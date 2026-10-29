// Protection uses a compact bottle beside the name, never a text status row.
export const hasPotionProtection=p=>!!p.health?.potionProtection?.size;
export function potionNameplate(plate,p,font,unit){
 const size=hasPotionProtection(p)?Math.max(10,font):0,extra=size?size+4*unit:0;
 return {...plate,width:plate.width+extra,labelOffset:plate.labelOffset-extra/2,medalCenterOffset:plate.medalCenterOffset-extra/2,potionSize:size,potionCenterOffset:(plate.width+extra)/2-6*unit-size/2};
}
export function drawPotionBadge(c,x,y,size){
 if(!size)return;c.save();c.translate(x-size/2,y);c.scale(size/16,size/16);
 c.fillStyle='#f3e9ff';c.beginPath();c.roundRect(3,5,10,10,3);c.fill();
 c.fillStyle='#a376ec';c.beginPath();c.roundRect(4,8,8,6,2);c.fill();
 c.fillStyle='#e2d1ff';c.fillRect(6,2,4,5);c.fillStyle='#725195';c.fillRect(5,0,6,3);
 c.fillStyle='#ffffff';c.fillRect(5,8,2,3);c.restore();
}
export function drawHealing(c,p,x,y,size){
 if(!(p.healingTime>0))return;
 const progress=1-p.healingTime/2.4;c.save();c.globalAlpha=Math.min(1,p.healingTime)*.85;c.strokeStyle='#bbffe5';c.lineWidth=2;
 for(let i=0;i<3;i++){const px=x+(i-1)*size*.26,py=y-size*(.35+progress*.45)-i*4;c.beginPath();c.moveTo(px-3,py);c.lineTo(px+3,py);c.moveTo(px,py-3);c.lineTo(px,py+3);c.stroke();}c.restore();
}
