import {freshAttack,defaultStats,simulate} from './combat-model.js?v=20261025-reactions';
import {targetReaction,fitReactionX} from './target-reactions.js?v=20261025-reactions';
const examples=(await(await fetch('vfx-library.json',{cache:'no-store'})).json()).examples,poses=new Map();
for(const key of ['ready_side','hurt_side','guard_side','knocked_down_side','get_up_side','jump_side','defeated_side']){
 const ref=examples[key],image=new Image();image.src=ref.url;await image.decode();const frames=[];
 for(let i=0;i<ref.count;i++){
  const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,i*128,0,128,128,0,0,128,128);const data=ctx.getImageData(0,0,128,128).data;let l=128,t=128,r=-1,b=-1;
  for(let y=0;y<128;y++)for(let x=0;x<128;x++)if(data[(y*128+x)*4+3]){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
  frames.push({x:i*128+l,y:t,w:r-l+1,h:b-t+1});
 }
 poses.set(key,{image,frames});
}
const cases=[
 ['Hit and recover','A short recoil followed by the ready stance.',{knockback:0,launchHeight:0},{}],
 ['Block','Guard absorbs the hit without launching the character.',{knockback:80,launchHeight:30},{guard:true}],
 ['Launch and land','Backward tilt in the air, then a crouched landing.',{knockback:65,launchHeight:32},{}],
 ['Wall smash','Wall contact, a fall, and a full get-up.',{knockback:150,launchHeight:25,wallSlam:true},{distance:170}],
 ['Floor slam and get up','Land hard, stay down briefly, then recover.',{knockback:30,launchHeight:38,floorSlam:true},{}],
 ['Knockout','A defeated character stays down.',{base:500,launchHeight:24,knockback:40,floorSlam:true},{}]
],cards=[];
for(const [name,note,patch,options] of cases){
 const attack=Object.assign(freshAttack(),{base:5,coefficient:0,cost:0,startup:18,flightFrames:42,box:{x:0,y:-70,w:220,h:80},knockback:0,launchHeight:0},patch),stats=defaultStats();const scenario={distance:75,...options};const sim=simulate(attack,stats,stats,scenario);
 const article=document.createElement('article');article.className='panel';const h=document.createElement('h2');h.textContent=name;const p=document.createElement('p');p.textContent=note;const canvas=document.createElement('canvas');canvas.width=480;canvas.height=280;canvas.setAttribute('aria-label',name+' animated demonstration');const state=document.createElement('p');state.className='state';article.append(h,canvas,state,p);document.getElementById('cards').append(article);cards.push({canvas,state,sim,scenario,attack});
}
const previewLength=Math.max(...cards.map(c=>c.sim.frames.length))+45;document.getElementById("frame").max=previewLength;
let frame=0,playing=true,last=0,elapsed=0;
document.getElementById("frame").oninput=e=>{frame=Number(e.target.value);playing=false;document.getElementById("play").textContent="Play previews";};
document.getElementById('play').onclick=()=>{playing=!playing;document.getElementById('play').textContent=playing?'Pause previews':'Play previews';};document.getElementById('restart').onclick=()=>{frame=0;elapsed=0;};
function draw(){document.getElementById("frame").value=frame;document.getElementById("frameNumber").textContent=frame;for(const card of cards){const f=Math.min(frame,card.sim.frames.length-1),target=card.sim.frames[f].target,reaction=targetReaction(target,f,{guard:card.scenario.guard}),pose=poses.get(reaction.pose),order=reaction.sequence||pose.frames.map((_,i)=>i),b=pose.frames[order[Math.min(order.length-1,Math.floor(reaction.progress*order.length))]],ctx=card.canvas.getContext('2d');ctx.clearRect(0,0,480,280);ctx.imageSmoothingEnabled=false;ctx.save();ctx.translate(20,245);ctx.scale(1.8,1.8);ctx.strokeStyle='#586b81';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(245,0);ctx.stroke();if(card.attack.wallSlam){ctx.fillStyle='#738195';ctx.fillRect(234,-100,3,100);}const scale=Math.min(1,80/b.w,100/b.h),worldX=target.x+reaction.offsetX;ctx.translate(card.attack.wallSlam&&!target.reactionInFlight?fitReactionX(worldX,b.w*scale):worldX,target.y-32);ctx.rotate(reaction.angle*Math.PI/180);ctx.translate(0,32);ctx.scale(-1,1);ctx.drawImage(pose.image,b.x,b.y,b.w,b.h,-b.w*scale/2,-b.h*scale,b.w*scale,b.h*scale);ctx.restore();card.state.textContent=reaction.label;}}
function tick(now){if(playing){elapsed+=Math.min((now-last)/1000,.1)*60;while(elapsed>=1){frame=(frame+1)%(previewLength+1);elapsed--;}}last=now;draw();requestAnimationFrame(tick);}document.getElementById('status').textContent='Six live demonstrations · reactions also work in the planner';requestAnimationFrame(tick);
