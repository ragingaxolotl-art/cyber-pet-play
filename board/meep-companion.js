export const OWNER_BOARD_ID='f897e01c512ffb3d00001199393765594533337812aa9b9142ca2819b49131e9';
export const ownsMeep=data=>data?.boardId===OWNER_BOARD_ID;
export const meepWordVisible=(seconds,still=false)=>!still&&((Math.max(0,seconds)%6.5)<1.2);
let frames,repair;
const cleanFrames=new Map();
function cleanFrame(image,index){
 if(cleanFrames.has(index))return cleanFrames.get(index);
 const result=document.createElement('canvas');result.width=616;result.height=574;
 const c=result.getContext('2d');c.imageSmoothingEnabled=false;
 // Preserve the original animated face and body below the eyes.
 c.drawImage(image,252,294,616,322,0,252,616,322);
 const head=document.createElement('canvas');head.width=26;head.height=6;
 const h=head.getContext('2d');h.imageSmoothingEnabled=false;
 h.drawImage(repair,368,289,518,556*84/392,0,0,26,6);
 h.globalCompositeOperation='source-in';h.fillStyle='rgb(150,187,15)';h.fillRect(0,0,26,6);
 c.drawImage(head,14,168,364,84);cleanFrames.set(index,result);return result;
}
export function drawMeepCompanion(ctx,data,x,y,w,h,facing,seconds,still=false){
 if(!ownsMeep(data))return;
 frames??=Array.from({length:9},(_,i)=>{const image=new Image();image.src=new URL(`./assets/meep/${i}.png`,import.meta.url).href;return image;});
 repair??=Object.assign(new Image(),{src:new URL('./assets/meep/repaired-head.png',import.meta.url).href});
 const index=still?0:Math.floor(seconds/.08)%frames.length;
 const image=frames[index];if(!image.complete||!image.naturalWidth||!repair.complete||!repair.naturalWidth)return;
 const size=Math.max(36,Math.min(88,Math.max(w,h)*.55));
 const left=x-facing*(w*.55+size*.65)-size*.5,top=y-size*.93-(still?0:Math.abs(Math.sin(seconds*8))*3);
 ctx.save();ctx.filter='none';ctx.globalAlpha=1;ctx.imageSmoothingEnabled=false;ctx.drawImage(cleanFrame(image,index),left,top,size,size*574/616);
 if(meepWordVisible(seconds,still)){ctx.font=`bold ${Math.max(10,size*.18)}px monospace`;ctx.textAlign='left';ctx.lineWidth=2;ctx.strokeStyle='white';ctx.fillStyle='black';ctx.strokeText('MEEP',left+size*.48,top+size*.22);ctx.fillText('MEEP',left+size*.48,top+size*.22);}
 ctx.restore();
}
