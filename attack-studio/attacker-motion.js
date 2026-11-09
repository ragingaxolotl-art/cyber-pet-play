// Authored fighter displacement in arena pixels and 60 Hz combat frames.
// Forward follows the cast facing; positive rise moves up. Gaps use normal physics.
export const ATTACKER_MOTION_LIMITS=Object.freeze({segments:8,frames:900,duration:180,forward:300,rise:150});
export function validateAttackerMotion(attack){
 const segments=attack.attackerMotion;if(segments===undefined)return;
 if(!Array.isArray(segments)||!segments.length||segments.length>8)throw Error('Use 1–8 attacker movement segments.');
 const ids=new Set();let previousEnd=-1;
 for(const segment of segments){
  if(!segment||Object.keys(segment).some(k=>!['id','start','duration','forward','rise'].includes(k)))throw Error('Use movement ID, start, duration, forward distance and rise.');
  if(typeof segment.id!=='string'||!/^move_[a-zA-Z0-9_]{1,80}$/.test(segment.id)||ids.has(segment.id))throw Error('Each attacker movement needs a unique ID.');ids.add(segment.id);
  if(!Number.isInteger(segment.start)||segment.start<0||!Number.isInteger(segment.duration)||segment.duration<1||segment.duration>180||segment.start+segment.duration>900)throw Error('Movement segments require 1–180 frames and must end within frame 900.');
  if(segment.start<previousEnd)throw Error('Order attacker movements by start frame without overlapping them.');previousEnd=segment.start+segment.duration;
  if(!Number.isFinite(segment.forward)||Math.abs(segment.forward)>300||!Number.isFinite(segment.rise)||Math.abs(segment.rise)>150)throw Error('Movement distance must be within ±300 horizontal and ±150 vertical pixels.');
  if(segment.forward===0&&segment.rise===0)throw Error('A movement segment must move the attacker.');
 }
}
export function createAttackerMotion(attack,facing){
 validateAttackerMotion(attack);if(![1,-1].includes(facing))throw Error('Movement needs a left or right cast facing.');
 return {segments:structuredClone(attack.attackerMotion||[]),facing,lastFrame:-1,cancelled:false};
}
// Repeated calls at a combat frame are inert (including presentation hitstop).
// Clipped movement is spent; it must not teleport back after hitting a wall.
export function stepAttackerMotion(state,frame,position,{interrupted=false,minX=35,maxX=925}={}){
 if(!Number.isInteger(frame)||frame<0||frame<state.lastFrame)throw Error('Movement frames must advance monotonically.');
 if(!Number.isFinite(position.x)||!Number.isFinite(position.y)||!Number.isFinite(minX)||!Number.isFinite(maxX)||minX>maxX)throw Error('Movement requires a finite position and ordered stage bounds.');
 if(interrupted)state.cancelled=true;
 let dx=0,dy=0,active=false,vertical=false;
 if(!state.cancelled&&frame>state.lastFrame)for(const s of state.segments){
  const progress=f=>Math.max(0,Math.min(s.duration,f-s.start+1))/s.duration;
  const amount=progress(frame)-progress(state.lastFrame);dx+=s.forward*state.facing*amount;dy-=s.rise*amount;
  if(frame>=s.start&&frame<s.start+s.duration){active=true;vertical||=s.rise!==0;}
 }
 state.lastFrame=frame;
 return {x:Math.max(minX,Math.min(maxX,position.x+dx)),y:Math.min(0,position.y+dy),active,vertical,cancelled:state.cancelled};
}

// Movement keeps the action committed through its last segment; it does not
// extend active hit windows. Authoring uses absolute combat frames at any speed.
export function attackerMotionTiming(attack,timing){
 const end=Math.max(0,...(attack.attackerMotion||[]).map(s=>s.start+s.duration));
 return {...timing,recovery:Math.max(timing.recovery,end-timing.startup-timing.active)};
}
