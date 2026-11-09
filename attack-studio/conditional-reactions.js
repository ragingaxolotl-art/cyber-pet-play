import {validateBounces} from './bounce-rules.js';
// Reaction alternatives are selected from the contact snapshot, before any
// simultaneous hit changes the target. They never change damage or eligibility.
export const REACTION_CONDITIONS = Object.freeze(['grounded','airborne']);
const reactions=['launch','suspend','relaunch','spike','knockback','none'];
const allowed=new Set(['when','reaction','height','knockback','frames','hold','hitstun','bounces']);
const ranges={height:[0,150],knockback:[0,150],frames:[1,120],hold:[1,30],hitstun:[0,120]};

export function validateReactionAlternatives(alternatives) {
 if(alternatives===undefined)return;
 if(!Array.isArray(alternatives)||alternatives.length<1||alternatives.length>2)
  throw Error('Choose one or two grounded/airborne reaction alternatives.');
 const seen=new Set();
 for(const rule of alternatives){
  if(!rule||typeof rule!=='object'||Array.isArray(rule)||Object.keys(rule).some(k=>!allowed.has(k)))
   throw Error('Reaction alternatives contain unsupported properties.');
  if(!REACTION_CONDITIONS.includes(rule.when)||seen.has(rule.when))
   throw Error('Each target condition may appear only once.');
  seen.add(rule.when);
  validateBounces(rule.bounces);
  if(rule.bounces&&['none','suspend'].includes(rule.reaction))throw Error('Bounces require a moving alternative reaction.');
  if(!reactions.includes(rule.reaction))throw Error('Choose a supported alternative reaction.');
  for(const [key,[min,max]] of Object.entries(ranges)){
   if(rule[key]===undefined){if(key==='hitstun')continue;throw Error('Complete the alternative reaction settings.');}
   if(!Number.isInteger(rule[key])||rule[key]<min||rule[key]>max)
    throw Error('Alternative '+key+' is outside its allowed range.');
  }
 }
}

export function reactionContactState(target) {
 if(!target||!Number.isFinite(target.y))throw Error('A contact needs a finite target height.');
 return Object.freeze({airborne:target.y<0});
}

export function resolveReactionAlternative(event,contact) {
 validateReactionAlternatives(event.reactionAlternatives);
 if(!contact||typeof contact.airborne!=='boolean')throw Error('Use the captured target contact state.');
 const rule=event.reactionAlternatives?.find(r=>r.when===(contact.airborne?'airborne':'grounded'));
 const resolved=structuredClone(event);delete resolved.reactionAlternatives;
 if(!rule)return resolved;
 // No implicit inheritance of hitstun/bounces from the default reaction.
 // Omitting hitstun keeps the selected reaction's normal duration rule.
 delete resolved.hitstun;delete resolved.bounces;
 for(const key of ['reaction','height','knockback','frames','hold','hitstun'])
  if(rule[key]!==undefined)resolved[key]=rule[key];
 if(rule.bounces)resolved.bounces=structuredClone(rule.bounces);
 return resolved;
}
