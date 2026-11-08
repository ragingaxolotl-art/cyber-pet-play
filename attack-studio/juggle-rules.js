import {resetBounceChain} from './bounce-rules.js?v=20261108-bounces';
// Classroom balance: initial grounded launch counts as reaction one.
// The budget belongs to the target and resets only on floor contact.
export const JUGGLE_RULES=Object.freeze({reactions:10,releaseFrames:15,releaseDistance:30});
export function resetGroundedJuggle(target){if(target.y>=0&&!target.pulseMotion?.bounce){resetBounceChain(target);target.juggleHits=0;target.juggleLocked=false;target.airRecoveryUsed=false;}}
export function recordJuggleReaction(target,launches=false){
 resetGroundedJuggle(target);
 if(target.juggleLocked&&target.y<0)return 'locked';
 if(target.y>=0&&!launches)return 'normal';
 target.juggleHits=(target.juggleHits||0)+1;
 if(target.juggleHits>=JUGGLE_RULES.reactions){target.juggleLocked=true;return 'release';}
 return 'normal';
}
export function juggleLegacyReaction(target,attack){
 const result=recordJuggleReaction(target,attack.pushAxis!=='x'&&attack.launchHeight>0);
 if(result==='locked')return null;
 return result==='release'?{...attack,pushAxis:'both',launchHeight:0,knockback:JUGGLE_RULES.releaseDistance,flightFrames:JUGGLE_RULES.releaseFrames,hitstun:JUGGLE_RULES.releaseFrames,wallSlam:false,floorSlam:false}:attack;
}
