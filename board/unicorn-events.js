import {floor} from './motion.js?v=28';
import {hostX} from './host-interactions.js?v=28';
import {weatherAt,huts} from './world.js?v=28';
// Seconds, not frame counts. Visits remain brief with several quiet minutes between.
export const visitSettings={duration:48,variation:12,quiet:240,quietVariation:180,rainChance:.75,rainDelay:5,rainVariation:12,minQuiet:150};
export function visitState(random){return {age:0,nextVisit:105+random()*90,lastDeparture:-Infinity,visitRemaining:0,visits:0,trail:[],glitter:[],particleClock:0,wasRaining:false,rainChecked:-1,magicAttempted:false};}
function enter(f){
 const left=f.random()<.5;f.state='fly';f.x=left?-.08:1.08;f.y=.17;f.fromX=f.x;f.fromY=f.y;f.targetX=left?.72:.28;f.targetY=.2;f.direction=left?1:-1;f.clock=0;f.duration=12;
 f.visitRemaining=visitSettings.duration+f.random()*visitSettings.variation;f.nextDrop=5+f.random()*3;f.visits++;f.magicAttempted=false;f.greeting=null;
}
export function advanceVisit(f,dt,time=f.age+dt){
 f.age+=dt;const weather=weatherAt(time);
 if(f.wasRaining&&!weather.rain&&f.rainChecked!==weather.cycle){
  f.rainChecked=weather.cycle;
  if(f.state==='absent'&&f.age-f.lastDeparture>=visitSettings.minQuiet&&f.random()<visitSettings.rainChance)f.nextVisit=Math.min(f.nextVisit,f.age+visitSettings.rainDelay+f.random()*visitSettings.rainVariation);
 }
 f.wasRaining=weather.rain;
 if(f.state==='absent'){if(f.age<f.nextVisit)return false;enter(f);return true;}
 if(f.state==='leave'&&f.clock>=f.duration){f.state='absent';f.lastDeparture=f.age;f.nextVisit=f.age+visitSettings.quiet+f.random()*visitSettings.quietVariation;f.greeting=null;f.feelingTime=0;return false;}
 f.visitRemaining-=dt;
 // Finish a throw, greeting or landing before the final departure.
 if(f.visitRemaining<=0&&f.state==='fly'){
  f.state='leave';f.fromX=f.x;f.fromY=f.y;f.targetX=f.direction>0?1.08:-.08;f.targetY=.12;f.clock=0;f.duration=Math.max(3,Math.abs(f.targetX-f.x)*9);f.greeting=null;
 }
 return true;
}
export function tryMagicPavilion(f,world,pets,time){
 if(!world||f.magicAttempted||f.state!=='fly'||f.clock<1)return;
 f.magicAttempted=true;if(weatherAt(time).rain||f.random()>=.35)return;
 const choices=world.buildings.map((b,level)=>({b,level,hut:huts[level]})).filter(({b,level,hut})=>b.phase==='ready'&&!b.workers.length&&!pets.some(p=>p.level===level&&(p.mode==='shelter'||p.mode==='build'||p.x>hut.left-.03&&p.x<hut.right+.03)));
 if(!choices.length)return;
 const {b,level,hut}=choices[Math.floor(f.random()*choices.length)];
 // The unicorn actually visits the pavilion before the little magic smoke cloud.
 f.magicTarget={b,level,hut};f.fromX=f.x;f.fromY=f.y;f.targetX=(hut.left+hut.right)/2;f.targetY=floor(level)-.13;f.direction=Math.sign(f.targetX-f.x)||1;f.clock=0;f.duration=8.4;
}
export function advanceMagic(f,pets,hosts,world,dt,time,aspect=16/9){
 for(const p of [...pets,...(hosts?.people||[])])p.sparkleTime=Math.max(0,(p.sparkleTime||0)-dt);
 for(const p of f.trail)p.age+=dt;f.trail=f.trail.filter(p=>p.age<3);
 for(const p of f.glitter){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}
 f.glitter=f.glitter.filter(p=>p.age<6&&p.y<.9);
 const moving=['fly','leave','land','takeoff'].includes(f.state);
 f.particleClock+=dt;
 if(moving&&f.particleClock>=.08){
  f.particleClock=0;
  f.trail.push({x:f.x-f.direction*.027/aspect,y:f.y-.037,age:0,visit:f.visits});
  const last=f.trail.at(-2);if(last&&Math.hypot((last.x-f.x)*aspect,last.y-f.y)>.15)f.trail.at(-1).break=true;
  f.glitter.push({x:f.x+(f.random()-.5)*.065/aspect,y:f.y-.03,age:0,vx:(f.random()-.5)*.018/aspect,vy:.085+f.random()*.025,phase:f.random()*Math.PI*2});
 }
 // Bound memory even after unusual long frame gaps or test time steps.
 f.trail=f.trail.slice(-45);f.glitter=f.glitter.slice(-85);
 for(const spark of f.glitter){
  for(const p of pets)if(!p.stair&&Math.abs(p.x-spark.x)<.035/aspect&&spark.y>floor(p.level)-.10&&spark.y<floor(p.level))p.sparkleTime=3;
  for(const [i,p] of (hosts?.people||[]).entries())if(Math.abs(hostX(i,aspect,1)/aspect+(p.offset||0)/aspect-spark.x)<.04/aspect&&spark.y>.49&&spark.y<.605)p.sparkleTime=3;
 }
 // Sparkle is a separate reaction layer; food and social outcomes keep priority.
 tryMagicPavilion(f,world,pets,time);
 const target=f.magicTarget;
 if(target&&Math.abs(f.x-(target.hut.left+target.hut.right)/2)<.035&&Math.abs(f.y-(floor(target.level)-.13))<.03){
  const occupied=pets.some(p=>p.level===target.level&&(p.mode==='shelter'||p.mode==='build'||p.x>target.hut.left-.03&&p.x<target.hut.right+.03));
  if(!weatherAt(time).rain&&!occupied&&target.b.phase==='ready'&&!target.b.workers.length){target.b.magicRemaining=3;target.b.phase='magic';target.b.dust=1;f.feeling='hearts';f.feelingTime=4;}
  f.magicTarget=null;
 }
 if(f.state==='absent'||f.state==='leave')f.magicTarget=null;
}
const colors=['#ff9bb8','#ffd496','#fff3a4','#a3e8b1','#9dd9f3','#c3aff2'];
export function drawMagic(c,w,h,f,time){
 c.save();c.lineCap='round';c.lineJoin='round';c.lineWidth=h*.0035;
 for(let i=1;i<f.trail.length;i++){
  const a=f.trail[i-1],b=f.trail[i];if(b.break||a.visit!==b.visit||a.age-b.age>.2)continue;
  c.globalAlpha=Math.max(0,1-a.age/3)*.6;
  for(let band=0;band<colors.length;band++){c.strokeStyle=colors[band];c.beginPath();c.moveTo(a.x*w,(a.y+(band-2.5)*.0031)*h);c.lineTo(b.x*w,(b.y+(band-2.5)*.0031)*h);c.stroke();}
 }
 for(const p of f.glitter){
  c.globalAlpha=Math.max(0,1-p.age/6)*(.55+.45*Math.abs(Math.sin(time*5+p.phase)));c.strokeStyle=colors[Math.floor(p.phase)%colors.length];c.lineWidth=Math.max(1,h*.0011);const x=p.x*w,y=p.y*h,r=h*.003;
  c.beginPath();c.moveTo(x-r,y);c.lineTo(x+r,y);c.moveTo(x,y-r);c.lineTo(x,y+r);c.stroke();
 }
 c.restore();
}
