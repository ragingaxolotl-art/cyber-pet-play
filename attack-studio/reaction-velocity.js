import {reactionAge} from './reaction-clock.js?v=20261109-momentum-release';
// Current velocity in arena pixels per combat frame. Authored arcs store zero
// in fighter.vx/vy, so momentum blending must sample their actual derivative.
// Reading motion never changes it. Positive Y points downward.
export function reactionVelocity(target,frame,{minX=-Infinity,maxX=Infinity}={}){
 const motion=target.pulseMotion||target.legacyMotion;
 if(!motion)return {x:Number.isFinite(target.vx)?target.vx:0,y:Number.isFinite(target.vy)?target.vy:0};
 if(motion.impulse)return {x:motion.impulse.rule.mode==='suspend'?0:motion.impulse.vx,y:motion.impulse.rule.mode==='suspend'?0:motion.impulse.vy};
 const pulse=!!target.pulseMotion,e=pulse?motion.event:motion.attack;
 const duration=pulse?(e.reaction==='suspend'?e.hold:e.frames):(e.flightFrames??36),elapsed=reactionAge(motion,frame);
 if(!Number.isFinite(duration)||duration<=0||elapsed<0||elapsed>=duration)return {x:0,y:0};
 const t=elapsed/duration,height=pulse?(e.reaction==='spike'?0:e.height):(e.pushAxis==='x'?0:e.launchHeight);
 let x=motion.direction*(pulse||e.pushAxis!=='y'?e.knockback:0)/duration;
 if(target.x<=minX&&x<0||target.x>=maxX&&x>0)x=0;
 const y=pulse&&e.reaction==='suspend'?0:-motion.y/duration-4*height/duration*(1-2*t);
 const rate=motion.clock?.rate??1;return {x:x===0?0:x*rate,y:y===0?0:y*rate};
}
