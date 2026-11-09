import {reactionAge} from './reaction-clock.js?v=20261109-momentum-release';
// Authored legacy displacement, sampled at 60 Hz from the most recent hit.
// Stage bounds belong to each scene; axis and duration belong to the attack.
export function sampleLegacyMotion(origin,attack,direction,elapsed,minX=-Infinity,maxX=Infinity) {
 elapsed=reactionAge(origin,(origin.start??0)+elapsed);
 const progress=Math.max(0,Math.min(1,elapsed/(attack.flightFrames??36)));
 const rawX=origin.x+direction*(attack.pushAxis==='y'?0:attack.knockback)*progress;
 const height=attack.pushAxis==='x'?0:attack.launchHeight;
 return {x:Math.max(minX,Math.min(maxX,rawX)),y:origin.y*(1-progress)-4*height*progress*(1-progress),
  wall:rawX<=minX||rawX>=maxX,done:progress===1};
}

export function hasLegacyMotion(target,attack) {
 return target.y<0||(attack.pushAxis!=='y'&&attack.knockback>0)||(attack.pushAxis!=='x'&&attack.launchHeight>0);
}
