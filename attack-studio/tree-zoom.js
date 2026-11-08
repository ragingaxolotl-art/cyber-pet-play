export const clampZoom=value=>Math.max(.25,Math.min(2,value));
export function installTreeZoom($){
 const viewport=$('viewport'),board=$('board'),picker=$('zoom');let zoom=1,gesture=null;
 function setZoom(value,x=viewport.clientWidth/2,y=viewport.clientHeight/2){
  const next=clampZoom(value),worldX=(viewport.scrollLeft+x)/zoom,worldY=(viewport.scrollTop+y)/zoom;
  zoom=next;board.style.zoom=String(zoom);
  let option=picker.querySelector('[data-custom]');if(!option){option=new Option();option.dataset.custom='true';picker.add(option);}
  option.value=String(zoom);option.textContent=Math.round(zoom*100)+'%';picker.value=String(zoom);
  viewport.scrollLeft=worldX*zoom-x;viewport.scrollTop=worldY*zoom-y;
 }
 picker.onchange=()=>setZoom(Number(picker.value));$('zoomIn').onclick=()=>setZoom(zoom*1.2);$('zoomOut').onclick=()=>setZoom(zoom/1.2);$('zoomReset').onclick=()=>setZoom(1);
 viewport.addEventListener('wheel',event=>{if(!event.ctrlKey)return;event.preventDefault();const r=viewport.getBoundingClientRect();setZoom(zoom*Math.exp(-event.deltaY*.01),event.clientX-r.left,event.clientY-r.top);},{passive:false});
 const points=new Map();let movingCard=false;
 viewport.addEventListener('pointerdown',event=>{
  if(event.pointerType==='mouse'&&event.button!==0)return;
  points.set(event.pointerId,{x:event.clientX,y:event.clientY});
  if(points.size===1){movingCard=!!event.target.closest('.node,button,.edge-hit');gesture={x:event.clientX,y:event.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};if(!movingCard)viewport.setPointerCapture(event.pointerId);}
  if(points.size===2){movingCard=false;const [a,b]=[...points.values()];gesture={distance:Math.hypot(a.x-b.x,a.y-b.y),zoom};event.preventDefault();event.stopImmediatePropagation();}
 },true);
 viewport.addEventListener('pointermove',event=>{
  if(!points.has(event.pointerId))return;points.set(event.pointerId,{x:event.clientX,y:event.clientY});
  if(points.size>=2){event.preventDefault();event.stopImmediatePropagation();const [a,b]=[...points.values()],r=viewport.getBoundingClientRect();if(gesture?.distance)setZoom(gesture.zoom*Math.hypot(a.x-b.x,a.y-b.y)/gesture.distance,(a.x+b.x)/2-r.left,(a.y+b.y)/2-r.top);}
  else if(!movingCard&&gesture){viewport.scrollLeft=gesture.left+gesture.x-event.clientX;viewport.scrollTop=gesture.top+gesture.y-event.clientY;}
 },true);
 function end(event){points.delete(event.pointerId);gesture=null;if(points.size===1){const a=[...points.values()][0];gesture={x:a.x,y:a.y,left:viewport.scrollLeft,top:viewport.scrollTop};}}
 for(const type of ['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(type,end,true);
}
