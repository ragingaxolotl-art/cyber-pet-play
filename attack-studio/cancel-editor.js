import {compactSectionHelp} from './context-help.js?v=20261108-static-help';
import {renderMovementCancelEditor} from './movement-cancel-editor.js?v=20261108-static-help';
import {validateAttack} from './combat-model.js?v=20261108-area-final';
const make=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
export function renderCancelEditor({root,attack,attacks,commit,status,test}){
 root.replaceChildren();root.append(make('h2','Follow-up windows'));
 root.append(make('p','Allow a named attack to replace this move during a frame window. Follow-ups still require energy, readiness and an equipped attack in Arena. Conditions use this cast’s results. Choose Manual input or Automatic for each window. Timing starts when the attack begins.'));
 const mutate=change=>{try{const next=structuredClone(attack);change(next);validateAttack(next);commit(next);}catch(error){status(error.message);}};
 const add=make('button','Add follow-up window');add.type='button';add.disabled=(attack.cancelWindows?.length||0)>=16||!attacks.length;
 add.onclick=()=>mutate(next=>{(next.cancelWindows??=[]).push({id:'cancel_'+crypto.randomUUID().replaceAll('-',''),start:0,duration:12,condition:'hit',attacks:[(attacks.find(a=>a.id!==attack.id)||attack).id]});});root.append(add);
 for(const [index,window] of (attack.cancelWindows||[]).entries()){
  const section=make('fieldset');section.append(make('legend','Follow-up '+(index+1)));
  for(const [name,key,min,max] of [['Start frame','start',0,899],['Duration','duration',1,900]]){
   const label=make('label',name),input=make('input');input.type='number';input.min=min;input.max=max;input.step=1;input.value=window[key];input.setAttribute('aria-label',`Follow-up ${index+1} ${name.toLowerCase()}`);
   input.onchange=()=>{const value=Number(input.value);if(input.value===''||!Number.isInteger(value)||value<min||value>max||(key==='start'?value+window.duration:window.start+value)>900){status('Use whole frames with a window ending by frame 900.');input.value=window[key];return;}mutate(next=>next.cancelWindows[index][key]=value);};label.append(input);section.append(label);
  }
  const label=make('label','When'),select=make('select');select.setAttribute('aria-label',`Follow-up ${index+1} condition`);
  for(const [value,text] of [['any','Any result'],['hit','After hitting'],['block','After being blocked'],['parry','After parrying'],['whiff','After missing (active time finished)']])select.add(new Option(text,value));select.value=window.condition;select.onchange=()=>mutate(next=>next.cancelWindows[index].condition=select.value);label.append(select);section.append(label);
  const activationLabel=make('label','Activation'),activation=make('select');activation.setAttribute('aria-label',`Follow-up ${index+1} activation`);activation.add(new Option('Manual input','manual'));activation.add(new Option('Automatic','automatic'));activation.value=window.automatic?'automatic':'manual';activation.onchange=()=>{if(activation.value==='automatic'&&window.attacks.length!==1){status('Choose exactly one allowed attack before enabling Automatic.');activation.value='manual';return;}mutate(next=>{if(activation.value==='automatic')next.cancelWindows[index].automatic=true;else delete next.cancelWindows[index].automatic;});};activationLabel.append(activation);section.append(activationLabel);
  if(window.automatic)section.append(make('p','Automatic follow-ups start after this frame’s contacts, obey energy and cooldown checks, and require an equipped attack. The first eligible automatic window has priority. Chains stop after eight transitions. Saving requires version 6 support.'));
  const choices=make('fieldset');choices.append(make('legend','Allowed attacks (choose 1–16)'));
  const available=new Map(attacks.map(a=>[a.id,a.name||a.id]));for(const id of window.attacks)if(!available.has(id))available.set(id,`Missing from this project: ${id}`);
  for(const [id,name] of available){const label=make('label',name),input=make('input');input.type='checkbox';input.checked=window.attacks.includes(id);input.setAttribute('aria-label',`Follow-up ${index+1} allow ${name}`);input.onchange=()=>{const ids=input.checked?[...window.attacks,id]:window.attacks.filter(a=>a!==id);if(!ids.length||ids.length>16||(window.automatic&&ids.length!==1)){status(window.automatic?'Automatic follow-ups allow exactly one attack.':'Choose 1–16 follow-up attacks.');input.checked=window.attacks.includes(id);return;}mutate(next=>next.cancelWindows[index].attacks=ids);};label.append(input);choices.append(label);}section.append(choices);
  if(test){const link=make('a','Test this follow-up in Arena');link.href='#';link.target='_blank';link.rel='noopener';link.onclick=event=>{try{link.href=test(window);}catch(error){event.preventDefault();status(error.message);}};section.append(link);section.append(make('p',window.automatic?'Opens an isolated comparison with automatic rules enabled and no scheduled manual follow-up. Choose the opponent in Arena.':'Opens an isolated comparison at this window’s start using its first allowed attack. Adjust the attempt frame and opponent in Arena.'));}
  const remove=make('button',`Delete follow-up ${index+1}`);remove.type='button';remove.onclick=()=>mutate(next=>{next.cancelWindows.splice(index,1);if(!next.cancelWindows.length)delete next.cancelWindows;});section.append(remove);root.append(section);
 }
 const movement=make('section');root.append(movement);renderMovementCancelEditor({root:movement,attack,commit,status});
 compactSectionHelp(root);
}
