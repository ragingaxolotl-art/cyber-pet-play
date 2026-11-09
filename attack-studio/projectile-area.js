import {validateImpactAreaArt} from './impact-area-art.js?v=20261109-area-art';
import {shapeHitsRectangle,shapesOverlap} from './hitbox-shapes.js?v=20261109-rotation';
// Areas begin on the combat frame AFTER contact: impact never double-hits.
export function validateProjectileArea(attack,effectIds){
 const rule=attack.projectileArea;if(rule===undefined)return;
 if(!rule||typeof rule!=='object'||Array.isArray(rule))throw Error('Use a projectile area definition.');
 if(attack.delivery!=='projectile'||attack.payload!=='damage'||attack.projectileLifetime===undefined||attack.projectileContact!=='single')throw Error('Impact areas require a single-contact independent damage projectile.');
 validateImpactAreaArt(rule.visual,effectIds);
 const bounds={width:[1,500],height:[1,500],duration:[1,600],interval:[1,300],hitLimit:[1,10],damage:[0,500]};
 for(const key of Object.keys(rule))if(key!=='visual'&&key!=='blastFrames'&&!Object.hasOwn(bounds,key))throw Error('Unexpected projectile area setting: '+key);
 if(rule.blastFrames!==undefined&&(!Number.isInteger(rule.blastFrames)||rule.blastFrames<1||rule.blastFrames>rule.duration||rule.hitLimit!==1))throw Error('Explosions require one hit per target and expansion frames from 1 through the area lifetime.');
 for(const [key,[min,max]] of Object.entries(bounds))if(!Number.isInteger(rule[key])||rule[key]<min||rule[key]>max)throw Error(`Area ${key} must be a whole number from ${min} to ${max}.`);
}
export function createImpactArea(attack,box,frame){
 validateProjectileArea(attack);if(!attack.projectileArea)throw Error('This projectile has no impact area.');
 if(!Number.isInteger(frame)||!box||![box.x,box.y,box.w,box.h].every(Number.isFinite))throw Error('Impact area needs a finite contact box and combat frame.');
 const rule=structuredClone(attack.projectileArea);return {rule,start:frame+1,end:frame+1+rule.duration,box:{x:box.x+box.w/2-rule.width/2,y:box.y+box.h/2-rule.height/2,w:rule.width,h:rule.height,shape:'rectangle'},targets:new Map()};
}
export function claimAreaHit(area,target,frame,overlap){
 if(!overlap||frame<area.start||frame>=area.end)return false;
 const previous=area.targets.get(target)||{hits:0,last:-Infinity};
 if(previous.hits>=area.rule.hitLimit||frame-previous.last<area.rule.interval)return false;
 area.targets.set(target,{hits:previous.hits+1,last:frame});return true;
}
export const areaAlive=(area,frame)=>frame<area.end;

export const impactAreaAnchor=(boxes,groupId,hurt,fallback)=>boxes?.find(box=>box.groupId===groupId&&(Array.isArray(hurt)?hurt.some(region=>shapesOverlap(box,region)):shapeHitsRectangle(box,hurt)))??fallback;

// Keep the authored bounds immutable; expansion is sampled from the combat clock.
export function impactAreaBox(area,frame){
 const box=area.box;if(area.rule.blastFrames===undefined)return {...box};
 const progress=Math.max(0,Math.min(1,(frame-area.start+1)/area.rule.blastFrames));
 const w=box.w*progress,h=box.h*progress;
 return {x:box.x+(box.w-w)/2,y:box.y+(box.h-h)/2,w,h,shape:'ellipse'};
}

// Optional presentation data is detached from live area state for replay/scrubbing.
export function impactAreaView(area,frame){
 const box=impactAreaBox(area,frame);
 return area.rule.visual?{...box,visual:structuredClone(area.rule.visual),age:frame-area.start}:box;
}
