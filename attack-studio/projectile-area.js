import {shapeHitsRectangle} from './hitbox-shapes.js';
// Areas begin on the combat frame AFTER contact: impact never double-hits.
export function validateProjectileArea(attack){
 const rule=attack.projectileArea;if(rule===undefined)return;
 if(!rule||typeof rule!=='object'||Array.isArray(rule))throw Error('Use a projectile area definition.');
 if(attack.delivery!=='projectile'||attack.payload!=='damage'||attack.projectileLifetime===undefined||attack.projectileContact!=='single')throw Error('Impact areas require a single-contact independent damage projectile.');
 const bounds={width:[1,500],height:[1,500],duration:[1,600],interval:[1,300],hitLimit:[1,10],damage:[0,500]};
 for(const key of Object.keys(rule))if(!Object.hasOwn(bounds,key))throw Error('Unexpected projectile area setting: '+key);
 for(const [key,[min,max]] of Object.entries(bounds))if(!Number.isInteger(rule[key])||rule[key]<min||rule[key]>max)throw Error(`Area ${key} must be a whole number from ${min} to ${max}.`);
}
export function createImpactArea(attack,box,frame){
 validateProjectileArea(attack);if(!attack.projectileArea)throw Error('This projectile has no impact area.');
 if(!Number.isInteger(frame)||!box||![box.x,box.y,box.w,box.h].every(Number.isFinite))throw Error('Impact area needs a finite contact box and combat frame.');
 const rule={...attack.projectileArea};return {rule,start:frame+1,end:frame+1+rule.duration,box:{x:box.x+box.w/2-rule.width/2,y:box.y+box.h/2-rule.height/2,w:rule.width,h:rule.height,shape:'rectangle'},targets:new Map()};
}
export function claimAreaHit(area,target,frame,overlap){
 if(!overlap||frame<area.start||frame>=area.end)return false;
 const previous=area.targets.get(target)||{hits:0,last:-Infinity};
 if(previous.hits>=area.rule.hitLimit||frame-previous.last<area.rule.interval)return false;
 area.targets.set(target,{hits:previous.hits+1,last:frame});return true;
}
export const areaAlive=(area,frame)=>frame<area.end;

export const impactAreaAnchor=(boxes,groupId,hurt,fallback)=>boxes?.find(box=>box.groupId===groupId&&shapeHitsRectangle(box,hurt))??fallback;
