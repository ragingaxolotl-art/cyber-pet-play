import {advancePulseReaction} from './hit-sequence.js?v=20261110-library-management';
// Use the combat sampler instead of maintaining a second flight formula.
export function authoredTrajectory(event){
 if(event.impulse||!['launch','relaunch','knockback'].includes(event.reaction))return null;
 return Array.from({length:25},(_,i)=>{const target={x:0,y:0,pulseMotion:{start:0,x:0,y:0,direction:1,event:{...event,bounces:undefined}}};advancePulseReaction(target,event.frames*i/24);return {x:target.x,y:target.y};});
}
export function trajectoryEdit(event,key,value){
 if(!['height','knockback'].includes(key)||!Number.isFinite(value))throw Error('Choose a valid trajectory position.');
 return {...structuredClone(event),[key]:Math.round(Math.max(0,Math.min(150,value)))};
}
export function renderTrajectoryEditor({root,event,commit,status=()=>{}}){
 if(!authoredTrajectory(event))return;
 const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Shape reaction trajectory';details.append(summary);
 const help=document.createElement('p');help.textContent='Drag the green handle beside the peak to set height or the blue landing handle to set knockback. Arrow keys adjust one pixel; Shift adjusts ten. This grounded, right-facing arc excludes walls, bounces and later hits. Numeric controls above remain available.';details.append(help);
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 220 190');svg.setAttribute('aria-label','Authored reaction trajectory');svg.style.cssText='display:block;width:100%;max-width:380px;touch-action:none;overflow:visible';
 const shape=(tag,attrs)=>{const node=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))node.setAttribute(k,String(v));svg.append(node);return node;};
 shape('path',{d:'M40 10 V170 H200',fill:'none',stroke:'currentColor',opacity:.35});const curve=shape('path',{fill:'none',stroke:'#bce981','stroke-width':2});
 const tether=shape('path',{fill:'none',stroke:'#bce981','stroke-width':1,'stroke-dasharray':'2 2'});const handles={};let draft=structuredClone(event),drag=null;
 const draw=()=>{tether.setAttribute('d',`M${20+draft.knockback/2} ${170-draft.height} H${40+draft.knockback/2}`);curve.setAttribute('d',authoredTrajectory(draft).map((p,i)=>`${i?'L':'M'}${40+p.x} ${170+p.y}`).join(' '));for(const [key,node]of Object.entries(handles)){node.setAttribute('cx',40+(key==='height'?draft.knockback/2-20:draft.knockback));node.setAttribute('cy',170-(key==='height'?draft.height:0));node.setAttribute('aria-valuenow',draft[key]);node.setAttribute('aria-valuetext',`${draft[key]} pixels`);}};
 const save=key=>{try{commit(draft);const next=[...root.querySelectorAll('summary')].find(n=>n.textContent==='Shape reaction trajectory');if(next){next.parentNode.open=true;next.parentNode.querySelector('[aria-label="'+(key==='height'?'Launch height':'Knockback distance')+' trajectory handle"]')?.focus();}status('Reaction trajectory updated. Undo restores the previous arc.');}catch(error){draft=structuredClone(event);draw();status(error.message);}};
 for(const [key,label]of [['height','Launch height'],['knockback','Knockback distance']]){
  const node=shape('circle',{r:8,fill:key==='height'?'#bce981':'#80dafa',stroke:'#17232c','stroke-width':2,tabindex:0,role:'slider','aria-label':label+' trajectory handle','aria-valuemin':0,'aria-valuemax':150,'aria-orientation':key==='height'?'vertical':'horizontal'});handles[key]=node;node.style.cursor=key==='height'?'ns-resize':'ew-resize';
  node.onkeydown=e=>{if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();draft=trajectoryEdit(event,key,event[key]+(['ArrowUp','ArrowRight'].includes(e.key)?1:-1)*(e.shiftKey?10:1));save(key);};
  node.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();drag={key,id:e.pointerId};node.setPointerCapture(e.pointerId);};
  node.onpointermove=e=>{if(!drag||drag.id!==e.pointerId)return;const matrix=svg.getScreenCTM();if(!matrix)return;const point=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());draft=trajectoryEdit(event,key,key==='height'?170-point.y:point.x-40);draw();};
  node.onpointerup=e=>{if(!drag||drag.id!==e.pointerId)return;drag=null;node.releasePointerCapture(e.pointerId);if(draft[key]!==event[key])save(key);};
  const cancel=()=>{if(!drag)return;drag=null;draft=structuredClone(event);draw();};node.onpointercancel=cancel;node.onlostpointercapture=cancel;
 }
 draw();details.append(svg);root.append(details);
}
