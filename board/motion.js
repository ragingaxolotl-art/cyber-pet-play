// Normalized stage coordinates keep paths identical on every board size.
export const stairs=[{from:0,to:1,a:.20,b:.35},{from:1,to:2,a:.77,b:.62}];
export const tuning={walkSpeed:.018,stairChance:.42,minPause:2,maxPause:5,emoteSeconds:3.5};
export const floor=(level)=>.86-level*.255;
export const stations={food:{level:1,left:.43,right:.59},wash:{level:2,left:.34,right:.53}};
export function hasAction(data,action){
  const frames=data.config?.animations?.[action];
  return Array.isArray(frames)&&frames.length>0&&frames.every(name=>data.images?.has(name));
}
export function makePet(data,index,count,random=Math.random){
  const level=index%3, perLevel=Math.ceil(count/3);
  return {data,level,x:(Math.floor(index/3)+.5)/perLevel,direction:index%2?1:-1,mode:'idle',timer:1+random()*5,clock:0,cooldown:0,emote:'',emoteTime:0,stair:null,random,stationCooldown:0,foodSpot:.45+(index%5)*.03,cleanliness:data.cleanliness??.35,washProgress:0};
}
const axis=(pet,key)=>(Number.isFinite(pet.data.personality?.[key])?Math.max(0,Math.min(100,pet.data.personality[key])):50)/100;
export function chooseEmote(pet){
  const choices=[['♫',.3+axis(pet,'activity_level')],['♡',.3+axis(pet,'generosity')],['!',.3+axis(pet,'bravery')],['?',.3+axis(pet,'curiosity')],['Hi!',.3+axis(pet,'sociability')],['…',1.3-axis(pet,'sociability')]];
  let pick=pet.random()*choices.reduce((sum,x)=>sum+x[1],0);
  for(const [text,weight] of choices){pick-=weight;if(pick<=0)return text;}return '♡';
}
export function tick(pet,dt){
  pet.clock+=dt;pet.cooldown=Math.max(0,pet.cooldown-dt);pet.emoteTime=Math.max(0,pet.emoteTime-dt);
  pet.stationCooldown=Math.max(0,pet.stationCooldown-dt);
  // Artwork capabilities come from successfully decoded frames, never placeholders.
  if(!hasAction(pet.data,'walking')){
    pet.mode='idle';pet.stair=null;pet.timer-=dt;
    if(pet.timer<=0){pet.emote=chooseEmote(pet);pet.emoteTime=3;pet.timer=12+pet.random()*20;}
    return;
  }
  if(pet.mode==='eat'){
    pet.timer-=dt;
    if(pet.timer<=0||!hasAction(pet.data,'eat')){pet.mode='walk';pet.clock=0;pet.timer=20;pet.stationCooldown=55;pet.emote='♡';pet.emoteTime=3;}
    return;
  }
  const speed=tuning.walkSpeed*(.65+axis(pet,'activity_level')*.9);
  if(pet.mode==='wash'){
    pet.x+=pet.direction*speed*.65*dt;
    const zone=stations.wash;pet.washProgress=Math.max(0,Math.min(1,(pet.direction>0?pet.x-zone.left:zone.right-pet.x)/(zone.right-zone.left)));
    if(pet.washProgress>=1){pet.cleanliness=1;pet.mode='walk';pet.clock=0;pet.timer=20;pet.stationCooldown=50;pet.emote='✦';pet.emoteTime=4;}
    return;
  }
  if(pet.stair){
    const trip=pet.stair;trip.progress=Math.min(1,trip.progress+speed*dt/Math.abs(trip.end-trip.start));
    pet.x=trip.start+(trip.end-trip.start)*trip.progress;
    if(trip.progress===1){pet.level=trip.target;pet.stair=null;pet.cooldown=3;}
    return;
  }
  pet.timer-=dt;
  if(pet.mode==='idle'){
    if(pet.timer<=0){pet.mode='walk';pet.clock=0;pet.timer=12+pet.random()*25;}
    return;
  }
  const before=pet.x;pet.x+=pet.direction*speed*dt;
  const crosses=point=>(before-point)*(pet.x-point)<=0&&before!==pet.x;
  if(pet.stationCooldown===0){
    if(pet.level===1&&pet.data.food&&hasAction(pet.data,'eat')&&crosses(pet.foodSpot)){
      pet.x=pet.foodSpot;pet.mode='eat';pet.clock=0;
      pet.timer=Math.max(6,animationDuration(pet.data.config,'eat')*2);
      pet.emote='♡';pet.emoteTime=3;return;
    }
    if(pet.level===2&&crosses(pet.direction>0?stations.wash.left:stations.wash.right)){
      pet.mode='wash';pet.clock=0;pet.washProgress=0;return;
    }
  }
  if(pet.cooldown===0)for(const stair of stairs){
    let start,end,target;
    if(pet.level===stair.from){start=stair.a;end=stair.b;target=stair.to;}
    else if(pet.level===stair.to){start=stair.b;end=stair.a;target=stair.from;}
    else continue;
    if(pet.direction!==Math.sign(end-start))continue;
    if((before-start)*(pet.x-start)<=0 && before!==pet.x){
      if(pet.random()<tuning.stairChance+axis(pet,'curiosity')*.25){pet.x=start;pet.stair={start,end,target,source:pet.level,progress:0};return;}
    }
  }
  if(pet.x>1.035)pet.x=-.035;
  if(pet.x<-.035)pet.x=1.035;
  if(pet.timer<=0){pet.mode='idle';pet.clock=0;pet.timer=tuning.minPause+pet.random()*(tuning.maxPause-tuning.minPause);pet.emote=chooseEmote(pet);pet.emoteTime=tuning.emoteSeconds;if(pet.random()<.3)pet.direction*=-1;}
}
export function petFloor(pet){
  if(!pet.stair)return floor(pet.level);
  const t=pet.stair, steps=18, stepped=Math.floor(t.progress*steps)/steps;
  return floor(t.source)+(floor(t.target)-floor(t.source))*stepped;
}
// Same timing precedence as CharacterPackage: per-frame, per-action, legacy default.
const timingCache=new WeakMap();
export function frameDurations(config,action){
  let actions=timingCache.get(config);if(!actions){actions=new Map();timingCache.set(config,actions);}
  if(actions.has(action))return actions.get(action);
  const valid=value=>Number.isFinite(value)&&value>=.02&&value<=10;
  const fallback=valid(config.animation_speeds?.[action])?config.animation_speeds[action]:valid(config.frame_time)?config.frame_time:.25;
  const frames=config.animations[action]||[],saved=config.animation_frame_times?.[action];
  const durations=frames.map((_,i)=>Array.isArray(saved)&&saved.length===frames.length&&valid(saved[i])?saved[i]:fallback);
  actions.set(action,durations);return durations;
}
export function animationDuration(config,action){return frameDurations(config,action).reduce((sum,t)=>sum+t,0);}
export function frameIndex(config,action,seconds){
  const durations=frameDurations(config,action),count=durations.length;if(!count)return 0;
  let remaining=Number.isFinite(seconds)?Math.max(0,seconds):0;
  const loop=config.animation_loops?.[action];
  const bounded=Number.isInteger(loop?.start)&&Number.isInteger(loop?.end)&&loop.start>=0&&loop.end>=loop.start&&loop.end<count;
  const start=bounded?loop.start:0,end=bounded?loop.end:count-1;
  if(loop?.enabled!==false){
    const entry=durations.slice(0,end+1).reduce((a,b)=>a+b,0);
    if(remaining>=entry){remaining=(remaining-entry)%durations.slice(start,end+1).reduce((a,b)=>a+b,0);for(let i=start;i<=end;i++){if(remaining<durations[i])return i;remaining-=durations[i];}return end;}
  }
  for(let i=0;i<count;i++){if(remaining<durations[i])return i;remaining-=durations[i];}return count-1;
}
