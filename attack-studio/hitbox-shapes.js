export function validateHitboxRotation(box){if(box.rotation!==undefined&&(!Number.isFinite(box.rotation)||box.rotation < -180||box.rotation > 180))throw Error('Hitbox rotation must be a number from -180 to 180 degrees.');}
// Shared geometry keeps preview outlines, dragging and combat contacts consistent.
// Positive degrees turn clockwise in the screen's downward-positive Y axis.
// World-space facing transforms must mirror the authored angle separately.
export function rotatePoint(box,point,inverse=false){
 const angle=(box.rotation||0)*Math.PI/180*(inverse?-1:1),c=Math.cos(angle),s=Math.sin(angle),cx=box.x+box.w/2,cy=box.y+box.h/2,dx=point.x-cx,dy=point.y-cy;
 return {x:cx+c*dx-s*dy,y:cy+s*dx+c*dy};
}
export function shapeBounds(box){
 if(!box.rotation)return {x:box.x,y:box.y,w:box.w,h:box.h};
 if(box.shape==='ellipse'){
  const angle=box.rotation*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle),rx=box.w/2,ry=box.h/2,ex=Math.hypot(rx*c,ry*s),ey=Math.hypot(rx*s,ry*c);
  return {x:box.x+rx-ex,y:box.y+ry-ey,w:2*ex,h:2*ey};
 }
 const points=shapePoints(box),xs=points.map(p=>p.x),ys=points.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys);
 return {x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y};
}
export const HITBOX_SHAPES=['rectangle','ellipse','diamond','triangle'];
export function shapePoints(box){
 const {x,y,w,h}=box;
 let points=box.shape==='diamond'?[[.5,0],[1,.5],[.5,1],[0,.5]]:box.shape==='triangle'?[[0,0],[1,.5],[0,1]]:[[0,0],[1,0],[1,1],[0,1]];
 if(box.shape==='triangle'&&box.facing===-1)points=points.map(([px,py])=>[1-px,py]);
 return points.map(([px,py])=>rotatePoint(box,{x:x+px*w,y:y+py*h}));
}
export function containsPoint(box,p){
 if(box.shape==='ellipse'){p=rotatePoint(box,p,true);const dx=(p.x-box.x-box.w/2)/(box.w/2),dy=(p.y-box.y-box.h/2)/(box.h/2);return dx*dx+dy*dy<=1;}
 const points=shapePoints(box);let positive=false,negative=false;
 for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],cross=(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);positive ||= cross>0;negative ||= cross<0;}
 return !(positive&&negative);
}
export function shapeHitsRectangle(box,target){
 if(box.rotation||target.rotation)return shapesOverlap(box,{...target,shape:'rectangle'});
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
 const ab=shapeBounds(a),bb=shapeBounds(b);
 if(ab.x>=bb.x+bb.w||ab.x+ab.w<=bb.x||ab.y>=bb.y+bb.h||ab.y+ab.h<=bb.y)return false;
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
 const points=polygon.map(p=>{const local=rotatePoint(ellipse,p,true);return {x:(local.x-cx)/(ellipse.w/2),y:(local.y-cy)/(ellipse.h/2)};});
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
 // Affine transformation preserves an ellipse; no polygon approximation is used.
 // Transform B into A's unit-circle space, then diagonalize its ellipse.
 const angleA=(a.rotation||0)*Math.PI/180,angleB=(b.rotation||0)*Math.PI/180,delta=angleB-angleA,c=Math.cos(delta),s=Math.sin(delta),ax=a.w/2,ay=a.h/2;
 const center=rotatePoint(a,{x:b.x+b.w/2,y:b.y+b.h/2},true),ux=(center.x-a.x-ax)/ax,uy=(center.y-a.y-ay)/ay;
 const m00=c*b.w/2/ax,m01=-s*b.h/2/ax,m10=s*b.w/2/ay,m11=c*b.h/2/ay;
 const q00=m00*m00+m01*m01,q01=m00*m10+m01*m11,q11=m10*m10+m11*m11;
 const angle=.5*Math.atan2(2*q01,q00-q11),ec=Math.cos(angle),es=Math.sin(angle);
 const xx=q00*ec*ec+2*q01*ec*es+q11*es*es,yy=q00*es*es-2*q01*ec*es+q11*ec*ec;
 const cx=ec*ux+es*uy,cy=-es*ux+ec*uy,rx=Math.sqrt(xx),ry=Math.sqrt(yy);
 if(cx*cx/xx+cy*cy/yy<=1)return true;
 const equation=lambda=>xx*cx*cx/(lambda+xx)**2+yy*cy*cy/(lambda+yy)**2;
 let low=0,high=Math.max(1,Math.abs(rx*cx)+Math.abs(ry*cy));
 while(equation(high)>1)high*=2;
 for(let i=0;i<64;i++){const mid=(low+high)/2;if(equation(mid)>1)low=mid;else high=mid;}
 const lambda=(low+high)/2;
 return (lambda*cx/(lambda+xx))**2+(lambda*cy/(lambda+yy))**2<1-1e-12;
}
export function hitboxResizeHandles(box){
 return [{kind:'width',x:box.x+box.w,y:box.y+box.h/2},{kind:'height',x:box.x+box.w/2,y:box.y+box.h},{kind:'size',x:box.x+box.w,y:box.y+box.h}].map(p=>({...p,...rotatePoint(box,p)}));
}
export function resizeHitbox(original,dx,dy,handle,facing){
 if(original.rotation){
  const angle=original.rotation*facing*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
  const localX=c*dx+s*dy,localY=-s*dx+c*dy;
  const dw=handle==='height'?0:Math.max(1,Math.min(500,original.w+localX))-original.w;
  const dh=handle==='width'?0:Math.max(1,Math.min(500,original.h+localY))-original.h;
  // Keep the opposite local corner fixed while the center moves with resizing.
  const shiftX=facing*(c*dw-s*dh)/2-dw/2,shiftY=(s*dw+c*dh)/2-dh/2;
  let fraction=1;
  for(const [start,delta] of [[original.x,shiftX],[original.y,shiftY]])if(delta)fraction=Math.min(fraction,(delta>0?500-start:-500-start)/delta);
  fraction=Math.max(0,fraction);
  return {...original,x:original.x+shiftX*fraction,y:original.y+shiftY*fraction,w:original.w+dw*fraction,h:original.h+dh*fraction};
 }

 const next={...original},bound=n=>Math.max(1,Math.min(500,n));
 if(handle!=='height'){next.w=bound(original.w+dx);if(facing===-1){next.x=original.x+original.w-next.w;if(next.x < -500){next.x=-500;next.w=original.x+original.w+500;}if(next.x>500){next.x=500;next.w=original.x+original.w-500;}}}
 if(handle!=='width')next.h=bound(original.h+dy);
 return next;
}
