import {validateImpulseReaction,IMPULSE_MODES} from './impulse-reaction.js?v=20261109-momentum-release';
import {addContextHelp} from './context-help.js';
const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
export function renderImpulseEditor({root,event,commit,status,label='Hit'}){
 const section=el('details');section.open=!!event.impulse;section.append(el('summary',label+' momentum'));
 const title=el('h4','Velocity reaction'),note=el('p','Optional physics replaces the authored arc for this hit. Positive horizontal points forward; negative vertical launches upward. Add keeps current motion. Redirect keeps speed and changes direction. Extend stretches the unplayed arc or prolongs an active physical reaction; with no active reaction it changes no motion. Suspend holds position, then releases stored velocity. Ignore changes no motion. Hitstun is separate. Save format 35 is required.');section.append(title,note);addContextHelp(section,title,[note]);
 const change=fn=>{try{const next=structuredClone(event);fn(next);validateImpulseReaction(next.impulse);commit(next);return true;}catch(error){status(error.message);return false;}};
 if(!event.impulse){const add=el('button','Use '+label.toLowerCase()+' velocity reaction');add.type='button';add.disabled=event.reaction==='none';add.onclick=()=>change(next=>next.impulse={mode:'replace',horizontal:2,vertical:-4,gravity:.48,drag:.95,duration:24});section.append(add);}
 else{
  const select=el('select');select.setAttribute('aria-label',label+' momentum mode');for(const mode of IMPULSE_MODES)select.add(new Option(mode,mode));select.value=event.impulse.mode;select.onchange=()=>{if(!change(next=>next.impulse.mode=select.value))select.value=event.impulse.mode;};section.append(select);
  const mode=event.impulse.mode,fields=[];if(['replace','add','redirect'].includes(mode))fields.push(['horizontal',mode==='redirect'?'Horizontal direction':'Horizontal velocity',-20,20,.1],['vertical',mode==='redirect'?'Vertical direction':'Vertical velocity',-20,20,.1]);if(['replace','add','redirect'].includes(mode))fields.push(['gravity','Gravity',0,2,.01],['drag','Horizontal velocity retained per frame',0,1,.01]);if(mode!=='ignore')fields.push(['duration',mode==='extend'?'Extra frames':'Duration (frames)',1,mode==='suspend'?30:120,1]);
  for(const [key,name,min,max,step] of fields){const field=el('label',name),input=el('input');Object.assign(input,{type:'number',min,max,step,value:event.impulse[key]});input.setAttribute('aria-label',label+' momentum '+key);input.onchange=()=>{if(!change(next=>{if(input.value==='')throw Error('Enter a value.');next.impulse[key]=Number(input.value);}))input.value=event.impulse[key];};field.append(input);section.append(field);}
  const remove=el('button','Restore '+label.toLowerCase()+' authored arc');remove.type='button';remove.onclick=()=>change(next=>delete next.impulse);section.append(remove);
 }root.append(section);
}
