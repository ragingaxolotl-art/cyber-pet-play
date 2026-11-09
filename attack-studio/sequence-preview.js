import {reactionContactState,resolveReactionAlternative} from './conditional-reactions.js?v=20261109-conditional-release';
import {fighterHurtboxes} from './hurtboxes.js?v=20261109-hurtboxes';
import {guardContactRule,applyGuardRecovery} from './guard-interaction.js?v=20261109-guard';
import {createImpactArea,claimAreaHit,impactAreaBox,impactAreaView,impactAreaAnchor} from './projectile-area.js?v=20261109-area-art';
import {consumesProjectile,CONTACT_END_REASON} from './projectile-contact.js?v=20261108-area-final';
import {createSteeringState,advanceSteering} from './projectile-steering.js?v=20261108-steering';
import {recoverInAir,validateRecoveryFrame} from './air-recovery.js?v=20261109-throw-release';
import {scaledHitEvent} from './hitstun-scaling.js?v=20261108-hitstun';
import {scaledComboDamage} from './combo-scaling.js?v=20261108-combo-scaling';
import {ComboTracker} from './combo-tracker.js?v=20261108-combo-scaling';
import {presentationFrames} from './preview-clock.js?v=20261108-impact-timing';
import {contactDeadline,castEnd,activeEnd} from './contact-timing.js?v=20261108-shared-juggle';
import {createDefenseState,defenseSnapshot,claimArmor,isInvulnerable,claimParry} from './defense-windows.js?v=20261109-throw-release';
import {activeGroupBoxes} from './hitbox-groups.js?v=20261109-melee-clashes';
import {worldBox,timing,statsFor} from './combat-model.js?v=20261109-conditional-release';
import {shapeHitsRectangle} from './hitbox-shapes.js?v=20261109-rotation';
import {resetGroundedJuggle,sequenceState,sequenceDuration,sequenceOpportunities,applyPulseReaction,advancePulseReaction,hitResult,SEQUENCE_LIMITS} from './hit-sequence.js?v=20261109-conditional-release';

export function simulateSequence(attack,attacker,target,options={}) {
  validateRecoveryFrame(options.recoveryFrame);
  const av=statsFor(attacker),tv=statsFor(target),tm=timing(attack,attacker),direction=options.facing===-1?-1:1;
  const self={x:0,y:0,hp:Math.round(av.maxHP*(options.selfHP??.6)),maxHP:av.maxHP,energy:Math.round(av.maxEnergy*(options.energy??1)),shield:0,stun:0};
  const other={x:(options.targetSide===-1?-1:1)*(options.distance??100),y:-(options.targetHeight??0),vy:0,hp:Math.round(tv.maxHP*(options.targetHP??.7)),maxHP:tv.maxHP,energy:tv.maxEnergy,shield:0,stun:0};
  const cost=Math.ceil(attack.cost*av.cost),cast=self.energy>=cost;
  if(cast)self.energy-=cost;
  const combos=new ComboTracker();
  const defenseCast={a:attack,defenseState:createDefenseState()};
  tm.active=sequenceDuration(attack);
  const state=sequenceState(attack.sequenceTiming==='cast'?tm.startup:null),events=[],frames=[];let recovery=null,impactArea=null;let hits=0,end=castEnd(null,tm),ownerInterrupted=false,launched=false,steering=null;const independent=attack.projectileLifetime!==undefined;
  if(!cast)events.push({frame:0,text:'Not enough energy — attack did not start.'});
  let guardRecoveryUntil=0;
  for(let frame=0;frame<=end;frame++){
    const guardContact=guardContactRule(attack,!!options.guard&&frame>=guardRecoveryUntil);
    const hitsBeforeFeedback=hits;
    if(independent&&cast&&!ownerInterrupted&&frame>=tm.startup)launched=true;
    if(independent&&launched&&frame>=tm.startup+attack.projectileLifetime&&!state.cancelled&&state.results.length<attack.hitEvents.length)state.cancelled='Projectile lifetime expired.';
    if(independent&&self.hp<=0)state.cancelled='Attacker defeated.';
    if(!advancePulseReaction(other,frame,-220,220)&&state.contactFrame!==null&&other.y<0){other.vy+=SEQUENCE_LIMITS.gravity;other.y=Math.min(0,other.y+other.vy);if(other.y===0){resetGroundedJuggle(other);other.reaction='standing';other.reactionLandFrame=frame;}}
    combos.beginFrame(frame,new Map([['target',{defeated:other.hp<=0,locked:other.stun>frame||!!other.pulseMotion}]]));
    let box=worldBox(attack,(state.startFrame!==null?frame:state.contactFrame??frame),attacker,direction);
    if(attack.projectileSteering&&independent&&launched){
     steering??=createSteeringState({x:box.x+box.w/2,y:box.y+box.h/2},direction,frame);
     if(state.attached&&attack.projectileMode==='attached')steering.lastFrame=frame;
     else if(!state.cancelled){advanceSteering(steering,attack.projectileSteering,attack.projectileSpeed,frame,{x:other.x,y:other.y-30},{x:self.x,y:self.y-30});box={...box,x:steering.x-box.w/2,y:steering.y-box.h/2};}
     if(steering.caught&&!state.cancelled){state.cancelled='Projectile returned to owner.';events.push({frame,text:state.cancelled});}
    }
    if(state.attached&&attack.projectileMode==='attached')box={...box,x:other.x-box.w/2,y:other.y-box.h};
    const targetBox={x:other.x-14,y:other.y-60,w:28,h:60};
    const base=worldBox(attack,(state.startFrame!==null?frame:state.contactFrame??frame),attacker,direction),elapsed=(state.startFrame??state.contactFrame)===null?0:frame-(state.startFrame??state.contactFrame);
    const boxes=attack.hitboxGroups?activeGroupBoxes(attack.hitboxGroups,elapsed,b=>{const world=worldBox({...attack,box:b},(state.startFrame!==null?frame:state.contactFrame??frame),attacker,direction);return {...world,x:world.x+box.x-base.x,y:world.y+box.y-base.y};}):null;
    const overlap=event=>boxes?boxes.some(b=>b.groupId===event.hitboxGroup&&shapeHitsRectangle(b,targetBox)):shapeHitsRectangle(box,targetBox);
    const contact=boxes?boxes.some(b=>shapeHitsRectangle(b,targetBox)):shapeHitsRectangle(box,targetBox);
    const sourceAlive=cast&&(!independent||(launched&&self.hp>0&&frame<tm.startup+attack.projectileLifetime));
    let incomingInterrupted=false;
    if(options.incomingDamage>0&&frame===(options.incomingFrame??30)){
      if(other.stun>frame)events.push({frame,text:'Incoming attack interrupted — opponent is stunned.'});
      else if((other.blockstunUntil||0)>frame)events.push({frame,text:'Incoming attack interrupted — opponent is recovering from a block.'});
      else {
       const castAlive=cast&&!ownerInterrupted&&!state.cancelled&&frame<(independent?tm.startup+tm.active+tm.recovery:castEnd(state.startFrame??state.contactFrame,tm)),defense=defenseSnapshot(castAlive?defenseCast:null,frame),incoming={payload:'damage',delivery:'melee'};
       const invulnerable=isInvulnerable(defense,incoming),parry=!invulnerable&&claimParry(defense,incoming),armored=!parry&&!invulnerable&&claimArmor(defense,incoming);
       if(parry)other.stun=Math.max(other.stun,frame+parry.stun);
       self.hp=Math.max(0,self.hp-(parry||invulnerable?0:options.incomingDamage));incomingInterrupted=(!parry&&!invulnerable&&!armored)||self.hp<=0;
       events.push({frame,text:parry?'Incoming attack parried; no damage.':invulnerable?'Incoming attack invulnerable; no damage.':incomingInterrupted?'Incoming attack interrupted this sequence.':'Incoming attack armored; damage still applies.'});
      }
    }
    const active=sourceAlive&&frame>=tm.startup&&!state.cancelled&&((state.startFrame??state.contactFrame)===null?frame<=contactDeadline(tm):frame<(state.startFrame??state.contactFrame)+sequenceDuration(attack));
    if(active){
      const reactionContact=reactionContactState(other);
      for(const event of sequenceOpportunities(attack,state,frame,overlap,other)){
        const guarded=guardContact.guarded;
        const rawDamage=Math.round(event.damage*(1-Math.max(-50,Math.min(75,options.resistance??0))/100)*(guarded?1-tv.guard:1));
        const damage=scaledComboDamage(rawDamage,combos.priorHits('self','target'),attack.comboScaling,guarded?'block':'hit');
        const actual=Math.min(other.hp,damage);other.hp-=actual;hits++;
        combos.contact('self','target',guarded?'block':'hit',actual);
        hitResult(state,event,frame,guarded?'Blocked':'Connected');
        events.push({frame,text:`${guarded?'Blocked hit':'Hit'} ${hits}: ${actual} damage.`});
        if(guarded){if(state.startFrame===null)state.cancelled='First contact was blocked; attachment cancelled.';other.reactionGuardFrame=frame;if(attack.contactFeedback?.blockstun>0)other.blockstunUntil=Math.max(other.blockstunUntil||0,frame+attack.contactFeedback.blockstun+1);}
        else {state.attached=true;applyPulseReaction(other,scaledHitEvent(resolveReactionAlternative(event,reactionContact),combos.priorHits('self','target'),attack.hitstunScaling),direction,frame);}
        if(applyGuardRecovery(other,guardContact,guarded?'block':'hit',frame)){guardRecoveryUntil=Math.max(guardRecoveryUntil,other.stun);events.push({frame,text:'Guard '+guardContact.mode+'.'});}
        if(other.hp<=0)state.cancelled='Target defeated.';
        if(consumesProjectile(attack,guarded?'block':'hit')){state.cancelled=CONTACT_END_REASON;if(attack.projectileArea){impactArea=createImpactArea(attack,impactAreaAnchor(boxes,event.hitboxGroup,targetBox,box),frame);events.push({frame,text:'Impact area created.'});}events.push({frame,text:state.cancelled});break;}
      }
    }
    if(impactArea&&self.hp>0&&other.hp>0&&claimAreaHit(impactArea,'target',frame,shapeHitsRectangle(impactAreaBox(impactArea,frame),targetBox))){
     const guarded=!!options.guard&&frame>=guardRecoveryUntil&&attack.blockable,damage=Math.min(other.hp,Math.round(impactArea.rule.damage*(1-Math.max(-50,Math.min(75,options.resistance??0))/100)*(guarded?1-tv.guard:1)));other.hp-=damage;other.lastHit=frame;
     events.push({frame,text:`Impact area ${guarded?'blocked':'hit'}: ${damage} damage.`});
    }
    if(incomingInterrupted){ownerInterrupted=true;if(!independent||!launched||self.hp<=0)state.cancelled='Attacker interrupted.';}
    if((state.startFrame??state.contactFrame)!==null)end=(state.startFrame??state.contactFrame)+sequenceDuration(attack)+Math.max(120,tm.recovery);
    end=Math.max(end,guardRecoveryUntil);
    if(impactArea)end=Math.max(end,impactArea.end);
    if(other.pulseMotion)end=Math.max(end,other.pulseMotion.start+other.pulseMotion.event.frames+1);
    if(options.recoveryFrame!==undefined&&options.recoveryFrame!==null&&frame===options.recoveryFrame){
      const reason=recoverInAir(other,frame);recovery={attempted:true,recovered:!reason,reason,combatFrame:frame};
      events.push({frame,text:reason?'Air recovery rejected: '+reason:'Air recovery succeeded; control restored without invulnerability'});
    }
    if(other.reactionBounceFrame===frame)events.push({frame,text:other.reactionBounceKind==='wall'?'Wall bounce':'Floor bounce'});
    for(const who of [self,other])who.canAct=who.hp>0&&!who.pulseMotion&&frame>=(who.stun||0)&&frame>=(who.blockstunUntil||0);
    const impactStop=hits>hitsBeforeFeedback?(guardContact.guarded?attack.contactFeedback?.blockstop:attack.contactFeedback?.hitstop)??0:0;
    if(self.hp<=0||other.hp<=0)combos.endAll('Round ended');
    frames.push({areaHits:impactArea?.targets.get('target')?.hits??0,areas:impactArea&&self.hp>0&&other.hp>0&&frame>=impactArea.start&&frame<impactArea.end?[impactAreaView(impactArea,frame)]:[],steering:steering?{...steering}:null,combos:combos.snapshot(),frame,impactStop,active,ownerActive:cast&&!ownerInterrupted&&self.hp>0&&frame<(independent?tm.startup+tm.active+tm.recovery:castEnd(state.startFrame??state.contactFrame,tm)),projectileAlive:independent&&launched&&!state.cancelled&&self.hp>0&&other.hp>0&&frame<tm.startup+attack.projectileLifetime&&frame<activeEnd(state.startFrame??state.contactFrame,tm),box,boxes,targetBox,contact,self:{...self},target:{...other},hits,modifiers:[]});
    const recorded=frames.at(-1);recorded.attackerHurtboxes=fighterHurtboxes({x:0,y:0,facing:options.facing??1},recorded.ownerActive?{attack:attack,frame:frame,timing:tm}:null);
    if(!cast)break;
  }
  const results=attack.hitEvents.map(event=>state.results.find(r=>r.id===event.id)||{id:event.id,offset:event.offset,frame:null,result:'Missed',reason:state.cancelled||(state.startFrame===null&&state.contactFrame===null?'Projectile did not reach the target.':'No eligible contact during this hit window.')});
  return {recovery:recovery??(options.recoveryFrame==null?null:{attempted:false,recovered:false,reason:'Test ended before the recovery attempt.'}),combos:combos.snapshot(),frames,presentationFrames:presentationFrames(frames),events,hitResults:results,cost,cast,contactMode:state.startFrame===null,impactFrame:state.startFrame??state.contactFrame,timing:{...tm,active:sequenceDuration(attack)},power:attack.hitEvents[0].damage,nextCast:Math.max(attack.cooldown,independent?tm.startup+tm.active+tm.recovery:castEnd(state.startFrame??state.contactFrame,tm))};
}
