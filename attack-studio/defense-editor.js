import {validateAttack} from './combat-model.js?v=20261108-persistence';
const make=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
export function renderDefenseEditor({root,attack,commit,status}){
 root.replaceChildren();root.append(make('h2','Defense windows'));
 root.append(make('p','Parry prevents an eligible hit and briefly interrupts its attacker. Invulnerability prevents eligible damage and hit reactions. Armor takes damage but prevents ordinary hit reactions while the move continues. Status effects still apply. Timing uses frames since attack start. Armor and parry each have a hit limit; overlapping windows are used in list order.'));
 const mutate=change=>{try{const next=structuredClone(attack);change(next);validateAttack(next);commit(next);}catch(error){status(error.message);}};
 for(const kind of ['armor','invulnerability','parry']){
  const add=make('button',`Add ${kind} window`);add.type='button';add.disabled=(attack.defenseWindows?.length||0)>=8;
  add.onclick=()=>mutate(next=>{(next.defenseWindows??=[]).push({id:'defense_'+crypto.randomUUID().replaceAll('-',''),kind,start:0,duration:12,...(kind==='invulnerability'?{}:{hits:1}),...(kind==='parry'?{stun:8}:{}),against:kind==='parry'?'melee':'all'});});root.append(add);
 }
 for(const [index,window] of (attack.defenseWindows||[]).entries()){
  const title=window.kind==='armor'?'Armor':window.kind==='parry'?'Parry':'Invulnerability';
  const section=make('fieldset');section.append(make('legend',title+' '+(index+1)));
  for(const [name,key,min,max] of [['Start frame','start',0,899],['Duration','duration',1,900],['Hit limit','hits',1,10],['Interruption frames','stun',1,60]]){
   if(key==='hits'&&window.kind==='invulnerability'||key==='stun'&&window.kind!=='parry')continue;
   const label=make('label',name),input=make('input');input.type='number';input.min=min;input.max=max;input.step=1;input.value=window[key];input.setAttribute('aria-label',`${title} ${index+1} ${name.toLowerCase()}`);
   input.onchange=()=>{const value=Number(input.value);if(input.value===''||!Number.isInteger(value)||value<min||value>max||((key==='start'?value:window.start)+(key==='duration'?value:window.duration)>900)){status('Use whole frames within 0–900 and a hit limit of 1–10, and interruption of 1–60 frames.');input.value=window[key];return;}mutate(next=>next.defenseWindows[index][key]=value);};label.append(input);section.append(label);
  }
  const label=make('label','Protect against'),select=make('select');select.setAttribute('aria-label',`${title} ${index+1} attack types`);
  for(const [value,text] of [['all','All attack types'],['melee','Melee'],['projectile','Projectiles'],['area','Area attacks']])select.add(new Option(text,value));select.value=window.against;select.onchange=()=>mutate(next=>next.defenseWindows[index].against=select.value);label.append(select);section.append(label);
  const remove=make('button',`Delete ${window.kind} ${index+1}`);remove.type='button';remove.onclick=()=>mutate(next=>{next.defenseWindows.splice(index,1);if(!next.defenseWindows.length)delete next.defenseWindows;});section.append(remove);root.append(section);
 }
}
