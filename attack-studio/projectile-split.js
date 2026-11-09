// Authored split timing uses combat frames after launch. Children inherit their
// parent's combat definition, but never split recursively or renew owner actions.
export const SPLIT_LIMITS=Object.freeze({children:5,delay:300,speed:12,lifetime:300});
export function validateProjectileSplit(attack){
 const rule=attack.projectileSplit;if(rule===undefined)return;
 if(!rule||typeof rule!=='object'||Array.isArray(rule))throw Error('Use a projectile split definition.');
 if(attack.delivery!=='projectile'||!['damage','push'].includes(attack.payload)||attack.projectileLifetime===undefined)throw Error('Splitting requires an independent damage or push projectile.');
 const bounds={afterFrames:[1,SPLIT_LIMITS.delay],count:[2,SPLIT_LIMITS.children],spread:[0,180],speed:[1,SPLIT_LIMITS.speed],lifetime:[1,SPLIT_LIMITS.lifetime]};
 for(const key of Object.keys(rule))if(!Object.hasOwn(bounds,key))throw Error('Unexpected projectile split setting: '+key);
 for(const [key,[min,max]] of Object.entries(bounds))if(!Number.isInteger(rule[key])||rule[key]<min||rule[key]>max)throw Error(`Split ${key} must be a whole number from ${min} through ${max}.`);
 if(rule.afterFrames>=attack.projectileLifetime)throw Error('Split must occur before the parent projectile expires.');
}
export function splitDue(attack,spawnFrame,frame){
 validateProjectileSplit(attack);
 if(!Number.isInteger(spawnFrame)||!Number.isInteger(frame))throw Error('Split timing requires whole combat frames.');
 return !!attack.projectileSplit&&frame===spawnFrame+attack.projectileSplit.afterFrames;
}
export function splitFan(attack,center,direction,frame){
 validateProjectileSplit(attack);const rule=attack.projectileSplit;if(!rule)throw Error('This projectile has no split.');
 if(!center||![center.x,center.y,direction].every(Number.isFinite)||!Number.isInteger(frame))throw Error('Split needs a finite center, direction and combat frame.');
 return Array.from({length:rule.count},(_,index)=>{
  const angle=direction+(index/(rule.count-1)-.5)*rule.spread*Math.PI/180;
  return {index,x:center.x,y:center.y,vx:Math.cos(angle)*rule.speed,vy:Math.sin(angle)*rule.speed,spawnFrame:frame,start:frame+1,end:frame+1+rule.lifetime};
 });
}
export function splitChildDefinition(attack){
 validateProjectileSplit(attack);if(!attack.projectileSplit)throw Error('This projectile has no split.');
 const child=structuredClone(attack),rule=child.projectileSplit;delete child.projectileSplit;
 // Travel belongs to each ray. Independent damage/reaction/group settings stay
 // authored; the runtime gives each child a fresh cast and collision tracker.
 delete child.projectileSteering;delete child.motionPath;delete child.projectileStart;
 child.projectileSpeed=rule.speed;child.projectileLifetime=rule.lifetime;
 child.startup=0;child.active=rule.lifetime;child.recovery=0;
 return child;
}
export function splitRayPosition(ray,frame){
 const age=Math.max(0,frame-ray.start);
 return {x:ray.x+ray.vx*age,y:ray.y+ray.vy*age};
}
