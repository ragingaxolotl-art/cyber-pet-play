// Preview node movement without changing the saved tree until release.
export function installTreeNodeDrag({handle,card,node,minY,zoom,redraw,commit}){
 let active=null;
 const paint=()=>{card.style.left=node.x+'px';card.style.top=node.y+'px';redraw();};
 function finish(canceled){
  if(!active)return;const start=active;active=null;
  handle.onpointermove=handle.onpointerup=handle.onpointercancel=handle.onlostpointercapture=null;
  document.removeEventListener('keydown',onKey);window.removeEventListener('blur',onBlur);
  if(canceled){node.x=start.nx;node.y=start.ny;paint();}
  else commit(node.x,Math.max(0,node.y+minY));
 }
 const onKey=event=>{if(event.key==='Escape'&&active){event.preventDefault();finish(true);}};
 const onBlur=()=>finish(true);
 handle.onpointerdown=event=>{
  if(event.button!==undefined&&event.button!==0)return;
  finish(true);event.preventDefault();
  active={x:event.clientX,y:event.clientY,nx:node.x,ny:node.y,zoom:zoom()};
  handle.setPointerCapture(event.pointerId);
  handle.onpointermove=next=>{
   if(!active)return;
   node.x=Math.max(0,Math.min(50000,active.nx+(next.clientX-active.x)/active.zoom));
   node.y=Math.max(0,Math.min(50000-minY,active.ny+(next.clientY-active.y)/active.zoom));paint();
  };
  handle.onpointerup=()=>finish(false);
  handle.onpointercancel=handle.onlostpointercapture=()=>finish(true);
  document.addEventListener('keydown',onKey);window.addEventListener('blur',onBlur);
 };
}
