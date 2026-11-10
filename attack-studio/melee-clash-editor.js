import {addContextHelp} from './context-help.js';
import {validateAttack} from './combat-model.js?v=20261110-status-support-audit';
export function renderMeleeClashEditor({root,attack,commit,status}){
 if(attack.delivery!=='melee'||!['damage','push'].includes(attack.payload))return;
 const section=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent='Melee clashes';section.append(legend);
 const label=document.createElement('label');label.textContent='Clash with other melee attacks';const toggle=document.createElement('input');toggle.type='checkbox';toggle.checked=!!attack.meleeClash;toggle.setAttribute('aria-label','Enable melee clashes');label.append(toggle);section.append(label);
 const mutate=change=>{try{const next=structuredClone(attack);change(next);validateAttack(next);commit(next);return true;}catch(error){status(error.message);return false;}};
 toggle.onchange=()=>{if(!mutate(next=>{if(toggle.checked)next.meleeClash={priority:0};else delete next.meleeClash;}))toggle.checked=!!attack.meleeClash;};
 if(attack.meleeClash){
  const label=document.createElement('label');label.textContent='Clash priority';const input=document.createElement('input');Object.assign(input,{type:'number',min:0,max:9,step:1,value:attack.meleeClash.priority});input.setAttribute('aria-label','Melee clash priority');
  input.onchange=()=>{if(input.value===''||!mutate(next=>next.meleeClash.priority=Number(input.value))){if(input.value==='')status('Enter a whole priority from 0 to 9.');input.value=attack.meleeClash.priority;}};label.append(input);section.append(label);
 }
 const note=document.createElement('p');note.textContent='Both attacks must enable melee clashes and their active hitboxes must overlap. Equal priorities stop both attacks; higher priority stops only the weaker attack. Stopped attacks lose their remaining hits and enter their configured recovery. Other simultaneous hits still trade. Priority does not increase damage or bypass the surviving target’s defense. Compare two attacks in Arena to test clashes. Saving requires version 29 support.';section.append(note);addContextHelp(section,legend,[note]);root.append(section);
}
