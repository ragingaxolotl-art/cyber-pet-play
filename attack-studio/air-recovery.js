// Classroom balance, in combat frames: one neutral air recovery per landing.
// Recovery brakes authored motion at the current position; gravity resumes.
// It grants neither invulnerability nor a renewed juggle budget.
export const AIR_RECOVERY_RULES=Object.freeze({minimumHitAge:12});
export function airRecoveryReason(target,frame){
 if(target.captured||target.holding)return 'Finish the throw first';
 if(target.hp<=0)return 'Defeated fighters cannot recover';
 if(target.y>=0)return 'Air recovery requires an airborne fighter';
 if(target.airRecoveryUsed)return 'Land before another air recovery';
 if(target.juggleLocked)return 'Finish the forced juggle landing';
 if(target.needsFall||target.legacyMotion?.attack.floorSlam||['wall','down','getting_up'].includes(target.reaction))return 'Forced knockdown cannot be air-recovered';
 if(target.reaction!=='airborne')return 'No airborne hit reaction to recover from';
 if((target.hitstunUntil||0)>frame)return 'Hitstun has not ended';
 if(target.statuses?.some(s=>s.type==='stun'&&s.until>frame))return 'Stun effect is still active';
 if(frame-target.lastHit<AIR_RECOVERY_RULES.minimumHitAge)return 'Wait 12 combat frames after the last hit';
 return '';
}
export function recoverInAir(target,frame){
 const reason=airRecoveryReason(target,frame);if(reason)return reason;
 target.airRecoveryUsed=true;target.pulseMotion=null;target.legacyMotion=null;
 target.pulseOwned=false;target.legacyOwned=false;target.reaction='standing';
 target.reactionUntil=frame;target.stun=frame;target.hitstunUntil=frame;
 target.needsFall=false;target.vx=0;target.vy=0;target.cast=null;
 target.guarding=false;target.moving=false;target.sprinting=false;
 target.reactionInFlight=false;target.airRecoveryFrame=frame;
 return '';
}

export function validateRecoveryFrame(frame){if(frame!==undefined&&frame!==null&&(!Number.isInteger(frame)||frame<0||frame>899))throw Error('Use an air-recovery attempt frame from 0 to 899.');}
