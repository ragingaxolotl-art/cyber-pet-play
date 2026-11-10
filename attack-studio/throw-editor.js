import {addContextHelp} from './context-help.js';
import {validateAttack} from './combat-model.js?v=20261110-results-navigation';
export function renderThrowEditor({root,attack,commit,status}){
 if(attack.delivery!=='melee'||attack.payload!=='damage')return;
 const section=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent='Grab and throw';section.append(legend);
 const label=document.createElement('label');label.textContent='Capture before dealing damage';const toggle=document.createElement('input');toggle.type='checkbox';toggle.checked=!!attack.throw;toggle.setAttribute('aria-label','Enable throw');label.append(toggle);section.append(label);
 const mutate=change=>{try{const next=structuredClone(attack);change(next);validateAttack(next);commit(next);return true;}catch(error){status(error.message);return false;}};
 toggle.onchange=()=>{if(!mutate(next=>{if(toggle.checked)next.throw={holdFrames:12,holdX:30,holdHeight:20,target:'grounded'};else delete next.throw;}))toggle.checked=!!attack.throw;};
 if(attack.throw){
  for(const [key,title,min,max] of [['holdFrames','Hold frames',1,60],['holdX','Hold forward distance',0,60],['holdHeight','Hold height',0,80]]){
   const label=document.createElement('label'),input=document.createElement('input');label.textContent=title;Object.assign(input,{type:'number',min,max,step:1,value:attack.throw[key]});input.setAttribute('aria-label','Throw '+title.toLowerCase());
   input.onchange=()=>{if(input.value===''||!mutate(next=>next.throw[key]=Number(input.value))){if(input.value==='')status(`Enter a whole number from ${min} to ${max}.`);input.value=attack.throw[key];}};label.append(input);section.append(label);
  }
  const label=document.createElement('label'),select=document.createElement('select');label.textContent='Eligible target';select.setAttribute('aria-label','Throw target');for(const [value,title] of [['grounded','Grounded'],['airborne','Airborne'],['any','Either']])select.add(new Option(title,value));select.value=attack.throw.target;select.onchange=()=>{if(!mutate(next=>next.throw.target=select.value))select.value=attack.throw.target;};label.append(select);section.append(label);
 }
 const note=document.createElement('p');note.textContent='A single melee damage contact can grab a target within 80 pixels. Both fighters stay held for the chosen combat frames, then ordinary damage and your launch/knockback settings apply. Guard, armor and parry do not stop a grab; dodge and all/throw invulnerability do. Simultaneous grabs break; a strike can interrupt capture. Throws require one hit and cannot combine with hit sequences, melee clashes or guard-break rules. Existing settings are preserved if enabling is refused. Saving requires version 31 support.';section.append(note);addContextHelp(section,legend,[note]);root.append(section);
}
