import {shapePoints} from './hitbox-shapes.js?v=20261109-rotation';
// Draw the collision shape, rather than its unrotated enclosing rectangle.
export function traceHitbox(ctx,box,ground=0){
 ctx.beginPath();
 if(box.shape==='ellipse')ctx.ellipse(box.x+box.w/2,ground+box.y+box.h/2,box.w/2,box.h/2,(box.rotation||0)*Math.PI/180,0,Math.PI*2);
 else {const points=shapePoints(box);ctx.moveTo(points[0].x,ground+points[0].y);for(const p of points.slice(1))ctx.lineTo(p.x,ground+p.y);ctx.closePath();}
}
