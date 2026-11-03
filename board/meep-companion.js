export const OWNER_BOARD_ID='f897e01c512ffb3d00001199393765594533337812aa9b9142ca2819b49131e9';
export const ownsMeep=data=>data?.boardId===OWNER_BOARD_ID;
export const meepWordVisible=(seconds,still=false)=>!still&&((Math.max(0,seconds)%6.5)<1.2);
let atlas;
export function companionRect(x,floorY,w,h,facing){
 const width=Math.max(22,Math.min(52,Math.max(w,h)*.325));
 const height=width*56/52;
 return {x:x-facing*(w*.55+width*.65)-width*.5,y:floorY-height,width,height};
}
export function drawMeepCompanion(ctx,data,x,y,w,h,facing,seconds,still=false){
 if(!ownsMeep(data))return;
 atlas??=Object.assign(new Image(),{src:new URL('./assets/meep/compact-atlas.png',import.meta.url).href});
 if(!atlas.complete||!atlas.naturalWidth)return;
 const index=still?0:Math.floor(seconds/.08)%9;
 const rect=companionRect(x,y,w,h,facing);
 ctx.save();ctx.filter='none';ctx.globalAlpha=1;ctx.imageSmoothingEnabled=false;
 ctx.drawImage(atlas,index*52,0,52,56,rect.x,rect.y,rect.width,rect.height);
 if(meepWordVisible(seconds,still)){ctx.font=`bold ${Math.max(10,rect.width*.25)}px monospace`;ctx.textAlign='left';ctx.lineWidth=2;ctx.strokeStyle='white';ctx.fillStyle='black';ctx.strokeText('MEEP',rect.x+rect.width*.55,rect.y-4);ctx.fillText('MEEP',rect.x+rect.width*.55,rect.y-4);}
 ctx.restore();
}
