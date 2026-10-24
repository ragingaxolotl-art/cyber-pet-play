import {freshAttack,validateAttack} from './combat-model.js?v=20261024-reviewed18';
import {familyKey,createReskinGroup} from './reskin-groups.js?v=20261024-reviewed18';
// Reviewed setups always open as new drafts; bank entries and existing edits are untouched.
export function openReviewedAttack(setup,effects){
 const attack=structuredClone(setup.attack),effect=effects.find(e=>e.id===setup.effectId);
 if(!effect)throw Error('Artwork for this tuned attack is not available.');
 attack.id=freshAttack().id;delete attack.reskinGroupId;delete attack.reskinElement;
 attack.reviewedSetup={effectId:setup.effectId,revision:setup.revision||1};
 validateAttack(attack,new Set(effects.map(e=>e.id)));
 return familyKey(effect)?createReskinGroup([attack],attack,effect,effects,()=>freshAttack().id):[attack];
}
