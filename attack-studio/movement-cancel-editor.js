import {validateAttack} from './combat-model.js?v=20261109-rotation';
const make=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
export function renderMovementCancelEditor({root,attack,commit,status}){
 root.replaceChildren();root.append(make('h3','Movement cancel windows'));
 root.append(make('p','Allow manual jump, dodge or dash input to end this attack early. Windows use cast frames and this attack’s results. Energy, artwork, recovery and movement cooldown checks still apply. Jump and dash require standing on the ground. The stationary preview does not simulate these inputs. Saving requires version 11 support.'));
 const mutate=change=>{try{const next=structuredClone(attack);change(next);validateAttack(next);commit(next);return true;}catch(error){status(error.message);return false;}};
 const add=make('button','Add movement cancel');add.type='button';add.disabled=(attack.movementCancels?.length||0)>=16;add.onclick=()=>mutate(next=>(next.movementCancels??=[]).push({id:'movement_'+crypto.randomUUID().replaceAll('-',''),start:0,duration:12,action:'jump',condition:'hit',cost:0}));root.append(add);
 for(const [index,window] of (attack.movementCancels||[]).entries()){
  const section=make('fieldset');section.append(make('legend',`Movement cancel ${index+1}`));
  const selectField=(title,key,choices)=>{const label=make('label',title),select=make('select');select.setAttribute('aria-label',`Movement cancel ${index+1} ${key}`);for(const [value,text] of choices)select.add(new Option(text,value));select.value=window[key];select.onchange=()=>{if(!mutate(next=>{const w=next.movementCancels[index];w[key]=select.value;if(key==='action'){if(w.action==='dash')w.direction='forward';else delete w.direction;}}))select.value=window[key];};label.append(select);section.append(label);};
  selectField('Movement','action',[['jump','Jump'],['dodge','Dodge'],['dash','Dash']]);
  selectField('When','condition',[['any','Any result'],['hit','After hitting'],['block','After being blocked'],['parry','After parrying'],['whiff','After missing (active time finished)']]);
  if(window.action==='dash'){selectField('Dash direction','direction',[['forward','Toward opponent'],['backward','Away from opponent'],['input','Held left/right input']]);section.append(make('p','Dash lasts 12 frames, with a 30-frame cooldown. Press N in Arena or use a Dash button. It does not grant invulnerability.'));}
  for(const [title,key,min,max] of [['Start frame','start',0,899],['Duration','duration',1,900],['Energy cost','cost',0,200]]){
   const label=make('label',title),input=make('input');Object.assign(input,{type:'number',min,max,step:key==='cost'?'any':1,value:window[key]});input.setAttribute('aria-label',`Movement cancel ${index+1} ${key}`);
   input.onchange=()=>{if(input.value===''||!mutate(next=>next.movementCancels[index][key]=Number(input.value))){if(input.value==='')status('Enter a number.');input.value=window[key];}};label.append(input);section.append(label);
  }
  const remove=make('button',`Delete movement cancel ${index+1}`);remove.type='button';remove.onclick=()=>mutate(next=>{next.movementCancels.splice(index,1);if(!next.movementCancels.length)delete next.movementCancels;});section.append(remove);root.append(section);
 }
}
