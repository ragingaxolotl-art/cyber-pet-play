import {poseSourceFrames,poseDurations} from './pose-timing.js?v=20261109-hurtboxes';
import {validateAttack} from './combat-model.js?v=20261109-area-art';
import {addContextHelp} from './context-help.js';
let selectedFrame=0,selectedName='hand';
const make=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
export function renderAnchorEditor({root,attack,count,commit,status,preview}){
 const section=make('section'),heading=make('h3','Animation anchors');section.append(heading);root.append(section);
 const note=make('p','Place named points relative to the attacker’s feet. Positive X is forward and negative Y is above the floor. Each frame has independent positions. Anchors follow the attack clock; projectiles use the launch-frame position.');section.append(note);addContextHelp(section,heading,[note]);
 const mutate=change=>{try{const next=structuredClone(attack);change(next);validateAttack(next);commit(next);}catch(e){status(e.message);}};
 const button=(text,action)=>{const b=make('button',text);b.type='button';b.onclick=action;section.append(b);return b;};
 if(!attack.animationAnchors){button('Add animation anchors',()=>mutate(next=>{
  const order=poseSourceFrames(next,count||1);next.poseFrames=order;next.poseDurations=poseDurations(next,count||1);
  next.animationAnchors={frames:order.map((_,i)=>({id:'anchor_'+crypto.randomUUID().replaceAll('-',''),points:{hand:{x:0,y:-35}}}))};
 }));return;}
 const frames=attack.animationAnchors.frames;selectedFrame=Math.min(selectedFrame,frames.length-1);
 const names=[...new Set(frames.flatMap(frame=>Object.keys(frame.points)))];if(!names.includes(selectedName))selectedName=names[0];
 const choose=(label,values,current,change)=>{const l=make('label',label),select=make('select');select.setAttribute('aria-label',label);for(const [value,text]of values)select.add(new Option(text,value));select.value=current;select.onchange=()=>change(select.value);l.append(select);section.append(l);return select;};
 const redraw=()=>{section.remove();renderAnchorEditor({root,attack,count,commit,status,preview});};
 choose('Anchor frame',frames.map((f,i)=>[String(i),'Frame '+(i+1)]),String(selectedFrame),value=>{selectedFrame=Number(value);preview?.(selectedFrame,selectedName,true);redraw();});
 choose('Anchor point',names.map(name=>[name,name]),selectedName,value=>{selectedName=value;preview?.(selectedFrame,selectedName,true);redraw();});
 const name=make('input');name.setAttribute('aria-label','New anchor name');name.placeholder='head, foot, weapon…';section.append(name);
 button('Add named point',()=>{const value=name.value.trim();mutate(next=>{if(!/^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/.test(value)||names.includes(value))throw Error('Choose a new anchor name using letters, numbers, underscores or hyphens.');for(const f of next.animationAnchors.frames)f.points[value]={x:0,y:0};selectedName=value;});});
 if(selectedName){
  button('Rename selected point',()=>{const value=name.value.trim(),old=selectedName;mutate(next=>{
   if(!/^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/.test(value)||names.includes(value))throw Error('Enter a new, unused name in New anchor name.');
   for(const f of next.animationAnchors.frames)if(Object.hasOwn(f.points,old)){f.points[value]=f.points[old];delete f.points[old];}
   for(const box of [next.box,...(next.hitboxGroups||[]).flatMap(g=>g.boxes)])if(box.anchor===old)box.anchor=value;
   selectedName=value;preview?.(selectedFrame,value,true);
  });});
  button('Delete selected point',()=>{const old=selectedName;mutate(next=>{
   if([next.box,...(next.hitboxGroups||[]).flatMap(g=>g.boxes)].some(box=>box.anchor===old))throw Error('Detach hitboxes from this point before deleting it.');
   for(const f of next.animationAnchors.frames)delete f.points[old];
   preview?.(null);
  });});
 }
 button('Return to combat preview',()=>preview?.(null));
 if(selectedName&&!frames[selectedFrame].points[selectedName]){section.append(make('p','This point is missing on the selected frame.'));button('Add point on this frame',()=>mutate(next=>{next.animationAnchors.frames[selectedFrame].points[selectedName]={x:0,y:0};}));}
 if(selectedName&&frames[selectedFrame].points[selectedName]){button('Place point in preview',()=>preview?.(selectedFrame,selectedName));for(const axis of ['x','y']){const label=make('label','Anchor '+axis.toUpperCase()),input=make('input');Object.assign(input,{type:'number',min:-500,max:500,step:1,value:frames[selectedFrame].points[selectedName]?.[axis]??0});input.setAttribute('aria-label','Anchor '+axis.toUpperCase());input.onchange=()=>mutate(next=>{if(input.value==='')throw Error('Enter an anchor coordinate.');next.animationAnchors.frames[selectedFrame].points[selectedName][axis]=Number(input.value);});label.append(input);section.append(label);}
 button('Copy point to all frames',()=>mutate(next=>{const point=next.animationAnchors.frames[selectedFrame].points[selectedName];for(const f of next.animationAnchors.frames)f.points[selectedName]={...point};}));}
 const boxes=[['primary','Primary hitbox',attack.box],...(attack.hitboxGroups||[]).flatMap(g=>g.boxes.map(b=>[b.id,b.id,b]))];
 for(const [id,label,box]of boxes)choose(label+' anchor',[['','Fighter origin'],...names.filter(n=>frames.every(f=>Object.hasOwn(f.points,n))).map(n=>[n,n])],box.anchor||'',value=>mutate(next=>{const target=id==='primary'?next.box:next.hitboxGroups.flatMap(g=>g.boxes).find(b=>b.id===id);if(value)target.anchor=value;else delete target.anchor;}));
}
