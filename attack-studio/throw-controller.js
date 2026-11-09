import {throwRejection,resolveGrabAttempts,createThrowHold,heldPosition,throwHoldPhase} from './throw-rules.js?v=20261109-throw-release';
import {contactDeadline} from './contact-timing.js';
export class ThrowController{
 constructor(arena){this.arena=arena;this.holds=[];}
 record(hold,outcome){const arena=this.arena;arena.lastThrows.push({frame:arena.frame,owner:arena.fighters.indexOf(hold.attacker),target:arena.fighters.indexOf(hold.target),name:hold.cast.a.name,outcome});arena.emit(outcome.toUpperCase(),hold.target.x,hold.target.y-70);}
 position(){for(const hold of this.holds)Object.assign(hold.target,heldPosition(hold,hold.attacker),{vx:0,vy:0});}
 finish(hold,recover=true){
  const {attacker,target,cast}=hold;delete attacker.holding;delete target.captured;
  if(recover&&attacker.cast===cast)cast.throwRecoveryEnd=this.arena.frame+cast.tm.recovery+1;
  this.holds=this.holds.filter(h=>h!==hold);
 }
 clear(){for(const hold of [...this.holds])this.finish(hold,false);}
 settle(){
  const arena=this.arena;
  for(const hold of [...this.holds]){
   const {attacker,target,cast}=hold;
   const phase=throwHoldPhase(hold,arena.frame,{attackerAlive:attacker.hp>0,targetAlive:target.hp>0,interrupted:attacker.cast!==cast||attacker.reaction!=='standing'||attacker.statuses.some(s=>s.type==='stun')||target.lastHit>hold.start});
   if(phase==='hold')continue;
   this.finish(hold);if(phase==='cancel'){this.record(hold,'throw cancelled');continue;}
   arena.releaseThrow(hold);this.record(hold,'throw released');
  }
 }
 capture(pending){
  const arena=this.arena;
  const attempts=pending.filter(s=>s?.cast.a.throw&&!s.cast.throwSpent&&s.f.cast===s.cast).map(s=>{
   const {cast,age}=s,{a,tm}=cast;
   const active=age>=tm.startup&&(cast.impact===null?age<=contactDeadline(tm):age<cast.impact+tm.active);
   return {id:arena.fighters.indexOf(s.f),attack:a,attacker:s.f,target:s.target,active,contact:s.boxes?s.groupContacts.length>0:s.contact,evading:s.evading,defense:s.defense,snapshot:s};
  });
  const result=resolveGrabAttempts(attempts);
  for(const attempt of attempts){
   const {attacker,target,snapshot:{cast}}=attempt;
   if(result.broken.includes(attempt.id)){
    cast.throwSpent=true;cast.throwRecoveryEnd=arena.frame+cast.tm.recovery+1;this.record({attacker,target,cast},'throw break');continue;
   }
   if(!result.accepted.includes(attempt.id))continue;
   // Recheck after ordinary hits and area pulses. An interrupted captor cannot grab.
   if(attacker.cast!==cast||attacker.reaction!=='standing'||attacker.stun>arena.frame||throwRejection(attempt))continue;
   const hold={...createThrowHold(cast.a,arena.frame,cast.facing),attacker,target,cast};
   cast.throwSpent=true;attacker.holding=hold;target.captured=hold;target.cast=null;target.guarding=false;target.blockstunUntil=0;target.dodgeUntil=0;target.dashUntil=0;target.pulseMotion=null;target.legacyMotion=null;target.reaction='standing';target.vx=target.vy=0;attacker.vx=attacker.vy=0;
   this.holds.push(hold);this.record(hold,'grabbed');
  }
  this.position();
 }
}
