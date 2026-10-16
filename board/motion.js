import {trait as axis,expression,travelSpeed,traitFeeling,love,willing} from './profile.js?v=21';
import {makeDirt} from './dirt.js?v=21';
import {collectItem,friendship} from './sharing.js?v=21';
import {trySocial,startGesture,advanceSocial} from './social.js?v=21';
// Normalized stage coordinates keep paths identical on every board size.
export const stairs=[{from:0,to:1,a:.20,b:.35},{from:1,to:2,a:.77,b:.62}];
export const tuning={walkSpeed:.018,stairChance:.42,minPause:2,maxPause:5,emoteSeconds:3.5,dirtPerStage:0.32};
export const floor=(level)=>.86-level*.255;
export const stations={food:{level:1,left:.43,right:.59},wash:{level:2,left:.34,right:.53}};
export function hasAction(data,action){
  const frames=data.config?.animations?.[action];
  return Array.isArray(frames)&&frames.length>0&&frames.every(name=>data.images?.has(name));
}
export function makePet(data,index,count,random=Math.random){
  const level=index%3, perLevel=Math.ceil(count/3);
  return {data,dirtPattern:makeDirt(),level,x:(Math.floor(index/3)+.5)/perLevel,direction:index%2?1:-1,mode:'idle',timer:1+random()*5,clock:0,cooldown:0,emote:'',emoteTime:0,stair:null,random,stationCooldown:0,foodSpot:.45+(index%5)*.03,cleanliness:data.cleanliness??.35,washProgress:0,mealDuration:0,socialCooldown:3+random()*8,socialDuration:0,socialReply:'',heldItem:null,friendships:new Map(),shareCooldown:0};
}
export function chooseEmote(pet){
  const stats=pet.data.stats||{};
  if(stats.health<=15)return 'crying';
  if(stats.energy<=12)return 'sleepy';
  if(stats.fullness<=12)return 'drooling';
  if(stats.happiness<=35&&!(pet.comfortTime>0))return 'frustrated';
  const keys=['activity_level','generosity','bravery','curiosity','sociability','assertiveness'];
  return traitFeeling(pet,keys[Math.min(5,Math.floor(pet.random()*keys.length))]);
}
export function foodRemaining(pet){
  if(pet.awaitingCounter||!['eat','snack'].includes(pet.mode)||!pet.mealDuration)return 0;
  // Eight visible bites, with no change to the character's actual save data.
  return Math.max(0,Math.min(1,Math.ceil(8*pet.timer/pet.mealDuration)/8));
}
export function engagementSeconds(pet,activity){
  return activity==='tag'?6+axis(pet,'activity_level')*18+axis(pet,'sociability')*8-axis(pet,'curiosity')*4:3+axis(pet,'sociability')*10+axis(pet,'curiosity')*5;
}
// Keep resting tag partners side by side, including near either screen edge.
export function standBeside(a,b){
  if(a.level!==b.level||a.stair||b.stair)return;
  const gap=(a.bodyWidth??.06)/2+(b.bodyWidth??.06)/2+.012;
  if(Math.abs(a.x-b.x)>=gap)return;
  const left=a.x<=b.x?a:b,right=left===a?b:a;
  const center=Math.max(gap/2+.04,Math.min(1-gap/2-.04,(a.x+b.x)/2));
  left.x=center-gap/2;right.x=center+gap/2;
}
export function addWalkingDirt(pet,distance){
  pet.cleanliness=Math.max(0,Math.min(1,pet.cleanliness-distance*tuning.dirtPerStage));
}
export function startConversation(a,b,afterTag=false){
  standBeside(a,b);
  const curious=axis(a,'curiosity')>.65,shy=axis(a,'sociability')<.35||axis(b,'sociability')<.35;
  const generous=axis(a,'generosity')>.65||axis(b,'generosity')>.65;
  const lowMood=(a.data.stats?.happiness??50)<=35||(b.data.stats?.happiness??50)<=35;
  const opening=afterTag?['laughing','eager']:lowMood?['frustrated','hearts']:shy?['thinking','cute']:curious?['question','thinking']:generous?['hearts','love']:['laughing','eager'];
  const reply=lowMood?['cute','hearts']:shy?['cute','hearts']:curious?['eager','ok']:generous?['love','hearts']:['laughing','laughing'];
  const likes=[a.data.boardLike||a.data.food?.name||'snacks',b.data.boardLike||b.data.food?.name||'snacks'];
  for(const [index,p] of [a,b].entries()){
    const duration=engagementSeconds(p,'talk');
    p.mode='social';p.clock=0;p.timer=duration;p.socialDuration=duration;p.socialReply=reply[index];p.engagement=1;p.tagGame=null;
    p.socialCooldown=duration+20+p.random()*25;p.direction=p.x<(index===0?b:a).x?1:-1;
    p.emote=love(p)<.5?traitFeeling(p,'sociability'):opening[index];p.socialReply=love(p)<.5?traitFeeling(p,'assertiveness'):reply[index];p.emoteTime=duration;
    p.speech=afterTag?'That was fun!':index===0?'I like '+likes[0]+'!':'What do you like?';
    p.speechReply=index===0?'What about you?':'I like '+likes[1]+'!';
  }

}
export function startTag(a,b){
  if(!hasAction(a.data,'walking')||!hasAction(b.data,'walking'))return false;
  const game={players:[a,b],chaser:a,runner:b,cooldown:1,tags:0};
  for(const p of game.players){p.mode='tag';p.tagGame=game;p.engagement=1;p.clock=0;p.socialCooldown=0;p.emote='eager';p.emoteTime=3;p.speech=p===a?"You're it!":'Catch me!';}
  a.direction=b.direction=a.x<=b.x?1:-1;return true;
}
const wrapped=x=>((x+.035)%1.07+1.07)%1.07-.035;
const distance=(from,to)=>{let d=to-from;if(d>.535)d-=1.07;if(d<-.535)d+=1.07;return d;};
export function advanceTag(pets,dt){
  const present=new Set(pets),games=new Set(pets.filter(p=>p.mode==='tag').map(p=>p.tagGame));
  for(const game of games){
    if(!game)continue;
    const [a,b]=game.players;
    if(!present.has(a)||!present.has(b)||a.level!==b.level||!game.players.every(p=>p.mode==='tag'&&hasAction(p.data,'walking'))){
      for(const p of game.players)if(p.mode==='tag'){p.mode='idle';p.tagGame=null;p.timer=2;p.socialCooldown=20;p.speech='';}continue;
    }
    for(const p of game.players)p.engagement=Math.max(0,p.engagement-dt/engagementSeconds(p,'tag'));
    if(game.players.some(p=>p.engagement<=0)){startConversation(a,b,true);continue;}
    const runner=game.runner,chaser=game.chaser,runSpeed=travelSpeed(runner)*1.6,chaseSpeed=travelSpeed(chaser)*1.8;
    game.cooldown=Math.max(0,game.cooldown-dt);
    const gap=distance(chaser.x,runner.x);chaser.direction=Math.sign(gap)||runner.direction;
    runner.x=wrapped(runner.x+runner.direction*runSpeed*dt);
    addWalkingDirt(runner,runSpeed*dt);addWalkingDirt(chaser,chaseSpeed*dt);
    chaser.x=wrapped(chaser.x+chaser.direction*chaseSpeed*dt);
    if(game.cooldown===0&&Math.abs(distance(chaser.x,runner.x))<.014){
      game.chaser=runner;game.runner=chaser;game.cooldown=1.5;game.tags++;
      chaser.direction=runner.direction;chaser.speech='Tag!';runner.speech="I'm it!";chaser.emote='laughing';runner.emote='eager';chaser.emoteTime=runner.emoteTime=2;
    }
  }
}
export function interactPets(pets){
  const eligible=p=>!p.stair&&['walk','idle'].includes(p.mode)&&p.socialCooldown<=0&&p.x>.04&&p.x<.96;
  for(let level=0;level<3;level++){
    const row=pets.filter(p=>p.level===level&&eligible(p)).sort((a,b)=>a.x-b.x);
    for(let i=0;i<row.length-1;i++){
      const a=row[i],b=row[i+1];if(!eligible(a)||!eligible(b)||b.x-a.x>.055)continue;
      if(!willing(b,a)){standBeside(a,b);a.socialCooldown=12+love(a)*25;b.socialCooldown=20;b.emote=traitFeeling(b,'sociability');b.emoteTime=3;a.emote=traitFeeling(a,'assertiveness');a.emoteTime=3;continue;}
      if(trySocial(a,b,socialWorld())){i++;continue;}
      const playful=(axis(a,'activity_level')+axis(b,'activity_level'))/2;
      const affinity=(friendship(a,b)+friendship(b,a))/100;
      if(a.random()>Math.max(.25,Math.min(1,affinity))){a.socialCooldown=b.socialCooldown=8;continue;}
      const canPlay=(a.data.stats?.energy??100)>12&&(b.data.stats?.energy??100)>12;
      if(!(canPlay&&a.random()<.15+playful*.6&&startTag(a,b)))startConversation(a,b);
      i++;
    }
  }
}
export function tick(pet,dt){
  const before=pet.x,walking=pet.mode==='walk';
  tickMotion(pet,dt);
  if(walking&&hasAction(pet.data,'walking'))addWalkingDirt(pet,Math.abs(distance(before,pet.x)));
}
function tickMotion(pet,dt){
  pet.foodReactionTime=Math.max(0,(pet.foodReactionTime||0)-dt);
  pet.comfortTime=Math.max(0,(pet.comfortTime||0)-dt);
  pet.shareCooldown=Math.max(0,(pet.shareCooldown||0)-dt);
  pet.clock+=dt;pet.cooldown=Math.max(0,pet.cooldown-dt);pet.emoteTime=Math.max(0,pet.emoteTime-dt);
  pet.stationCooldown=Math.max(0,pet.stationCooldown-dt);pet.socialCooldown=Math.max(0,pet.socialCooldown-dt);
  if(pet.heldItem)pet.heldTime=(pet.heldTime||0)+dt;
  if(['counterQueue','counterLeave','seekWash','shelterWait','game','build','tag','gesture','together','escort','shelter','puddle','watch','explore','celebrate','quiet','startle'].includes(pet.mode))return;
  if(pet.mode==='social'){pet.timer-=dt;pet.engagement=Math.max(0,pet.timer/pet.socialDuration);if(pet.timer<pet.socialDuration/2){pet.emote=pet.socialReply;pet.speech=pet.speechReply;}if(pet.timer<=0){pet.mode='idle';pet.timer=1;pet.clock=0;pet.emote='thinking';pet.emoteTime=2;pet.speech='';}return;}
  if(pet.mode==='snack'){
    pet.timer-=dt;
    if(pet.timer<=0){pet.heldItem=null;pet.mode='idle';pet.timer=2;pet.clock=0;pet.emote='hearts';pet.emoteTime=3;}
    return;
  }
  if(pet.mode==='idle'&&pet.heldItem&&pet.heldTime>75&&hasAction(pet.data,'eat')){
    pet.mode='snack';pet.clock=0;pet.timer=pet.mealDuration=Math.max(6,animationDuration(pet.data.config,'eat')*2);return;
  }
  // Artwork capabilities come from successfully decoded frames, never placeholders.
  if(!hasAction(pet.data,'walking')){
    pet.mode='idle';pet.stair=null;pet.timer-=dt;
    if(pet.timer<=0){pet.emote=chooseEmote(pet);pet.emoteTime=3;pet.timer=12+pet.random()*20;}
    return;
  }
  if(pet.mode==='eat'){
    if(pet.awaitingCounter)return;
    pet.timer-=dt;
    if(pet.timer<=0||!hasAction(pet.data,'eat')){collectItem(pet);pet.mode='walk';pet.clock=0;pet.timer=20;pet.stationCooldown=55;pet.emote='hearts';pet.emoteTime=3;}
    return;
  }
  const speed=travelSpeed(pet);
  if(pet.mode==='wash'){
    pet.x+=pet.direction*speed*.65*dt;
    const zone=stations.wash;pet.washProgress=Math.max(0,Math.min(1,(pet.direction>0?pet.x-zone.left:zone.right-pet.x)/(zone.right-zone.left)));
    pet.cleanliness=1-(1-(pet.washStartCleanliness??pet.cleanliness))*(1-pet.washProgress);
    if(pet.washProgress>=1){pet.cleanliness=1;pet.mode='walk';pet.clock=0;pet.timer=20;pet.stationCooldown=50;pet.emote='ok';pet.emoteTime=4;}
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
    if(pet.counterService&&pet.level===1&&pet.data.food&&pet.direction>0&&crosses(pet.counterEntry??.49)){
      if(pet.joinCounter?.())return;pet.stationCooldown=15;
    }
    if(!pet.counterService&&pet.level===1&&pet.data.food&&crosses(pet.foodSpot)){
      if(pet.heldItem&&hasAction(pet.data,'eat'))pet.heldItem=null;
      if(!hasAction(pet.data,'eat')){collectItem(pet);pet.stationCooldown=55;return;}
      pet.x=pet.foodSpot;pet.mode='eat';pet.clock=0;pet.awaitingCounter=!!pet.counterService;pet.counterWait=0;
      pet.timer=Math.max(6,animationDuration(pet.data.config,'eat')*2);pet.mealDuration=pet.timer;
      pet.emote='hearts';pet.emoteTime=3;return;
    }
    if(pet.level===2&&crosses(pet.direction>0?stations.wash.left:stations.wash.right)){
      pet.mode='wash';pet.clock=0;pet.washProgress=0;pet.washStartCleanliness=pet.cleanliness;return;
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
  if(pet.timer<=0){pet.mode='idle';pet.clock=0;pet.timer=tuning.minPause+pet.random()*(tuning.maxPause-tuning.minPause)+expression(pet).rest*5+expression(pet).inertia*6+expression(pet).withdrawal*3;pet.emote=chooseEmote(pet);pet.emoteTime=tuning.emoteSeconds;if(pet.random()<.3)pet.direction*=-1;}
}
export function petFloor(pet){
  if(Number.isFinite(pet.routeFloor))return pet.routeFloor;
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

export const socialWorld=()=>({standBeside,hasAction,tuning,stairs,stations,floor,addWalkingDirt,travelSpeed});
export function advanceInteractions(pets,dt){advanceSocial(pets,dt,socialWorld());}
