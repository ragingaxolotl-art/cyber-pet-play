import {frameCoordinates,animationEnvelope,sourceScale} from './display.js?v=height1';
// Uniform scaling only: never stretch width and height independently.
export const sizeStability={sizeRatio:1.35,aspectTolerance:1.25,minimumCorrection:.125,maximumCorrection:8};
const median=values=>{const a=[...values].sort((a,b)=>a-b),m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;};
const width=f=>f.right-f.left,height=f=>f.bottom-f.top;
const summarize=frames=>({height:median(frames.map(height)),width:median(frames.map(width)),center:median(frames.map(f=>(f.left+f.right)/2)),floor:Math.max(...frames.map(f=>f.bottom))});
function correction(sample,reference){
 const h=sample.height/reference.height,w=sample.width/reference.width,aspect=w/h;
 // A squat, stretch, extended arm or turn changes proportions: leave it authored.
 if(aspect<1/sizeStability.aspectTolerance||aspect>sizeStability.aspectTolerance||h>=1/sizeStability.sizeRatio&&h<=sizeStability.sizeRatio)return 1;
 return Math.max(sizeStability.minimumCorrection,Math.min(sizeStability.maximumCorrection,1/h));
}
export function stableArtwork(data,measure){
 const raw=new Map();for(const [name,image] of data.images){const bounds=measure(image);if(!bounds.empty)raw.set(name,frameCoordinates(bounds,image,sourceScale(data,name)));}
 const clips=new Map();for(const [action,names] of Object.entries(data.config.animations||{})){
  const frames=names.map(name=>raw.get(name)).filter(f=>f&&width(f)>0&&height(f)>0);if(frames.length)clips.set(action,{frames,summary:summarize(frames)});
 }
 const referenceAction=['idle_front','idle','idle_side','idle_back'].find(action=>clips.has(action))||clips.keys().next().value;
 const reference=clips.get(referenceAction)?.summary;
 if(!reference)return {frames:new Map(),envelope:{left:-.5,right:.5,top:-1,bottom:0}};
 const result=new Map(),all=[];
 for(const [action,clip] of clips){
  const clipScale=correction(clip.summary,reference),frames=new Map();
  for(const name of data.config.animations[action]){
   const frame=raw.get(name);if(!frame)continue;
   const frameScale=correction({height:height(frame),width:width(frame)},clip.summary),scale=clipScale*frameScale;
   let adjusted=frame;
   if(clipScale!==1||frameScale!==1){
    // Anchor corrected artwork to the standing baseline while keeping each clip's hops
    // and sideways sway. A smaller pose with different proportions is never enlarged.
    const center=((frame.left+frame.right)/2-clip.summary.center)*clipScale+(clipScale!==1?reference.center:clip.summary.center);
    const bottom=(frame.bottom-clip.summary.floor)*clipScale+(clipScale!==1?reference.floor:clip.summary.floor);
    adjusted={left:center-width(frame)*scale/2,right:center+width(frame)*scale/2,top:bottom-height(frame)*scale,bottom};
   }
   frames.set(name,adjusted);all.push(adjusted);
  }
  result.set(action,frames);
 }
 return {frames:result,envelope:animationEnvelope(all)};
}
export function stableFrame(data,action,name,bounds,image){return data.stableFrames?.get(action)?.get(name)||frameCoordinates(bounds,image,sourceScale(data,name));}
