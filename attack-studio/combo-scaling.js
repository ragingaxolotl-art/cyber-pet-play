// Percentages apply to direct damage after existing stat/status/resistance math,
// before shields. Guard/armor damage and periodic status ticks are not scaled.
export function validateComboScaling(settings){
 if(settings===undefined)return;
 if(!settings||typeof settings!=='object'||Array.isArray(settings)||Object.keys(settings).length!==2||!Object.hasOwn(settings,'step')||!Object.hasOwn(settings,'minimum'))throw Error('Combo scaling requires step and minimum percentages.');
 for(const key of ['step','minimum'])if(!Number.isInteger(settings[key])||settings[key]<0||settings[key]>100)throw Error('Combo scaling percentages must be whole numbers from 0 to 100.');
}
export function scaledComboDamage(damage,priorHits,settings,outcome='hit'){
 if(!settings||outcome!=='hit')return damage;
 const percent=Math.max(settings.minimum,100-priorHits*settings.step);
 return Math.round(damage*percent/100);
}
