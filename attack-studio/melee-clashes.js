import {contactDeadline} from './contact-timing.js';
import {shapesOverlap} from './hitbox-shapes.js';

export function validateMeleeClash(attack){
 const rule=attack.meleeClash;if(rule===undefined)return;
 if(!rule||typeof rule!=='object'||Array.isArray(rule)||Object.keys(rule).some(key=>key!=='priority'))throw Error('Use a melee clash priority definition.');
 if(attack.delivery!=='melee'||!['damage','push'].includes(attack.payload))throw Error('Melee clashes require a melee damage or push attack.');
 if(!Number.isInteger(rule.priority)||rule.priority<0||rule.priority>9)throw Error('Melee clash priority must be a whole number from 0 to 9.');
}

// Call with active attack geometry from one simulation-frame snapshot.
// Neither damage nor processing order confers priority. Both moves must opt in.
export function resolveMeleeClashes(snapshots){
 const eligible=snapshots.filter(s=>s.attack.meleeClash!==undefined);
 for(const snapshot of eligible)validateMeleeClash(snapshot.attack);
 eligible.sort((a,b)=>String(a.id)<String(b.id)?-1:String(a.id)>String(b.id)?1:0);
 const stopped=new Set(),contacts=[];
 for(let i=0;i<eligible.length;i++)for(let j=i+1;j<eligible.length;j++){
  const a=eligible[i],b=eligible[j];if(a.owner===b.owner)continue;
  if(!a.boxes.some(first=>b.boxes.some(second=>shapesOverlap(first,second))))continue;
  const difference=a.attack.meleeClash.priority-b.attack.meleeClash.priority;
  if(difference<=0)stopped.add(a.id);if(difference>=0)stopped.add(b.id);
  contacts.push({first:a.id,second:b.id,outcome:difference===0?'clash':'priority',winner:difference===0?null:difference>0?a.id:b.id});
 }
 return {contacts,stopped};
}

// Read-only eligibility: do not consume hit events while collecting collisions.
export function meleeClashBoxes(snapshot){
 if(!snapshot)return [];
 const {cast,age,box,boxes}=snapshot,{a,tm}=cast;
 if(!a.meleeClash||a.delivery!=='melee'||age<tm.startup)return [];
 if(a.hitEvents){
  const state=cast.sequence;if(!state||state.cancelled)return [];
  const start=state.startFrame??state.contactFrame;if(start===null)return [];
  const elapsed=age-start;
  const events=a.hitEvents.filter(event=>!state.consumed.has(event.id)&&elapsed>=event.offset&&elapsed<event.offset+event.duration);
  if(!events.length)return [];
  return boxes===null||boxes===undefined?[box]:boxes.filter(region=>events.some(event=>!event.hitboxGroup||event.hitboxGroup===region.groupId));
 }
 const active=cast.impact===null?age<=contactDeadline(tm):age>=cast.impact&&age<cast.impact+tm.active;
 if(!active||(!a.hitboxGroups&&(cast.hits>=a.hitLimit||age-cast.lastHit<a.hitInterval)))return [];
 return boxes?.filter(region=>{
  const group=a.hitboxGroups.find(group=>group.id===region.groupId);
  return group&&cast.groupTracker.canClaim(snapshot.target,group,age);
 })??[box];
}
