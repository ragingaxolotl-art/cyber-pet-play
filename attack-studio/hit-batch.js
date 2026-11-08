import {validateAttack} from './combat-model.js?v=20261108-impact-timing';
export const BATCH_HIT_FIELDS={damage:'Damage',reaction:'Reaction',target:'Eligible target',height:'Launch height',knockback:'Knockback',frames:'Reaction travel',hold:'Suspend time'};
export function editHitBatch(attack,ids,key,value){
 if(!Object.hasOwn(BATCH_HIT_FIELDS,key))throw Error('Choose a supported hit property.');
 if(!Array.isArray(ids)||!ids.length)throw Error('Select at least one hit to change.');
 const chosen=new Set(ids),next=structuredClone(attack);
 if(!next.hitEvents||[...chosen].some(id=>!next.hitEvents.some(h=>h.id===id)))throw Error('A selected hit no longer exists. Select the hits again.');
 for(const hit of next.hitEvents)if(chosen.has(hit.id))hit[key]=value;
 validateAttack(next);return next;
}
