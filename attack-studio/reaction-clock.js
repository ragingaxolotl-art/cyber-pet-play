// Retiming only the unplayed portion preserves the current position of an arc.
export function reactionAge(motion,frame){return motion.clock?motion.clock.age+(frame-motion.clock.frame)*motion.clock.rate:frame-(motion.start??0);}
export function extendReactionArc(motion,duration,frame,extra){
 const age=reactionAge(motion,frame),remaining=duration-age;
 if(remaining<=0)return false;
 const oldRate=motion.clock?.rate??1,remainingFrames=remaining/oldRate;
 const nextRemaining=Math.min(120,remainingFrames+extra);
 motion.clock={age,frame,rate:remaining/nextRemaining};motion.endFrame=frame+nextRemaining;return true;
}
