import {poseSourceFrames,poseDurations} from './pose-timing.js?v=20261109-hurtboxes';
import {validateAttack} from './combat-model.js?v=20261110-defense-boundary-audit';
import {addContextHelp} from './context-help.js';
let frameIndex=0,boxIndex=0;
const make=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
export function renderHurtboxEditor({root,attack,count,commit,status,preview}){
 const section=make('section'),heading=make('h3','Vulnerable regions');section.append(heading);root.append(section);
 const note=make('p','Hurtboxes define where this fighter can be hit during the attack. Each animation frame has its own regions. Overlapping regions count as one contact. Use defense windows for invulnerability.');section.append(note);addContextHelp(section,heading,[note]);
 const mutate=change=>{try{const next=structuredClone(attack);change(next);validateAttack(next);commit(next);}catch(e){status(e.message);}};
 const button=(text,action,disabled=false)=>{const b=make('button',text);b.type='button';b.disabled=disabled;b.onclick=action;section.append(b);};
 if(!attack.hurtboxes){button('Customize hurtboxes',()=>mutate(next=>{const order=poseSourceFrames(next,count||1);next.poseFrames=order;next.poseDurations=poseDurations(next,count||1);next.hurtboxes={frames:order.map(()=>({boxes:[{x:-14,y:-60,w:28,h:60,shape:'rectangle'}]}))};}));return;}
 const frames=attack.hurtboxes.frames;frameIndex=Math.min(frameIndex,frames.length-1);boxIndex=Math.min(boxIndex,frames[frameIndex].boxes.length-1);
 const redraw=()=>{section.remove();renderHurtboxEditor({root,attack,count,commit,status,preview});};
 const select=(label,values,value,change)=>{const l=make('label',label),n=make('select');n.setAttribute('aria-label',label);values.forEach(([v,text])=>n.add(new Option(text,v)));n.value=value;n.onchange=()=>change(n.value);l.append(n);section.append(l);};
 select('Hurtbox frame',frames.map((_,i)=>[String(i),'Frame '+(i+1)]),String(frameIndex),v=>{frameIndex=Number(v);boxIndex=0;preview?.(frameIndex,boxIndex,true);redraw();});
 const boxes=frames[frameIndex].boxes,box=boxes[boxIndex];
 select('Vulnerable region',boxes.map((_,i)=>[String(i),'Region '+(i+1)]),String(boxIndex),v=>{boxIndex=Number(v);preview?.(frameIndex,boxIndex,true);redraw();});
 button('Place hurtbox in preview',()=>preview?.(frameIndex,boxIndex));button('Return to combat playback',()=>preview?.(null));
 select('Hurtbox shape',['rectangle','ellipse','diamond','triangle'].map(v=>[v,v]),box.shape,v=>mutate(next=>next.hurtboxes.frames[frameIndex].boxes[boxIndex].shape=v));
 for(const [key,label,min,max]of [['x','Hurtbox X',-500,500],['y','Hurtbox Y',-500,500],['w','Hurtbox width',1,500],['h','Hurtbox height',1,500],['rotation','Hurtbox rotation',-180,180]]){
  const l=make('label',label),input=make('input');Object.assign(input,{type:'number',min,max,step:1,value:box[key]??0});input.setAttribute('aria-label',label);input.onchange=()=>mutate(next=>{if(input.value==='')throw Error('Enter a hurtbox value.');next.hurtboxes.frames[frameIndex].boxes[boxIndex][key]=Number(input.value);});l.append(input);section.append(l);
 }
 button('Duplicate vulnerable region',()=>mutate(next=>{next.hurtboxes.frames[frameIndex].boxes.push(structuredClone(box));boxIndex=boxes.length;}),boxes.length>=8);
 button('Delete vulnerable region',()=>mutate(next=>next.hurtboxes.frames[frameIndex].boxes.splice(boxIndex,1)),boxes.length===1);
 button('Copy regions to all frames',()=>mutate(next=>{for(const f of next.hurtboxes.frames)f.boxes=structuredClone(boxes);}));
 button('Use default body hurtbox',()=>mutate(next=>{delete next.hurtboxes;}));
}
