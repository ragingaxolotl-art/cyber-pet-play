// Proposed classroom playtest rules. All timing is in 60 Hz simulation frames.
export const BALANCE={id:'classroom-playtest-v1',baseHP:100,hpPerStamina:2,baseEnergy:50,energyPerStamina:1,maxSpeedReduction:.15,maxFocusCostReduction:.2,baseGuardReduction:.35,maxFocusGuardBonus:.2,maxCharismaShieldBonus:.2,maxFocusStatusReduction:.25,statCap:99};
export const STATS=['strength','speed','stamina','intelligence','charisma','focus'];
export const MOTIONS=['upper_hit_side','lower_hit_side','thrust_hit_side','sweep_hit_side','body_bash_side','spin_hit_side','ground_slam_side','side_push_side','up_summon_side','down_summon_side','gather_power_side','release_power_side','channel_power_side','block_side','dodge_side','stunned_side','knocked_down_side','get_up_side','victory_front'];
export const label=s=>s.replace(/_side$|_front$/,'').replaceAll('_',' ');
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const defaultStats=()=>Object.fromEntries(STATS.map(k=>[k,20]));
export function freshAttack(kind='melee'){
 const support=['heal','shield'].includes(kind);
 return {id:'attack_'+crypto.randomUUID().replaceAll('-',''),name:({melee:'Stone strike',projectile:'Traveling bolt',area:'Ground burst',heal:'Restoring pulse',shield:'Protective ward',burn:'Burning strike'})[kind]||'New attack',notes:'',tags:[],poseImpact:0,motion:support?'channel_power_side':kind==='area'?'ground_slam_side':kind==='projectile'?'release_power_side':'thrust_hit_side',element:'earth',delivery:kind==='projectile'?'projectile':kind==='area'?'area':support?'self':'melee',payload:kind==='heal'?'heal':kind==='shield'?'shield':'damage',base:support?18:12,scaling:support?'intelligence':kind==='melee'?'strength':'intelligence',coefficient:.35,startup:18,active:12,recovery:24,cooldown:90,cost:12,hitLimit:1,hitInterval:12,knockback:support?0:12,hitstun:support?0:12,blockable:true,projectileSpeed:3,box:{x:22,y:-52,w:54,h:44},visuals:[],status:kind==='burn'?'burn':'none',statusPower:kind==='burn'?3:0,statusDuration:180,statusInterval:60,shieldDuration:240};
}
const fail=s=>{throw Error(s);};
function num(o,key,min,max,integer=false){const v=o[key];if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max||(integer&&!Number.isInteger(v)))fail(`${key} must be ${integer?'a whole number ':''}between ${min} and ${max}.`);}
export function validateAttack(a,ids){
 if(!a||typeof a!=='object')fail('Invalid attack.');
 if(!/^attack_[a-zA-Z0-9_]{1,80}$/.test(a.id)||typeof a.name!=='string'||!a.name.trim()||a.name.length>48)fail('Attack needs an ID and a name (1–48 characters).');
 if(typeof a.notes!=='string'||a.notes.length>2000||!Array.isArray(a.tags)||a.tags.length>24||a.tags.some(t=>typeof t!=='string'||t.length>40))fail('Invalid notes or tags.');
 for(const [k,values] of Object.entries({motion:MOTIONS,element:['earth','water','air','fire','metal','ice','electric','plant','light','dark','mixed'],delivery:['melee','projectile','area','self','ally'],payload:['damage','heal','shield','energy'],scaling:STATS,status:['none','burn','poison','regen','slow','haste','weaken','stun']}))if(!values.includes(a[k]))fail('Invalid '+k);
 for(const [k,min,max] of [['base',0,500],['coefficient',0,5],['cost',0,200],['knockback',0,150],['projectileSpeed',0,12],['statusPower',0,100]])num(a,k,min,max);
 for(const [k,min,max] of [['startup',0,180],['active',1,300],['recovery',0,180],['cooldown',0,900],['hitLimit',1,10],['hitInterval',1,300],['hitstun',0,120],['statusDuration',1,900],['statusInterval',1,300],['shieldDuration',1,900]])num(a,k,min,max,true);
 if(a.poseImpact!==undefined)num(a,'poseImpact',0,300,true);
 if(typeof a.blockable!=='boolean'||!a.box)fail('Invalid hitbox.');
 for(const k of ['x','y'])num(a.box,k,-500,500);for(const k of ['w','h'])num(a.box,k,1,500);
 if(!Array.isArray(a.visuals)||a.visuals.length>3)fail('Use up to three VFX layers.');
 for(const v of a.visuals){if(typeof v.effectId!=='string'||(ids&&!ids.has(v.effectId)))fail('A VFX reference is missing from this library.');for(const [k,min,max] of [['x',-500,500],['y',-500,500],['scale',.25,6],['start',0,600],['rate',.25,4]])num(v,k,min,max);if(!Number.isInteger(v.start))fail('VFX start must be a whole frame.');}
 return a;
}
export function validateDesign(p,ids){
 if(p?.format!=='cyber-pet-combat-design'||p.version!==1||!Array.isArray(p.attacks)||p.attacks.length<1||p.attacks.length>256)fail('Choose a version 1 Combat Design project (1–256 attacks).');
 if(p.testBench){for(const side of ['attacker','target'])statsFor(p.testBench[side]);validateSandbox(p.testBench.options);}
 const unique=new Set();for(const a of p.attacks){validateAttack(a,ids);if(unique.has(a.id))fail('Duplicate attack ID.');unique.add(a.id);}return p;
}
export function validateSandbox(o){if(!o||typeof o.guard!=='boolean'||![1,-1].includes(o.facing)||![1,-1].includes(o.targetSide))fail('Invalid test scenario.');for(const [key,min,max] of [['distance',0,160],['resistance',-50,75],['selfHP',.05,1],['targetHP',.05,1],['energy',0,1]])num(o,key,min,max);}
export function statsFor(s){if(!s||typeof s!=='object')fail('Missing test stats.');for(const k of STATS)num(s,k,0,99,true);const b=BALANCE;return {maxHP:b.baseHP+b.hpPerStamina*s.stamina,maxEnergy:b.baseEnergy+b.energyPerStamina*s.stamina,timing:1-b.maxSpeedReduction*s.speed/b.statCap,cost:1-b.maxFocusCostReduction*s.focus/b.statCap,guard:b.baseGuardReduction+b.maxFocusGuardBonus*s.focus/b.statCap,support:1+b.maxCharismaShieldBonus*s.charisma/b.statCap,resistance:1-b.maxFocusStatusReduction*s.focus/b.statCap};}
export function timing(a,s){const scale=statsFor(s).timing;return {startup:Math.round(a.startup*scale),active:a.active,recovery:Math.round(a.recovery*scale),cooldown:a.cooldown};}
export function magnitude(a,s){return Math.round((a.base+a.coefficient*s[a.scaling])*(a.payload==='shield'?statsFor(s).support:1));}
export function worldBox(a,t,s,facing=1){const tm=timing(a,s),travel=a.delivery==='projectile'?Math.max(0,t-tm.startup)*a.projectileSpeed:0;return {x:facing===1?a.box.x+travel:-a.box.x-a.box.w-travel,y:a.box.y,w:a.box.w,h:a.box.h};}
export const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export function simulate(a,attacker,target,options={}){
 validateAttack(a);const av=statsFor(attacker),tv=statsFor(target),tm=timing(a,attacker),facing=options.facing===-1?-1:1;
 const distance=options.distance??100,side=options.targetSide===-1?-1:1;
 let self={hp:Math.round(av.maxHP*(options.selfHP??.6)),maxHP:av.maxHP,energy:Math.round(av.maxEnergy*(options.energy??1)),shield:0,shieldUntil:0,x:0,stun:0};
 let other={hp:Math.round(tv.maxHP*(options.targetHP??.7)),maxHP:tv.maxHP,energy:tv.maxEnergy,shield:0,shieldUntil:0,x:side*distance,stun:0};
 const cost=Math.ceil(a.cost*av.cost),events=[],frames=[],statuses=[];let hits=0,lastHit=-Infinity;
 const end=Math.max(tm.startup+tm.active+tm.recovery,tm.startup+tm.active+(a.status==='none'?0:a.statusDuration),tm.startup+tm.active+(a.payload==='shield'?a.shieldDuration:0));
 const cast=self.energy>=cost;if(cast)self.energy-=cost;else events.push({frame:0,text:'Not enough energy — attack did not start.'});
 function event(frame,text){events.push({frame,text});}
 function heal(who,n){const old=who.hp;who.hp=Math.min(who.maxHP,who.hp+n);return who.hp-old;}
 function hurt(who,n){const absorb=Math.min(who.shield,n);who.shield-=absorb;const damage=Math.min(who.hp,n-absorb);who.hp-=damage;return damage;}
 for(let f=0;f<=end;f++){
  for(const who of [self,other])if(who.shield&&f>=who.shieldUntil){who.shield=0;event(f,'Shield expired.');}
  const active=cast&&f>=tm.startup&&f<tm.startup+tm.active;
  const box=worldBox(a,f,attacker,facing),targetBox={x:other.x-14,y:-60,w:28,h:60};
  const recipient=a.delivery==='self'?self:other;
  const contact=a.delivery==='self'||overlaps(box,targetBox);
  if(active&&contact&&hits<a.hitLimit&&f-lastHit>=a.hitInterval&&recipient.hp>0){
   hits++;lastHit=f;let amount=magnitude(a,attacker);
   const guarding=a.payload==='damage'&&options.guard&&a.blockable&&a.delivery!=='self';
   if(a.payload==='damage'){
    amount=Math.round(amount*(1-clamp(options.resistance??0,-50,75)/100)*(guarding?1-tv.guard:1));
    event(f,`${guarding?'Blocked hit':'Hit'} ${hits}: ${hurt(recipient,amount)} damage.`);
    if(!guarding){recipient.x+=facing*a.knockback;recipient.stun=Math.max(recipient.stun,f+a.hitstun);}
   }else if(a.payload==='heal')event(f,`Healed ${heal(recipient,amount)} HP.`);
   else if(a.payload==='shield'){recipient.shield=Math.max(recipient.shield,amount);recipient.shieldUntil=f+a.shieldDuration;event(f,`Shield: ${amount} HP (refresh; does not stack).`);}
   else {const max=recipient===self?av.maxEnergy:tv.maxEnergy,old=recipient.energy;recipient.energy=Math.min(max,recipient.energy+amount);event(f,`Restored ${recipient.energy-old} energy.`);}
   if(a.status!=='none'&&!guarding){
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
 if(cast&&!hits)event(tm.startup+tm.active,'Miss — no hitbox contact during the active window.');
 return {frames,events,cost,timing:tm,power:magnitude(a,attacker),nextCast:Math.max(tm.startup+tm.active+tm.recovery,a.cooldown),cast};
}
export function effectFrame(effect,elapsedMs){
 if(elapsedMs<0)return -1;const total=effect.times.reduce((a,b)=>a+b,0);
 if(!effect.loop&&elapsedMs>=total)return -1;
 let t=elapsedMs%total;for(let i=0;i<effect.times.length;i++){if(t<effect.times[i])return i;t-=effect.times[i];}return -1;
}
