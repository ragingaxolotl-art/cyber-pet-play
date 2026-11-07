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
 groups.forEach((group,gi)=>group.boxes.forEach((box,bi)=>{
  const row=el('div');row.className='group-timeline-row';const label=el('span',box.label||`G${gi+1} · Box ${bi+1}`),track=el('div');track.className='group-timeline-track';
  const bar=el('button'),end=el('button','↔');bar.type=end.type='button';bar.className='group-timeline-bar';end.className='group-timeline-end';end.disabled=!!box.lockDuration;
  bar.setAttribute('aria-label',box.label?`Move ${box.label}`:`Move group ${gi+1} box ${bi+1}`);end.setAttribute('aria-label',box.label?`Resize ${box.label}`:`Resize group ${gi+1} box ${bi+1}`);
  let proposal={...box},drag=null;
  function paint(){bar.style.left=100*proposal.start/frames+'%';bar.style.width=100*proposal.duration/frames+'%';bar.textContent=`${proposal.start}–${proposal.start+proposal.duration-1}`;end.style.left=100*(proposal.start+proposal.duration)/frames+'%';bar.title=`Start ${proposal.start}; duration ${proposal.duration} frames`;}
  function apply(){try{if(proposal.start!==box.start||proposal.duration!==box.duration)commit(group.id,box.id,{start:proposal.start,duration:proposal.duration});}catch(error){proposal={...box};paint();onError(error.message);}}
  for(const [control,mode] of [[bar,'move'],[end,'resize']]){
   control.onpointerdown=e=>{if(e.button!==undefined&&e.button!==0)return;e.preventDefault();drag={x:e.clientX,width:track.getBoundingClientRect().width,mode};control.setPointerCapture(e.pointerId);};
   control.onpointermove=e=>{if(!drag||drag.width<=0)return;proposal=adjustWindow(box,(e.clientX-drag.x)*frames/drag.width,drag.mode,frames);paint();};
   control.onpointerup=()=>{if(!drag)return;drag=null;apply();};
   control.onpointercancel=()=>{drag=null;proposal={...box};paint();};
   control.onkeydown=e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();proposal=adjustWindow(box,e.key==='ArrowLeft'?-1:1,e.shiftKey?'resize':mode,frames);const label=control.getAttribute('aria-label');apply();[...document.querySelectorAll('button')].find(n=>n.getAttribute('aria-label')===label)?.focus();};
  }
  paint();track.append(bar,end);row.append(label,track);timeline.append(row);
 }));root.append(timeline);
}
