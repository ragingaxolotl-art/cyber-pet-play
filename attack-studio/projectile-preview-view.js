import {visualFrame,visualOpacity,pathSample} from './attack-motion.js';
import {steeringVisualPosition} from './projectile-steering.js';

export function projectileVisualInstances(projectiles,effects,target) {
 return projectiles.flatMap(projectile => projectile.attack.visuals.flatMap((visual,index) => {
  const effect=effects.get(visual.effectId);if(!effect)return [];
  const impact=projectile.impact??Infinity;
  const frame=visualFrame(effect,visual,projectile.age,impact);if(frame<0)return [];
  const facing=projectile.box.facing??projectile.facing;
  const position=projectile.attached?{x:target.x+visual.x*facing,y:target.y+visual.y}:steeringVisualPosition({x:projectile.box.x+projectile.box.w/2,y:projectile.box.y+projectile.box.h/2},projectile.attack.box,visual,facing);
  const path=pathSample(projectile.attack,projectile.age);
  const directionAngle=visual.followPath?(projectile.splitRay?Math.atan2(projectile.splitRay.vy,Math.abs(projectile.splitRay.vx)):projectile.attack.motionPath?.length?Math.atan2(path.dy,path.dx):0):0;
  return [{index,projectileId:projectile.id,effect,visual,source:visual.frames?.[frame]??frame,...position,facing,
   angle:directionAngle-(visual.forwardAngle||0)*Math.PI/180,scaleX:visual.scale*(visual.stretchX??1),scaleY:visual.scale*(visual.stretchY??1),
   anchor:effect.anchor,size:effect.canvas,visible:true,opacity:visualOpacity(effect,visual,projectile.age,impact)}];
 }));
}
export function drawProjectileVisuals(ctx,instances,imageFor) {
 for(const item of instances){const {effect,source}=item,image=imageFor(effect.sheet||effect.frames[source]);
  if(!image.complete||!image.naturalWidth)continue;
  ctx.save();ctx.globalAlpha=item.opacity;ctx.translate(item.x,item.y);ctx.scale(item.facing,1);ctx.rotate(item.angle);ctx.scale(item.scaleX,item.scaleY);
  const [w,h]=item.size,[ax,ay]=item.anchor;
  if(effect.sheet)ctx.drawImage(image,source%effect.columns*w,Math.floor(source/effect.columns)*h,w,h,-ax,-ay,w,h);
  else ctx.drawImage(image,-ax,-ay,w,h);
  ctx.restore();
 }
}
