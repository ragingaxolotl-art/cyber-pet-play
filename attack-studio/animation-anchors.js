import {posePlayback} from './pose-timing.js?v=20261109-anchors';

// Anchor coordinates use the same fighter-origin pixels as hitboxes. Frames are
// authored sequence positions, not indexes into a particular pet's sprite sheet.
export function validateAnimationAnchors(attack) {
 const sequence = attack.animationAnchors;
 if (sequence === undefined) return;
 const fail = message => { throw new Error(message); };
 if (!sequence || typeof sequence !== 'object' || !Array.isArray(sequence.frames) ||
     sequence.frames.length < 1 || sequence.frames.length > 300)
  fail('Use 1–300 animation anchor frames.');
 if (attack.poseFrames && attack.poseFrames.length !== sequence.frames.length)
  fail('Animation anchors must match the authored animation sequence length.');
 if (attack.poseDurations && attack.poseDurations.length !== sequence.frames.length)
  fail('Animation anchors must match the authored frame durations.');
 const ids = new Set();
 for (const frame of sequence.frames) {
  if (!frame || typeof frame.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(frame.id) || ids.has(frame.id))
   fail('Each anchor frame needs a unique stable ID.');
  ids.add(frame.id);
  if (!frame.points || typeof frame.points !== 'object' || Array.isArray(frame.points))
   fail('Each anchor frame needs named points.');
  const entries = Object.entries(frame.points);
  if (entries.length > 32) fail('Use at most 32 anchors per frame.');
  for (const [name, point] of entries) {
   if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/.test(name) || !point ||
       !Number.isFinite(point.x) || !Number.isFinite(point.y) ||
       Math.abs(point.x) > 500 || Math.abs(point.y) > 500)
    fail('Anchor names and coordinates must be valid; coordinates range from -500 to 500.');
  }
 }
}

// Missing points return null: callers must diagnose missing authoring rather than
// silently snapping a hand/weapon hitbox to the fighter origin.
export function animationAnchorAt(attack, name, frame, timing, facing = 1, contactFrame) {
 const frames = attack.animationAnchors?.frames;
 if (!frames?.length) return null;
 const playback = posePlayback(attack, frames.length, frame, timing, contactFrame);
 const selected = frames[playback.index];
 const point = selected?.points[name];
 return point ? {x: point.x * (facing === -1 ? -1 : 1), y: point.y,
  frameId: selected.id, index: playback.index} : null;
}

export function validateAnchorBindings(attack) {
 validateAnimationAnchors(attack);
 const boxes = [attack.box, ...(attack.hitboxGroups || []).flatMap(group => group.boxes)];
 for (const box of boxes) {
  if (box?.anchor === undefined) continue;
  if (typeof box.anchor !== 'string' || !/^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/.test(box.anchor))
   throw Error('Choose a valid hitbox anchor name.');
  if (!attack.animationAnchors?.frames.every(frame => Object.hasOwn(frame.points, box.anchor)))
   throw Error('A bound hitbox anchor must exist on every animation frame.');
 }
}
