import {resolveHitPropertyLinks} from './hit-property-links.js?v=20261109-hit-links';
import {validateAttack} from './combat-model.js?v=20261109-hit-links';
const uniqueId=prefix=>prefix+'_'+crypto.randomUUID().replaceAll('-','');
// Clipboard is an immutable snapshot, never a reference to the editable attack.
export function copyTimelineEvents(attack,tracks,selection){
 attack=resolveHitPropertyLinks(attack);
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
  else if(item.groupId==='movementCancels')value=attack.movementCancels?.find(w=>w.id===item.boxId);
  else if(item.groupId==='cancels')value=attack.cancelWindows?.find(w=>w.id===item.boxId);
  else value=attack.hitboxGroups?.find(g=>g.id===item.groupId)?.boxes.find(b=>b.id===item.boxId);
  if(!value)throw Error('Animation, movement paths and the main block/dodge window cannot be duplicated.');
  entries.push({...item,start:box.start,value:structuredClone(value)});
 }
 const copiedHits=new Set(entries.filter(e=>e.groupId==='sequence').map(e=>e.value.id));
 const hitPropertyLinks=structuredClone((attack.hitPropertyLinks||[]).filter(link=>copiedHits.has(link.sourceId)&&copiedHits.has(link.targetId)));
 return {hitPropertyLinks,attackId:attack.id,entries,origin:Math.min(...entries.map(e=>e.start)),sequenceTiming:attack.sequenceTiming??'contact',geometryBase:tracks.geometryBase,groups:structuredClone(attack.hitboxGroups||[])};
}
// Cross-attack copies remap group IDs and self follow-ups; existing destination
// behavior is never converted implicitly. Referenced geometry travels with hits.
export function pasteTimelineEvents(attack,tracks,clipboard,start){
 if(!clipboard?.entries?.length)throw Error('Copy timeline events before pasting.');
 const crossAttack=clipboard.attackId!==attack.id;
 if(crossAttack&&clipboard.entries.some(e=>e.groupId==='sequence')&&(clipboard.sequenceTiming!==(attack.sequenceTiming??'contact')||!attack.hitEvents))throw Error('Create a compatible hit sequence in the destination before pasting hits.');
 if(crossAttack){
  const hits=clipboard.entries.filter(e=>e.groupId==='sequence');
  const bringsGroups=hits.some(e=>e.value.hitboxGroup)||clipboard.entries.some(e=>clipboard.groups.some(g=>g.id===e.groupId));
  if(bringsGroups&&attack.hitEvents?.some(h=>!h.hitboxGroup))throw Error('Add multiple hitboxes and assign every destination hit to a group before pasting grouped events.');
  if(attack.hitboxGroups&&hits.some(e=>!e.value.hitboxGroup))throw Error('Assign hitbox groups to the source hits, then copy again before pasting into a grouped attack.');
 }
 if(!Number.isInteger(start)||start<0)throw Error('Choose a whole attack frame at or after zero.');
 const next=resolveHitPropertyLinks(attack),groupIds=new Map(),hitIds=new Map();
 if(crossAttack){
  const referenced=new Set(clipboard.entries.filter(e=>e.groupId==='sequence').map(e=>e.value.hitboxGroup).filter(Boolean));
  const selectedGroups=new Set(clipboard.entries.map(e=>e.groupId).filter(id=>clipboard.groups.some(g=>g.id===id)));
  for(const id of new Set([...referenced,...selectedGroups])){
   const source=clipboard.groups.find(g=>g.id===id);if(!source)throw Error('Copied hitbox geometry is missing.');
   const group=structuredClone(source);group.id=uniqueId('group');groupIds.set(id,group.id);
   group.boxes=group.boxes.filter(b=>referenced.has(id)||clipboard.entries.some(e=>e.groupId===id&&e.boxId===b.id)).map(b=>({...b,id:uniqueId('box'),start:b.start+clipboard.geometryBase+start-clipboard.origin-tracks.geometryBase}));
   (next.hitboxGroups??=[]).push(group);
  }
 }

 for(const entry of clipboard.entries){
  const value=structuredClone(entry.value),frame=start+entry.start-clipboard.origin;
  if(entry.groupId==='sequence'){
   if(!next.hitEvents)throw Error('Restore a hit sequence before pasting these hits.');
   const oldId=value.id;value.id=uniqueId('hit');hitIds.set(oldId,value.id);value.offset=frame-tracks.contact;if(crossAttack&&value.hitboxGroup)value.hitboxGroup=groupIds.get(value.hitboxGroup);next.hitEvents.push(value);
  }else if(entry.groupId==='effects'){value.start=frame;next.visuals.push(value);}
  else if(entry.groupId==='armor'){value.id=uniqueId('defense');value.start=frame;(next.defenseWindows??=[]).push(value);}
  else if(entry.groupId==='movementCancels'){value.id=uniqueId('movement');value.start=frame;(next.movementCancels??=[]).push(value);}
  else if(entry.groupId==='cancels'){value.id=uniqueId('cancel');value.start=frame;if(crossAttack)value.attacks=value.attacks.map(id=>id===clipboard.attackId?attack.id:id);(next.cancelWindows??=[]).push(value);}
  else{
   if(crossAttack)continue; // Geometry was copied once above, including dependencies.
   const group=next.hitboxGroups?.find(g=>g.id===entry.groupId);
   if(!group)throw Error('A copied hitbox group no longer exists.');
   value.id=uniqueId('box');value.start=frame-tracks.geometryBase;group.boxes.push(value);
  }
 }
 for(const link of clipboard.hitPropertyLinks||[]){if(!hitIds.has(link.sourceId)||!hitIds.has(link.targetId))throw Error('A copied property link is missing its hit.');(next.hitPropertyLinks??=[]).push({...structuredClone(link),sourceId:hitIds.get(link.sourceId),targetId:hitIds.get(link.targetId)});}
 if(next.hitEvents){next.hitEvents.sort((a,b)=>a.offset-b.offset);next.active=Math.max(next.active,...next.hitEvents.map(h=>h.offset+h.duration));}
 if(next.hitboxGroups)next.active=Math.max(next.active,...next.hitboxGroups.flatMap(g=>g.boxes.map(b=>b.start+b.duration)));
 const resolved=resolveHitPropertyLinks(next);validateAttack(resolved);return resolved;
}
