import {shapesOverlap} from './hitbox-shapes.js?v=20261108-durability';

// Runtime-only groundwork. Both projectiles must opt into durability; legacy
// projectiles keep passing through each other until versioned authoring exists.
export class ProjectileClashes{
 constructor(){this.overlaps=new Set();}
 clear(){this.overlaps.clear();}
 resolve(snapshots){
  const eligible=snapshots.filter(s=>Number.isInteger(s.durability)&&s.durability>0);
  const ordered=[...eligible].sort((a,b)=>a.id-b.id),now=new Set(),losses=new Map(),contacts=[];
  for(let i=0;i<ordered.length;i++)for(let j=i+1;j<ordered.length;j++){
   const a=ordered[i],b=ordered[j];if(a.owner===b.owner)continue;
   if(!a.boxes.some(first=>b.boxes.some(second=>shapesOverlap(first,second))))continue;
   const key=a.id+':'+b.id;now.add(key);
   if(this.overlaps.has(key))continue;
   // Collect every contact before computing destruction. A source destroyed by
   // one simultaneous clash still contributes its other contacts on this frame.
   contacts.push({first:a.id,second:b.id});
   losses.set(a.id,(losses.get(a.id)||0)+1);losses.set(b.id,(losses.get(b.id)||0)+1);
  }
  this.overlaps=now;
  const remaining=new Map(ordered.map(s=>[s.id,Math.max(0,s.durability-(losses.get(s.id)||0))]));
  const destroyed=new Set([...remaining].filter(([,value])=>value===0).map(([id])=>id));
  return {contacts,losses,remaining,destroyed};
 }
}
