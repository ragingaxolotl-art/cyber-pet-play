// Durations use 60 Hz simulation frames. Missing settings preserve legacy timing.
export const CONTACT_FEEDBACK_LIMITS=Object.freeze({hitstop:20,blockstop:20,blockstun:120});
export function validateContactFeedback(feedback){
 if(feedback===undefined)return;
 if(!feedback||typeof feedback!=='object'||Array.isArray(feedback))throw Error('Contact feedback must be a settings object.');
 const keys=Object.keys(feedback);
 if(!keys.length||keys.some(key=>!Object.hasOwn(CONTACT_FEEDBACK_LIMITS,key)))throw Error('Choose hitstop, blockstop or blockstun settings.');
 for(const key of keys)if(!Number.isInteger(feedback[key])||feedback[key]<0||feedback[key]>CONTACT_FEEDBACK_LIMITS[key])throw Error(`${key} must be 0–${CONTACT_FEEDBACK_LIMITS[key]} whole frames.`);
}
// Collect every accepted contact before choosing a stop duration. Trades and
// multi-box contacts take the maximum, never a sum dependent on processing order.
export function contactFeedbackResult(contacts){
 let stopFrames=0;const guards=new Map();
 for(const {attack,target,outcome} of contacts){
  const settings=attack?.contactFeedback;
  if(!settings)continue;
  if(outcome==='block'){
   stopFrames=Math.max(stopFrames,settings.blockstop??0);
   if(target!==undefined)guards.set(target,Math.max(guards.get(target)||0,settings.blockstun??0));
  }else if(outcome==='hit'||outcome==='armor')stopFrames=Math.max(stopFrames,settings.hitstop??0);
 }
 return {stopFrames,guards};
}
