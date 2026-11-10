import {poseDurations} from './pose-timing.js';
import {validateAttack} from './combat-model.js?v=20261110-status-support-audit';

// All alignment targets use the preview's combat clock. Change existing authored
// fields only, so saving, Arena playback and attack Undo keep their usual meaning.
export function alignAttackPart(attack, effects, part, target, poseCount=0) {
 if (!Number.isInteger(target) || target < 0 || target > 1800) throw Error('Choose a whole preview frame from 0 to 1800.');
 const next=structuredClone(attack);
 if (part.kind==='effect') {
  const visual=next.visuals[part.index], effect=visual&&effects.get(visual.effectId);
  if (!effect) throw Error('Select an available effect layer.');
  if (visual.loopUntilImpact) throw Error('This effect waits for contact. Turn off Loop until impact before giving it a fixed alignment.');
  let offset=0;
  if (part.edge==='impact') {
   const order=visual.frames||effect.times.map((_,i)=>i), position=order.indexOf(effect.impact-1);
   if (position<0) throw Error('The impact artwork was removed from this layer. Restore that frame or align its start.');
   offset=Math.ceil(order.slice(0,position).reduce((sum,i)=>sum+effect.times[i],0)*60/1000/visual.rate-1e-9);
  }
  visual.start=target-offset;
  if (visual.start<0 || visual.start>600) throw Error('That alignment would start the effect outside frames 0–600. Choose a later frame or adjust its speed.');
 } else if (part.kind==='movement') {
  const movement=next.attackerMotion?.find(item=>item.id===part.id);
  if (!movement) throw Error('Add or select an attacker movement first.');
  movement.start=target-(part.edge==='end'?movement.duration:0);
  next.attackerMotion.sort((a,b)=>a.start-b.start);
 } else if (part.kind==='pose') {
  if (!poseCount) throw Error('Choose an available character animation first.');
  const durations=poseDurations(next,poseCount), index=part.index;
  if (!Number.isInteger(index)||index<0||index>=durations.length) throw Error('Select an available character pose.');
  if (index===0) {
   if (target!==0) throw Error('The first character pose starts at frame 0. Choose a later pose to adjust its timing.');
  } else {
   const before=durations.slice(0,index).reduce((sum,n)=>sum+n,0), factor=target/60/before;
   for(let i=0;i<index;i++) durations[i]*=factor;
   if(durations.some(n=>n<.02||n>5)) throw Error('That alignment would put a character frame outside 0.02–5 seconds. Choose a closer preview frame.');
  }
  next.poseTiming='custom';next.poseDurations=durations;
 } else throw Error('Select a movement, character pose or effect.');
 validateAttack(next);return next;
}
