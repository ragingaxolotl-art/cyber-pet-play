import {floor} from './motion.js?v=24';
import {traitFeeling} from './profile.js?v=24';
export const ballItem=Object.freeze({id:'unicorn-ball',name:'Ball',type:'toy',sprite:'assets/npcs/toy-ball.svg',tags:[]});
export const releaseAt=.72, tossDuration=1.56;
// Sprite coordinates are converted with the viewport aspect, including facing.
export function heldBallPosition(f,aspect=16/9){
 const anchors=[[47,52],[47,52],[48,49],[51,47],[57,45],[57,49],[57,49]];
 const frame=Math.min(6,Math.max(0,f.clock/.12)),i=Math.floor(frame),a=anchors[i],b=anchors[Math.min(6,i+1)],u=frame-i;
 const px=a[0]+(b[0]-a[0])*u+4,py=a[1]+(b[1]-a[1])*u;
 return {x:f.x+f.direction*(.105/aspect)*(px/64-.5),y:f.y+.105*(py/64-1)+.017/2};
}
export function releaseBall(f,aspect){
 const position=heldBallPosition(f,aspect),level=[2,1,0].find(l=>floor(l)>position.y+.012)??0;
 f.toys.push({...position,level,vy:-.10,vx:f.direction*.10/aspect,age:0,landed:false,bounces:0,item:ballItem});f.dropped=true;
}
export function advanceToys(f,pets,dt){
 for(const t of f.toys){
  t.age+=dt;
  if(!t.landed){
   t.vy+=dt*.28;t.x+=t.vx*dt;t.y+=t.vy*dt;
   if(t.x<.015||t.x>.985){t.x=Math.max(.015,Math.min(.985,t.x));t.vx*=-.65;}
   if(t.y>=floor(t.level)){t.y=floor(t.level);if(t.bounces++<2&&Math.abs(t.vy)>.05){t.vy*=-.38;t.vx*=.65;}else{t.landed=true;t.vx=0;}}
  }else{
   const p=pets.find(p=>!p.heldItem&&!p.stair&&p.level===t.level&&['walk','idle'].includes(p.mode)&&Math.abs(p.x-t.x)<.045);
   if(p){p.heldItem=t.item;p.heldTime=0;p.emote=traitFeeling(p,'activity_level');p.emoteTime=4;t.collected=true;}
  }
 }
 // Remain available until picked up; the flyer caps abandoned world toys at five.
 f.toys=f.toys.filter(t=>!t.collected);
}
export function drawBall(c,x,y,size){
 c.save();c.translate(x,y-size/2);c.fillStyle='#ecb84e';c.strokeStyle='#8b5937';c.lineWidth=Math.max(1,size*.09);c.beginPath();c.arc(0,0,size*.46,0,Math.PI*2);c.fill();c.stroke();
 c.strokeStyle='#e56c76';c.lineWidth=size*.18;c.beginPath();c.moveTo(-size*.36,size*.06);c.quadraticCurveTo(0,-size*.35,size*.36,size*.06);c.stroke();c.fillStyle='#fff0b5';c.beginPath();c.arc(-size*.16,-size*.23,size*.09,0,Math.PI*2);c.fill();c.restore();
}
