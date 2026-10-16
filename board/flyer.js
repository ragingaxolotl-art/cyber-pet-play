import {floor} from './motion.js?v=22';
import {trait,traitFeeling,love} from './profile.js?v=22';
import {drawFeeling} from './emotes.js?v=22';
// One scenery character. Toy props and greetings are session-only, never save data.
export function createFlyer(random=Math.random){return {random,x:.12,y:.18,fromX:.12,fromY:.18,targetX:.8,targetY:.2,state:'fly',clock:0,duration:12,direction:1,toys:[],nextDrop:7,landings:0,greeting:null,feeling:'',feelingTime:0};}
const FLIGHT_CYCLE=1.2,TALK_CYCLE=2.4;
function start(f,state,x,y,duration){if(state==='fly')duration=Math.ceil(duration/FLIGHT_CYCLE)*FLIGHT_CYCLE;if(state==='talk')duration=Math.ceil(duration/TALK_CYCLE)*TALK_CYCLE;f.state=state;f.clock=0;f.duration=duration;f.fromX=f.x;f.fromY=f.y;f.targetX=x;f.targetY=y;f.direction=x===f.x?f.direction:Math.sign(x-f.x);}
const available=p=>!p.stair&&['walk','idle'].includes(p.mode);
export function advanceFlyer(f,pets,dt){
 const previousClock=f.clock;f.clock+=dt;f.feelingTime=Math.max(0,f.feelingTime-dt);f.nextDrop-=dt;
 for(const toy of f.toys){
  toy.age+=dt;if(!toy.landed){toy.vy+=dt*.18;toy.y=Math.min(floor(toy.level),toy.y+toy.vy*dt);toy.landed=toy.y>=floor(toy.level);}
  else if(!toy.played){
   const visitor=pets.find(p=>p.level===toy.level&&available(p)&&Math.abs(p.x-toy.x)<.045);
   if(visitor){toy.played=true;toy.age=Math.max(toy.age,25);visitor.emote=traitFeeling(visitor,'curiosity');visitor.emoteTime=4;toy.bounce=1;}
  }
  toy.bounce=Math.max(0,(toy.bounce||0)-dt);
 }
 f.toys=f.toys.filter(t=>t.age<32);
 if(f.greeting&&!pets.includes(f.greeting)){f.greeting=null;f.feeling='thinking';}
 const u=Math.min(1,f.clock/f.duration),ease=u*u*(3-2*u);
 if(['fly','land','takeoff'].includes(f.state)){
  f.x=f.fromX+(f.targetX-f.fromX)*ease;f.y=f.fromY+(f.targetY-f.fromY)*ease;
  if(f.state==='fly')f.y+=Math.sin(u*Math.PI*2)*.018;
 }
 if(f.state==='fly'&&f.nextDrop<=0&&f.toys.length<5&&Math.floor(previousClock/FLIGHT_CYCLE)!==Math.floor(f.clock/FLIGHT_CYCLE)){
  f.resume={x:f.targetX,y:f.targetY};start(f,'drop',f.x,f.y,2.5);f.dropped=false;return;
 }
 if(f.state==='drop'&&f.clock>=1.25&&!f.dropped){
  const level=[2,1,0].find(l=>floor(l)>f.y+.025)??0;
  f.toys.push({x:f.x,y:f.y,level,vy:0,age:0,landed:false,kind:Math.floor(f.random()*3),played:false});f.dropped=true;
 }
 if(u<1)return;
 if(f.state==='drop'){f.nextDrop=16+f.random()*22;start(f,'fly',f.resume.x,f.resume.y,5+f.random()*4);return;}
 if(f.state==='fly'){
  const level=Math.floor(f.random()*3),row=pets.filter(p=>p.level===level&&!p.stair);
  // Choose an open spot beside a pet; never land on their artwork or the food queue.
  const choices=Array.from({length:12},(_,i)=>.07+i*.078).filter(x=>!(level===1&&x>.38&&x<.98)&&row.every(p=>Math.abs(p.x-x)>(p.bodyWidth||.05)/2+.05));
  if(choices.length){const x=choices[Math.floor(f.random()*choices.length)];f.level=level;start(f,'land',x,floor(level),2.3);}
  else start(f,'fly',.08+f.random()*.84,.13+f.random()*.14,7+f.random()*5);
 }else if(f.state==='land'){
  // A moving pet may have entered the chosen landing spot during descent. Lift off again instead of overlapping.
  if(pets.some(p=>p.level===f.level&&!p.stair&&Math.abs(p.x-f.x)<(p.bodyWidth||.05)/2+.035)){start(f,'takeoff',Math.max(.06,Math.min(.94,f.x+f.direction*.08)),Math.max(.12,f.y-.14),2.3);return;}
  f.landings++;f.greeting=pets.filter(p=>p.level===f.level&&available(p)&&Math.abs(p.x-f.x)<.2).sort((a,b)=>Math.abs(a.x-f.x)-Math.abs(b.x-f.x))[0]||null;
  f.feeling='hearts';f.feelingTime=5;if(f.greeting){f.direction=Math.sign(f.greeting.x-f.x)||1;f.greeting.emote=love(f.greeting)>.5?(trait(f.greeting,'sociability')>.5?'hearts':'cute'):traitFeeling(f.greeting,'sociability');f.greeting.emoteTime=4;f.greeting.mode='idle';f.greeting.timer=4;f.greeting.clock=0;f.greeting.direction=Math.sign(f.x-f.greeting.x)||1;f.greeting.socialCooldown=8;}
  start(f,'talk',f.x,f.y,4+f.random()*3);
 }else if(f.state==='talk'){f.greeting=null;start(f,'takeoff',Math.max(.06,Math.min(.94,f.x+f.direction*.08)),Math.max(.12,f.y-.14),2.3);}
 else if(f.state==='takeoff')start(f,'fly',.08+f.random()*.84,.13+f.random()*.15,8+f.random()*8);
}
export function drawFlyer(c,w,h,f,art,elapsed){
 const clip=art.flyer?.[f.state]||art.flyer?.fly;if(!clip?.image?.complete||!clip.image.naturalWidth)return;
 const index=f.state==='fly'||f.state==='talk'?Math.min(clip.count-1,Math.floor((f.clock%(f.state==='fly'?FLIGHT_CYCLE:TALK_CYCLE))/(f.state==='fly'?FLIGHT_CYCLE:TALK_CYCLE)*clip.count)):Math.min(clip.count-1,Math.floor(f.clock/f.duration*clip.count));
 const resting=(index===0||index===clip.count-1)&&clip.restImage?.complete&&clip.restImage.naturalWidth,image=resting?clip.restImage:clip.image,sx=resting?0:(clip.frames?.[index]??index)*64;
 const size=h*.105,y=f.y*h;c.save();c.imageSmoothingEnabled=false;c.translate(f.x*w,y);c.scale(f.direction,1);c.drawImage(image,sx,0,64,64,-size/2,-size,size,size);c.restore();
 if(f.feelingTime>0)drawFeeling(c,f.feeling,elapsed,f.x*w,y-size-h*.025,h*.04);
}
export function drawToys(c,w,h,f){
 for(const t of f.toys){const size=h*.017,x=t.x*w,y=t.y*h-Math.sin((t.bounce||0)*Math.PI)*h*.035;c.save();c.globalAlpha=Math.min(1,(32-t.age)/3);c.translate(x,y-size/2);c.rotate(t.landed?(t.bounce||0)*5:t.age*2);c.fillStyle=['#ef9bc0','#6ddacb','#edcf6b'][t.kind];
  if(t.kind===0){c.beginPath();c.arc(0,0,size/2,0,Math.PI*2);c.fill();c.strokeStyle='#fff5d7';c.lineWidth=2;c.beginPath();c.moveTo(-size/2,0);c.lineTo(size/2,0);c.stroke();}
  else if(t.kind===1){c.fillRect(-size/2,-size/2,size,size);c.fillStyle='#fff5d7';c.fillRect(-size/5,-size/5,size*.4,size*.4);}
  else {c.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=size*(i%2?.23:.55);c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fill();}c.restore();
 }
}
