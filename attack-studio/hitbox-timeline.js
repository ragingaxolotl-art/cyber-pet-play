// View state stays separate from attack data and survives editor rerenders.
const timelineViews=new WeakMap();
const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
export function adjustWindow(box,delta,mode,frames){
 delta=Math.round(delta);
 if(mode==='resize'&&box.lockDuration)return {...box};
 if(mode==='resize')return {...box,duration:Math.max(1,Math.min(frames-box.start,box.duration+delta))};
 if(box.lockStart)return {...box};
 return {...box,start:Math.max(box.minStart??0,Math.min(box.maxStart??Infinity,frames-box.duration,box.start+delta))};
}
export function renderHitboxTimeline({root,groups,frames,commit,title='Hitbox timing tracks',clockLabel='Active frames',onError=()=>{}}){
 const timeline=el('div');timeline.className='group-timeline';timeline.setAttribute('aria-label',title);
 timeline.append(el('p',`${clockLabel} 0–${frames-1}. Drag a bar to move it; drag its end to resize. Arrow keys move one frame; Shift + arrow resizes.`));
 let views=timelineViews.get(root);if(!views){views=new Map();timelineViews.set(root,views);}
 let view=views.get(title);if(!view){view={zoom:1,scroll:0};views.set(title,view);}
 const tools=el('div'),zoomLabel=el('label','Timeline zoom '),zoom=el('select'),fit=el('button','Fit timeline');
 zoom.setAttribute('aria-label',title+' zoom');for(const factor of [1,2,4,8])zoom.add(new Option(factor+'×',factor));zoom.value=String(view.zoom);fit.type='button';
 const viewport=el('div'),content=el('div');viewport.className='timeline-viewport';viewport.style.overflowX='auto';content.style.width=view.zoom*100+'%';content.style.minWidth='100%';
 viewport.setAttribute('aria-label',title+' scroll area');viewport.tabIndex=0;
 zoom.onchange=()=>{const value=Number(zoom.value);if(![1,2,4,8].includes(value))return;view.zoom=value;content.style.width=value*100+'%';};
 fit.onclick=()=>{view.zoom=1;view.scroll=0;zoom.value='1';content.style.width='100%';viewport.scrollLeft=0;};
 viewport.addEventListener('scroll',()=>{view.scroll=viewport.scrollLeft;});zoomLabel.append(zoom);tools.append(zoomLabel,fit);timeline.append(tools);viewport.append(content);timeline.append(viewport);
 view.locked??=new Set();view.hidden??=new Set();
 const trackOptions=el('details'),summary=el('summary','Track visibility and locks');trackOptions.append(summary);timeline.append(trackOptions);
 const rowsByGroup=new Map(),controlsByGroup=new Map();
 for(const [index,group] of groups.entries()){
  const name=({sequence:'Hit sequence',animation:'Animation',effects:'Visual effects',movement:'Movement',defense:'Block / dodge',armor:'Defense windows',cancels:'Follow-ups'})[group.id]||'Hitbox group '+(index+1);
  const options=el('div'),show=el('input'),lock=el('input');show.type=lock.type='checkbox';show.checked=!view.hidden.has(group.id);lock.checked=view.locked.has(group.id);
  show.setAttribute('aria-label','Show '+name+' track');lock.setAttribute('aria-label','Lock '+name+' track');
  const showLabel=el('label',name+' · show '),lockLabel=el('label',' lock ');showLabel.append(show);lockLabel.append(lock);options.append(showLabel,lockLabel);trackOptions.append(options);
  show.onchange=()=>{show.checked?view.hidden.delete(group.id):view.hidden.add(group.id);for(const row of rowsByGroup.get(group.id)||[])row.hidden=!show.checked;};
  lock.onchange=()=>{lock.checked?view.locked.add(group.id):view.locked.delete(group.id);for(const {bar,end,box} of controlsByGroup.get(group.id)||[]){bar.disabled=lock.checked;end.disabled=lock.checked||!!box.lockDuration;}};
 }


 groups.forEach((group,gi)=>group.boxes.forEach((box,bi)=>{
  const row=el('div');row.className='group-timeline-row';const label=el('span',box.label||`G${gi+1} · Box ${bi+1}`),track=el('div');track.className='group-timeline-track';
  const bar=el('button'),end=el('button','↔');bar.type=end.type='button';bar.className='group-timeline-bar';end.className='group-timeline-end';end.disabled=!!box.lockDuration;
  bar.setAttribute('aria-label',box.label?`Move ${box.label}`:`Move group ${gi+1} box ${bi+1}`);end.setAttribute('aria-label',box.label?`Resize ${box.label}`:`Resize group ${gi+1} box ${bi+1}`);
  bar.disabled=view.locked.has(group.id);end.disabled=view.locked.has(group.id)||!!box.lockDuration;row.hidden=view.hidden.has(group.id);
  if(!rowsByGroup.has(group.id)){rowsByGroup.set(group.id,[]);controlsByGroup.set(group.id,[]);}rowsByGroup.get(group.id).push(row);controlsByGroup.get(group.id).push({bar,end,box});
  let proposal={...box},drag=null;
  function paint(){bar.style.left=100*proposal.start/frames+'%';bar.style.width=100*proposal.duration/frames+'%';bar.textContent=`${proposal.start}–${proposal.start+proposal.duration-1}`;end.style.left=100*(proposal.start+proposal.duration)/frames+'%';bar.title=`Start ${proposal.start}; duration ${proposal.duration} frames`;}
  function apply(){if(view.locked.has(group.id))return;try{if(proposal.start!==box.start||proposal.duration!==box.duration)commit(group.id,box.id,{start:proposal.start,duration:proposal.duration});}catch(error){proposal={...box};paint();onError(error.message);}}
  for(const [control,mode] of [[bar,'move'],[end,'resize']]){
   control.onpointerdown=e=>{if(view.locked.has(group.id))return;if(e.button!==undefined&&e.button!==0)return;e.preventDefault();drag={x:e.clientX,width:track.getBoundingClientRect().width,mode};control.setPointerCapture(e.pointerId);};
   control.onpointermove=e=>{if(!drag||drag.width<=0)return;proposal=adjustWindow(box,(e.clientX-drag.x)*frames/drag.width,drag.mode,frames);paint();};
   control.onpointerup=()=>{if(!drag)return;drag=null;apply();};
   control.onpointercancel=()=>{drag=null;proposal={...box};paint();};
   control.onkeydown=e=>{if(view.locked.has(group.id))return;if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();proposal=adjustWindow(box,e.key==='ArrowLeft'?-1:1,e.shiftKey?'resize':mode,frames);const label=control.getAttribute('aria-label');apply();[...document.querySelectorAll('button')].find(n=>n.getAttribute('aria-label')===label)?.focus();};
  }
  paint();track.append(bar,end);row.append(label,track);content.append(row);
 }));root.append(timeline);viewport.scrollLeft=view.scroll;
}
