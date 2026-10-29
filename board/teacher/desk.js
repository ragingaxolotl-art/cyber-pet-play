import {installTeacherPanel} from './teacher-panel.js';
const frame=document.getElementById('board'),origin='https://ragingaxolotl-art.github.io';
const send=data=>frame.contentWindow.postMessage(data,origin);
const panel=installTeacherPanel(document.getElementById('desk'),{onSelection:ids=>send({type:'board-selection',ids,enabled:panel.unlocked}),onPreview:(ids,layout)=>send({type:'board-preview',ids,layout}),onSaved:state=>send({type:'board-saved',state})});
window.addEventListener('message',event=>{if(event.origin===origin&&event.source===frame.contentWindow&&event.data?.type==='board-picked'&&Array.isArray(event.data.ids))panel.setSelection(event.data.ids);});
