import {validateAttack} from './combat-model.js?v=20261110-defense-boundary-audit';
import {REACTIONS} from './hit-sequence.js?v=20261110-library-management';
export const REACTION_BLOCKS=['hit',...REACTIONS.filter(r=>r!=='none')];
// Shared defaults keep the builder's conditional editor and generated hits aligned.
export function reactionBlockSettings(block,interval=5){
 const reaction=block.type==='hit'?'none':block.type;
 return {reaction,height:['launch','relaunch','spike'].includes(reaction)?45:reaction==='knockback'?12:0,knockback:reaction==='knockback'?65:0,frames:24,hold:interval,...(block.impulse!==undefined?{impulse:structuredClone(block.impulse)}:{}),...(block.reactionAlternatives!==undefined?{reactionAlternatives:structuredClone(block.reactionAlternatives)}:{})};
}
// Authoring helper only: exports ordinary hit events understood by both runtimes.
// It never changes delivery, geometry, artwork, defense or follow-up definitions.
export function buildReactionSequence(attack,blocks,{interval=5,start=attack.hitEvents?.[0]?.offset??0}={}){
 if(!attack.hitEvents)throw Error('Create a hit sequence before adding reaction blocks.');
 if(!Number.isInteger(interval)||interval<1||interval>25||!Number.isInteger(start)||start<0)throw Error('Choose whole-frame spacing from 1–25 and a nonnegative start.');
 if(!Array.isArray(blocks)||!blocks.length||blocks.length>10)throw Error('Add 1–10 reaction blocks.');
 const next=structuredClone(attack),events=[];
 for(const block of blocks){
  if(!block||!REACTION_BLOCKS.includes(block.type)||!Number.isInteger(block.repeat)||block.repeat<1||block.repeat>10)throw Error('Each block needs a supported reaction and 1–10 repeats.');
  if(events.length+block.repeat>10)throw Error('A sequence can contain at most ten hits.');
  for(let i=0;i<block.repeat;i++){
   const reaction=block.type==='hit'?'none':block.type;
   const event={id:'hit_'+crypto.randomUUID().replaceAll('-',''),offset:start+events.length*interval,duration:1,damage:block.damage??(reaction==='knockback'?12:reaction==='launch'?6:3),...reactionBlockSettings(block,interval),target:'any'};
   if(next.hitboxGroups)event.hitboxGroup=block.hitboxGroup??attack.hitEvents[0].hitboxGroup;
   events.push(event);
  }
 }
 delete next.hitPropertyLinks; // Recipe replacement creates new independent hit identities.
 next.hitEvents=events;next.active=Math.max(next.active,...events.map(e=>e.offset+e.duration));
 validateAttack(next);return next;
}
