import {pathSample} from './attack-motion.js?v=20261024-reviewed18';
import {HITBOX_SHAPES,shapeHitsRectangle} from './hitbox-shapes.js?v=20261024-reviewed18';
// Proposed classroom playtest rules. All timing is in 60 Hz simulation frames.
export const BALANCE={id:'classroom-playtest-v1',baseHP:100,hpPerStamina:2,baseEnergy:50,energyPerStamina:1,maxSpeedReduction:.15,maxFocusCostReduction:.2,baseGuardReduction:.35,maxFocusGuardBonus:.2,maxCharismaShieldBonus:.2,maxFocusStatusReduction:.25,statCap:99};
export const STATS=['strength','speed','stamina','intelligence','charisma','focus'];
export const MOTIONS=['upper_hit_side','lower_hit_side','thrust_hit_side','sweep_hit_side','body_bash_side','spin_hit_side','ground_slam_side','side_push_side','up_summon_side','down_summon_side','gather_power_side','release_power_side','channel_power_side','block_side','dodge_side','stunned_side','knocked_down_side','get_up_side','victory_front'];
export const label=s=>s.replace(/_side$|_front$/,'').replaceAll('_',' ');
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const defaultStats=()=>Object.fromEntries(STATS.map(k=>[k,20]));
export function freshAttack(kind='melee'){
 const support=['heal','shield'].includes(kind);
 return {id:'attack_'+crypto.randomUUID().replaceAll('-',''),name:({melee:'Stone strike',projectile:'Traveling bolt',area:'Ground burst',heal:'Restoring pulse',shield:'Protective ward',burn:'Burning strike'})[kind]||'New attack',notes:'',tags:[],poseImpact:0,poseTiming:'synced',poseFinish:'stand',pushAxis:'both',blockPercent:100,launchHeight:0,flightFrames:36,wallSlam:false,floorSlam:false,motion:support?'channel_power_side':kind==='area'?'ground_slam_side':kind==='projectile'?'release_power_side':'thrust_hit_side',element:'earth',delivery:kind==='projectile'?'projectile':kind==='area'?'area':support?'self':'melee',payload:kind==='heal'?'heal':kind==='shield'?'shield':'damage',base:support?18:12,scaling:support?'intelligence':kind==='melee'?'strength':'intelligence',coefficient:.35,startup:18,active:12,recovery:24,cooldown:90,cost:12,hitLimit:1,hitInterval:12,knockback:support?0:12,hitstun:support?0:12,blockable:true,projectileSpeed:3,box:{x:22,y:-52,w:54,h:44},visuals:[],status:kind==='burn'?'burn':'none',statusPower:kind==='burn'?3:0,statusDuration:180,statusInterval:60,shieldDuration:240};
}
const fail=s=>{throw Error(s);};
function num(o,key,min,max,integer=false){const v=o[key];if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max||(integer&&!Number.isInteger(v)))fail(`${key} must be ${integer?'a whole number ':''}between ${min} and ${max}.`);}
export function validateAttack(a,ids){
 if(!a||typeof a!=='object')fail('Invalid attack.');
 if(!/^attack_[a-zA-Z0-9_]{1,80}$/.test(a.id)||typeof a.name!=='string'||!a.name.trim()||a.name.length>48)fail('Attack needs an ID and a name (1–48 characters).');
 if(typeof a.notes!=='string'||a.notes.length>2000||!Array.isArray(a.tags)||a.tags.length>24||a.tags.some(t=>typeof t!=='string'||t.length>40))fail('Invalid notes or tags.');
 for(const [k,values] of Object.entries({motion:MOTIONS,element:['earth','water','air','fire','metal','ice','electric','plant','light','dark','mixed'],delivery:['melee','projectile','area','self','ally'],payload:['damage','heal','shield','energy','push','block','dodge'],scaling:STATS,status:['none','burn','poison','regen','slow','haste','weaken','stun']}))if(!values.includes(a[k]))fail('Invalid '+k);
 for(const [k,min,max] of [['base',0,500],['coefficient',0,5],['cost',0,200],['knockback',0,150],['projectileSpeed',0,12],['statusPower',0,100]])num(a,k,min,max);
 for(const [k,min,max] of [['startup',0,180],['active',1,300],['recovery',0,180],['cooldown',0,900],['hitLimit',1,10],['hitInterval',1,300],['hitstun',0,120],['statusDuration',1,900],['statusInterval',1,300],['shieldDuration',1,900]])num(a,k,min,max,true);
 for(const [key,value] of Object.entries({launchHeight:0,flightFrames:36,wallSlam:false,floorSlam:false}))a[key]??=value;
 a.pushAxis??='both';a.blockPercent??=100;if(!['x','y','both'].includes(a.pushAxis))fail('Invalid push axis.');num(a,'blockPercent',0,100);
 num(a,'launchHeight',0,500);if(a.impactTrigger!==undefined&&!['timed','contact'].includes(a.impactTrigger))fail('Invalid impact trigger.');if(a.projectileStart!==undefined)num(a,'projectileStart',0,180,true);num(a,'flightFrames',1,120,true);
 if(typeof a.wallSlam!=='boolean'||typeof a.floorSlam!=='boolean')fail('Invalid collision settings.');
 a.poseTiming??='synced';a.poseFinish??='stand';
 if(!['synced','custom'].includes(a.poseTiming)||!['stand','hold'].includes(a.poseFinish))fail('Invalid attacker playback setting.');
 if(a.poseDurations!==undefined&&(!Array.isArray(a.poseDurations)||!a.poseDurations.length||a.poseDurations.length>300||a.poseDurations.some(n=>!Number.isFinite(n)||n<0.02||n>5)||(a.poseFrames&&a.poseDurations.length!==a.poseFrames.length)))fail('Use a duration of 0.02–5 seconds for each attacker frame.');
 if(a.pathDuration!==undefined)num(a,'pathDuration',1,600,true);
 if(a.motionPath!==undefined){if(!Array.isArray(a.motionPath)||a.motionPath.length>64||(a.motionPath.length===1))fail('Draw a path with 2–64 points.');for(const p of a.motionPath){num(p,'x',-500,500);num(p,'y',-500,500);}}
 validateSequence(a.poseFrames);
 for(const v of a.visuals||[])validateSequence(v.frames);
 if(a.poseImpact!==undefined)num(a,'poseImpact',0,300,true);
 if(typeof a.blockable!=='boolean'||!a.box)fail('Invalid hitbox.');
 if(a.box.shape!==undefined&&!HITBOX_SHAPES.includes(a.box.shape))fail('Invalid hitbox shape.');
 for(const k of ['x','y'])num(a.box,k,-500,500);for(const k of ['w','h'])num(a.box,k,1,500);
 if(!Array.isArray(a.visuals)||a.visuals.length>12)fail('Use up to twelve VFX layers.');
 for(const v of a.visuals){if(v.fadeOutFrames!==undefined)num(v,'fadeOutFrames',0,120,true);if(v.forwardAngle!==undefined)num(v,'forwardAngle',-180,180);for(const key of ['followPath','loopUntilImpact','loop'])if(v[key]!==undefined&&typeof v[key]!=='boolean')fail('Invalid visual motion setting.');for(const key of ['loopStart','loopEnd'])if(v[key]!==undefined)num(v,key,1,300,true);if(v.loopStart>v.loopEnd)fail('Loop start must precede loop end.');for(const key of ['stretchX','stretchY'])if(v[key]!==undefined)num(v,key,.1,4);if(typeof v.effectId!=='string'||(ids&&!ids.has(v.effectId)))fail('A VFX reference is missing from this library.');for(const [k,min,max] of [['x',-500,500],['y',-500,500],['scale',.25,6],['start',0,600],['rate',.25,4]])num(v,k,min,max);if(!Number.isInteger(v.start))fail('VFX start must be a whole frame.');}
 return a;
}
export function validateDesign(p,ids){
 if(p?.format!=='cyber-pet-combat-design'||p.version!==1||!Array.isArray(p.attacks)||p.attacks.length<1||p.attacks.length>256)fail('Choose a version 1 Combat Design project (1–256 attacks).');
 if(p.testBench){for(const side of ['attacker','target'])statsFor(p.testBench[side]);validateSandbox(p.testBench.options);}
 const unique=new Set();for(const a of p.attacks){validateAttack(a,ids);if(unique.has(a.id))fail('Duplicate attack ID.');unique.add(a.id);}return p;
}
export function validateSandbox(o){if(!o||typeof o.guard!=='boolean'||![1,-1].includes(o.facing)||![1,-1].includes(o.targetSide))fail('Invalid test scenario.');for(const [key,min,max] of [['distance',0,245],['resistance',-50,75],['selfHP',.05,1],['targetHP',.05,1],['energy',0,1]])num(o,key,min,max);for(const [key,min,max] of [['incomingDamage',0,500],['incomingFrame',0,1800],['targetHeight',0,60]])if(o[key]!==undefined)num(o,key,min,max,true);}
export function statsFor(s){if(!s||typeof s!=='object')fail('Missing test stats.');for(const k of STATS)num(s,k,0,99,true);const b=BALANCE;return {maxHP:b.baseHP+b.hpPerStamina*s.stamina,maxEnergy:b.baseEnergy+b.energyPerStamina*s.stamina,timing:1-b.maxSpeedReduction*s.speed/b.statCap,cost:1-b.maxFocusCostReduction*s.focus/b.statCap,guard:b.baseGuardReduction+b.maxFocusGuardBonus*s.focus/b.statCap,support:1+b.maxCharismaShieldBonus*s.charisma/b.statCap,resistance:1-b.maxFocusStatusReduction*s.focus/b.statCap};}
export function timing(a,s){const scale=statsFor(s).timing;return {startup:Math.round(a.startup*scale),active:a.active,recovery:Math.round(a.recovery*scale),cooldown:a.cooldown};}
export function magnitude(a,s){if(['push','block','dodge'].includes(a.payload))return 0;return Math.round((a.base+a.coefficient*s[a.scaling])*(a.payload==='shield'?statsFor(s).support:1));}
export function worldBox(a,t,s,facing=1){const tm=timing(a,s),path=pathSample(a,t),travel=a.motionPath?.length?0:a.delivery==='projectile'?Math.max(0,t-Math.round((a.projectileStart??a.startup)*statsFor(s).timing))*a.projectileSpeed:0;return {x:facing===1?a.box.x+travel+path.x:-a.box.x-a.box.w-travel-path.x,y:a.box.y+path.y,w:a.box.w,h:a.box.h,shape:a.box.shape||'rectangle',facing};}
export const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export function simulate(a,attacker,target,options={}){
 validateAttack(a);const av=statsFor(attacker),tv=statsFor(target),tm=timing(a,attacker),facing=options.facing===-1?-1:1;
 const distance=options.distance??100,side=options.targetSide===-1?-1:1;
 let self={hp:Math.round(av.maxHP*(options.selfHP??.6)),maxHP:av.maxHP,energy:Math.round(av.maxEnergy*(options.energy??1)),shield:0,shieldUntil:0,x:0,stun:0,y:0};
 let other={hp:Math.round(tv.maxHP*(options.targetHP??.7)),maxHP:tv.maxHP,energy:tv.maxEnergy,shield:0,shieldUntil:0,x:side*distance,stun:0,y:-(options.targetHeight??0)};
 const cost=Math.ceil(a.cost*av.cost),events=[],frames=[],statuses=[];let hits=0,lastHit=-Infinity,flight=null;
 const incomingDamage=options.incomingDamage??0,incomingFrame=options.incomingFrame??30;num({incomingDamage},'incomingDamage',0,500);num({incomingFrame},'incomingFrame',0,1800,true);
 const contactMode=a.impactTrigger==='contact'&&a.delivery!=='self'&&!['block','dodge'].includes(a.payload);let impactFrame=null;const contactDeadline=tm.startup+600;
 let end=Math.max(a.motionPath?.length?(a.pathDuration||60):0,incomingDamage?incomingFrame:0,tm.startup+tm.active+a.flightFrames,tm.startup+tm.active+tm.recovery,tm.startup+tm.active+(a.status==='none'?0:a.statusDuration),tm.startup+tm.active+(a.payload==='shield'?a.shieldDuration:0));
 const normalEnd=end;if(contactMode)end=Math.max(end,contactDeadline);
 const cast=self.energy>=cost;if(cast)self.energy-=cost;else events.push({frame:0,text:'Not enough energy — attack did not start.'});
 function event(frame,text){events.push({frame,text});}
 function heal(who,n){const old=who.hp;who.hp=Math.min(who.maxHP,who.hp+n);return who.hp-old;}
 function startReaction(who,f){
  who.reactionHitFrame=f;who.reactionDirection=facing;who.reactionWallFrame=null;who.reactionLandFrame=null;
  who.reactionLaunched=(a.pushAxis!=='x'&&a.launchHeight>0)||who.y<0;who.reactionInFlight=true;who.reactionFlightFrames=a.flightFrames;who.reactionKnockedDown=false;
  end=Math.max(end,f+Math.max(18,a.hitstun));
 }
 function hurt(who,n){const absorb=Math.min(who.shield,n);who.shield-=absorb;const damage=Math.min(who.hp,n-absorb);who.hp-=damage;return damage;}
 for(let f=0;f<=end;f++){
  if(flight){
   const t=clamp((f-flight.start)/a.flightFrames,0,1),who=flight.who;
   who.x=flight.x+facing*(a.pushAxis==='y'?0:a.knockback)*t;
   who.y=(flight.y||0)*(1-t)-4*(a.pushAxis==='x'?0:a.launchHeight)*t*(1-t);
   if(a.wallSlam&&Math.abs(who.x)>=220){who.x=clamp(who.x,-220,220);if(!flight.wall){event(f,'Wall smash!');flight.wall=true;who.reactionWallFrame=f;}}
   if(t===1){who.y=0;who.reactionInFlight=false;if(who.reactionLaunched||flight.wall){who.reactionLandFrame=f;who.reactionKnockedDown=!!(a.floorSlam||flight.wall);end=Math.max(end,f+(who.reactionKnockedDown?62:18)+(flight.wall?10:0));}if(a.floorSlam&&a.pushAxis!=='x'&&a.launchHeight>0)event(f,'Floor smash!');flight=null;}
  }
  for(const who of [self,other])if(who.shield&&f>=who.shieldUntil){who.shield=0;event(f,'Shield expired.');}
  const box=worldBox(a,contactMode&&impactFrame!==null?Math.min(f,impactFrame):f,attacker,facing),targetBox={x:other.x-14,y:other.y-60,w:28,h:60};
  const recipient=a.delivery==='self'?self:other;
  const contact=a.delivery==='self'||shapeHitsRectangle(box,targetBox);
  if(contactMode&&cast&&impactFrame===null&&f>=tm.startup&&f<=contactDeadline&&contact&&recipient.hp>0){impactFrame=f;end=Math.max(normalEnd,f+tm.active+Math.max(tm.recovery,a.flightFrames,a.status==='none'?0:a.statusDuration,a.payload==='shield'?a.shieldDuration:0));event(f,'Impact triggered by opponent contact.');}
  const active=cast&&(contactMode?impactFrame!==null&&f>=impactFrame&&f<impactFrame+tm.active:f>=tm.startup&&f<tm.startup+tm.active);
  self.blocking=active&&a.payload==='block'&&self.hp>0;
  self.evading=active&&a.payload==='dodge'&&self.hp>0;
  if(self.evading&&f===tm.startup)event(f,'Dodge window opened.');
  if(self.blocking&&f===tm.startup)event(f,'Block window opened.');
  if(incomingDamage>0&&f===incomingFrame&&f<other.stun)event(f,'Incoming attack interrupted — opponent is stunned.');
  if(incomingDamage>0&&f===incomingFrame&&f>=other.stun){const blocked=self.blocking&&facing===side,evaded=self.evading;const damage=hurt(self,Math.round(incomingDamage*(evaded?0:blocked?1-a.blockPercent/100:1)));event(f,`${evaded?'Incoming attack evaded':blocked?'Incoming attack blocked':'Incoming attack hit'}: ${damage} damage to attacker.`);}
  if(!['block','dodge'].includes(a.payload)&&active&&contact&&hits<a.hitLimit&&f-lastHit>=a.hitInterval&&recipient.hp>0){
   hits++;lastHit=f;let amount=magnitude(a,attacker);
   const guarding=['damage','push'].includes(a.payload)&&options.guard&&a.blockable&&a.delivery!=='self';
   if(a.payload==='damage'){
    amount=Math.round(amount*(1-clamp(options.resistance??0,-50,75)/100)*(guarding?1-tv.guard:1));
    event(f,`${guarding?'Blocked hit':'Hit'} ${hits}: ${hurt(recipient,amount)} damage.`);
    if(guarding)recipient.reactionGuardFrame=f;
    if(!guarding){startReaction(recipient,f);flight={who:recipient,x:recipient.x,y:recipient.y,start:f,wall:false};recipient.stun=Math.max(recipient.stun,f+a.hitstun);}
   }else if(a.payload==='push'){event(f,guarding?'Push blocked — no damage.':'Push only — no damage.');if(guarding)recipient.reactionGuardFrame=f;if(!guarding){startReaction(recipient,f);flight={who:recipient,x:recipient.x,y:recipient.y,start:f,wall:false};}}
   else if(a.payload==='heal')event(f,`Healed ${heal(recipient,amount)} HP.`);
   else if(a.payload==='shield'){recipient.shield=Math.max(recipient.shield,amount);recipient.shieldUntil=f+a.shieldDuration;event(f,`Shield: ${amount} HP (refresh; does not stack).`);}
   else {const max=recipient===self?av.maxEnergy:tv.maxEnergy,old=recipient.energy;recipient.energy=Math.min(max,recipient.energy+amount);event(f,`Restored ${recipient.energy-old} energy.`);}
   if(!['push','block','dodge'].includes(a.payload)&&a.status!=='none'&&!guarding){
    const duration=Math.max(1,Math.round(a.statusDuration*(['burn','poison','slow','weaken','stun'].includes(a.status)?(recipient===self?av:tv).resistance:1)));
    // One status per cast/recipient; repeated hits refresh duration instead of multiplying ticks.
    const previous=statuses.find(s=>s.who===recipient);
    const status={who:recipient,kind:a.status,power:a.statusPower,start:f,end:f+duration,next:f+a.statusInterval};
    if(previous)Object.assign(previous,{end:status.end,power:status.power});else statuses.push(status);
    if(a.status==='stun')recipient.stun=Math.max(recipient.stun,f+duration);
    event(f,`${label(a.status)} for ${duration} frames.`);
   }
  }
  for(const s of statuses)if(f>=s.next&&f<=s.end){
   if(['burn','poison','regen'].includes(s.kind)){const n=s.kind==='regen'?heal(s.who,s.power):hurt(s.who,s.power);event(f,`${s.kind} tick: ${n} ${s.kind==='regen'?'healing':'damage'}.`);}s.next+=a.statusInterval;
  }
  const modifiers=statuses.filter(s=>f>=s.start&&f<s.end).map(s=>({recipient:s.who===self?'self':'target',kind:s.kind,power:s.power,remaining:s.end-f}));
  frames.push({frame:f,active,box,targetBox,contact,self:{...self},target:{...other},hits,modifiers});
 }
 if(cast&&!hits&&!['block','dodge'].includes(a.payload))event(contactMode?contactDeadline:tm.startup+tm.active,contactMode?'Miss — no opponent contact before travel timeout.':'Miss — no hitbox contact during the active window.');
 return {frames,events,cost,impactFrame:contactMode?impactFrame:tm.startup,contactMode,timing:tm,power:magnitude(a,attacker),nextCast:Math.max((contactMode?(impactFrame??contactDeadline):tm.startup)+tm.active+tm.recovery,a.cooldown),cast};
}
export function effectFrame(effect,elapsedMs){
 if(elapsedMs<0)return -1;const total=effect.times.reduce((a,b)=>a+b,0);
 if(!effect.loop&&elapsedMs>=total)return -1;
 let t=elapsedMs%total;for(let i=0;i<effect.times.length;i++){if(t<effect.times[i])return i;t-=effect.times[i];}return -1;
}

// Ordered source-frame references preserve original artwork and support repeats/omissions.
export function validateSequence(sequence){if(sequence!==undefined&&(!Array.isArray(sequence)||!sequence.length||sequence.length>300||sequence.some(n=>!Number.isInteger(n)||n<0||n>=300)))fail('Use 1–300 source frames numbered 1–300.');}
export function orderedEffect(effect,sequence){return sequence?{...effect,times:sequence.map(i=>effect.times[i]??effect.times[0])}:effect;}
export function moveFrame(sequence,from,to){const result=[...sequence];const [item]=result.splice(from,1);result.splice(to,0,item);return result;}

// Find a representable damage-start frame against the opponent's initial hurtbox.
export function markOpponentImpact(attack,stats,options={}){
 if(attack.delivery==='self'||['block','dodge'].includes(attack.payload))throw Error('Choose an attack that contacts the opponent.');
 const candidate=structuredClone(attack),scale=statsFor(stats).timing;
 if(candidate.delivery==='projectile'&&!candidate.motionPath?.length)candidate.projectileStart??=candidate.startup;
 const x=(options.targetSide===-1?-1:1)*(options.distance??100),y=-(options.targetHeight??0),targetBox={x:x-14,y:y-60,w:28,h:60};
 for(let startup=0;startup<=180;startup++){
  const frame=Math.round(startup*scale);
  if(shapeHitsRectangle(worldBox(candidate,frame,stats,options.facing===-1?-1:1),targetBox)){
   candidate.startup=startup;validateAttack(candidate);return {attack:candidate,frame};
  }
 }
 throw Error('The attack does not reach the opponent hitbox within 180 startup frames. Move the target or adjust the attack hitbox or path, then try again.');
}
