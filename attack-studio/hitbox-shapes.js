// Shared geometry keeps preview outlines, dragging and combat contacts consistent.
export const HITBOX_SHAPES=['rectangle','ellipse','diamond','triangle'];
export function shapePoints(box){
 const {x,y,w,h}=box;
 let points=box.shape==='diamond'?[[.5,0],[1,.5],[.5,1],[0,.5]]:box.shape==='triangle'?[[0,0],[1,.5],[0,1]]:[[0,0],[1,0],[1,1],[0,1]];
 if(box.shape==='triangle'&&box.facing===-1)points=points.map(([px,py])=>[1-px,py]);
 return points.map(([px,py])=>({x:x+px*w,y:y+py*h}));
}
export function containsPoint(box,p){
 if(box.shape==='ellipse'){const dx=(p.x-box.x-box.w/2)/(box.w/2),dy=(p.y-box.y-box.h/2)/(box.h/2);return dx*dx+dy*dy<=1;}
 const points=shapePoints(box);let positive=false,negative=false;
 for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],cross=(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);positive ||= cross>0;negative ||= cross<0;}
 return !(positive&&negative);
}
export function shapeHitsRectangle(box,target){
 if(box.x>=target.x+target.w||box.x+box.w<=target.x||box.y>=target.y+target.h||box.y+box.h<=target.y)return false;
 if(box.shape==='ellipse'){
  const cx=box.x+box.w/2,cy=box.y+box.h/2;
  const nearX=Math.max(target.x,Math.min(target.x+target.w,cx)),nearY=Math.max(target.y,Math.min(target.y+target.h,cy));
  return ((nearX-cx)/(box.w/2))**2+((nearY-cy)/(box.h/2))**2<1;
 }
 const a=shapePoints(box),b=shapePoints({...target,shape:'rectangle'});
 // Separating-axis test for two convex polygons. Touching edges alone are not a hit.
 for(const polygon of [a,b])for(let i=0;i<polygon.length;i++){
  const p=polygon[i],q=polygon[(i+1)%polygon.length],axis={x:-(q.y-p.y),y:q.x-p.x};
  const ap=a.map(p=>p.x*axis.x+p.y*axis.y),bp=b.map(p=>p.x*axis.x+p.y*axis.y);
  if(Math.max(...ap)<=Math.min(...bp)||Math.max(...bp)<=Math.min(...ap))return false;
 }
 return true;
}
export function resizeHitbox(original,dx,dy,handle,facing){
 const next={...original},bound=n=>Math.max(1,Math.min(500,n));
 if(handle!=='height'){next.w=bound(original.w+dx);if(facing===-1){next.x=original.x+original.w-next.w;if(next.x < -500){next.x=-500;next.w=original.x+original.w+500;}if(next.x>500){next.x=500;next.w=original.x+original.w-500;}}}
 if(handle!=='width')next.h=bound(original.h+dy);
 return next;
}
