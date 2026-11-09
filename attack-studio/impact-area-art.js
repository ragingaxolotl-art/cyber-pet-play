// Artwork uses the area's combat clock and sampled bounds. It never changes damage geometry.
export function validateImpactAreaArt(visual,effectIds){
 if(visual===undefined)return;
 if(!visual||typeof visual!=='object'||Array.isArray(visual))throw Error('Choose impact-area artwork settings.');
 for(const key of Object.keys(visual))if(!['effectId','scale','rate','loop'].includes(key))throw Error('Unexpected impact-area artwork setting.');
 if(typeof visual.effectId!=='string'||!visual.effectId.length||visual.effectId.length>160||(effectIds&&!effectIds.has(visual.effectId)))throw Error('Choose available impact-area artwork.');
 if(!Number.isFinite(visual.scale)||visual.scale<.25||visual.scale>4)throw Error('Area artwork scale must be 0.25–4.');
 if(!Number.isFinite(visual.rate)||visual.rate<.25||visual.rate>4)throw Error('Area artwork speed must be 0.25–4.');
 if(typeof visual.loop!=='boolean')throw Error('Choose whether area artwork repeats.');
}
export function impactAreaArtSample(visual,effect,box,age){
 if(!visual||!effect||age<0)return null;
 const times=effect.times;if(!Array.isArray(times)||!times.length||times.some(t=>!Number.isFinite(t)||t<=0))return null;
 const [width,height]=effect.canvas||[];
 if(!(width>0&&height>0&&Number.isInteger(effect.columns)&&effect.columns>0))return null;
 const total=times.reduce((sum,t)=>sum+t,0);let elapsed=age*1000/60*visual.rate;
 if(visual.loop)elapsed%=total;else if(elapsed>=total)return null;
 let index=0;while(index<times.length-1&&elapsed>=times[index])elapsed-=times[index++];
 const scale=Math.min(box.w/width,box.h/height)*visual.scale,w=width*scale,h=height*scale;
 return {index,sx:(index%effect.columns)*width,sy:Math.floor(index/effect.columns)*height,sw:width,sh:height,x:box.x+(box.w-w)/2,y:box.y+(box.h-h)/2,w,h};
}
export function drawImpactAreaArt(ctx,{visual,effect,image,box,age,ground=0}){
 const sample=impactAreaArtSample(visual,effect,box,age);if(!sample||!image)return false;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(image,sample.sx,sample.sy,sample.sw,sample.sh,sample.x,ground+sample.y,sample.w,sample.h);ctx.restore();return true;
}
