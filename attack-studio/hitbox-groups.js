import {HITBOX_SHAPES,shapeHitsRectangle} from './hitbox-shapes.js?v=20261106-hitboxes';
// Runtime foundation; authoring and format negotiation are integrated separately.
export function validateHitboxGroups(groups) {
 if(!Array.isArray(groups)||!groups.length||groups.length>8)throw Error('Use 1–8 hit groups.');
 const ids=new Set(),boxes=new Set();let count=0;
 for(const group of groups){
  if(typeof group.id!=='string'||!/^group_[a-zA-Z0-9_]{1,64}$/.test(group.id)||ids.has(group.id))throw Error('Hit groups need unique IDs.');ids.add(group.id);
  if(!Number.isInteger(group.hitLimit)||group.hitLimit<1||group.hitLimit>10||!Number.isInteger(group.hitInterval)||group.hitInterval<1||group.hitInterval>300)throw Error('Invalid group hit limit or interval.');
  if(!Array.isArray(group.boxes)||!group.boxes.length)throw Error('Each group needs a hitbox.');
  for(const box of group.boxes){
   if(++count>16)throw Error('Use at most 16 hitboxes.');
   if(typeof box.id!=='string'||!/^box_[a-zA-Z0-9_]{1,64}$/.test(box.id)||boxes.has(box.id))throw Error('Hitboxes need unique IDs.');boxes.add(box.id);
   if(!Number.isInteger(box.start)||!Number.isInteger(box.duration)||box.start<0||box.duration<1||box.start+box.duration>600)throw Error('Hitbox windows must fit within 600 frames.');
   if(!HITBOX_SHAPES.includes(box.shape))throw Error('Unsupported hitbox shape.');
   for(const key of ['x','y','w','h'])if(!Number.isFinite(box[key])||(key==='w'||key==='h'?box[key]<1||box[key]>500:Math.abs(box[key])>500))throw Error('Invalid hitbox geometry.');
  }
 }
 return groups;
}
export function activeGroupBoxes(groups,frame,transform=box=>box) {
 return groups.flatMap(group=>group.boxes.filter(box=>frame>=box.start&&frame<box.start+box.duration).map(box=>({...transform(box),groupId:group.id,boxId:box.id})));
}
export function activeGroupContacts(groups,frame,target,transform=box=>box) {
 const contacts=new Set(activeGroupBoxes(groups,frame,transform).filter(box=>shapeHitsRectangle(box,target)).map(box=>box.groupId));
 return groups.filter(group=>contacts.has(group.id));
}
export function createGroupHitTracker(){
 const targets=new Map();
 return {claim(targetId,group,frame){
  let hits=targets.get(targetId);if(!hits){hits=new Map();targets.set(targetId,hits);}
  const record=hits.get(group.id)||{count:0,last:-Infinity};
  if(record.count>=group.hitLimit||frame-record.last<group.hitInterval)return false;
  hits.set(group.id,{count:record.count+1,last:frame});return true;
 }};
}
