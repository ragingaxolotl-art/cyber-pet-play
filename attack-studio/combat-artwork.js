export const KEYS=['Q','W','E','A','S','D','Z','X','C'];
export function availability(pet,attack){if(!pet)return '';const frames=pet.config.animations?.[attack.motion];if(!Array.isArray(frames)||!frames.length)return 'Missing '+attack.motion.replaceAll('_',' ')+' artwork';if(pet.config.animation_reviewed?.[attack.motion]!==true)return 'Save this animation in the compiler first';if(frames.some(name=>!pet.images.has(name)))return 'Required frames could not be loaded';return '';}
export function mappedAttack(pet,attack){const result=structuredClone(attack);if(!pet)return result;
 // Only an exact source slot may provide the pet-specific impact marker.
 const plan=pet.config.battle_plans?.attacks?.find(p=>p.definition_id===attack.id&&p.animation===attack.motion);
 const count=pet.config.animations?.[attack.motion]?.length||0;
 if(plan&&Number.isInteger(plan.impact_frame)&&plan.impact_frame>=1&&plan.impact_frame<=count){result.poseImpact=plan.impact_frame;}
 return result;
}
