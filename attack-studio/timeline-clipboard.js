import {validateAttack} from './combat-model.js?v=20261108-shared-juggle';
const uniqueId=prefix=>prefix+'_'+crypto.randomUUID().replaceAll('-','');
// Clipboard is an immutable snapshot, never a reference to the editable attack.
export function copyTimelineEvents(attack,tracks,selection){
 if(!Array.isArray(selection)||!selection.length)throw Error('Select events to copy.');
 const entries=[],seen=new Set();
 for(const item of selection){
  const key=JSON.stringify([item.groupId,item.boxId]);if(seen.has(key))continue;seen.add(key);
  const box=tracks.groups.find(g=>g.id===item.groupId)?.boxes.find(b=>b.id===item.boxId);
  if(!box)throw Error('A selected event is no longer available.');
  let value;
  if(item.groupId==='sequence')value=attack.hitEvents?.find(h=>h.id===item.boxId);
  else if(item.groupId==='effects')value=attack.visuals[Number(item.boxId)];
  else if(item.groupId==='armor')value=attack.defenseWindows?.find(w=>w.id===item.boxId);
  else if(item.groupId==='cancels')value=attack.cancelWindows?.find(w=>w.id===item.boxId);
  else value=attack.hitboxGroups?.find(g=>g.id===item.groupId)?.boxes.find(b=>b.id===item.boxId);
  if(!value)throw Error('Animation, movement paths and the main block/dodge window cannot be duplicated.');
  entries.push({...item,start:box.start,value:structuredClone(value)});
 }
 return {attackId:attack.id,entries,origin:Math.min(...entries.map(e=>e.start))};
}
// Paste within the source attack preserves group budgets and follow-up references.
// Cross-attack transfer needs explicit group/attack-reference remapping first.
export function pasteTimelineEvents(attack,tracks,clipboard,start){
 if(!clipboard?.entries?.length)throw Error('Copy timeline events before pasting.');
 if(clipboard.attackId!==attack.id)throw Error('Paste into the attack these events were copied from. Cross-attack timeline transfer is not supported yet.');
 if(!Number.isInteger(start)||start<0)throw Error('Choose a whole attack frame at or after zero.');
 const next=structuredClone(attack);
 for(const entry of clipboard.entries){
  const value=structuredClone(entry.value),frame=start+entry.start-clipboard.origin;
  if(entry.groupId==='sequence'){
   if(!next.hitEvents)throw Error('Restore a hit sequence before pasting these hits.');
   value.id=uniqueId('hit');value.offset=frame-tracks.contact;next.hitEvents.push(value);
  }else if(entry.groupId==='effects'){value.start=frame;next.visuals.push(value);}
  else if(entry.groupId==='armor'){value.id=uniqueId('defense');value.start=frame;(next.defenseWindows??=[]).push(value);}
  else if(entry.groupId==='cancels'){value.id=uniqueId('cancel');value.start=frame;(next.cancelWindows??=[]).push(value);}
  else{
   const group=next.hitboxGroups?.find(g=>g.id===entry.groupId);
   if(!group)throw Error('A copied hitbox group no longer exists.');
   value.id=uniqueId('box');value.start=frame-tracks.geometryBase;group.boxes.push(value);
  }
 }
 if(next.hitEvents){next.hitEvents.sort((a,b)=>a.offset-b.offset);next.active=Math.max(next.active,...next.hitEvents.map(h=>h.offset+h.duration));}
 if(next.hitboxGroups)next.active=Math.max(next.active,...next.hitboxGroups.flatMap(g=>g.boxes.map(b=>b.start+b.duration)));
 validateAttack(next);return next;
}
