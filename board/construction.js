import {trait,expression,love,travelSpeed,traitFeeling,willing,wantsRainShelter,shelterHelpChance} from './profile.js?v=22';
import {hasAction,tuning,floor,addWalkingDirt} from './motion.js?v=22';
export const createBuildings=(random=Math.random)=>Array.from({length:3},()=>({random,startAt:Infinity,dismantleAt:Infinity,rainCycle:-1,dryCycle:-1,phase:'bare',progress:0,workers:[],lastBuildCycle:-1,recruitAt:0,dust:0}));
const available=p=>!p.stair&&!p.socialGroup&&!p.playGroup&&['idle','walk','shelterWait'].includes(p.mode)&&hasAction(p.data,'walking');
export function workRate(helpers){return Math.max(0,helpers)/18;}
function release(building,rain){for(const p of building.workers){p.buildingJob=null;p.worldBob=0;p.mode=rain&&building.phase==='ready'&&p.rainWantsShelter?'shelter':'idle';p.timer=2;p.worldTimer=60;p.socialCooldown=15;p.worldCooldown=15;p.emote='hearts';p.emoteTime=4;}building.workers=[];}
export function advanceConstruction(world,pets,dt,time,huts,weather){
 const present=new Set(pets);
 for(const [level,b] of world.buildings.entries()){
  b.dust=Math.max(0,b.dust-dt);b.workers=b.workers.filter(p=>{if(present.has(p)&&p.mode==='build'&&hasAction(p.data,'walking'))return true;if(p.mode==='build'){p.mode='idle';p.timer=2;p.buildingJob=null;p.worldBob=0;}return false;});
  if(weather.rain&&b.rainCycle!==weather.cycle){b.rainCycle=weather.cycle;b.startAt=time+3+level*4+b.random()*10;b.dismantleAt=Infinity;b.dryCycle=-1;}
  if(!weather.rain&&b.progress>0&&b.dryCycle!==weather.cycle){b.dryCycle=weather.cycle;b.dismantleAt=time+8+level*5+b.random()*18;}
  if(b.phase==='bare'&&weather.rain&&time>=b.startAt){b.phase='building';b.lastBuildCycle=weather.cycle;}
  if(['ready','building'].includes(b.phase)&&!weather.rain&&time>=b.dismantleAt&&!pets.some(p=>p.level===level&&p.mode==='shelter')){if(b.progress>0)b.phase='dismantling';else{b.phase='bare';release(b,false);}}
  if(b.phase==='building'&&!weather.rain&&b.progress===0){b.phase='bare';release(b,false);continue;}
  if(b.phase==='building'&&!weather.rain&&time<b.dismantleAt){release(b,false);continue;}
  if(b.phase==='dismantling'&&weather.rain)b.phase='building';
  if(!['building','dismantling'].includes(b.phase))continue;
  if(time>=b.recruitAt){b.recruitAt=time+2+b.random()*4;for(const p of pets){if(b.workers.length>=6)break;if(p.level!==level||!available(p))continue;
   const needsRoof=wantsRainShelter(p,weather.cycle),key=weather.cycle+':'+b.phase;
   if(p.buildDecisionKey!==key){p.buildDecisionKey=key;p.willHelpBuild=needsRoof||p.random()<shelterHelpChance(p);}
   if(!p.willHelpBuild)continue;p.mode='build';p.buildingJob=b;p.clock=0;p.emote='eager';p.emoteTime=4;b.workers.push(p);break;}}
  const hut=huts[level],span=hut.right-hut.left;let helpers=0;
  b.workers.forEach((p,i)=>{const target=hut.left+.03+(span-.06)*(i+.5)/b.workers.length;p.worldTarget=target;const delta=target-p.x,step=Math.min(Math.abs(delta),travelSpeed(p)*dt);p.gameMoving=step>.00001;
   if(Math.abs(delta)>.003){p.direction=Math.sign(delta);p.x+=p.direction*step;addWalkingDirt(p,step);}else{helpers++;p.worldBob=Math.abs(Math.sin(p.clock*9+i))*.004;p.emote='sweat';p.emoteTime=2;}
  });
  b.helpers=helpers;if(helpers)b.dust=.8;
  b.progress=Math.max(0,Math.min(1,b.progress+workRate(helpers)*dt*(b.phase==='building'?1:-1)));
  if(b.phase==='building'&&b.progress===1){b.phase='ready';release(b,weather.rain);b.dust=1.5;}
  if(b.phase==='dismantling'&&b.progress===0){b.phase='bare';release(b,false);b.dust=1.5;}
 }
}
export function drawConstruction(c,w,h,world,huts,time){
 for(const [level,b] of world.buildings.entries()){
  if(!b.dust)continue;const hut=huts[level],y=floor(level)*h,center=(hut.left+hut.right)/2*w,span=(hut.right-hut.left)*w;
  c.save();c.globalAlpha=Math.min(1,b.dust*2)*.94;
  for(let i=0;i<14;i++){const x=center+Math.sin(i*2.3+time*2)*span*.46,yy=y-h*(.035+.07*(.5+.5*Math.sin(i+time*3)));c.fillStyle=i%3?'#e7e6d8':'#fff8e6';c.beginPath();c.ellipse(x,yy,span*(.08+.025*Math.sin(time*5+i)),h*.037,0,0,Math.PI*2);c.fill();}
  c.globalAlpha=Math.min(1,b.dust);c.strokeStyle='#dfc18a';c.lineWidth=3;for(let i=0;i<5;i++){const x=center+Math.sin(time*4+i*2)*span*.43,yy=y-h*(.06+Math.abs(Math.sin(time*4+i))*.09);c.beginPath();c.moveTo(x-4,yy-4);c.lineTo(x+4,yy+4);c.moveTo(x-4,yy+4);c.lineTo(x+4,yy-4);c.stroke();}c.restore();
 }
}
