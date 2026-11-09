import {HITBOX_SHAPES,validateHitboxRotation,shapesOverlap} from './hitbox-shapes.js';
import {posePlayback} from './pose-timing.js?v=20261109-hurtboxes';

// Authored hurtboxes replace the default body only while their action is active.
// At least one region per frame: invulnerability belongs to defense windows.
export function validateHurtboxes(attack) {
 if (attack.hurtboxes === undefined) return;
 const frames=attack.hurtboxes?.frames;
 if (!Array.isArray(frames)||!frames.length||frames.length>300)
  throw Error('Use 1–300 hurtbox frames.');
 const count=attack.animationAnchors?.frames.length||attack.poseFrames?.length;
 if (count && count!==frames.length) throw Error('Hurtboxes must match the authored animation frame count.');
 if (attack.poseDurations && attack.poseDurations.length!==frames.length)
  throw Error('Hurtboxes must match authored frame durations.');
 for (const frame of frames) {
  if (!Array.isArray(frame.boxes)||!frame.boxes.length||frame.boxes.length>8)
   throw Error('Use 1–8 hurtboxes per animation frame.');
  for (const box of frame.boxes) {
   if (!box||!HITBOX_SHAPES.includes(box.shape)) throw Error('Choose a supported hurtbox shape.');
   for (const key of ['x','y','w','h'])
    if (!Number.isFinite(box[key]) || (key==='w'||key==='h' ? box[key]<1||box[key]>500 : Math.abs(box[key])>500))
     throw Error('Invalid hurtbox geometry.');
   validateHitboxRotation(box);
  }
 }
}
export function fighterHurtboxes(fighter, action=null) {
 const {x=0,y=0,facing=1,crouch=false}=fighter;
 if (!action?.attack.hurtboxes) return [{x:x-14,y:y-(crouch?34:60),w:28,h:crouch?34:60,shape:'rectangle'}];
 const a=action.attack,frames=a.hurtboxes.frames;
 const pose=posePlayback(a,frames.length,action.frame,action.timing);
 return frames[pose.index].boxes.map(box=>({...box,
  x:x+(facing===-1?-box.x-box.w:box.x),y:y+box.y,facing,
  ...(box.rotation!==undefined?{rotation:box.rotation*(facing===-1?-1:1)}:{})}));
}
// A single yes/no contact prevents overlapping vulnerable regions multiplying damage.
export const touchesHurtboxes=(hitbox,regions)=>regions.some(region=>shapesOverlap(hitbox,region));
