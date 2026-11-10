// Selection belongs to this rendered strip, never to saved attack data.
export function frameSelection({root,strip,count,name,remove}){
 const selected=new Set(),boxes=[],tiles=[];let anchor=null;
 const bar=document.createElement('div');bar.className='frame-selection-tools';
 const summary=document.createElement('span');summary.setAttribute('role','status');
 const all=document.createElement('button'),clear=document.createElement('button'),erase=document.createElement('button');
 all.textContent='Select all frames';clear.textContent='Clear frame selection';erase.textContent='Delete selected frames';
 for(const b of [all,clear,erase])b.type='button';
 erase.setAttribute('aria-label','Delete selected frames · '+name);
 const update=()=>{summary.textContent=selected.size+' selected'+(selected.size===count?' · keep at least one frame':'');erase.disabled=!selected.size||selected.size===count;clear.disabled=!selected.size;boxes.forEach((box,i)=>{box.checked=selected.has(i);tiles[i].classList.toggle('frame-selected',selected.has(i));});};
 const toggle=(index,event={})=>{if(event.shiftKey&&anchor!==null){for(let i=Math.min(anchor,index);i<=Math.max(anchor,index);i++)selected.add(i);}else{if(selected.has(index))selected.delete(index);else selected.add(index);anchor=index;}update();};
 all.onclick=()=>{for(let i=0;i<count;i++)selected.add(i);update();};clear.onclick=()=>{selected.clear();anchor=null;update();};
 erase.onclick=()=>{if(selected.size&&selected.size<count){const indices=[...selected].sort((a,b)=>a-b);boxes[indices[0]]?.focus({preventScroll:true});remove(indices);}};
 bar.append(summary,all,clear,erase);root.append(bar);
 const hint=document.createElement('p');hint.className='hint';hint.textContent='Select pictures or checkboxes. Shift-click selects a range. Delete selected frames removes them together; Undo restores them.';root.append(hint);
 strip.addEventListener('keydown',event=>{if(event.key!=='Delete'&&event.key!=='Backspace')return;const tag=event.target?.tagName;if(tag==='INPUT'||tag==='SELECT'||tag==='TEXTAREA')return;if(!erase.disabled){event.preventDefault();erase.onclick();}});
 update();return {add(tile,index,picture){const label=document.createElement('label'),box=document.createElement('input');box.type='checkbox';box.setAttribute('aria-label','Select '+name+' frame '+(index+1));box.onclick=event=>toggle(index,event);label.append(box,document.createTextNode('Select '+(index+1)));tile.append(label);boxes[index]=box;tiles[index]=tile;if(picture){const previous=picture.onclick;picture.onclick=event=>{toggle(index,event);previous?.(event);};}update();},selected};
}
