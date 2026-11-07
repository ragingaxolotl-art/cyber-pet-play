import {hasLegacyMotion} from './legacy-motion.js?v=20261107-invulnerability';
// Classroom recovery timeline, in 60 Hz frames. Down includes the falling pose.
export const RECOVERY_TIMING=Object.freeze({wall:10,landing:12,fall:12,down:30,getUp:32});

export function legacyRecoveryEnd(target,attack,start,wall=false) {
 const moving=hasLegacyMotion(target,attack),airborne=target.y<0||(attack.pushAxis!=='x'&&attack.launchHeight>0);
 const travel=moving?(attack.flightFrames??36):0;
 const down=wall||(airborne&&attack.floorSlam);
 return start+Math.max(attack.hitstun,travel+(down?RECOVERY_TIMING.down+RECOVERY_TIMING.getUp:0));
}
