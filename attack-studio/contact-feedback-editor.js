import {validateAttack} from './combat-model.js?v=20261109-hurtboxes';
import {CONTACT_FEEDBACK_LIMITS} from './contact-feedback.js?v=20261108-impact-timing';
const make=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
export function renderContactFeedbackEditor({root,attack,commit,status}){
 root.replaceChildren();root.append(make('h3','Impact timing'));
 root.append(make('p','These settings apply when this attack hits an opponent. Hitstop pauses combat after a hit or armor contact; blockstop pauses after a blocked contact. Blockstun keeps the defender guarding without moving or attacking after the pause. Values are whole 60 Hz frames. Timeline edits use combat frames; playback includes the pauses. Requires version 12 saving.'));
 const mutate=change=>{try{const next=structuredClone(attack);change(next);validateAttack(next);commit(next);return true;}catch(error){status(error.message);return false;}};
 if(attack.contactFeedback===undefined){const add=make('button','Customize impact timing');add.type='button';add.onclick=()=>mutate(next=>next.contactFeedback={hitstop:0,blockstop:0,blockstun:0});root.append(add);return;}
 for(const [key,title] of [['hitstop','Hit pause'],['blockstop','Blocked-hit pause'],['blockstun','Guard recovery']]){
  const label=make('label',title+' (frames)'),input=make('input');Object.assign(input,{type:'number',min:0,max:CONTACT_FEEDBACK_LIMITS[key],step:1,value:attack.contactFeedback[key]??0});input.setAttribute('aria-label',title+' frames');input.onchange=()=>{if(input.value===''||!mutate(next=>next.contactFeedback[key]=Number(input.value))){if(input.value==='')status('Enter a whole number of frames.');input.value=attack.contactFeedback[key]??0;}};label.append(input);root.append(label);
 }
 root.append(make('p','Simultaneous contacts use the longest pause rather than adding them. Misses, dodges, invulnerability and parries do not trigger these ordinary impact pauses.'));
 const reset=make('button','Restore default impact timing');reset.type='button';reset.onclick=()=>mutate(next=>delete next.contactFeedback);root.append(reset);
}
