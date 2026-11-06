import {worldBox,timing,statsFor} from './combat-model.js?v=20261106-recovery';
import {shapeHitsRectangle} from './hitbox-shapes.js?v=20261106-recovery';
import {sequenceState,sequenceDuration,sequenceOpportunities,applyPulseReaction,advancePulseReaction,hitResult,SEQUENCE_LIMITS} from './hit-sequence.js?v=20261106-recovery';

export function simulateSequence(attack,attacker,target,options={}) {
  const av=statsFor(attacker),tv=statsFor(target),tm=timing(attack,attacker),direction=options.facing===-1?-1:1;
  const self={x:0,y:0,hp:Math.round(av.maxHP*(options.selfHP??.6)),maxHP:av.maxHP,energy:Math.round(av.maxEnergy*(options.energy??1)),shield:0,stun:0};
  const other={x:(options.targetSide===-1?-1:1)*(options.distance??100),y:-(options.targetHeight??0),vy:0,hp:Math.round(tv.maxHP*(options.targetHP??.7)),maxHP:tv.maxHP,energy:tv.maxEnergy,shield:0,stun:0};
  const cost=Math.ceil(attack.cost*av.cost),cast=self.energy>=cost;
  if(cast)self.energy-=cost;
  const state=sequenceState(),events=[],frames=[];let hits=0,end=tm.startup+600;
  if(!cast)events.push({frame:0,text:'Not enough energy — attack did not start.'});
  for(let frame=0;frame<=end;frame++){
    if(!advancePulseReaction(other,frame,-220,220)&&state.contactFrame!==null&&other.y<0){other.vy+=SEQUENCE_LIMITS.gravity;other.y=Math.min(0,other.y+other.vy);if(other.y===0){other.reaction='standing';other.reactionLandFrame=frame;}}
    let box=worldBox(attack,state.contactFrame??frame,attacker,direction);
    if(state.attached&&attack.projectileMode==='attached')box={...box,x:other.x-box.w/2,y:other.y-box.h};
    const targetBox={x:other.x-14,y:other.y-60,w:28,h:60},contact=shapeHitsRectangle(box,targetBox);
    if(options.incomingDamage>0&&frame===(options.incomingFrame??30)){
      if(other.stun>frame)events.push({frame,text:'Incoming attack interrupted — opponent is stunned.'});
      else {self.hp=Math.max(0,self.hp-options.incomingDamage);state.cancelled='Attacker interrupted.';events.push({frame,text:'Incoming attack interrupted this sequence.'});}
    }
    const active=cast&&frame>=tm.startup&&!state.cancelled&&(state.contactFrame===null||frame<state.contactFrame+sequenceDuration(attack));
    if(active){
      for(const event of sequenceOpportunities(attack,state,frame,contact,other)){
        const guarded=!!options.guard&&attack.blockable;
        const damage=Math.round(event.damage*(1-Math.max(-50,Math.min(75,options.resistance??0))/100)*(guarded?1-tv.guard:1));
        const actual=Math.min(other.hp,damage);other.hp-=actual;hits++;
        hitResult(state,event,frame,guarded?'Blocked':'Connected');
        events.push({frame,text:`${guarded?'Blocked hit':'Hit'} ${hits}: ${actual} damage.`});
        if(guarded){state.cancelled='First contact was blocked; attachment cancelled.';other.reactionGuardFrame=frame;}
        else {state.attached=true;applyPulseReaction(other,event,direction,frame);}
        if(other.hp<=0)state.cancelled='Target defeated.';
      }
    }
    if(state.contactFrame!==null)end=state.contactFrame+sequenceDuration(attack)+Math.max(120,tm.recovery);
    frames.push({frame,active,box,targetBox,contact,self:{...self},target:{...other},hits,modifiers:[]});
    if(!cast)break;
  }
  const results=attack.hitEvents.map(event=>state.results.find(r=>r.id===event.id)||{id:event.id,offset:event.offset,frame:null,result:'Missed',reason:state.cancelled||'Projectile did not reach the target.'});
  return {frames,events,hitResults:results,cost,cast,contactMode:true,impactFrame:state.contactFrame,timing:{...tm,active:sequenceDuration(attack)},power:attack.hitEvents[0].damage,nextCast:Math.max(attack.cooldown,(state.contactFrame??tm.startup+600)+sequenceDuration(attack)+tm.recovery)};
}
