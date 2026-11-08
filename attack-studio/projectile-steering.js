// Fixed 60 Hz movement in world-space projectile-center coordinates.
// Combat callers own spawn/lifetime, collision damage, ownership and target choice.
export const STEERING_LIMITS=Object.freeze({catchRadius:12,maxTurn:180,maxReturnFrames:600});
const finitePoint=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
export function validateProjectileSteering(rule){
 if(rule===undefined)return;
 if(!rule||typeof rule!=='object'||Array.isArray(rule)||!['homing','return'].includes(rule.mode))throw Error('Choose homing or return projectile steering.');
 const keys=rule.mode==='return'?['mode','turnRate','returnAfter']:['mode','turnRate'];
 if(Object.keys(rule).length!==keys.length||Object.keys(rule).some(k=>!keys.includes(k)))throw Error('Unexpected projectile steering settings.');
 if(!Number.isInteger(rule.turnRate)||rule.turnRate<1||rule.turnRate>180)throw Error('Turn rate must be 1–180 degrees per combat frame.');
 if(rule.mode==='return'&&(!Number.isInteger(rule.returnAfter)||rule.returnAfter<1||rule.returnAfter>600))throw Error('Return delay must be 1–600 combat frames.');
}
export function createSteeringState(origin,facing,frame){
 if(!finitePoint(origin)||![1,-1].includes(facing)||!Number.isInteger(frame))throw Error('Steering needs a position, facing and combat frame.');
 return {x:origin.x,y:origin.y,angle:facing===1?0:Math.PI,spawnFrame:frame,lastFrame:frame,phase:'outbound',caught:false};
}
const wrap=angle=>Math.atan2(Math.sin(angle),Math.cos(angle));
function segmentDistanceSquared(a,b,p){
 const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
 const t=length?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/length)):0;
 return (p.x-a.x-t*dx)**2+(p.y-a.y-t*dy)**2;
}
export function advanceSteering(state,rule,speed,frame,target,owner){
 validateProjectileSteering(rule);
 if(!rule||!Number.isFinite(speed)||speed<0||speed>12||!Number.isInteger(frame)||!finitePoint(target)||!finitePoint(owner))throw Error('Invalid projectile steering step.');
 // Multiple collision queries or presentation holds must not move twice.
 if(frame===state.lastFrame||state.caught)return state;
 if(frame!==state.lastFrame+1)throw Error('Advance steering once per consecutive combat frame.');
 const returning=rule.mode==='return'&&frame-state.spawnFrame>=rule.returnAfter;
 const aim=returning?owner:rule.mode==='homing'?target:null;
 let angle=state.angle;
 if(aim&&(aim.x!==state.x||aim.y!==state.y)){
  const delta=wrap(Math.atan2(aim.y-state.y,aim.x-state.x)-angle),limit=rule.turnRate*Math.PI/180;
  angle=wrap(angle+Math.max(-limit,Math.min(limit,delta)));
 }
 const next={x:state.x+Math.cos(angle)*speed,y:state.y+Math.sin(angle)*speed};
 const caught=returning&&segmentDistanceSquared(state,next,owner)<=STEERING_LIMITS.catchRadius**2;
 Object.assign(state,next,{angle,lastFrame:frame,phase:returning?'returning':rule.mode==='homing'?'homing':'outbound',caught});
 return state;
}
// Reflection preserves position, travel age and return deadline. The caller
// supplies the new owner and opponent on subsequent steps.
export function reflectSteering(state){state.angle=wrap(Math.PI-state.angle);return state;}

// Preserve the authored VFX-to-hitbox offset as the collision center steers.
// Reflection mirrors horizontal offsets; attachment placement remains caller-owned.
export function steeringVisualPosition(state,box,visual,direction=1){
 return {x:state.x+direction*(visual.x-box.x-box.w/2),y:state.y+visual.y-box.y-box.h/2};
}
