import {installTeacherPanel} from './teacher-panel.js';
import {controls,setControls,keyOf} from './control-state.js';
const DESKS=['https://cyber-pet-board-control.ragingaxolotl.chatgpt.site','https://ragingaxolotl-art.github.io'];
export function installBoardTeacher(canvas,getPets){
 const panel=document.createElement('aside');panel.id='board-teacher-panel';panel.className='teacher-panel';panel.hidden=true;document.body.append(panel);
 const close=document.createElement('button');close.id='close-teacher';close.textContent='Close controls';close.hidden=true;document.body.append(close);close.onclick=()=>{panel.hidden=true;close.hidden=true;};
 let local=null,preview=null,remote=false,parentOrigin=null;const areas=[];
 const editor=installTeacherPanel(panel,{onSelection:ids=>{preview=null;local=editor.unlocked?new Set(ids):null;if(!editor.unlocked)preview=null;},onPreview:(ids,layout)=>{preview={ids:new Set(ids),layout};},onSaved:data=>{preview=null;setControls(data);}});
 const button=document.getElementById('teacher-control');button.onclick=()=>{panel.hidden=false;close.hidden=false;};
 window.addEventListener('message',event=>{if(!DESKS.includes(event.origin)||event.source!==window.parent)return;parentOrigin=event.origin;const d=event.data;if(d?.type==='board-selection'&&Array.isArray(d.ids)){remote=d.enabled!==false;local=remote?new Set(d.ids.slice(0,200)):null;if(!remote)preview=null;}if(d?.type==='board-preview'&&Array.isArray(d.ids)&&Number.isFinite(d.layout?.scale)&&Number.isFinite(d.layout?.offset))preview={ids:new Set(d.ids.slice(0,200)),layout:{scale:Math.max(.5,Math.min(2.5,d.layout.scale)),offset:Math.max(-120,Math.min(120,d.layout.offset))}};if(d?.type==='board-saved'){preview=null;if(d.state)setControls(d.state);}});
 canvas.addEventListener('click',event=>{if(!editor.unlocked&&!remote)return;const box=canvas.getBoundingClientRect(),x=event.clientX-box.left,y=event.clientY-box.top;const hit=[...areas].reverse().find(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h);if(!hit)return;if(remote){local??=new Set();local.has(hit.id)?local.delete(hit.id):local.add(hit.id);window.parent.postMessage({type:'board-picked',ids:[...local]},parentOrigin);}else editor.toggle(hit.id);});
 return {areas,selected:p=>(local||new Set(controls.selection)).has(keyOf(p)),layout:p=>preview?.ids.has(keyOf(p))?preview.layout:null};
}
