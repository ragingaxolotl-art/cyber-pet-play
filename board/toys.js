import {freeForActivity} from './activity-state.js?v=31';
import {foodScore} from './food.js?v=31';
import {floor,hasAction,animationDuration,addWalkingDirt} from './motion.js?v=31';
import {traitFeeling,trait,love,willing,travelSpeed} from './profile.js?v=31';
export const ballItem=Object.freeze({id:'unicorn-ball',name:'Ball',type:'toy',sprite:'assets/npcs/toy-ball.svg',tags:[]});
export const releaseAt=.48, tossDuration=1.56;
// Sprite coordinates are converted with the viewport aspect, including facing.
export function heldBallPosition(f,aspect=16/9){
 const anchors=[[48,51],[48,51],[49,48],[53,46],[58,45]];
 const frame=Math.min(4,Math.max(0,f.clock/.12)),i=Math.floor(frame),a=anchors[i],b=anchors[Math.min(4,i+1)],u=frame-i;
 const px=a[0]+(b[0]-a[0])*u+4,py=a[1]+(b[1]-a[1])*u;
 return {x:f.x+f.direction*(.105/aspect)*(px/64-.5),y:f.y+.105*(py/64-1)+.022/2};
}
export function releaseBall(f,aspect){
 const position=heldBallPosition(f,aspect),level=[2,1,0].find(l=>floor(l)>position.y+.012)??0;
 f.toys.push({...position,level,vy:-.23,vx:f.direction*.24/aspect,age:0,landed:false,bounces:0,item:f.dropItem||ballItem});f.dropped=true;
}
const free=p=>freeForActivity(p);
function moveTo(p,target,dt){const delta=target-p.x,step=Math.min(Math.abs(delta),travelSpeed(p)*dt);p.direction=Math.sign(delta)||p.direction||1;p.x+=p.direction*step;p.gameMoving=step>0;addWalkingDirt(p,step);}
export function chooseDrop(f,pets){
 f.dropCount=(f.dropCount||0)+1;
 const eaters=pets.filter(p=>p.data.food&&hasAction(p.data,'eat'));
 f.dropItem=f.dropCount%3===0&&eaters.length?eaters[Math.floor(f.random()*eaters.length)].data.food:ballItem;
}
function endPlay(t,present){
 const g=t.play,owner=g.players.find(p=>present.has(p)&&p.mode==='toyPlay'&&p.toyPlay===g&&!p.heldItem);
 if(owner){owner.heldItem=t.item;owner.heldTime=0;t.collected=true;}
 for(const p of g.players)if(p.toyPlay===g){p.toyPlay=null;p.gameMoving=false;p.worldBob=0;p.toyCooldown=25;p.socialCooldown=8;if(p.mode==='toyPlay'){p.mode='idle';p.timer=2;}}
 t.play=null;t.visitor=null;t.landed=true;t.y=floor(t.level);t.playCooldown=18;
}
export function startToyPlay(t,p,pets){
 const partner=pets.find(q=>q!==p&&free(q)&&q.level===p.level&&(q.toyCooldown||0)<=0&&Math.abs(q.x-p.x)<.24&&hasAction(q.data,'walking')&&willing(q,p));
 const players=partner?[p,partner]:[p],gap=partner?Math.max(.11,(p.bodyWidth||.06)/2+(partner.bodyWidth||.06)/2+.035):0;
 const center=Math.max(.08+gap/2,Math.min(.92-gap/2,t.x));
 const g={players,time:0,duration:9+trait(p,'activity_level')*7,center,gap};t.play=g;t.visitor=null;
 players.sort((a,b)=>a.x-b.x).forEach((q,i)=>{q.mode='toyPlay';q.toyPlay=g;q.toyTarget=null;q.clock=0;q.toySlot=center+(i-.5)*gap;q.emote=traitFeeling(q,'activity_level');q.emoteTime=4;});return g;
}
export function advanceToys(f,pets,dt){
 const present=new Set(pets);
 for(const p of pets){
  p.toyCooldown=Math.max(0,(p.toyCooldown||0)-dt);
  if(p.heldItem?.type==='toy'&&p.heldTime>65+35*(1-trait(p,'activity_level'))&&p.toyCooldown===0&&free(p)&&hasAction(p.data,'walking')&&f.toys.length<(f.state==='drop'&&!f.dropped?4:5)){
   const t={x:p.x,y:floor(p.level),level:p.level,age:0,landed:true,item:p.heldItem,vy:0,vx:0,bounces:2};p.heldItem=null;f.toys.push(t);startToyPlay(t,p,pets);
  }
  if(p.mode==='seekToy'&&(!f.toys.includes(p.toyTarget)||p.toyTarget.visitor!==p)){p.mode='idle';p.timer=1;p.toyTarget=null;}
 }
 for(const t of f.toys){
  t.age+=dt;t.playCooldown=Math.max(0,(t.playCooldown||0)-dt);
  if(t.play){
   const g=t.play;
   if(g.players.some(p=>!present.has(p)||p.mode!=='toyPlay'||p.level!==t.level||!hasAction(p.data,'walking'))){endPlay(t,present);continue;}
   for(const p of g.players){moveTo(p,p.toySlot,dt);if(!p.gameMoving)p.direction=t.x>p.x?1:-1;p.emote=love(p)>.5?'laughing':traitFeeling(p,'activity_level');p.emoteTime=2;}
   if(g.players.some(p=>Math.abs(p.x-p.toySlot)>.004)){t.x=g.players[0].x;t.y=floor(t.level);continue;}
   g.time+=dt;
   const u=.5+.5*Math.sin(g.time*2.4);t.x=g.players.length===2?g.center+(u-.5)*g.gap:g.center+Math.sin(g.time*2.4)*.025;
   t.y=floor(t.level)-Math.abs(Math.cos(g.time*2.4))*.045;
   if(g.time>=g.duration)endPlay(t,present);continue;
  }
  if(!t.landed){
   t.vy+=dt*.28;t.x+=t.vx*dt;t.y+=t.vy*dt;
   if(t.x<.015||t.x>.985){t.x=Math.max(.015,Math.min(.985,t.x));t.vx*=-.65;}
   if(t.y>=floor(t.level)){t.y=floor(t.level);if(t.bounces++<2&&Math.abs(t.vy)>.05){t.vy*=-.38;t.vx*=.65;}else{t.landed=true;t.vx=0;}}
   continue;
  }
  if(t.visitor&&(!present.has(t.visitor)||t.visitor.mode!=='seekToy'||t.visitor.toyTarget!==t||!hasAction(t.visitor.data,'walking'))){const p=t.visitor;if(p.mode==='seekToy'&&p.toyTarget===t){p.mode='idle';p.timer=1;p.toyTarget=null;}t.visitor=null;}
  if(!t.visitor&&t.playCooldown===0){
   const candidates=pets.filter(p=>free(p)&&p.level===t.level&&(p.toyCooldown||0)<=0&&hasAction(p.data,'walking')&&Math.abs(p.x-t.x)<.35&&(t.item.type==='toy'||hasAction(p.data,'eat')||!p.heldItem));
   candidates.sort((a,b)=>Math.abs(a.x-t.x)-Math.abs(b.x-t.x));const p=candidates[0];
   if(p){t.visitor=p;p.toyTarget=t;p.mode='seekToy';p.clock=0;p.emote=t.item.type==='toy'?'eager':'drooling';p.emoteTime=3;}
  }
  const p=t.visitor;if(!p)continue;moveTo(p,t.x,dt);if(Math.abs(p.x-t.x)>.018)continue;
  if(t.item.type==='toy')startToyPlay(t,p,pets);
  else {t.collected=true;t.visitor=null;p.toyTarget=null;p.gameMoving=false;p.toyCooldown=20;
   if(hasAction(p.data,'eat')){p.snackItem=t.item;p.mode='snack';p.clock=0;p.timer=p.mealDuration=Math.max(8,animationDuration(p.data.config,'eat')*2);p.emote=foodScore(t.item,p.data.foodPreferences)<=0?(love(p)>.5?'thinking':'frustrated'):traitFeeling(p,'generosity');p.emoteTime=3;p.foodReactionTime=3;}
   else {p.heldItem=t.item;p.heldTime=0;p.mode='idle';p.timer=2;}
  }
 }
 f.toys=f.toys.filter(t=>!t.collected);
}
export function drawDroppedItem(c,x,y,size,item,images){
 if(item?.type!=='toy'){const im=images?.get(item?.id);if(im?.complete&&im.naturalWidth){c.drawImage(im,x-size/2,y-size,size,size);return;}}
 drawBall(c,x,y,size);
}
export function drawBall(c,x,y,size){
 c.save();c.translate(x,y-size/2);c.fillStyle='#ecb84e';c.strokeStyle='#8b5937';c.lineWidth=Math.max(1,size*.09);c.beginPath();c.arc(0,0,size*.46,0,Math.PI*2);c.fill();c.stroke();
 c.strokeStyle='#e56c76';c.lineWidth=size*.18;c.beginPath();c.moveTo(-size*.36,size*.06);c.quadraticCurveTo(0,-size*.35,size*.36,size*.06);c.stroke();c.fillStyle='#fff0b5';c.beginPath();c.arc(-size*.16,-size*.23,size*.09,0,Math.PI*2);c.fill();c.restore();
}
