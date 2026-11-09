// Ballistic movement uses world-space pixels and 60 Hz combat frames.
// One movement authority per projectile: ballistic flight, steering or a path.
export const FLIGHT_LIMITS=Object.freeze({acceleration:1,gravity:1,speed:12,range:3000});
const finite=(value,min,max)=>Number.isFinite(value)&&value>=min&&value<=max;
export function validateProjectileFlight(attack){
 const rule=attack.projectileFlight;if(rule===undefined)return;
 if(!rule||typeof rule!=='object'||Array.isArray(rule)||Object.keys(rule).some(key=>!['angle','acceleration','gravity','range'].includes(key)))throw Error('Use angle, acceleration, gravity and range for projectile flight.');
 if(attack.delivery!=='projectile'||attack.projectileLifetime===undefined)throw Error('Ballistic flight requires an independent projectile lifetime.');
 if(attack.projectileSteering||attack.motionPath?.length)throw Error('Choose ballistic flight, steering or an authored path.');
 if(!finite(rule.angle,-180,180)||!finite(rule.acceleration,-1,1)||!finite(rule.gravity,-1,1)||!finite(rule.range,1,FLIGHT_LIMITS.range))throw Error('Flight needs angle −180–180°, acceleration/gravity −1–1 px/frame², and range 1–3000 px.');
}
export function createFlightState(origin,facing,speed,rule,frame){
 if(!origin||!Number.isFinite(origin.x)||!Number.isFinite(origin.y)||![1,-1].includes(facing)||!finite(speed,0,FLIGHT_LIMITS.speed)||!Number.isInteger(frame))throw Error('Flight needs a finite position, facing, speed and combat frame.');
 if(rule===undefined)throw Error('Choose a projectile flight rule.');
 validateProjectileFlight({delivery:'projectile',projectileLifetime:1,projectileFlight:rule});
 const radians=rule.angle*Math.PI/180,dx=Math.cos(radians)*facing,dy=Math.sin(radians);
 return {x:origin.x,y:origin.y,vx:dx*speed,vy:dy*speed,ax:dx*rule.acceleration,ay:dy*rule.acceleration+rule.gravity,distance:0,range:rule.range,lastFrame:frame,expired:false};
}
export function advanceFlight(state,frame){
 if(!Number.isInteger(frame))throw Error('Use a whole combat frame.');
 if(frame===state.lastFrame||state.expired)return state;
 if(frame!==state.lastFrame+1)throw Error('Advance flight once per consecutive combat frame.');
 let vx=state.vx+state.ax,vy=state.vy+state.ay;
 const speed=Math.hypot(vx,vy);if(speed>FLIGHT_LIMITS.speed){vx*=FLIGHT_LIMITS.speed/speed;vy*=FLIGHT_LIMITS.speed/speed;}
 const length=Math.hypot(vx,vy),remaining=Math.max(0,state.range-state.distance),step=Math.min(length,remaining),ratio=length?step/length:0;
 Object.assign(state,{x:state.x+vx*ratio,y:state.y+vy*ratio,vx,vy,distance:state.distance+step,lastFrame:frame,expired:length>=remaining});
 return state;
}
// Ownership changes do not renew travel range or combat age. Gravity stays down.
export function reflectFlight(state){state.vx=-state.vx;state.ax=-state.ax;return state;}
