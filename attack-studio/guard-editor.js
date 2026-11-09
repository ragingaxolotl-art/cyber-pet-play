import {addContextHelp} from './context-help.js?v=20261109-guard';
import {validateAttack} from './combat-model.js?v=20261109-hit-links';
export function renderGuardEditor({root,attack,commit,status}) {
 const section=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent='Against guarding opponents';section.append(legend);
 const label=document.createElement('label');label.textContent='Guard interaction';const mode=document.createElement('select');mode.setAttribute('aria-label','Guard interaction');
 for(const [value,text] of [['off','Normal guard'],['break','Break — full damage'],['crush','Crush — reduced damage']]){const option=document.createElement('option');option.value=value;option.textContent=text;mode.append(option);}
 mode.value=attack.guardInteraction?.mode??'off';label.append(mode);section.append(label);
 const mutate=fn=>{try{const next=structuredClone(attack);fn(next);validateAttack(next);commit(next);return true;}catch(error){status(error.message);return false;}};
 mode.onchange=()=>{if(!mutate(next=>{if(mode.value==='off')delete next.guardInteraction;else next.guardInteraction={mode:mode.value,recoveryFrames:next.guardInteraction?.recoveryFrames??20};}))mode.value=attack.guardInteraction?.mode??'off';};
 if(attack.guardInteraction){
  const label=document.createElement('label');label.textContent='Forced recovery (frames)';const input=document.createElement('input');Object.assign(input,{type:'number',min:1,max:120,step:1,value:attack.guardInteraction.recoveryFrames});input.setAttribute('aria-label','Guard recovery frames');
  input.onchange=()=>{if(input.value===''||!mutate(next=>next.guardInteraction.recoveryFrames=Number(input.value))){if(input.value==='')status('Enter 1–120 whole recovery frames.');input.value=attack.guardInteraction.recoveryFrames;}};label.append(input);section.append(label);
 }
 const note=document.createElement('p');note.textContent='Break removes guard damage reduction. Crush keeps reduced damage. Both interrupt a guarding opponent and force recovery; longer existing recovery is preserved. Unguarded targets receive the ordinary hit. These rules do not bypass dodge, invulnerability, parry or eligible armor. Use a blockable damage or push attack. Test with a guarding target. Impact-area pulses do not inherit this rule. Saving requires version 23 support.';section.append(note);addContextHelp(section,legend,[note]);root.append(section);
}
