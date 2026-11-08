import {contactDeadline,castEnd,activeEnd} from './contact-timing.js?v=20261108-scheduled-sequences';
import {createDefenseState,defenseSnapshot,claimArmor,isInvulnerable,claimParry} from './defense-windows.js?v=20261108-scheduled-sequences';
import {activeGroupBoxes} from './hitbox-groups.js?v=20261108-scheduled-sequences';
import {worldBox,timing,statsFor} from './combat-model.js?v=20261108-scheduled-sequences';
import {shapeHitsRectangle} from './hitbox-shapes.js?v=20261108-scheduled-sequences';
import {resetGroundedJuggle,sequenceState,sequenceDuration,sequenceOpportunities,applyPulseReaction,advancePulseReaction,hitResult,SEQUENCE_LIMITS} from './hit-sequence.js?v=20261108-scheduled-sequences';

export function simulateSequence(attack,attacker,target,options={}) {
  const av=statsFor(attacker),tv=statsFor(target),tm=timing(attack,attacker),direction=options.facing===-1?-1:1;
  const self={x:0,y:0,hp:Math.round(av.maxHP*(options.selfHP??.6)),maxHP:av.maxHP,energy:Math.round(av.maxEnergy*(options.energy??1)),shield:0,stun:0};
  const other={x:(options.targetSide===-1?-1:1)*(options.distance??100),y:-(options.targetHeight??0),vy:0,hp:Math.round(tv.maxHP*(options.targetHP??.7)),maxHP:tv.maxHP,energy:tv.maxEnergy,shield:0,stun:0};
  const cost=Math.ceil(attack.cost*av.cost),cast=self.energy>=cost;
  if(cast)self.energy-=cost;
  const defenseCast={a:attack,defenseState:createDefenseState()};
  tm.active=sequenceDuration(attack);
  const state=sequenceState(attack.sequenceTiming==='cast'?tm.startup:null),events=[],frames=[];let hits=0,end=castEnd(null,tm),ownerInterrupted=false,launched=false;const independent=attack.projectileLifetime!==undefined;
  if(!cast)events.push({frame:0,text:'Not enough energy — attack did not start.'});
  for(let frame=0;frame<=end;frame++){
    if(independent&&cast&&!ownerInterrupted&&frame>=tm.startup)launched=true;
    if(independent&&launched&&frame>=tm.startup+attack.projectileLifetime&&!state.cancelled&&state.results.length<attack.hitEvents.length)state.cancelled='Projectile lifetime expired.';
    if(independent&&self.hp<=0)state.cancelled='Attacker defeated.';
    if(!advancePulseReaction(other,frame,-220,220)&&state.contactFrame!==null&&other.y<0){other.vy+=SEQUENCE_LIMITS.gravity;other.y=Math.min(0,other.y+other.vy);if(other.y===0){resetGroundedJuggle(other);other.reaction='standing';other.reactionLandFrame=frame;}}
    let box=worldBox(attack,(state.startFrame!==null?frame:state.contactFrame??frame),attacker,direction);
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
      for(const event of sequenceOpportunities(attack,state,frame,overlap,other)){
        const guarded=!!options.guard&&attack.blockable;
        const damage=Math.round(event.damage*(1-Math.max(-50,Math.min(75,options.resistance??0))/100)*(guarded?1-tv.guard:1));
        const actual=Math.min(other.hp,damage);other.hp-=actual;hits++;
        hitResult(state,event,frame,guarded?'Blocked':'Connected');
        events.push({frame,text:`${guarded?'Blocked hit':'Hit'} ${hits}: ${actual} damage.`});
        if(guarded){if(state.startFrame===null)state.cancelled='First contact was blocked; attachment cancelled.';other.reactionGuardFrame=frame;}
        else {state.attached=true;applyPulseReaction(other,event,direction,frame);}
        if(other.hp<=0)state.cancelled='Target defeated.';
      }
    }
    if(incomingInterrupted){ownerInterrupted=true;if(!independent||!launched||self.hp<=0)state.cancelled='Attacker interrupted.';}
    if((state.startFrame??state.contactFrame)!==null)end=(state.startFrame??state.contactFrame)+sequenceDuration(attack)+Math.max(120,tm.recovery);
    frames.push({frame,active,ownerActive:cast&&!ownerInterrupted&&self.hp>0&&frame<(independent?tm.startup+tm.active+tm.recovery:castEnd(state.startFrame??state.contactFrame,tm)),projectileAlive:independent&&launched&&!state.cancelled&&self.hp>0&&other.hp>0&&frame<tm.startup+attack.projectileLifetime&&frame<activeEnd(state.startFrame??state.contactFrame,tm),box,boxes,targetBox,contact,self:{...self},target:{...other},hits,modifiers:[]});
    if(!cast)break;
  }
  const results=attack.hitEvents.map(event=>state.results.find(r=>r.id===event.id)||{id:event.id,offset:event.offset,frame:null,result:'Missed',reason:state.cancelled||(state.startFrame===null&&state.contactFrame===null?'Projectile did not reach the target.':'No eligible contact during this hit window.')});
  return {frames,events,hitResults:results,cost,cast,contactMode:state.startFrame===null,impactFrame:state.startFrame??state.contactFrame,timing:{...tm,active:sequenceDuration(attack)},power:attack.hitEvents[0].damage,nextCast:Math.max(attack.cooldown,independent?tm.startup+tm.active+tm.recovery:castEnd(state.startFrame??state.contactFrame,tm))};
}
