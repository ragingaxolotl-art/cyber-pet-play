// Durations are seconds per position, so repeated source frames can have different holds.
export const DEFAULT_POSE_SECONDS = 0.1;
// Authored anchor positions own their timeline independently of sprite-sheet size.
export function poseFrameCount(attack, count) {
 return attack.animationAnchors?.frames?.length || attack.hurtboxes?.frames?.length || attack.poseFrames?.length || count;
}
export function poseSourceFrames(attack, sourceCount) {
 // Clamp unavailable authored source frames for anchor-enabled artwork. Both
 // renderers then hold the last available source instead of wrapping differently.
 if (attack.poseFrames) return (attack.animationAnchors || attack.hurtboxes)
  ? attack.poseFrames.map(index => Math.min(sourceCount - 1, index)) : attack.poseFrames;
 const count = poseFrameCount(attack, sourceCount);
 return Array.from({length: count}, (_, index) => Math.min(sourceCount - 1,
  Math.floor(index * sourceCount / count)));
}
export function poseDurations(attack, count) {
 return Array.from({length: poseFrameCount(attack, count)}, (_, i) => attack.poseDurations?.[i] ?? DEFAULT_POSE_SECONDS);
}
export function posePlayback(attack, count, frame, combatTiming, contactFrame) {
 const durations = poseDurations(attack, count);
 if (attack.poseTiming !== 'custom') {
  // Anchor-driven collision must not wait for the contact it is meant to cause.
  // Its animation and geometry share a cast-relative clock.
  const impactTime = (attack.animationAnchors || attack.hurtboxes || attack.projectileLifetime!==undefined) ? combatTiming.startup : contactFrame ?? combatTiming.startup;
  const total = impactTime + combatTiming.active + combatTiming.recovery;
  const impact = Math.min(durations.length - 1, Math.max(0, (attack.poseImpact || Math.ceil(durations.length / 2)) - 1));
  let index;
  if(frame >= total) index = durations.length - 1;
  else if(frame < combatTiming.startup) index = Math.floor(frame / Math.max(1, combatTiming.startup) * impact);
  else if(frame < impactTime) index = Math.max(0, impact - 1);
  else if(frame < impactTime + combatTiming.active) index = impact;
  else index = Math.min(durations.length - 1, impact + Math.floor((frame - impactTime - combatTiming.active) / Math.max(1, combatTiming.recovery) * (durations.length - impact)));
  return {index, finished: frame >= total, end: total};
 }
 const end = Math.ceil(durations.reduce((sum, seconds) => sum + seconds, 0) * 60 - 1e-9);
 let remaining = frame / 60, index = 0;
 while(index < durations.length - 1 && remaining + 1e-9 >= durations[index]) remaining -= durations[index++];
 return {index, finished: frame >= end, end};
}
