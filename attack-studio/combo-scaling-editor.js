import {validateAttack} from './combat-model.js?v=20261110-defense-boundary-audit';
const make=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
export function renderComboScalingEditor({root,attack,commit,status}){
 root.replaceChildren();root.append(make('h3','Combo damage scaling'));
 root.append(make('p','Optional reduction for this attack based on earlier uninterrupted damage hits, including earlier attacks. An actionable gap resets the count. Settings use whole percentages and require version 13 saving.'));
 const mutate=change=>{try{const next=structuredClone(attack);change(next);validateAttack(next);commit(next);return true;}catch(error){status(error.message);return false;}};
 if(attack.comboScaling===undefined){const add=make('button','Customize combo scaling');add.type='button';add.onclick=()=>mutate(next=>next.comboScaling={step:0,minimum:100});root.append(add);return;}
 for(const [key,title] of [['step','Reduction per prior hit'],['minimum','Minimum damage']]){
  const label=make('label',title+' (%)'),input=make('input');Object.assign(input,{type:'number',min:0,max:100,step:1,value:attack.comboScaling[key]});input.setAttribute('aria-label',title+' percent');input.onchange=()=>{if(input.value===''||!mutate(next=>next.comboScaling[key]=Number(input.value))){if(input.value==='')status('Enter a whole percentage from 0 to 100.');input.value=attack.comboScaling[key];}};label.append(input);root.append(label);
 }
 const {step,minimum}=attack.comboScaling;
 root.append(make('p','First four damage percentages: '+[0,1,2,3].map(h=>Math.max(minimum,100-h*step)+'%').join(', ')+'. Same-frame contacts share the prior count. Guard, armor and periodic status damage are excluded. Shields apply after scaling.'));
 root.append(make('p','These values affect this move’s direct damage only. Use Arena comparison to test chains across attacks. A minimum of 100% disables reduction; a minimum of 0% can allow later hits to deal zero damage.'));
 const reset=make('button','Remove combo scaling');reset.type='button';reset.onclick=()=>mutate(next=>delete next.comboScaling);root.append(reset);
}
