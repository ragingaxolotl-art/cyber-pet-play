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
// Strict area overlap for two authored hitboxes. Used by projectile interactions;
// the established shape-vs-hurtbox path above keeps its existing contact behavior.
export function shapesOverlap(a,b){
 if(a.x>=b.x+b.w||a.x+a.w<=b.x||a.y>=b.y+b.h||a.y+a.h<=b.y)return false;
 if(a.shape==='ellipse'&&b.shape==='ellipse')return ellipsesOverlap(a,b);
 if(a.shape==='ellipse')return ellipsePolygonOverlap(a,shapePoints(b));
 if(b.shape==='ellipse')return ellipsePolygonOverlap(b,shapePoints(a));
 const first=shapePoints(a),second=shapePoints(b);
 for(const polygon of [first,second])for(let i=0;i<polygon.length;i++){
  const p=polygon[i],q=polygon[(i+1)%polygon.length],axis={x:p.y-q.y,y:q.x-p.x};
  const one=first.map(v=>v.x*axis.x+v.y*axis.y),two=second.map(v=>v.x*axis.x+v.y*axis.y);
  if(Math.max(...one)<=Math.min(...two)||Math.max(...two)<=Math.min(...one))return false;
 }
 return true;
}
function ellipsePolygonOverlap(ellipse,polygon){
 // Normalize the ellipse to a unit circle, retaining straight polygon edges.
 const cx=ellipse.x+ellipse.w/2,cy=ellipse.y+ellipse.h/2;
 const points=polygon.map(p=>({x:(p.x-cx)/(ellipse.w/2),y:(p.y-cy)/(ellipse.h/2)}));
 let positive=false,negative=false;
 for(let i=0;i<points.length;i++){
  const p=points[i],q=points[(i+1)%points.length],dx=q.x-p.x,dy=q.y-p.y;
  const cross=dx*(-p.y)-dy*(-p.x);positive ||= cross>0;negative ||= cross<0;
  const length=dx*dx+dy*dy,t=length?Math.max(0,Math.min(1,-(p.x*dx+p.y*dy)/length)):0;
  if((p.x+t*dx)**2+(p.y+t*dy)**2<1-1e-12)return true;
 }
 return !(positive&&negative); // Circle center lies inside the polygon.
}
function ellipsesOverlap(a,b){
 // In a's normalized space, find the closest point of b to the unit-circle center.
 // Axis-aligned scaling preserves b as an ellipse; no polygon approximation is used.
 const cx=(b.x+b.w/2-a.x-a.w/2)/(a.w/2),cy=(b.y+b.h/2-a.y-a.h/2)/(a.h/2);
 const rx=b.w/a.w,ry=b.h/a.h,xx=rx*rx,yy=ry*ry;
 if(cx*cx/xx+cy*cy/yy<=1)return true;
 const equation=lambda=>xx*cx*cx/(lambda+xx)**2+yy*cy*cy/(lambda+yy)**2;
 let low=0,high=Math.max(1,Math.abs(rx*cx)+Math.abs(ry*cy));
 while(equation(high)>1)high*=2;
 for(let i=0;i<64;i++){const mid=(low+high)/2;if(equation(mid)>1)low=mid;else high=mid;}
 const lambda=(low+high)/2;
 return (lambda*cx/(lambda+xx))**2+(lambda*cy/(lambda+yy))**2<1-1e-12;
}
export function resizeHitbox(original,dx,dy,handle,facing){
 const next={...original},bound=n=>Math.max(1,Math.min(500,n));
 if(handle!=='height'){next.w=bound(original.w+dx);if(facing===-1){next.x=original.x+original.w-next.w;if(next.x < -500){next.x=-500;next.w=original.x+original.w+500;}if(next.x>500){next.x=500;next.w=original.x+original.w-500;}}}
 if(handle!=='width')next.h=bound(original.h+dy);
 return next;
}
