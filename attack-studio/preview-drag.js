// Hit-test the same transformed artwork rectangle that the preview draws.
export function effectDragHit(point,visual,handleRadius=8){
 const dx=point.x-visual.x,dy=point.y-visual.y;
 if(Math.hypot(dx,dy)<=handleRadius)return true;
 if(!visual.visible)return false;
 const x=dx*visual.facing,y=dy,c=Math.cos(visual.angle),s=Math.sin(visual.angle);
 const localX=(x*c+y*s)/visual.scaleX,localY=(-x*s+y*c)/visual.scaleY;
 return localX>=-visual.anchor[0]&&localX<=visual.size[0]-visual.anchor[0]&&localY>=-visual.anchor[1]&&localY<=visual.size[1]-visual.anchor[1];
}
export function attackerDragPlacement(origin,targetX,delta){
 // Keep the attacker grounded and both the viewport and test distance bounded.
 const shift=Math.max((45-origin)/3,targetX-245,Math.min((915-origin)/3,targetX+245,delta));
 return {origin:origin+shift*3,targetX:targetX-shift};
}
