// Local review helper: use the editor's crop, feet anchoring and pose timing rules.
import {posePlayback} from './pose-timing.js?v=20261105-combat-compat';
const images=new Map();
export async function loadExample(reference){
 if(!reference||images.has(reference.url))return;
 const image=new Image();image.src=reference.url;await image.decode();
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
 const ctx=canvas.getContext('2d',{willReadFrequently:true}),bounds=[];
 for(let f=0;f<reference.count;f++){
  ctx.clearRect(0,0,128,128);ctx.drawImage(image,f*128,0,128,128,0,0,128,128);
  const data=ctx.getImageData(0,0,128,128).data;let left=128,top=128,right=-1,bottom=-1;
  for(let y=0;y<128;y++)for(let x=0;x<128;x++)if(data[(y*128+x)*4+3]){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  bounds.push(right<0||bottom-top<12||(/(?:^|\/)Ground_Slam\.png(?:\?|$)/.test(reference.url)&&f>=9)?null:{f,left,top,w:right-left+1,h:bottom-top+1});
 }
 images.set(reference.url,{image,bounds});
}
export function drawExample(ctx,reference,x,face,progress,sequence=null){
 const entry=reference&&images.get(reference.url);if(!entry)return false;
 const {image,bounds}=entry,order=sequence||Array.from({length:reference.count},(_,i)=>i);
 const n=order[Math.min(order.length-1,Math.floor(progress*order.length))];
 const b=bounds[n]||bounds.slice(0,n+1).reverse().find(Boolean)||bounds.find(Boolean);if(!b)return false;
 const scale=Math.min(1,80/b.w,100/b.h);ctx.save();ctx.translate(x,0);ctx.scale(face,1);
 ctx.drawImage(image,b.f*128+b.left,b.top,b.w,b.h,-b.w*scale/2,-b.h*scale,b.w*scale,b.h*scale);ctx.restore();return true;
}
export function reviewPose(ctx,row,frame){
 const a=row.attack,sim=row.sim,pose=posePlayback(a,row.poseReference?.count||1,frame,sim.timing,sim.contactMode?(sim.impactFrame??Infinity):undefined);
 const standing=pose.finished&&a.poseFinish==='stand',reference=standing?row.readyReference:row.poseReference;
 const order=standing?null:a.poseFrames,count=order?.length||reference?.count||1,progress=standing?.1:(pose.index+.01)/count;
 if(!drawExample(ctx,reference,0,1,Math.min(.999,progress),order)){ctx.fillStyle='#779e99';ctx.fillRect(-9,-60,18,60);}
}
