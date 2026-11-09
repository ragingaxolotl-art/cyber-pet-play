import {startBoundaryBounce} from './bounce-rules.js?v=20261108-bounces';
import {juggleLegacyReaction,resetGroundedJuggle} from './juggle-rules.js?v=20261108-bounces';
import {RECOVERY_TIMING,legacyRecoveryEnd} from './recovery-timing.js?v=20261108-movement-cancels';
import {sampleLegacyMotion,hasLegacyMotion} from './legacy-motion.js?v=20261108-movement-cancels';
export const REACTION={wallHold:RECOVERY_TIMING.wall,downHold:RECOVERY_TIMING.down,getUp:RECOVERY_TIMING.getUp,drag:.84};
export function beginReaction(f,attack,direction,frame,countJuggle=true){
 // A completed juggle must reach the floor before another hit can relaunch it.
 // Damage is resolved by the caller; preserve the forced landing motion here.
 if(f.juggleLocked&&f.y<0){f.lastHit=frame;return;}
 resetGroundedJuggle(f);
 if(countJuggle){attack=juggleLegacyReaction(f,attack);if(!attack)return;}
 const recoveryEnd=legacyRecoveryEnd(f,attack,frame);
 // Keep authored hitstun separate from motion/knockdown recovery for air recovery.
 f.hitstunUntil=Math.max(f.hitstunUntil||0,frame+attack.hitstun);
 f.pulseMotion=null;f.cast=null;f.guarding=false;f.moving=false;f.sprinting=false;f.vx=0;f.vy=0;
 f.legacyMotion=hasLegacyMotion(f,attack)?{x:f.x,y:f.y,start:frame,attack:{...attack},direction,wall:false}:null;
 f.needsFall=!!attack.floorSlam&&(f.y<0||(attack.pushAxis!=='x'&&attack.launchHeight>0));f.reaction=(attack.pushAxis!=='x'&&attack.launchHeight>0)||f.y<0?'airborne':'hurt';
 f.reactionStart=frame;f.reactionUntil=frame+attack.hitstun;
 if(!f.legacyMotion&&attack.hitstun===0)f.reaction='standing';
 f.lastHit=frame;f.stun=Math.max(f.stun,recoveryEnd);

}
export function advanceReaction(f,frame,emit){
 if(f.legacyMotion){
  const motion=f.legacyMotion,a=motion.attack,sample=sampleLegacyMotion(motion,a,motion.direction,frame-motion.start,35,925);
  const raw=sampleLegacyMotion(motion,a,motion.direction,frame-motion.start);
  if(startBoundaryBounce(f,a.bounces,raw,motion.direction,frame,35,925)){emit(f.reactionBounceKind==='wall'?'WALL BOUNCE':'FLOOR BOUNCE',f);return true;}
  f.x=sample.x;f.y=sample.y;f.vx=0;f.vy=0;
  if(sample.wall&&a.wallSlam&&!motion.wall){motion.wall=true;f.stun=Math.max(f.stun,legacyRecoveryEnd(motion,a,motion.start,true));f.reaction='wall';f.reactionStart=frame;emit('WALL HIT',f);}
  if(sample.done){f.legacyMotion=null;if(f.needsFall||motion.wall)knockDown(f,frame,emit);else f.reaction=frame>=f.reactionUntil?'standing':'hurt';}
  else f.stun=Math.max(f.stun,frame+1);
  return true;
 }
 if(f.reaction==='standing')return;
 if(f.reaction==='wall'&&frame>=f.reactionUntil){f.reaction='airborne';f.vy=1;f.needsFall=true;}
 if(f.reaction==='down'&&frame>=f.reactionUntil){f.reaction='getting_up';f.reactionStart=frame;f.reactionUntil=frame+REACTION.getUp;}
 if(f.reaction==='getting_up'&&frame>=f.reactionUntil){f.reaction='standing';f.vx=0;f.needsFall=false;}
 if(f.reaction==='hurt'&&frame>=f.reactionUntil){if(f.needsFall)knockDown(f,frame,emit);else f.reaction='standing';}
 if(['hurt','airborne'].includes(f.reaction)){const next=f.x+f.vx;if(Math.abs(f.vx)>.4&&(next<=35||next>=925)){f.x=Math.max(35,Math.min(925,next));f.vx=0;f.vy=0;f.y=Math.min(-18,f.y);f.reaction='wall';f.reactionStart=frame;f.reactionUntil=frame+REACTION.wallHold;f.needsFall=true;emit('WALL HIT',f);return;}f.x=next;f.vx*=REACTION.drag;}
 if(f.reaction!=='standing')f.stun=Math.max(f.stun,frame+1);
}
export function knockDown(f,frame,emit){if(f.reaction==='down'||f.reaction==='getting_up')return;f.reaction='down';f.reactionStart=frame;f.reactionUntil=frame+REACTION.downHold;f.vx=0;f.vy=0;f.y=0;emit('KNOCKDOWN',f);}
export function reactionMotion(f){return ({wall:'hurt_side',airborne:'knocked_down_side',hurt:'hurt_side',down:'knocked_down_side',getting_up:'get_up_side'})[f.reaction]||null;}
