import {freeForActivity} from './activity-state.js?v=28';
import {splashDirt} from './dirt.js?v=28';
import {trait,expression,love,travelSpeed,traitFeeling,willing,wantsRainShelter,mudEnjoyment} from './profile.js?v=28';
import {createBuildings,advanceConstruction,drawConstruction} from './construction.js?v=28';
import {floor,hasAction,tuning,addWalkingDirt} from './motion.js?v=28';
export const huts=[{level:0,left:.62,right:.95},{level:1,left:.025,right:.31},{level:2,left:.67,right:.97}];
export const puddles=[{level:0,x:.105,r:.041},{level:1,x:.895,r:.038},{level:2,x:.16,r:.043}];
export const mud=[{level:0,x:.155,r:.025},{level:1,x:.835,r:.025},{level:2,x:.225,r:.025}];
export const worldModes=new Set(['shelterWait','shelter','puddle','watch','explore','celebrate','quiet','startle']);
export function weatherAt(time){const phase=time%240;return {rain:phase>=30&&phase<90,celebrate:phase>=150&&phase<168,rustle:phase>=110&&phase<116,cycle:Math.floor(time/240)};}
export const butterflyAt=(level,time)=>.40+.16*Math.sin(time*.08+level*2);
export function beginWorld(p,kind,target,duration=10){p.mode=kind;p.worldTarget=target;p.worldTimer=duration;p.clock=0;p.socialCooldown=duration+10;p.emote=kind==='quiet'?'sleepy':kind==='puddle'?'eager':kind==='shelter'?'sweat':kind==='startle'?'question':'thinking';p.emoteTime=4;}
function finish(p){p.mode='idle';p.timer=2;p.clock=0;p.worldCooldown=20+p.random()*25;p.shelterScale=1;p.worldBob=0;p.socialCooldown=8;}
export function createWorld(){return {buildings:createBuildings(),splashes:[],previous:new WeakMap(),rainCycle:-1};}
function splash(world,p,muddy=false){
  for(let i=0;i<7;i++)world.splashes.push({x:p.x,y:floor(p.level),vx:(i-3)*.012,vy:-.035-(i%3)*.014,age:0,muddy});
  if(world.splashes.length>210)world.splashes.splice(0,world.splashes.length-210);
}
export function advanceWorld(world,pets,dt,time){
  const weather=weatherAt(time);
  advanceConstruction(world,pets,dt,time,huts,weather);
  for(const s of world.splashes){s.age+=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=.16*dt;}
  world.splashes=world.splashes.filter(s=>s.age<.65);
  // Assign distinct places under each broad roof. All shelter occupants remain visible.
  const shelterRows=huts.map(h=>pets.filter(p=>p.mode==='shelter'&&p.level===h.level));
  for(const [level,row] of shelterRows.entries())row.forEach((p,i)=>{const h=huts[level];p.worldTarget=h.left+.025+(h.right-h.left-.05)*(i+.5)/row.length;p.shelterScale=Math.min(1,(h.right-h.left-.05)/row.length/Math.max(.015,p.bodyWidth||.06)*.85);});
  for(const p of pets){
    p.worldCooldown=Math.max(0,(p.worldCooldown??12+p.random()*15)-dt);p.splashCooldown=Math.max(0,(p.splashCooldown||0)-dt);
    const previous=world.previous.get(p);world.previous.set(p,{x:p.x,level:p.level});
    if(previous&&previous.level===p.level&&!p.stair&&!p.routeFloor&&Math.abs(p.x-previous.x)<.1&&p.x!==previous.x){
      const patch=mud[p.level],pool=puddles[p.level];
      if(Math.abs(p.x-patch.x)<patch.r)addWalkingDirt(p,Math.abs(p.x-previous.x)*5);
      if(Math.abs(p.x-pool.x)<pool.r&&p.splashCooldown===0){splash(world,p,true);splashDirt(p);p.splashCooldown=.45;}
    }
    if(worldModes.has(p.mode)){
      if(['shelter','shelterWait'].includes(p.mode)&&!weather.rain){finish(p);continue;}
      if(p.mode==='shelterWait'&&world.buildings[p.level].phase==='ready'){p.mode='shelter';p.worldTimer=60;}
      const moving=hasAction(p.data,'walking'),delta=(p.worldTarget??p.x)-p.x;
      if(moving&&Math.abs(delta)>.002){const step=Math.min(Math.abs(delta),travelSpeed(p)*dt);p.direction=Math.sign(delta);p.x+=p.direction*step;addWalkingDirt(p,step);}
      else {
        p.worldTimer-=dt;
        if(p.mode==='puddle'){p.worldBob=Math.abs(Math.sin(p.clock*5))*.009;if(p.splashCooldown===0){splash(world,p,true);p.splashCooldown=.7;splashDirt(p,.1);p.emote='laughing';p.emoteTime=2;}}
        if(p.mode==='quiet'&&p.worldTimer<2){p.emote='neutral';p.emoteTime=2;}
        if(p.mode==='watch'){p.direction=butterflyAt(p.level,time)>p.x?1:-1;}
        if(p.mode==='shelter'){p.emote=traitFeeling(p,'sociability');p.emoteTime=2;}
        if(p.mode==='celebrate'){p.emote='hearts';p.emoteTime=2;p.worldBob=moving?Math.abs(Math.sin(p.clock*4))*.004:0;}
      }
      if(['shelter','shelterWait'].includes(p.mode)?!weather.rain:p.worldTimer<=0)finish(p);
      continue;
    }
    if(!freeForActivity(p))continue;
    const canWalk=hasAction(p.data,'walking');
    if(weather.rain&&p.rainSeen!==weather.cycle){
      p.rainSeen=weather.cycle;
      if(canWalk){if(wantsRainShelter(p,weather.cycle)){beginWorld(p,world.buildings[p.level].phase==='ready'?'shelter':'shelterWait',(huts[p.level].left+huts[p.level].right)/2,60);}else beginWorld(p,'puddle',puddles[p.level].x,5+mudEnjoyment(p)*7);}
      else {p.emote='sweat';p.emoteTime=5;}
      continue;
    }
    if(p.worldCooldown>0)continue;
    if(weather.celebrate){beginWorld(p,'celebrate',canWalk?.46+trait(p,'sociability')*.13:p.x,5+trait(p,'sociability')*8);continue;}
    if(weather.rustle){beginWorld(p,'startle',canWalk&&trait(p,'bravery')>.6?(love(p)>.5?.58:puddles[p.level].x):p.x,4);p.emote=traitFeeling(p,'bravery');p.worldTimer=3+expression(p).caution*(1-love(p))*7;continue;}
    // Leave genuine free time for meals, play and social invitations.
    p.worldCooldown=15+p.random()*20;if(p.random()>.5)continue;
    const pick=p.random(),curious=trait(p,'curiosity');
    if(canWalk&&pick<mudEnjoyment(p)*.18)beginWorld(p,'puddle',puddles[p.level].x,5);
    else if(pick<.22+curious*.30){beginWorld(p,'watch',p.x,5+curious*7);p.emote='question';}
    else if(canWalk&&pick<.65){beginWorld(p,'explore',curious<.4&&love(p)<.5?p.x:.58,5+curious*6);p.emote=traitFeeling(p,'curiosity');}
    else {beginWorld(p,'quiet',p.x,5+(1-trait(p,'sociability'))*9);p.emote=traitFeeling(p,'activity_level');}
  }
}
const oval=(c,x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
export function drawWorldGround(c,w,h,world){
  for(const hut of huts){const x=hut.left*w,ww=(hut.right-hut.left)*w,y=floor(hut.level)*h,hh=h*.19;
    const building=world?.buildings[hut.level];
    if(building&&building.progress===0){c.fillStyle='#ad8458';for(let i=0;i<5;i++)c.fillRect(x+ww*.38+i*3,y-5-i*3,ww*.20,4);continue;}
    c.save();if(building&&building.progress<1){c.beginPath();c.rect(x-ww*.04,y-hh*building.progress,ww*1.08,hh*building.progress+4);c.clip();}
    c.fillStyle='#263b3a70';c.fillRect(x,y-hh*.78,ww,hh*.78);
    c.fillStyle=hut.level===2?'#b9dce3':'#a77e52';c.fillRect(x,y-hh*.75,ww*.022,hh*.75);c.fillRect(x+ww*.978,y-hh*.75,ww*.022,hh*.75);
    c.fillStyle=hut.level===2?'#e4f3ed':'#658d56';c.beginPath();c.moveTo(x-ww*.035,y-hh*.75);c.lineTo(x+ww*.12,y-hh);c.lineTo(x+ww*.88,y-hh);c.lineTo(x+ww*1.035,y-hh*.75);c.closePath();c.fill();
    c.strokeStyle=hut.level===2?'#a8cbd2':'#446c40';c.lineWidth=2;for(let i=1;i<17;i++){const xx=x+ww*i/18;c.beginPath();c.moveTo(xx,y-hh*.98);c.lineTo(xx+ww*.015,y-hh*.78);c.stroke();}
    c.fillStyle='#ddc39a';c.fillRect(x,y,ww,h*.006);c.restore();
  }
  for(const patch of mud){const y=floor(patch.level)*h;oval(c,patch.x*w,y+2,patch.r*w,h*.007,'#77583e');for(let i=0;i<6;i++)oval(c,(patch.x+Math.sin(i*3)*patch.r*.75)*w,y+Math.cos(i)*h*.003,w*.003,h*.002,'#a57a4f');}
  for(const pool of puddles){const y=floor(pool.level)*h;oval(c,pool.x*w,y+2,pool.r*w,h*.008,'#7bb5ba');oval(c,(pool.x-.008)*w,y,pool.r*w*.7,h*.003,'#c8eef0');}
}
export function drawWorldAtmosphere(c,w,h,world,time){
  drawConstruction(c,w,h,world,huts,time);
  const weather=weatherAt(time);
  for(let level=0;level<3;level++){
    const x=butterflyAt(level,time)*w,y=(floor(level)-.15+Math.sin(time*.8+level)*.012)*h,wing=Math.abs(Math.sin(time*9))*7+2;
    oval(c,x-4,y,wing,5,level===1?'#ffc87a':'#f1a9d3');oval(c,x+4,y,wing,5,'#fff1a9');c.fillStyle='#4a5361';c.fillRect(x-1,y-4,2,9);
    // A small changing pinwheel invites investigation without blocking the path.
    const px=.58*w,py=(floor(level)-.075)*h;c.strokeStyle='#cbb284';c.lineWidth=2;c.beginPath();c.moveTo(px,py);c.lineTo(px,floor(level)*h);c.stroke();c.save();c.translate(px,py);c.rotate(time*(weather.rustle?5:.4));for(let i=0;i<4;i++){c.rotate(Math.PI/2);c.fillStyle=['#e9ac75','#8dc6bd','#e6d68f','#b6a3d0'][i];c.beginPath();c.moveTo(0,0);c.lineTo(h*.015,0);c.lineTo(h*.012,h*.012);c.fill();}c.restore();
  }
  if(weather.rain){c.save();c.strokeStyle='#c9edf080';c.lineWidth=1.3;for(let i=0;i<95;i++){const x=((i*.137+time*.012)%1)*w,y=((i*.219+time*.45)%1)*h;const covered=huts.some(hut=>world.buildings[hut.level].phase==='ready'&&x>hut.left*w&&x<hut.right*w&&y>(floor(hut.level)-.14)*h&&y<floor(hut.level)*h);if(!covered){c.beginPath();c.moveTo(x,y);c.lineTo(x-w*.002,y+h*.014);c.stroke();}}c.restore();}
  for(const s of world.splashes){c.globalAlpha=1-s.age/.65;oval(c,s.x*w,s.y*h,Math.max(1,w*.0017),Math.max(2,h*.004),s.muddy?'#a1845a':'#b3edf4');}c.globalAlpha=1;
  if(weather.celebrate){for(let i=0;i<35;i++){const x=((i*.173+time*.008)%1)*w,y=((i*.213+time*.08)%1)*h;c.fillStyle=['#f5ce85','#e9a8c9','#add7bf'][i%3];c.fillRect(x,y,4,4);}}
}
