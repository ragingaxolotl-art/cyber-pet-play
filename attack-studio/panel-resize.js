// Resize a panel without floating it or changing attack history.
export function installPanelResize({edge,shell,state,allowed,show,commit}){
 let gesture=null;
 const fit=height=>Math.round(Math.max((shell.querySelector('.workspace-panel-bar')?.offsetHeight||60)+124,Math.min(1200,height)));
 const apply=height=>{state[state.floating?'h':'dockHeight']=fit(height);show();};
 const finish=cancel=>{
  if(!gesture)return;
  const before=gesture;gesture=null;
  if(cancel){state.h=before.h;state.dockHeight=before.dockHeight;show();}
  // Clear the gesture before releasing capture: lostpointercapture may fire synchronously.
  try{edge.releasePointerCapture?.(before.id);}catch{}
  if(before.moved)commit();
 };
 edge.onpointerdown=e=>{
  if(gesture||!allowed()||state.collapsed||e.button!==0)return;
  e.preventDefault();edge.focus({preventScroll:true});gesture={id:e.pointerId,y:e.clientY,height:shell.getBoundingClientRect().height,h:state.h,dockHeight:state.dockHeight,moved:false};edge.setPointerCapture(e.pointerId);
 };
 edge.onpointermove=e=>{
  if(!gesture||e.pointerId!==undefined&&e.pointerId!==gesture.id)return;
  const delta=e.clientY-gesture.y;if(!gesture.moved&&Math.abs(delta)<4)return;
  gesture.moved=true;apply(gesture.height+delta);
 };
 edge.onpointerup=e=>{if(gesture&&(e.pointerId===undefined||e.pointerId===gesture.id))finish(false);};
 edge.onpointercancel=edge.onlostpointercapture=e=>{if(gesture&&(e.pointerId===undefined||e.pointerId===gesture.id))finish(true);};
 const pinKey=edge.onkeydown;
 edge.onkeydown=e=>{
  if(e.key==='Escape'&&gesture){e.preventDefault();finish(true);return;}
  if(gesture&&['ArrowUp','ArrowDown','Home','Enter',' '].includes(e.key)){e.preventDefault();return;}
  if(!['ArrowUp','ArrowDown','Home'].includes(e.key)){pinKey?.(e);return;}
  if(!allowed()||state.collapsed)return;e.preventDefault();
  if(e.key==='Home'){if(state.floating)state.h=400;else state.dockHeight=null;show();}
  else apply(shell.getBoundingClientRect().height+(e.key==='ArrowDown'?20:-20));
  commit();
 };
}
