// Opt-in direct damage bonus; phases are captured before resolving contacts.
// Apply before combo scaling and shields. Guard/armor/status ticks are excluded.
export function validateCounterHit(rule){
 if(rule===undefined)return;
 if(!rule||typeof rule!=='object'||Array.isArray(rule)||Object.keys(rule).length!==2||!Object.hasOwn(rule,'phases')||!Object.hasOwn(rule,'damagePercent'))throw Error('Counter-hit requires phases and damagePercent.');
 if(!Array.isArray(rule.phases)||!rule.phases.length||rule.phases.length>3||new Set(rule.phases).size!==rule.phases.length||rule.phases.some(p=>!['startup','active','recovery'].includes(p)))throw Error('Choose unique counter-hit phases: startup, active or recovery.');
 if(!Number.isInteger(rule.damagePercent)||rule.damagePercent<100||rule.damagePercent>300)throw Error('Counter-hit damage percentage must be a whole number from 100 to 300.');
}
export function isCounterHit(rule,phase,offensive,outcome='hit'){
 return !!rule&&!!offensive&&outcome==='hit'&&rule.phases.includes(phase);
}
export function counterHitDamage(damage,rule,phase,offensive,outcome='hit'){
 return isCounterHit(rule,phase,offensive,outcome)?Math.round(damage*rule.damagePercent/100):damage;
}
