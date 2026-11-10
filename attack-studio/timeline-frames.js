import {frameSelection} from './frame-selection.js?v=20261109-frame-multiselect';
import {remapAnchorFrames,remapHurtboxFrames} from './anchor-frame-edit.js';
import {posePlayback,poseSourceFrames,poseDurations} from './pose-timing.js';
import {impactAreaArtSample} from './impact-area-art.js';
import {visualFrame} from './attack-motion.js';

// Map thumbnails to actual simulated frames, including skipped/held poses.
export function thumbnailRows(attack,simulation,effects,poseAsset){
 const rows=[];
 if(poseAsset){
  const order=poseSourceFrames(attack,poseAsset.count);
  rows.push({kind:'character',name:'Character animation',asset:poseAsset,order,indexAt:frame=>{
   const state=simulation.frames[frame];
   const pose=posePlayback(attack,poseAsset.count,frame,simulation.timing,simulation.contactMode?(simulation.impactFrame??Infinity):undefined);
   return (attack.projectileLifetime!==undefined&&!state.ownerActive)||(pose.finished&&attack.poseFinish==='stand')?-1:pose.index;
  }});
 }
 for(const [i,visual] of attack.visuals.entries()){
  const asset=effects.get(visual.effectId);if(!asset)continue;
  rows.push({kind:'effect',visualIndex:i,name:`Effect ${i+1} · ${asset.name||visual.effectId}`,asset,order:visual.frames||asset.times.map((_,index)=>index),indicesAt:frame=>{
   const state=simulation.frames[frame];
   if(state.projectiles)return [...new Set(state.projectiles.flatMap(projectile=>{const v=projectile.attack.visuals[i];if(v?.effectId!==visual.effectId)return [];const index=visualFrame(asset,v,projectile.age,projectile.impact??Infinity);return index<0?[]:[index];}))];
   if(!simulation.cast||(attack.projectileLifetime!==undefined&&!state.projectileAlive))return [];
   const total=(attack.projectileLifetime!==undefined?simulation.timing.startup:(simulation.impactFrame??simulation.frames.length))+simulation.timing.active+simulation.timing.recovery;
   if(!visual.loopUntilImpact&&(visual.loop??asset.loop)&&frame>=total&&attack.projectileLifetime===undefined)return [];
   const index=visualFrame(asset,visual,frame,simulation.impactFrame??Infinity);return index<0?[]:[index];
  }});
 }
 const areaVisual=attack.projectileArea?.visual,areaAsset=areaVisual&&effects.get(areaVisual.effectId);
 if(areaAsset)rows.push({name:'Impact area · '+(areaAsset.name||areaVisual.effectId),asset:areaAsset,order:areaAsset.times.map((_,i)=>i),indicesAt:frame=>[...new Set((simulation.frames[frame].areas||[]).flatMap(area=>{const sample=impactAreaArtSample(area.visual,areaAsset,area,area.age);return sample?[sample.index]:[];}))]});
 for(const row of rows){
  if(!row.indicesAt)row.indicesAt=frame=>{const index=row.indexAt(frame);return index<0?[]:[index];};
  if(!row.indexAt)row.indexAt=frame=>row.indicesAt(frame)[0]??-1;
  row.firstFrames=row.order.map(()=>null);
  for(let frame=0;frame<simulation.frames.length;frame++){
   for(const index of row.indicesAt(frame))if(row.firstFrames[index]===null)row.firstFrames[index]=frame;
  }
 }
 return rows;
}

export function renderTimelineFrames({root,attack,simulation,effects,poseAsset,image,seek,commit}){
 if(!image||!seek)return ()=>{};
 const section=document.createElement('section');section.className='timeline-frames';section.setAttribute('aria-label','Animation frame thumbnails');
 const heading=document.createElement('h3');heading.textContent='Animation frames';section.append(heading);
 const hint=document.createElement('p');hint.textContent='Click a picture to preview that frame. Highlight follows playback. Dimmed frames are not reached in this test. Select frame checkboxes to delete several together. Reorder and edit durations in Character frames or VFX layers.';section.append(hint);
 const rows=thumbnailRows(attack,simulation,effects,poseAsset),updates=[];
 for(const row of rows){
  const title=document.createElement('h4');title.textContent=row.name;section.append(title);
  const strip=document.createElement('div');strip.className='timeline-frame-strip';strip.setAttribute('aria-label',row.name+' frames');section.append(strip);
  const rowIndex=rows.indexOf(row);
  const selection=commit&&row.kind?frameSelection({root:section,strip,count:row.order.length,name:row.name,remove:indices=>{
   const next=structuredClone(attack),keep=row.order.map((_,i)=>i).filter(i=>!indices.includes(i));if(!keep.length)return;
   if(row.kind==='character'){
    next.poseFrames=keep.map(i=>row.order[i]);const times=poseDurations(attack,poseAsset.count);next.poseDurations=keep.map(i=>times[i]);next.poseImpact=Math.min(next.poseImpact||0,keep.length);
    if(next.hurtboxes)next.hurtboxes.frames=remapHurtboxFrames(next.hurtboxes.frames,keep);
    if(next.animationAnchors)next.animationAnchors.frames=remapAnchorFrames(next.animationAnchors.frames,keep);
   }else{const v=next.visuals[row.visualIndex];v.frames=keep.map(i=>row.order[i]);v.loopStart=Math.min(v.loopStart||1,keep.length);v.loopEnd=Math.max(v.loopStart,Math.min(v.loopEnd||keep.length,keep.length));}
   const left=strip.scrollLeft,ancestors=[];for(let node=root;node;node=node.parentElement)ancestors.push([node,node.scrollTop,node.scrollLeft]);commit(next);
   const replacement=root.querySelectorAll('.timeline-frame-strip')[rowIndex];if(replacement){replacement.children[Math.min(indices[0],keep.length-1)]?.querySelector('input')?.focus({preventScroll:true});replacement.scrollLeft=left;}
   for(const [node,top,x] of ancestors){node.scrollTop=top;node.scrollLeft=x;}
  }}):null;
  const buttons=[];
  row.order.forEach((source,index)=>{
   const button=document.createElement('button');button.type='button';button.className='timeline-frame';const first=row.firstFrames[index];
   button.disabled=first===null;button.setAttribute('aria-label',`${row.name}, frame ${index+1}, source ${source+1}${first===null?', not reached':', attack frame '+first}`);
   button.onclick=()=>seek(first);button.setAttribute('aria-pressed','false');
   const canvas=document.createElement('canvas');canvas.width=72;canvas.height=72;
   const asset=row.asset,picture=image(asset.url||asset.sheet||asset.frames[source]);
   const paint=()=>{if(!picture.naturalWidth)return;const ctx=canvas.getContext('2d'),[w,h]=asset.canvas||[128,128],columns=asset.columns||asset.count;
    const scale=Math.min(72/w,72/h);ctx.clearRect(0,0,72,72);ctx.imageSmoothingEnabled=false;ctx.drawImage(picture,asset.url||asset.sheet?source%columns*w:0,asset.sheet?Math.floor(source/columns)*h:0,w,h,(72-w*scale)/2,(72-h*scale)/2,w*scale,h*scale);
   };
   if(picture.complete)paint();else picture.addEventListener('load',paint,{once:true});
   const label=document.createElement('span');label.textContent=`${index+1} · ${first===null?'not reached':first+'f'}`;button.append(canvas,label);if(selection){const tile=document.createElement('div');tile.className='timeline-frame-tile';tile.append(button);selection.add(tile,index,button);strip.append(tile);}else strip.append(button);buttons.push(button);
  });
  let previous='';updates.push(frame=>{const active=row.indicesAt(frame),key=active.join(',');if(key===previous)return;previous=key;buttons.forEach((button,index)=>button.setAttribute('aria-pressed',String(active.includes(index))));});
 }
 if(!rows.length){const empty=document.createElement('p');empty.textContent='Choose character artwork or add an effect to see its frames.';section.append(empty);}
 root.append(section);return frame=>updates.forEach(update=>update(frame));
}
