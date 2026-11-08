import {cancelWindowReady} from './cancel-windows.js';
// Classroom starting balance. A dash is a finite action, distinct from held sprint.
export const MOVEMENT_CANCEL_RULES=Object.freeze({dashFrames:12,dashSpeed:5,dashCooldown:30});
export function validateMovementCancels(windows){
 if(windows===undefined)return;
 if(!Array.isArray(windows)||!windows.length||windows.length>16)throw Error('Use 1–16 movement cancel windows.');
 const ids=new Set();
 for(const w of windows){
  if(!w||!/^movement_[a-zA-Z0-9_]{1,80}$/.test(w.id)||ids.has(w.id))throw Error('Movement cancel windows need unique IDs.');ids.add(w.id);
  if(!['jump','dodge','dash'].includes(w.action))throw Error('Choose jump, dodge or dash.');
  if(!Number.isInteger(w.start)||w.start<0||!Number.isInteger(w.duration)||w.duration<1||w.start+w.duration>900)throw Error('Movement windows must fit within 900 cast frames.');
  if(!['any','hit','block','parry','whiff'].includes(w.condition))throw Error('Invalid movement cancel condition.');
  if(typeof w.cost!=='number'||!Number.isFinite(w.cost)||w.cost<0||w.cost>200)throw Error('Movement cancel cost must be 0–200.');
  if(w.automatic!==undefined&&w.automatic!==false)throw Error('Movement cancels require manual input.');
  if(w.action==='dash'&&!['forward','backward','input'].includes(w.direction))throw Error('Choose a dash direction.');
 }
}
// Matching a window does not spend energy or end a cast. Arena must check motion,
// cooldown and state availability first, then apply the whole transition once.
export function movementCancelWindow(cast,action,age){
 if(!cast)return null;
 return (cast.a.movementCancels||[]).find(w=>w.action===action&&cancelWindowReady(cast,w,age))||null;
}
