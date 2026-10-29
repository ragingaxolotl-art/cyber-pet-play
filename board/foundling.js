import {creationRecord} from './character-birth.js?v=care46';
let atlas;
export function foundlingNameplate(record,labelWidth,font,unit){
 const eligible=creationRecord(record,{legacy:true}).foundling;
 const medalHeight=eligible?Math.max(18,26*unit):0,medalWidth=medalHeight*172/360;
 const extra=eligible?medalWidth+4*unit:0,width=labelWidth+12*unit+extra;
 return {width,labelOffset:extra?-extra/2:0,medalCenterOffset:width/2-6*unit-medalWidth/2,medalWidth,medalHeight,medalTop:(font+7*unit-medalHeight)/2};
}
export function drawFoundling(ctx,record,x,y,width,elapsed,reduced=false){
 if(!width||!creationRecord(record,{legacy:true}).foundling)return;
 if(!atlas){atlas=new Image();atlas.src=new URL('./assets/foundling_medal/atlas.png',import.meta.url);}
 if(!atlas.complete||!atlas.naturalWidth)return;
 const frame=reduced?0:Math.floor(elapsed/.1)%56,height=width*360/172;
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.drawImage(atlas,(frame%8)*256+31,Math.floor(frame/8)*448+24,172,360,x-width/2,y,width,height);ctx.restore();
}
