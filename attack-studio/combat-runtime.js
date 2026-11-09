import {splitDue,splitFan,splitChildDefinition,splitRayPosition} from './projectile-split.js?v=20261109-split';
import {createImpactArea,claimAreaHit,impactAreaBox,areaAlive,impactAreaAnchor} from './projectile-area.js?v=20261108-explosion';
import {consumesProjectile,CONTACT_END_REASON} from './projectile-contact.js?v=20261108-contact-final';
import {createSteeringState,advanceSteering,reflectSteering} from './projectile-steering.js?v=20261108-steering';
import {recoverInAir} from './air-recovery.js?v=20261108-air-recovery';
import {scaledHitReaction,scaledHitEvent} from './hitstun-scaling.js?v=20261108-hitstun';
import {counterHitDamage,isCounterHit} from './counter-hit.js?v=20261108-counter-hit';
import {attackPhase} from './attack-phase.js?v=20261109-split';
import {scaledComboDamage} from './combo-scaling.js?v=20261108-combo-scaling';
import {ComboTracker} from './combo-tracker.js?v=20261108-combo-scaling';
import {contactFeedbackResult} from './contact-feedback.js?v=20261108-impact-timing';
import {movementCancelWindow,MOVEMENT_CANCEL_RULES} from './movement-cancels.js?v=20261108-movement-cancels';
import {reflectedProjectileTransform,transformProjectileBox} from './projectile-reflection.js?v=20261108-movement-cancels';
import {ProjectileClashes} from './projectile-clashes.js?v=20261108-movement-cancels';
import {ProjectileRegistry,ownerActionEnd} from './projectile-lifetime.js?v=20261109-split';
import {CONTACT_TIMEOUT,contactDeadline,castEnd} from './contact-timing.js?v=20261108-movement-cancels';
import {canCancel,automaticFollowup,MAX_AUTOMATIC_FOLLOWUPS} from './cancel-windows.js?v=20261108-movement-cancels';
import {createDefenseState,defenseSnapshot,claimArmor,isInvulnerable,claimParry,claimProjectileDefense} from './defense-windows.js?v=20261108-absorption';
import {activeGroupBoxes,activeGroupContacts,createGroupHitTracker} from './hitbox-groups.js?v=20261108-movement-cancels';
import {refreshStatus,statusTickDue,statusMultiplier,movementMultiplier} from './status-rules.js?v=20261108-movement-cancels';
import {beginReaction,advanceReaction,knockDown} from './combat-reactions.js?v=20261109-split';
import {statsFor,timing,magnitude,worldBox,clamp} from './combat-model.js?v=20261109-split';
import {shapeHitsRectangle} from './hitbox-shapes.js?v=20261108-movement-cancels';
import {KEYS,availability,mappedAttack} from './combat-artwork.js?v=20261109-split';
import {resetGroundedJuggle,sequenceState,sequenceDuration,sequenceOpportunities,applyPulseReaction,advancePulseReaction,hitResult} from './hit-sequence.js?v=20261108-bounces';
export const RULES={width:960,ground:370,gravity:.48,jump:-9.5,move:2.8,sprintMultiplier:1.8,dodgeFrames:18,dodgeInvulnerableStart:2,dodgeInvulnerableEnd:14,dodgeCooldown:45,dodgeSpeed:4,energyPerFrame:.055,contactTimeout:CONTACT_TIMEOUT};
export function fighter(name,stats,pet=null){const limits=statsFor(stats);return {name,stats,pet,...limits,hp:limits.maxHP,energy:limits.maxEnergy,x:260,y:0,vy:0,facing:1,crouch:false,moving:false,backing:false,sprinting:false,guarding:false,blockstunUntil:0,blockstunReduction:0,dodgeStart:-999,dodgeUntil:0,dodgeReady:0,dashUntil:0,dashReady:0,dashDirection:0,reaction:"standing",reactionStart:0,reactionUntil:0,lastHit:-999,vx:0,needsFall:false,cast:null,cooldowns:new Map(),stun:0,hitstunUntil:0,airRecoveryUsed:false,statuses:[],shield:0,shieldUntil:0,flash:0};}
export class Arena{
 constructor(player,opponent,attacks,options={}){this.fighters=[player,opponent];opponent.x=700;opponent.facing=-1;this.attacks=attacks;this.frame=0;this.presentationFrame=0;this.hitstopRemaining=0;this.contactFeedback=[];this.combos=new ComboTracker();this.set=0;this.paused=true;this.winner=null;this.winnerIndex=null;this.honourMetrics={guards:0,dodges:0,attacks:new Set()};this.events=[];this.projectiles=new ProjectileRegistry();this.areas=[];this.projectileClashes=new ProjectileClashes();this.lastProjectileClashes=[];this.lastProjectileDefenses=[];this.lastProjectileReturns=[];this.lastProjectileContacts=[];this.lastHitResults=[];this.lastAreaContacts=[];this.automaticAttempts=[];this.training=options.training===true;this.ai=!this.training;this.metrics={hits:0,damage:0,wallHits:0,knockdowns:0};this.decks=options.decks||null;}
 // Internal launch boundary. Versioned authoring will call this at startup;
 // existing attack definitions remain cast-owned until that support is enabled.
 launchProjectile(f,lifetime){
  if(this.paused||this.winner)throw Error('Start or resume the round before launching.');
  if(!this.fighters.includes(f))throw Error('Projectile owner is not in this arena.');
  const entity=this.projectiles.launch(f,this.fighters.find(other=>other!==f),f.cast,this.frame,lifetime);
  entity.cast.projectileStats=Object.freeze({...f.stats});
  if(entity.cast.a.projectileSteering){const box=this.prepareCast(f,entity.target,entity.cast).box;entity.cast.steering=createSteeringState({x:box.x+box.w/2,y:box.y+box.h/2},entity.cast.facing,this.frame);}
  return entity;
 }
 splitProjectile(projectile){
  const parent=projectile.cast,snapshot=this.prepareCast(projectile.owner,projectile.target,parent),box=snapshot.box;
  let direction=parent.steering?.angle;
  if(direction===undefined){
   const previous=worldBox(parent.a,this.frame-parent.start-1,parent.projectileStats||projectile.owner.stats,parent.facing);
   previous.x+=parent.x;previous.y+=parent.y;const prior=transformProjectileBox(previous,parent.projectileTransform);
   const dx=box.x-prior.x,dy=box.y-prior.y;direction=dx||dy?Math.atan2(dy,dx):parent.facing*(parent.projectileTransform?.direction||1)===1?0:Math.PI;
  }
  const rays=splitFan(parent.a,{x:box.x+box.w/2,y:box.y+box.h/2},direction,this.frame);
  const casts=rays.map(ray=>{const a=splitChildDefinition(parent.a),tm=timing(a,parent.projectileStats||projectile.owner.stats);if(a.hitEvents)tm.active=sequenceDuration(a);return {a,tm,start:this.frame+1,x:0,y:0,facing:Math.cos(direction)>=0?1:-1,splitRay:ray,projectileStats:parent.projectileStats,projectileDamageMultiplier:snapshot.damageMultiplier,groupTracker:createGroupHitTracker(),defenseState:createDefenseState(),outcomes:new Set(),hits:0,lastHit:-999,impact:a.impactTrigger==='contact'?null:0,sequence:a.hitEvents?sequenceState(a.sequenceTiming==='cast'?0:null):null};});
  const children=this.projectiles.replaceWithChildren(projectile,casts,this.frame,parent.a.projectileSplit.lifetime);
  parent.splitReplaced=true;parent.projectileConsumed=true;this.emit('SPLIT ×'+children.length,box.x,box.y-20);return children;
 }
 // Reflection starts a new ownership leg, but never renews lifetime or durability.
 reflectProjectile(projectile,defender){
  if(this.paused||this.winner||!this.projectiles.entries.includes(projectile))throw Error('Reflection requires a live projectile.');
  if(defender!==projectile.target||defender.hp<=0)throw Error('Only the living projectile target can reflect it.');
  if((projectile.reflections||0)>=8){this.projectiles.remove(projectile);this.emit('REFLECTION LIMIT',defender.x,defender.y-70);return false;}
  const previous=projectile.cast,snapshot=this.prepareCast(projectile.owner,projectile.target,previous);
  const transform=reflectedProjectileTransform(previous.projectileTransform,snapshot.box);
  const formerOwner=projectile.owner,age=this.frame-previous.start;
  const authored=worldBox(previous.a,age,previous.projectileStats||formerOwner.stats,previous.facing),oldTransform=previous.projectileTransform;
  const rawX=oldTransform?.direction===-1?oldTransform.offset-snapshot.box.x-snapshot.box.w:snapshot.box.x-(oldTransform?.offset||0);
  projectile.cast={...previous,x:rawX-authored.x,y:snapshot.box.y-authored.y,projectileTransform:transform,projectileDamageMultiplier:snapshot.damageMultiplier,groupTracker:createGroupHitTracker(),outcomes:new Set(),hits:0,lastHit:-999,
   impact:previous.a.impactTrigger==='contact'?null:previous.impact,sequence:previous.a.hitEvents?sequenceState():null};
  if(projectile.cast.steering)reflectSteering(projectile.cast.steering);
  if(previous.splitRay){const point=splitRayPosition(previous.splitRay,this.frame);projectile.cast.splitRay={...previous.splitRay,...point,vx:-previous.splitRay.vx,start:this.frame};}
  projectile.owner=defender;projectile.target=formerOwner;projectile.reflections=(projectile.reflections||0)+1;
  this.emit('REFLECT',defender.x,defender.y-70);return true;
 }
 slots(){return this.decks?this.decks[this.set].slots:this.attacks.slice(this.set*KEYS.length,(this.set+1)*KEYS.length);}
 rotate(){if(this.paused||this.winner)return;this.set=(this.set+1)%(this.decks?.length||Math.ceil(this.attacks.length/KEYS.length));}
 reason(f,a,automatic=false){if(!a)return 'Empty slot';return (this.hitstopRemaining>0?'Impact pause':'')||(f.blockstunUntil>this.frame?'Recovering from a block':'')||availability(f.pet,a)||(f.reaction!=='standing'?'Recovering from a hit':f.dodgeUntil>this.frame?'Finish your dodge':f.dashUntil>this.frame?'Finish your dash':f.guarding?'Lower your guard before attacking':f.cast&&!canCancel(f.cast,a,this.frame-f.cast.start,automatic)?'Finish the current move':f.stun>this.frame?'Recovering from a hit':(f.cooldowns.get(a.id)||0)>this.frame?'Cooling down':f.energy<Math.ceil(a.cost*f.cost)?'Not enough energy':'');}
 attack(f,a,automatic=false){if(this.paused||this.winner||this.reason(f,a,automatic))return false;const automaticDepth=automatic?(f.cast?.automaticDepth||0)+1:0;this.faceOpponents();a=mappedAttack(f.pet,a);const tm=timing(a,f.stats);if(a.hitEvents)tm.active=sequenceDuration(a);const cost=Math.ceil(a.cost*f.cost);f.energy-=cost;f.cooldowns.set(a.id,this.frame+Math.max(tm.cooldown,tm.startup+tm.active+tm.recovery));f.cast={a,tm,automaticDepth,start:this.frame+1,x:f.x,y:f.y,facing:f.facing,groupTracker:createGroupHitTracker(),defenseState:createDefenseState(),outcomes:new Set(),hits:0,lastHit:-999,impact:a.impactTrigger==='contact'?null:tm.startup,sequence:a.hitEvents?sequenceState(a.sequenceTiming==='cast'?tm.startup:null):null};return true;}
 airRecover(f){
  if(this.paused||this.winner)return 'Start or resume the round first';
  if(this.hitstopRemaining>0)return 'Impact pause';
  const reason=recoverInAir(f,this.frame);if(!reason)this.emit('AIR RECOVERY',f.x,f.y-70);return reason;
 }
 dodge(f){
  if(this.paused||this.winner)return 'Start or resume the round first';
  if(this.hitstopRemaining>0)return 'Impact pause';
  if(f.blockstunUntil>this.frame)return 'Recovering from a block';
  const problem=availability(f.pet,{motion:'dodge_side'});
  if(problem)return problem;
  const window=f.cast?movementCancelWindow(f.cast,'dodge',this.frame-f.cast.start):null;
  if(f.reaction!=='standing'||(f.cast&&!window)||f.stun>this.frame||f.dodgeUntil>this.frame||f.dashUntil>this.frame)return 'Finish your current action first';
  if(f.dodgeReady>this.frame)return 'Dodge is cooling down';
  const cost=window?Math.ceil(window.cost*f.cost):0;
  if(f.energy<cost)return 'Not enough energy';
  // Commit only after every check succeeds. Launched independent projectiles
  // keep their cast; the fighter relinquishes only the current action.
  f.energy-=cost;f.cast=null;
  this.faceOpponents();f.guarding=false;f.sprinting=false;f.dodgeStart=this.frame;f.dodgeUntil=this.frame+RULES.dodgeFrames;f.dodgeReady=this.frame+RULES.dodgeCooldown;return '';
 }
 jump(f){
  if(this.paused||this.winner)return 'Start or resume the round first';
  if(this.hitstopRemaining>0)return 'Impact pause';
  if(f.blockstunUntil>this.frame)return 'Recovering from a block';
  const problem=availability(f.pet,{motion:'jump_side'});
  if(problem)return problem;
  const window=f.cast?movementCancelWindow(f.cast,'jump',this.frame-f.cast.start):null;
  if(f.reaction!=='standing'||(f.cast&&!window)||f.stun>this.frame||f.dodgeUntil>this.frame||f.dashUntil>this.frame)return 'Finish your current action first';
  if(f.y!==0||f.vy!==0)return 'Land before jumping';
  if(f.crouch||f.guarding)return 'Stand before jumping';
  const cost=window?Math.ceil(window.cost*f.cost):0;
  if(f.energy<cost)return 'Not enough energy';
  f.energy-=cost;f.cast=null;f.sprinting=false;f.vy=RULES.jump;return '';
 }
 dash(f,inputDirection=0){
  if(this.paused||this.winner)return 'Start or resume the round first';
  if(this.hitstopRemaining>0)return 'Impact pause';
  if(f.blockstunUntil>this.frame)return 'Recovering from a block';
  const window=f.cast?movementCancelWindow(f.cast,'dash',this.frame-f.cast.start):null;
  if(!window)return 'No dash cancel is available';
  const problem=availability(f.pet,{motion:'running_side'});
  if(problem)return problem;
  if(f.reaction!=='standing'||f.stun>this.frame||f.dodgeUntil>this.frame||f.dashUntil>this.frame)return 'Finish your current action first';
  if(f.y!==0||f.vy!==0||f.crouch||f.guarding)return 'Stand on the ground before dashing';
  if(f.dashReady>this.frame)return 'Dash is cooling down';
  if(window.direction==='input'&&inputDirection!==1&&inputDirection!==-1)return 'Choose a left or right direction';
  const cost=Math.ceil(window.cost*f.cost);
  if(f.energy<cost)return 'Not enough energy';
  this.faceOpponents();
  f.dashDirection=window.direction==='input'?inputDirection:f.facing*(window.direction==='backward'?-1:1);
  f.energy-=cost;f.cast=null;f.guarding=false;
  // The next tick is the first movement frame, matching attack start timing.
  f.dashUntil=this.frame+1+MOVEMENT_CANCEL_RULES.dashFrames;
  f.dashReady=this.frame+MOVEMENT_CANCEL_RULES.dashCooldown;return '';
 }
 emit(text,x,y){this.events.push({text,x,y,until:this.frame+60});this.events=this.events.slice(-12);}
 tick(input=new Set(),sprintDirection=0,opponentInput=new Set()){
  this.automaticAttempts=[];this.lastProjectileDefenses=[];this.lastProjectileReturns=[];this.lastProjectileContacts=[];this.lastHitResults=[];this.lastAreaContacts=[];this.lastProjectileClashes=[];
  if(this.paused||this.winner)return;this.presentationFrame++;
  if(this.hitstopRemaining>0){this.hitstopRemaining--;return;}
  this.contactFeedback=[];this.frame++;
  const trackedProjectiles=new Set(this.projectiles.entries);
  const [p,o]=this.fighters;
  if(this.training){p.energy=p.maxEnergy;o.hp=Math.max(1,o.hp);}
  for(const f of this.fighters){if(f.hp<=0)continue;const pulseOwned=advancePulseReaction(f,this.frame,35,RULES.width-35);const legacyOwned=!pulseOwned&&advanceReaction(f,this.frame,(name,who)=>this.reactionEvent(name,who));if(pulseOwned&&f.reactionBounceFrame===this.frame)this.reactionEvent(f.reactionBounceKind==='wall'?'WALL BOUNCE':'FLOOR BOUNCE',f);f.pulseOwned=pulseOwned;f.legacyOwned=!!legacyOwned;f.energy=Math.min(f.maxEnergy,f.energy+RULES.energyPerFrame);if(f.shieldUntil<=this.frame)f.shield=0;
   for(const s of f.statuses){if(statusTickDue(s,this.frame)){if(s.type==='regen')f.hp=Math.min(f.maxHP,f.hp+s.power);else if(['burn','poison'].includes(s.type))f.hp=Math.max(0,f.hp-s.power);s.next+=s.interval;}}
   f.statuses=f.statuses.filter(s=>s.until>this.frame);
   if(f.statuses.some(s=>s.type==='stun'))f.stun=Math.max(f.stun,this.frame+1);
   if(f.reaction!=='standing'||f.stun>this.frame)f.blockstunUntil=0;
   let direction=0,jump=false;f.crouch=false;f.sprinting=false;f.moving=false;f.guarding=f.blockstunUntil>this.frame||(f.reaction==='standing'&&(f===p?input:opponentInput).has('Shift')&&!f.cast&&f.dodgeUntil<=this.frame&&f.dashUntil<=this.frame&&f.stun<=this.frame&&!availability(f.pet,{motion:'block_side'}));
   if(f===p){direction=Number(input.has('ArrowRight'))-Number(input.has('ArrowLeft'));jump=input.has('ArrowUp');f.crouch=input.has('ArrowDown')&&f.y===0;}
   else if(this.ai){const distance=p.x-f.x;direction=Math.abs(distance)>65?Math.sign(distance):0;if(this.frame%90===0&&p.y< -20)jump=true;}
   if(f.reaction!=='standing'||f.stun>this.frame||f.hp<=0)f.dashUntil=0;
   if(jump&&f.cast)this.jump(f);
   if(f.dashUntil>this.frame){f.x+=f.dashDirection*MOVEMENT_CANCEL_RULES.dashSpeed*movementMultiplier(f.statuses);f.moving=true;f.sprinting=true;}
   if(f.reaction==='standing'&&f.dodgeUntil>this.frame&&f.stun<=this.frame){f.x-=f.facing*RULES.dodgeSpeed;}
   if(f.blockstunUntil<=this.frame&&f.reaction==='standing'&&!f.cast&&f.dodgeUntil<=this.frame&&f.dashUntil<=this.frame&&f.stun<=this.frame){const statusSpeed=movementMultiplier(f.statuses);
    if(direction){f.moving=true;f.sprinting=f===p&&direction===sprintDirection&&!f.guarding&&!f.crouch&&f.y===0;f.x+=direction*(RULES.move+f.stats.speed*.012)*statusSpeed*(f.crouch||f.guarding?.4:1)*(f.sprinting?RULES.sprintMultiplier:1);}if(jump&&f.y===0&&!f.crouch&&!f.guarding)f.vy=RULES.jump;}
   if(!f.pulseOwned&&!f.legacyOwned&&f.reaction!=='wall'){f.vy+=RULES.gravity;f.y+=f.vy;}if(f.y>=0){f.y=0;f.vy=0;resetGroundedJuggle(f);if(f.reaction==='airborne'&&!f.pulseOwned&&!f.pulseMotion)knockDown(f,this.frame,(name,who)=>this.reactionEvent(name,who));}f.x=clamp(f.x,35,RULES.width-35);
  }
  this.faceOpponents();p.backing=p.moving&&((input.has('ArrowRight')?1:0)-(input.has('ArrowLeft')?1:0))*p.facing<0;o.backing=false;
  if(this.ai&&!o.cast&&o.stun<=this.frame){o.facing=p.x<o.x?-1:1;if(this.frame%42===0){const choices=this.attacks.filter(a=>!this.reason(o,a));const a=choices[Math.floor(this.frame/42)%Math.max(1,choices.length)];if(a)this.attack(o,a);}}
  this.combos.beginFrame(this.frame,new Map(this.fighters.map(f=>[f,{defeated:f.hp<=0,locked:f.stun>this.frame||f.reaction!=='standing'||!!f.pulseMotion||!!f.legacyMotion}])));
  // Resolve against one frame snapshot before applying hits. A first hit cannot erase a simultaneous trade.
  this.projectiles.prune(this.frame);
  for(const f of this.fighters){
   const cast=f.cast;if(!cast||cast.a.projectileLifetime===undefined||cast.projectileLaunched||cast.projectileFailed||this.frame-cast.start<cast.tm.startup)continue;
   try{this.launchProjectile(f,cast.a.projectileLifetime);}catch(error){cast.projectileFailed=true;this.emit(error.message,f.x,f.y-80);}
  }
  for(const projectile of this.projectiles.entries)trackedProjectiles.add(projectile);
  for(const projectile of [...this.projectiles.entries]){
   const cast=projectile.cast;if(!cast.steering)continue;
   if(cast.sequence?.attached&&cast.a.projectileMode==='attached'){cast.steering.lastFrame=this.frame;continue;}
   advanceSteering(cast.steering,cast.a.projectileSteering,cast.a.projectileSpeed,this.frame,{x:projectile.target.x,y:projectile.target.y-30},{x:projectile.owner.x,y:projectile.owner.y-30});
   if(cast.steering.caught){this.lastProjectileReturns.push({id:projectile.id,name:cast.a.name,owner:this.fighters.indexOf(projectile.owner),combatFrame:this.frame});this.projectiles.remove(projectile);this.emit('PROJECTILE RETURNED',projectile.owner.x,projectile.owner.y-70);}
  }
  for(const projectile of [...this.projectiles.entries]){if(!splitDue(projectile.cast.a,projectile.spawnFrame,this.frame))continue;try{this.splitProjectile(projectile);}catch(error){this.emit(error.message,projectile.owner.x,projectile.owner.y-80);}}
  for(const projectile of this.projectiles.entries)trackedProjectiles.add(projectile);
  this.areas=this.areas.filter(area=>areaAlive(area,this.frame)&&area.owner.hp>0&&area.target.hp>0);
  const areaContacts=this.areas.map(area=>this.prepareArea(area));
  const pending=this.fighters.filter(f=>f.hp>0&&f.cast&&!f.cast.projectileLaunched&&!f.cast.projectileFailed).map(f=>this.prepare(f,f===p?o:p));
  for(const projectile of this.projectiles.entries.filter(p=>this.frame>=p.spawnFrame))pending.push({...this.prepareCast(projectile.owner,projectile.target,projectile.cast),projectile});
  const clashes=this.projectileClashes.resolve(pending.filter(hit=>hit?.projectile).map(hit=>({id:hit.projectile.id,owner:hit.f,durability:hit.projectile.durability,boxes:hit.boxes||[hit.box]})));
  this.lastProjectileClashes=clashes.contacts.map(contact=>({...contact,participants:[contact.first,contact.second].map(id=>{const projectile=this.projectiles.entries.find(p=>p.id===id);return {id,name:projectile.cast.a.name,owner:this.fighters.indexOf(projectile.owner),remaining:clashes.remaining.get(id),destroyed:clashes.destroyed.has(id)};})}));
  for(const projectile of [...this.projectiles.entries]){
   if(clashes.remaining.has(projectile.id))projectile.durability=clashes.remaining.get(projectile.id);
   if(clashes.destroyed.has(projectile.id))this.projectiles.remove(projectile);
  }
  for(const contact of clashes.contacts){const hit=pending.find(hit=>hit?.projectile?.id===contact.first);this.emit('CLASH',hit.box.x+hit.box.w/2,hit.box.y);}
  for(const hit of pending)if(hit&&!clashes.destroyed.has(hit.projectile?.id)){
   const before=hit.cast.sequence?.results.length??0;
   this.resolve(hit.f,hit.target,hit);
   for(const result of hit.cast.sequence?.results.slice(before)||[]){
    this.lastHitResults.push({...result,frame:result.frame===null?null:hit.cast.start+result.frame,
     projectileId:hit.projectile?.id??null,owner:this.fighters.indexOf(hit.f),attack:hit.cast.a.name});
   }
  }
  for(const contact of areaContacts)this.resolveArea(contact);
  this.projectiles.prune(this.frame);
  for(const projectile of trackedProjectiles)if(!this.projectiles.entries.includes(projectile)){
   const cast=projectile.cast;if(!cast.sequence)continue;
   const reason=cast.splitReplaced?'Parent replaced by split children.':projectile.expires<=this.frame?'Projectile expired before this hit connected.':cast.sequence.cancelled||'Projectile ended before this hit connected.';
   const recorded=new Set(cast.sequence.results.map(result=>result.id));
   for(const event of cast.a.hitEvents)if(!recorded.has(event.id))this.lastHitResults.push({id:event.id,offset:event.offset,frame:null,result:cast.splitReplaced?'Replaced':'Missed',reason,projectileId:projectile.id,owner:this.fighters.indexOf(projectile.owner),attack:cast.a.name});
  }
  for(const f of this.fighters){
   // Owner recovery is independent of contact travel time and entity expiry.
   if(f.hp<=0||(f.cast&&ownerActionEnd(f.cast)!==null&&this.frame-f.cast.start>=ownerActionEnd(f.cast)))f.cast=null;
  }
  this.combos.recordFrame(this.contactFeedback.filter(contact=>contact.attack.payload==='damage'));
  const feedback=contactFeedbackResult(this.contactFeedback);
  for(const [target,duration] of feedback.guards)if(duration>0){
   target.blockstunUntil=Math.max(target.blockstunUntil,this.frame+duration+1);
   target.blockstunReduction=Math.max(...this.contactFeedback.filter(c=>c.target===target&&c.outcome==='block').map(c=>c.guardReduction));
   target.guarding=true;target.dashUntil=0;target.dodgeUntil=0;
  }
  // Follow-ups start on the next simulation frame, after both sides resolve contact.
  if(this.fighters.every(f=>f.hp>0))for(const f of this.fighters){
   const cast=f.cast,window=automaticFollowup(cast,cast?this.frame-cast.start:0,true);if(!window)continue;
   const available=this.decks?this.decks.flatMap(deck=>deck.slots).filter(Boolean):this.attacks;
   const next=available.find(a=>a.id===window.attacks[0]);
   const reason=(cast.automaticDepth||0)>=MAX_AUTOMATIC_FOLLOWUPS?'Automatic chain limit reached (8 transitions)':!next?'Follow-up attack is unavailable or not equipped':this.reason(f,next,true);
   const started=!reason&&this.attack(f,next,true);
   this.automaticAttempts.push({fighter:f,cast,windowId:window.id,attackId:window.attacks[0],started:!!started,reason:reason||''});
   if(started)this.emit('FOLLOW-UP',f.x,f.y-80);
  }

  this.hitstopRemaining=feedback.stopFrames;
  this.faceOpponents();
  this.events=this.events.filter(e=>e.until>this.frame);
  if(this.training){o.hp=Math.max(1,o.hp);if(o.reaction==='standing'&&this.frame-o.lastHit>60){o.hp=o.maxHP;o.statuses=[];}return;}
  const dead=this.fighters.filter(f=>f.hp<=0);if(dead.length){this.combos.endAll('Round ended');this.winnerIndex=dead.length===2?-1:this.fighters.findIndex(f=>f.hp>0);this.winner=this.winnerIndex===-1?'Draw':this.fighters[this.winnerIndex].name;this.paused=true;this.projectiles.clear();this.areas=[];this.projectileClashes.clear();for(const f of this.fighters)f.cast=null;}
  this.events=this.events.filter(e=>e.until>this.frame);
 }
 faceOpponents(){const [p,o]=this.fighters;if(p.x!==o.x){p.facing=o.x>p.x?1:-1;o.facing=-p.facing;}for(const f of this.fighters){if(f.cast&&f.cast.a.delivery==='melee')f.cast.facing=f.facing;}}
 reactionEvent(name,f){this.emit(name,f.x,f.y-80);if(f===this.fighters[1]){if(name==='WALL HIT')this.metrics.wallHits++;if(name==='KNOCKDOWN')this.metrics.knockdowns++;}}
 resetDummy(position=700){if(!this.training)return;this.combos.clear();this.hitstopRemaining=0;this.contactFeedback=[];this.projectiles.clear();this.areas=[];this.projectileClashes.clear();this.lastProjectileClashes=[];this.lastProjectileDefenses=[];this.lastProjectileReturns=[];this.lastProjectileContacts=[];this.lastHitResults=[];this.lastAreaContacts=[];const f=this.fighters[1];Object.assign(f,{x:position,y:0,vy:0,vx:0,hp:f.maxHP,energy:f.maxEnergy,pulseMotion:null,pulseOwned:false,legacyMotion:null,legacyOwned:false,juggleHits:0,juggleLocked:false,reaction:'standing',reactionStart:this.frame,reactionUntil:0,needsFall:false,lastHit:-999,cast:null,stun:0,hitstunUntil:0,airRecoveryUsed:false,statuses:[],shield:0});this.metrics={hits:0,damage:0,wallHits:0,knockdowns:0};this.lastSequence=null;for(const actor of this.fighters){actor.cast=null;actor.dashUntil=0;actor.blockstunUntil=0;actor.blockstunReduction=0;}this.faceOpponents();}
 testDummyReaction(wall=false){if(!this.training)return;const f=this.fighters[1];this.resetDummy(wall?910:650);beginReaction(f,{motion:'ground_slam_side',knockback:wall?100:24,launchHeight:35,hitstun:15,flightFrames:36,pushAxis:'both',wallSlam:wall,floorSlam:true},1,this.frame);}
 prepare(f,target){return this.prepareCast(f,target,f.cast);}
 // Collision sources may outlive an owner action. Never swap f.cast to inspect one:
 // it also controls defense windows, cancel eligibility and action availability.
 prepareCast(f,target,cast){
  if(!cast||cast.projectileConsumed)return null;const {a,tm}=cast,age=this.frame-cast.start,sourceStats=cast.projectileStats||f.stats;
  let box=worldBox(a,a.impactTrigger==='contact'&&cast.impact!==null?Math.min(age,cast.impact):age,sourceStats,cast.facing);box.x+=cast.x;box.y+=cast.y;
  if(cast.sequence?.attached&&a.projectileMode==='attached')box={...box,x:target.x-box.w/2,y:target.y-box.h};
  if(!(cast.sequence?.attached&&a.projectileMode==='attached'))box=transformProjectileBox(box,cast.projectileTransform);else box.facing=cast.facing*(cast.projectileTransform?.direction||1);
  if(cast.steering&&!(cast.sequence?.attached&&a.projectileMode==='attached'))box={...box,x:cast.steering.x-box.w/2,y:cast.steering.y-box.h/2};
  if(cast.splitRay&&!(cast.sequence?.attached&&a.projectileMode==='attached')){const point=splitRayPosition(cast.splitRay,this.frame);box={...box,x:point.x-box.w/2,y:point.y-box.h/2};}
  const hurt={x:target.x-14,y:target.y-(target.crouch?34:60),w:28,h:target.crouch?34:60};
  const recipient=a.delivery==='self'?f:target,candidate=recipient.cast,defAge=candidate?this.frame-candidate.start:0,defense=candidate&&defAge<(ownerActionEnd(candidate)??castEnd(candidate.impact,candidate.tm))?candidate:null;
  const defending=defense&&defAge>=defense.tm.startup&&defAge<defense.tm.startup+defense.tm.active;
  const sequenceFrame=cast.sequence?.startFrame??cast.sequence?.contactFrame,groupFrame=a.hitEvents?(sequenceFrame===null?0:age-sequenceFrame):age-tm.startup;
  const groupTime=a.sequenceTiming==='cast'?age:a.hitEvents?(sequenceFrame??age):age;
  const primary=worldBox(a,groupTime,sourceStats,cast.facing);
  const attached=cast.sequence?.attached&&a.projectileMode==='attached';
  const boxes=a.hitboxGroups?activeGroupBoxes(a.hitboxGroups,groupFrame,b=>{
   const world=worldBox({...a,box:b},groupTime,sourceStats,cast.facing);
   const positioned={...world,x:world.x+(attached?target.x-a.box.w/2-primary.x:cast.x),y:world.y+(attached?target.y-a.box.h-primary.y:cast.y)};
   const transform=attached?(cast.projectileTransform?.direction===-1?{direction:-1,offset:2*target.x}:null):cast.projectileTransform;
   const transformed=transformProjectileBox(positioned,transform);
   if((cast.steering||cast.splitRay)&&!attached){const anchor=transformProjectileBox({...primary,x:primary.x+cast.x,y:primary.y+cast.y},transform);return {...transformed,x:transformed.x+box.x-anchor.x,y:transformed.y+box.y-anchor.y};}
   return transformed;
  }):null;
  const groupContacts=boxes?a.hitboxGroups.filter(g=>boxes.some(b=>b.groupId===g.id&&shapeHitsRectangle(b,hurt))):null;
  const sequenceContacts=boxes?new Set(groupContacts.map(g=>g.id)):null;

  return {f,target,cast,age,box,targetBox:hurt,defenderPhase:attackPhase(recipient.cast,this.frame),defenderOffensive:['damage','push'].includes(recipient.cast?.a.payload),defense: defenseSnapshot(defense,defAge),invulnerable:isInvulnerable(defenseSnapshot(defense,defAge),a),boxes,groupContacts,sequenceContacts,damageMultiplier:cast.projectileDamageMultiplier??statusMultiplier(f.statuses,'weaken'),contact:a.delivery==='self'||shapeHitsRectangle(box,hurt),guarding:recipient.guarding||(defending&&defense.a.payload==='block'),guardReduction:recipient.blockstunUntil>this.frame?recipient.blockstunReduction:defending&&defense.a.payload==='block'?defense.a.blockPercent/100:recipient.guard,evading:a.delivery!=='self'&&((this.frame>=recipient.dodgeStart+RULES.dodgeInvulnerableStart&&this.frame<recipient.dodgeStart+RULES.dodgeInvulnerableEnd)||(defending&&defense.a.payload==='dodge'))};
 }
 resolve(f,target,snapshot=this.prepare(f,target)){if(!snapshot)return;const {cast,age}=snapshot;const {a,tm}=cast;
  if(a.projectileContact==='single'&&(snapshot.evading||snapshot.invulnerable))return;
  if(a.hitEvents){this.resolveSequence(f,target,snapshot);return;}
  const box=worldBox(a,a.impactTrigger==='contact'&&cast.impact!==null?Math.min(age,cast.impact):age,f.stats,cast.facing);box.x+=cast.x;box.y+=cast.y;
  const hurt={x:target.x-14,y:target.y-(target.crouch?34:60),w:28,h:target.crouch?34:60};
  const support=a.delivery==='self',contact=snapshot.contact;
  if(cast.impact===null&&age>=tm.startup&&age<=contactDeadline(tm)&&contact)cast.impact=age;
  const impact=cast.impact;
  const active=impact!==null&&age>=impact&&age<impact+tm.active;
 const groups=snapshot.groupContacts?.filter(g=>active&&cast.groupTracker.claim(target,g,age));
 const opportunities=groups?groups.length:(active&&contact&&cast.hits<a.hitLimit&&age-cast.lastHit>=a.hitInterval?1:0);
 for(let opportunity=0;opportunity<opportunities&&target.hp>0;opportunity++){
   cast.hits++;cast.lastHit=age;const recipient=support?f:target;
   const defense=recipient.cast;const defAge=defense?this.frame-defense.start:0;const defending=defense&&defAge>=defense.tm.startup&&defAge<defense.tm.startup+defense.tm.active;
   if(!snapshot.evading&&!snapshot.invulnerable&&this.projectileDefense(snapshot,recipient))break;
   const parry=!snapshot.evading&&!snapshot.invulnerable&&claimParry(snapshot.defense,a);
   if(parry){this.parry(f,recipient,parry,snapshot.projectile);if(snapshot.projectile)break;continue;}
   if(snapshot.evading||snapshot.invulnerable){if(!snapshot.invulnerable&&recipient===this.fighters[0]&&a.payload==='damage')this.honourMetrics.dodges++;this.emit(snapshot.invulnerable?'INVULNERABLE':'DODGE',recipient.x,recipient.y-70);}
   else {let amount=magnitude(a,cast.projectileStats||f.stats);if(a.payload==='damage')amount=Math.round(amount*snapshot.damageMultiplier);
    if(a.payload==='damage'){const guard=snapshot.guarding&&a.blockable,armored=!guard&&claimArmor(snapshot.defense,a);amount=Math.round(amount*(1-clamp(recipient.damageResistance??0,-50,75)/100)*(guard?1-snapshot.guardReduction:1));amount=counterHitDamage(amount,a.counterHit,snapshot.defenderPhase,snapshot.defenderOffensive,guard?'block':armored?'armor':'hit');amount=scaledComboDamage(amount,this.combos.priorHits(f,recipient),a.comboScaling,guard?'block':armored?'armor':'hit');const absorbed=Math.min(recipient.shield,amount);recipient.shield-=absorbed;amount-=absorbed;const hpDamage=Math.min(recipient.hp,amount);recipient.hp-=hpDamage;recipient.flash=this.frame+8;
     this.contactFeedback.push({attack:a,attacker:f,damage:hpDamage,counterHit:isCounterHit(a.counterHit,snapshot.defenderPhase,snapshot.defenderOffensive,guard?'block':armored?'armor':'hit'),target:recipient,guardReduction:snapshot.guardReduction,outcome:guard?'block':armored?'armor':'hit'});
     cast.outcomes.add(guard?'block':'hit');if(guard&&recipient===this.fighters[0])this.honourMetrics.guards++;if(amount>0&&f===this.fighters[0]&&recipient===this.fighters[1])this.honourMetrics.attacks.add(a.id);if(!guard&&!armored)beginReaction(recipient,scaledHitReaction(a,this.combos.priorHits(f,recipient)),snapshot.box.facing,this.frame);if(armored)recipient.lastHit=this.frame;if(this.training&&recipient===this.fighters[1]){this.metrics.hits++;this.metrics.damage+=amount;}
     this.emit(guard?'GUARD −'+amount:armored?'ARMOR −'+amount:'−'+amount,recipient.x,recipient.y-70);
     if(!guard&&a.status!=='none')this.status(recipient,a);
    }else if(a.payload==='heal'){recipient.hp=Math.min(recipient.maxHP,recipient.hp+amount);this.emit('+'+amount,recipient.x,recipient.y-70);}
    else if(a.payload==='energy'){recipient.energy=Math.min(recipient.maxEnergy,recipient.energy+amount);this.emit('ENERGY +'+amount,recipient.x,recipient.y-70);}
    else if(a.payload==='shield'){recipient.shield=Math.max(recipient.shield,amount);recipient.shieldUntil=this.frame+a.shieldDuration;this.emit('SHIELD',recipient.x,recipient.y-70);}
    else if(a.payload==='push'){this.contactFeedback.push({attack:a,target:recipient,guardReduction:snapshot.guardReduction,outcome:snapshot.guarding&&a.blockable?'block':'hit'});cast.outcomes.add(snapshot.guarding&&a.blockable?'block':'hit');if(snapshot.guarding&&a.blockable)this.emit('PUSH BLOCKED',recipient.x,recipient.y-70);else if(claimArmor(snapshot.defense,a)){recipient.lastHit=this.frame;this.emit('ARMORED',recipient.x,recipient.y-70);}else beginReaction(recipient,a,snapshot.box.facing,this.frame);}
    if(!['damage','push','block','dodge'].includes(a.payload)&&a.status!=='none')this.status(recipient,a);
    if(consumesProjectile(a,snapshot.guarding&&a.blockable?'block':'hit')){this.consumeProjectile(snapshot,recipient,snapshot.guarding&&a.blockable?'block':'hit',groups?.[opportunity]?.id);break;}
   }
  }
  if(f.cast===cast&&age>=castEnd(impact,tm))f.cast=null;
 }
 resolveSequence(f,target,snapshot){
  const {cast,age}=snapshot,{a,tm,sequence:state}=cast;
  if(age<tm.startup)return;
  if(target.hp<=0)state.cancelled='Target defeated.';
  for(const event of (state.contactFrame===null&&age>contactDeadline(tm)?[]:sequenceOpportunities(a,state,age,snapshot.sequenceContacts?(event=>snapshot.sequenceContacts.has(event.hitboxGroup)):snapshot.contact,target))){
   const guard=snapshot.guarding&&a.blockable;
   if(snapshot.evading||snapshot.invulnerable){hitResult(state,event,age,snapshot.invulnerable?'Invulnerable':'Dodged');if(state.startFrame===null)state.cancelled=snapshot.invulnerable?'Contact invulnerable; attachment cancelled.':'Contact dodged; attachment cancelled.';this.emit(snapshot.invulnerable?'INVULNERABLE':'DODGE',target.x,target.y-70);continue;}
   const projectileResult=this.projectileDefense(snapshot,target);if(projectileResult){hitResult(state,event,age,projectileResult);break;}
   const parry=claimParry(snapshot.defense,a);if(parry){hitResult(state,event,age,'Parried');state.cancelled='Contact parried; attachment cancelled.';this.parry(f,target,parry,snapshot.projectile);if(snapshot.projectile)break;continue;}
   const armored=!guard&&claimArmor(snapshot.defense,a);
   const rawDamage=counterHitDamage(Math.round(event.damage*snapshot.damageMultiplier*(1-clamp(target.damageResistance??0,-50,75)/100)*(guard?1-snapshot.guardReduction:1)),a.counterHit,snapshot.defenderPhase,snapshot.defenderOffensive,guard?'block':armored?'armor':'hit');
   const amount=scaledComboDamage(rawDamage,this.combos.priorHits(f,target),a.comboScaling,guard?'block':armored?'armor':'hit'),absorbed=Math.min(target.shield,amount);
   target.shield-=absorbed;const damage=Math.min(target.hp,amount-absorbed);target.hp-=damage;cast.hits++;cast.lastHit=age;
   this.contactFeedback.push({attack:a,attacker:f,damage,counterHit:isCounterHit(a.counterHit,snapshot.defenderPhase,snapshot.defenderOffensive,guard?'block':armored?'armor':'hit'),target,guardReduction:snapshot.guardReduction,outcome:guard?'block':armored?'armor':'hit'});
   cast.outcomes.add(guard?'block':'hit');hitResult(state,event,age,guard?'Blocked':armored?'Armored':'Connected');this.emit((guard?'GUARD −':armored?'ARMOR −':'−')+damage,target.x,target.y-70);
   if(this.training&&target===this.fighters[1]){this.metrics.hits++;this.metrics.damage+=damage;}
   if(guard){if(state.startFrame===null)state.cancelled='Contact blocked; attachment cancelled.';}
   else {state.attached=true;if(armored)target.lastHit=this.frame;else {target.cast=null;target.guarding=false;applyPulseReaction(target,scaledHitEvent(event,this.combos.priorHits(f,target),a.hitstunScaling),snapshot.box.facing,this.frame);}if(f===this.fighters[0]&&damage>0)this.honourMetrics.attacks.add(a.id);}
   if(consumesProjectile(a,guard?'block':armored?'armor':'hit')){state.cancelled=CONTACT_END_REASON;this.consumeProjectile(snapshot,target,guard?'block':armored?'armor':'hit',event.hitboxGroup);break;}
  }
  cast.impact=state.startFrame??state.contactFrame;
  this.lastSequence={attack:a.name,results:state.results.map(r=>({...r})),reason:state.cancelled};
  if(f.cast===cast&&age>=castEnd(state.startFrame??state.contactFrame,tm))f.cast=null;
 }
 prepareArea(area){
  const target=area.target,cast=target.cast,age=this.frame-(cast?.start??0);
  const defending=cast&&age>=cast.tm.startup&&age<cast.tm.startup+cast.tm.active;
  const blocking=defending&&cast.a.payload==='block',dodging=defending&&cast.a.payload==='dodge';
  const defense=defenseSnapshot(cast,age),incoming={delivery:'area',payload:'damage'};
  return {area,defense,guarding:target.guarding||blocking,guardReduction:blocking?cast.a.blockPercent/100:target.guard,
   evading:dodging||(this.frame>=target.dodgeStart+RULES.dodgeInvulnerableStart&&this.frame<target.dodgeStart+RULES.dodgeInvulnerableEnd),
   invulnerable:isInvulnerable(defense,incoming),overlap:shapeHitsRectangle(impactAreaBox(area,this.frame),{x:target.x-14,y:target.y-(target.crouch?34:60),w:28,h:target.crouch?34:60})};
 }
 resolveArea({area,defense,guarding,guardReduction,evading,invulnerable,overlap}){
  const target=area.target;if(target.hp<=0||evading||invulnerable||!claimAreaHit(area,target,this.frame,overlap))return;
  if(claimParry(defense,{delivery:'area',payload:'damage'})){area.end=this.frame;target.cast?.outcomes.add('parry');this.lastAreaContacts.push({name:area.name,owner:this.fighters.indexOf(area.owner),target:this.fighters.indexOf(target),damage:0,parried:true,combatFrame:this.frame});this.emit('AREA PARRIED',target.x,target.y-70);return;}
  const guarded=guarding&&area.blockable,amount=Math.round(area.rule.damage*(1-clamp(target.damageResistance??0,-50,75)/100)*(guarded?1-guardReduction:1)),absorbed=Math.min(target.shield,amount),damage=Math.min(target.hp,amount-absorbed);target.shield-=absorbed;target.hp-=damage;target.flash=this.frame+8;target.lastHit=this.frame;
  this.lastAreaContacts.push({name:area.name,owner:this.fighters.indexOf(area.owner),target:this.fighters.indexOf(target),damage,blocked:!!guarded,combatFrame:this.frame});
  this.emit((guarded?'AREA BLOCKED −':'AREA −')+damage,target.x,target.y-70);
  if(this.training&&target===this.fighters[1]){this.metrics.hits++;this.metrics.damage+=damage;}
 }
 consumeProjectile(snapshot,target,outcome,groupId){
  if(snapshot.cast.a.projectileArea&&this.areas.filter(area=>area.owner===snapshot.f).length<16){const area=createImpactArea(snapshot.cast.a,impactAreaAnchor(snapshot.boxes,groupId,snapshot.targetBox,snapshot.box),this.frame);Object.assign(area,{owner:snapshot.f,target,blockable:snapshot.cast.a.blockable,name:snapshot.cast.a.name});this.areas.push(area);this.emit('IMPACT AREA',target.x,target.y-90);}
  else if(snapshot.cast.a.projectileArea)this.emit('IMPACT AREA LIMIT (16)',target.x,target.y-90);
  snapshot.cast.projectileConsumed=true;const projectile=snapshot.projectile;if(projectile)this.projectiles.remove(projectile);
  this.lastProjectileContacts.push({name:snapshot.cast.a.name,owner:this.fighters.indexOf(snapshot.f),outcome,combatFrame:this.frame});this.emit(CONTACT_END_REASON,target.x,target.y-90);
 }
 projectileDefense(snapshot,defender){
  const projectile=snapshot.projectile;if(!projectile)return false;
  const window=claimProjectileDefense(snapshot.defense,snapshot.cast.a);if(!window)return false;
  const reflected=window.kind==='reflect'&&this.reflectProjectile(projectile,defender);
  let energyRestored=0;
  if(window.kind==='absorb'){energyRestored=Math.min(window.energyGain??0,Math.max(0,defender.maxEnergy-defender.energy));defender.energy+=energyRestored;this.projectiles.remove(projectile);this.emit('ABSORB',defender.x,defender.y-70);if(energyRestored>0)this.emit('ENERGY +'+Number(energyRestored.toFixed(2)),defender.x,defender.y-90);}
  const result=window.kind==='absorb'?'Absorbed':reflected?'Reflected':'Reflection limit';
  this.lastProjectileDefenses.push({id:projectile.id,name:snapshot.cast.a.name,defender:this.fighters.indexOf(defender),result,energyRestored,remainingCharges:window.hits-(snapshot.defense.state.get(window.id)||0)});
  return result;
 }
 parry(attacker,defender,window,projectile=null){defender.cast?.outcomes.add('parry');if(projectile){this.projectiles.remove(projectile);this.emit('PARRY',defender.x,defender.y-70);return;}beginReaction(attacker,{knockback:0,launchHeight:0,pushAxis:'x',hitstun:window.stun,flightFrames:1,floorSlam:false,wallSlam:false},-attacker.facing,this.frame,false);this.emit('PARRY',defender.x,defender.y-70);}
 status(f,a){const previous=f.statuses.find(s=>s.type===a.status);const refreshed=refreshStatus(previous,a,this.frame,f.resistance);f.statuses=f.statuses.filter(s=>s.type!==a.status);f.statuses.push(refreshed);}
}
