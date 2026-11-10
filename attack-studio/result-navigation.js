import {shapeHitsRectangle} from './hitbox-shapes.js';
// Result navigation never invents a contact frame for a missed or unstarted hit.
export function hitInspection(attack,simulation,result,index){
 const event=attack.hitEvents?.find(e=>e.id===result.id),last=simulation.frames.length-1;
 let origin=attack.sequenceTiming==='cast'?simulation.timing.startup:simulation.impactFrame;
 if(result.projectileId!=null){origin=null;for(const sample of simulation.frames){const shot=sample.projectiles?.find(p=>p.id===result.projectileId);if(shot&&Number.isFinite(shot.impact)){origin=sample.frame-shot.age+shot.impact;break;}}}
 if(!simulation.cast)origin=null;
 const start=event&&Number.isFinite(origin)?origin+event.offset:null,end=start===null?null:start+event.duration-1;
 const actual=Number.isFinite(result.frame)?result.frame:null,observed=Number.isFinite(result.observedFrame)?result.observedFrame:null;
 const candidate=actual??observed??start??(simulation.cast?simulation.timing.startup:0),frame=Math.max(0,Math.min(last,candidate));
 let evidence='';
 // The ordinary sequence preview records pre-contact target geometry. Runtime
 // projectiles have their own clocks; do not infer their misses from another box.
 if(result.result==='Missed'&&start!==null&&event&&!simulation.stageBounds&&!simulation.frames.some(f=>f.projectiles)){
  const samples=simulation.frames.filter(f=>f.frame>=start&&f.frame<=end&&f.active),boxes=f=>event.hitboxGroup?(f.boxes||[]).filter(b=>b.groupId===event.hitboxGroup):[f.box];
  if(samples.length){const withBoxes=samples.filter(f=>boxes(f).length),overlaps=withBoxes.filter(f=>f.targetBox&&boxes(f).some(b=>b&&shapeHitsRectangle(b,f.targetBox)));
   if(!withBoxes.length)evidence='The assigned hitbox group had no active boxes in the recorded window.';
   else if(!overlaps.length)evidence='No overlap with the target hurtbox was recorded during this active hit window.';
   else if(event.target!=='any'&&overlaps.every(f=>event.target==='airborne'?f.targetBox.y+f.targetBox.h>=0:f.targetBox.y+f.targetBox.h<0))evidence=`Recorded overlaps did not meet this hit’s ${event.target} target restriction.`;
  }
 }
 return {eventId:event?.id,number:event?attack.hitEvents.indexOf(event)+1:index+1,projectileId:result.projectileId,frame,frameLabel:actual!==null?`View contact · ${frame}f`:observed!==null?`Inspect outcome · ${frame}f`:start!==null?`View window start · ${frame}f`:`View ${simulation.cast?'startup':'test start'} · ${frame}f`,expected:start===null?`${attack.sequenceTiming==='cast'?'Startup':'Contact'} + ${result.offset}f · clock not recorded`: `${start}–${end}f`,actual,evidence,boxId:event?.hitboxGroup?attack.hitboxGroups?.find(g=>g.id===event.hitboxGroup)?.boxes[0]?.id:attack.hitboxGroups?.[0]?.boxes[0]?.id};
}
export function diagnosticDestination(code){
 if(code==='energy')return {panel:'panel-12',label:'Edit test energy'};
 if(code==='missed-followups')return {panel:'sequenceEditor',label:'Inspect hit sequence'};
 if(/^(movement-|cancel-|automatic-followup)/.test(code))return {panel:'cancelEditor',label:'Edit follow-up windows'};
 if(code==='attacker-motion')return {panel:'panel-8',label:'Edit attacker movement'};
 if(code==='authored-hurtboxes')return {panel:'panel-10',label:'Edit character hurtboxes'};
 if(code==='presentation-events')return {panel:'panel-9',label:'Edit sound and camera'};
 if(/^(armor-|invulnerability-|parry-|throw-immunity|absorption-|counter-hit-|combo-scaling-|impact-|hitstun-|bounce-|throw$|melee-clash)/.test(code))return {panel:'defenseEditor',label:'Inspect combat rules'};
 if(/^(sequence-|scheduled-sequence|shared-juggle-|momentum-|conditional-)/.test(code))return {panel:'sequenceEditor',label:'Inspect hit sequence'};
 return {panel:'panel-13',label:'Inspect attack settings'};
}
