// Defense windows use absolute 60 Hz cast frames: [start, start + duration).
// Armor takes ordinary damage. It suppresses hit reactions, not status effects.
// A hit budget belongs to this cast and window, never to a reusable definition.
export function validateDefenseWindows(windows) {
 if(windows===undefined)return;
 if(!Array.isArray(windows)||windows.length<1||windows.length>8)throw Error('Use 1–8 defense windows.');
 const ids=new Set();
 for(const w of windows){
  if(!w||!/^defense_[a-zA-Z0-9_]{1,80}$/.test(w.id)||ids.has(w.id))throw Error('Each defense window needs a unique ID.');
  ids.add(w.id);
  if(w.kind!=='armor'||!['all','melee','projectile','area'].includes(w.against))throw Error('Invalid defense window type or attack filter.');
  if(!Number.isInteger(w.start)||w.start<0||!Number.isInteger(w.duration)||w.duration<1||w.start+w.duration>900)throw Error('Defense windows must fit within 900 frames.');
  if(!Number.isInteger(w.hits)||w.hits<1||w.hits>10)throw Error('Armor absorbs reactions from 1–10 hits per window.');
 }
}
export const createDefenseState=()=>new Map();
// Snapshot the active windows before any simultaneous hit changes a cast.
export function defenseSnapshot(cast,age){
 if(!cast)return null;
 return {state:cast.defenseState,windows:(cast.a.defenseWindows||[]).filter(w=>age>=w.start&&age<w.start+w.duration)};
}
export function claimArmor(snapshot,attack){
 if(!snapshot?.state||!['damage','push'].includes(attack.payload))return false;
 for(const w of snapshot.windows){
  if(w.against!=='all'&&w.against!==attack.delivery)continue;
  const used=snapshot.state.get(w.id)||0;
  if(used>=w.hits)continue;
  snapshot.state.set(w.id,used+1);return true;
 }
 return false;
}
