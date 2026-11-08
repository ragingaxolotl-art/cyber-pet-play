import {activeEnd} from './contact-timing.js?v=20261108-durability';

// Classroom safety bounds; lifetime uses 60 Hz simulation frames from launch.
export const PROJECTILE_LIMITS=Object.freeze({perOwner:16,lifetime:600});
export function validateProjectileLifetime(attack){
 if(attack.projectileDurability!==undefined){
  if(attack.projectileLifetime===undefined)throw Error('Projectile durability requires independent lifetime.');
  if(!Number.isInteger(attack.projectileDurability)||attack.projectileDurability<1||attack.projectileDurability>10)throw Error('Projectile durability must be 1–10 whole points.');
 }
 if(attack.projectileLifetime===undefined)return;
 if(attack.delivery!=='projectile'||!['damage','push'].includes(attack.payload))throw Error('Independent lifetime requires a damage or push projectile.');
 if(!Number.isInteger(attack.projectileLifetime)||attack.projectileLifetime<1||attack.projectileLifetime>PROJECTILE_LIMITS.lifetime)throw Error('Projectile lifetime must be 1–600 frames.');
 if(attack.projectileStart!==undefined&&attack.projectileStart!==attack.startup)throw Error('Independent projectiles must start traveling at startup.');
}
export const ownerActionEnd=(cast)=>cast.projectileLaunched||cast.a.projectileLifetime!==undefined?cast.tm.startup+cast.tm.active+cast.tm.recovery:null;
export class ProjectileRegistry{
 constructor(){this.entries=[];this.nextId=1;}
 launch(owner,target,cast,frame,lifetime){
  if(!cast||cast.a.delivery!=='projectile')throw Error('Only a projectile cast can launch.');
  if(!Number.isInteger(lifetime)||lifetime<1||lifetime>PROJECTILE_LIMITS.lifetime)throw Error('Projectile lifetime must be 1–600 frames.');
  if(!Number.isInteger(frame))throw Error('Projectile launch requires a simulation frame.');
  if(frame-cast.start>=activeEnd(cast.impact,cast.tm))throw Error('Projectile active window has ended.');
  if(frame<cast.start+cast.tm.startup)throw Error('Projectile startup has not finished.');
  if(cast.projectileLaunched)throw Error('This cast already launched its projectile.');
  if(owner.hp<=0||target.hp<=0)throw Error('Projectile requires living fighters.');
  if(this.entries.filter(p=>p.owner===owner).length>=PROJECTILE_LIMITS.perOwner)throw Error('Projectile limit reached.');
  const entity={id:this.nextId++,owner,target,cast,durability:cast.a.projectileDurability,spawnFrame:frame,expires:frame+lifetime};
  this.entries.push(entity);cast.projectileLaunched=true;return entity;
 }
 remove(entity){this.entries=this.entries.filter(p=>p!==entity);}
 prune(frame){this.entries=this.entries.filter(p=>frame<p.expires&&p.owner.hp>0&&p.target.hp>0&&!p.cast.sequence?.cancelled&&frame-p.cast.start<activeEnd(p.cast.impact,p.cast.tm));}
 clear(){this.entries=[];}
}
