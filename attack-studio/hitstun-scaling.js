// Only authored hitstun deteriorates. Motion, knockdown and status stun have
// independent recovery requirements and are not shortened by this rule.
export function validateHitstunScaling(rule){
 if(rule===undefined)return;
 if(!rule||typeof rule!=='object'||Array.isArray(rule)||Object.keys(rule).length!==2||!Object.hasOwn(rule,'step')||!Object.hasOwn(rule,'minimum'))throw Error('Hitstun scaling requires step and minimum frames.');
 for(const key of ['step','minimum'])if(!Number.isInteger(rule[key])||rule[key]<0||rule[key]>120)throw Error('Hitstun scaling values must be whole frames from 0 to 120.');
}
export function scaledHitstun(frames,priorHits,rule){
 if(!rule)return frames;
 return Math.min(frames,Math.max(rule.minimum,frames-priorHits*rule.step));
}
export function scaledHitReaction(attack,priorHits){
 if(attack.hitstunScaling===undefined||attack.payload!=='damage')return attack;
 return {...attack,hitstun:scaledHitstun(attack.hitstun,priorHits,attack.hitstunScaling)};
}

export function scaledHitEvent(event,priorHits,rule){
 if(rule===undefined)return event;
 const frames=event.hitstun??(event.reaction==='none'?0:event.reaction==='suspend'?event.hold:event.frames);
 return {...event,hitstun:scaledHitstun(frames,priorHits,rule)};
}
