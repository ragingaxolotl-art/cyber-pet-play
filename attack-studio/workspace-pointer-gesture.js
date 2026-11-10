// One pointer owns a workspace drag. Cancellation restores the caller's snapshot;
// it must not become a new layout edit or discard an existing Redo.
export function installWorkspacePointerGesture({target,allowed,start,keyboard}){
 let gesture=null,retainingCapture=false;
 const matches=e=>gesture&&(e?.pointerId===undefined||e.pointerId===gesture.id);
 function finish(cancel){
  if(!gesture)return;
  const current=gesture;gesture=null;
  try{current.actions.finish(cancel);}finally{
   if(target.hasPointerCapture?.(current.id))target.releasePointerCapture(current.id);
  }
 }
 function retainCapture(action){
  retainingCapture=true;
  try{action();if(gesture){target.setPointerCapture(gesture.id);target.focus({preventScroll:true});}}
  finally{retainingCapture=false;}
 }
 target.onpointerdown=e=>{
  if(gesture||!allowed()||e.button!==0||e.isPrimary===false)return;
  e.preventDefault();target.focus({preventScroll:true});
  gesture={id:e.pointerId,actions:start(e,retainCapture)};
  target.setPointerCapture(e.pointerId);
 };
 target.onpointermove=e=>{if(matches(e))gesture.actions.move(e);};
 target.onpointerup=e=>{if(matches(e))finish(false);};
 target.onpointercancel=e=>{if(matches(e))finish(true);};
 target.onlostpointercapture=e=>{
  // Reparenting a floating panel may queue an old capture-loss notification.
  if(matches(e)&&!retainingCapture&&!target.hasPointerCapture?.(gesture.id))finish(true);
 };
 target.onkeydown=e=>{
  if(gesture){if(e.key==='Escape'){e.preventDefault();finish(true);}return;}
  keyboard?.(e);
 };
 return {get active(){return !!gesture;}};
}
