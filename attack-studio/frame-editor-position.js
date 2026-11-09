// Rebuilding a strip must not send a designer back to its first frame.
export function rememberFrameEditorPosition(strip,parent){
 const left=strip.scrollLeft,ancestors=[];
 for(let node=parent;node;node=node.parentElement)ancestors.push({node,top:node.scrollTop,left:node.scrollLeft});
 const active=document.activeElement,tile=active?.closest?.('.frame-tile');
 const tileIndex=[...strip.children].indexOf(tile);
 const controlIndex=tile?[...tile.querySelectorAll('button,select,input')].indexOf(active):-1;
 return nextStrip=>{
  if(!nextStrip)return;
  if(tileIndex>=0&&controlIndex>=0){
   const nextTile=nextStrip.children[Math.min(tileIndex,nextStrip.children.length-1)];
   const control=nextTile?.querySelectorAll('button,select,input')[controlIndex];
   if(control&&!control.disabled)control.focus({preventScroll:true});
  }
  // Browsers clamp to the new end if deletion shortened the strip.
  nextStrip.scrollLeft=left;
  for(const {node,top,left} of ancestors){node.scrollTop=top;node.scrollLeft=left;}
 };
}
