import {renderThrowEditor} from './throw-editor.js?v=20261110-energy-preview';
import {renderMeleeClashEditor} from './melee-clash-editor.js?v=20261110-energy-preview';
import {renderGuardEditor} from './guard-editor.js?v=20261110-energy-preview';
import {compactSectionHelp} from './context-help.js?v=20261109-guard';
import {renderBounceEditor} from './bounce-editor.js?v=20261110-energy-preview';
import {renderHitstunEditor} from './hitstun-editor.js?v=20261110-energy-preview';
import {renderCounterHitEditor} from './counter-hit-editor.js?v=20261110-energy-preview';
import {renderComboScalingEditor} from './combo-scaling-editor.js?v=20261110-energy-preview';
import {renderContactFeedbackEditor} from './contact-feedback-editor.js?v=20261110-energy-preview';
import {validateAttack} from './combat-model.js?v=20261110-energy-preview';
const make=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
export function renderDefenseEditor({root,attack,commit,status}){
 root.replaceChildren();root.append(make('h2','Defense windows'));
 root.append(make('p','Reflect returns an independently launched projectile to its attacker. Absorb removes it; optional energy restoration is configured per window. Both use limited charges. Energy restoration requires version 18 saving; ordinary reflect/absorb windows require version 9. Test them with Arena comparison; the Studio incoming-hit probe is melee-only. Dodge and invulnerability take precedence, then reflect/absorb, parry, guard and armor. Parry prevents an eligible hit and briefly interrupts its attacker. Invulnerability prevents eligible damage and hit reactions. Armor takes damage but prevents ordinary hit reactions while the move continues. Status effects still apply. Timing uses frames since attack start. Armor and parry each have a hit limit; overlapping windows are used in list order.'));
 const mutate=change=>{try{const next=structuredClone(attack);change(next);validateAttack(next);commit(next);}catch(error){status(error.message);}};
 for(const kind of ['armor','invulnerability','parry','reflect','absorb']){
  const add=make('button',`Add ${kind} window`);add.type='button';add.disabled=(attack.defenseWindows?.length||0)>=8;
  add.onclick=()=>mutate(next=>{(next.defenseWindows??=[]).push({id:'defense_'+crypto.randomUUID().replaceAll('-',''),kind,start:0,duration:12,...(kind==='invulnerability'?{}:{hits:1}),...(kind==='parry'?{stun:8}:{}),against:['reflect','absorb'].includes(kind)?'projectile':kind==='parry'?'melee':'all'});});root.append(add);
 }
 for(const [index,window] of (attack.defenseWindows||[]).entries()){
  const title=window.kind==='armor'?'Armor':window.kind==='parry'?'Parry':window.kind==='reflect'?'Reflect':window.kind==='absorb'?'Absorb':'Invulnerability';
  const section=make('fieldset');section.append(make('legend',title+' '+(index+1)));
  for(const [name,key,min,max] of [['Start frame','start',0,899],['Duration','duration',1,900],['Hit limit','hits',1,10],['Interruption frames','stun',1,60]]){
   if(key==='hits'&&window.kind==='invulnerability'||key==='stun'&&window.kind!=='parry')continue;
   const label=make('label',name),input=make('input');input.type='number';input.min=min;input.max=max;input.step=1;input.value=window[key];input.setAttribute('aria-label',`${title} ${index+1} ${name.toLowerCase()}`);
   input.onchange=()=>{const value=Number(input.value);if(input.value===''||!Number.isInteger(value)||value<min||value>max||((key==='start'?value:window.start)+(key==='duration'?value:window.duration)>900)){status('Use whole frames within 0–900 and a hit limit of 1–10, and interruption of 1–60 frames.');input.value=window[key];return;}mutate(next=>next.defenseWindows[index][key]=value);};label.append(input);section.append(label);
  }
  if(window.kind==='absorb'){
   const label=make('label','Energy restored per projectile (blank = none)'),input=make('input');input.type='number';input.min=0;input.max=100;input.step=1;input.value=window.energyGain??'';input.setAttribute('aria-label',`Absorb ${index+1} energy restored`);
   input.onchange=()=>{const value=Number(input.value);if(input.value!==''&&(!Number.isInteger(value)||value<0||value>100)){status('Use 0–100 whole energy points, or leave blank for none.');input.value=window.energyGain??'';return;}mutate(next=>{if(input.value==='')delete next.defenseWindows[index].energyGain;else next.defenseWindows[index].energyGain=value;});};label.append(input);section.append(label,make('p','Awarded once per absorbed projectile, capped at maximum energy. Exhausted windows, misses, reflection and invulnerability award none. Arena comparison reports the amount actually restored.'));
  }
  const label=make('label','Protect against'),select=make('select');select.setAttribute('aria-label',`${title} ${index+1} attack types`);
  for(const [value,text] of [['all','All attack types'],['melee','Melee'],['projectile','Projectiles'],['area','Area attacks']])select.add(new Option(text,value));if(window.kind==='invulnerability')select.add(new Option('Throws','throw'));select.value=window.against;select.disabled=['reflect','absorb'].includes(window.kind);select.onchange=()=>mutate(next=>next.defenseWindows[index].against=select.value);label.append(select);section.append(label);
  const remove=make('button',`Delete ${window.kind} ${index+1}`);remove.type='button';remove.onclick=()=>mutate(next=>{next.defenseWindows.splice(index,1);if(!next.defenseWindows.length)delete next.defenseWindows;});section.append(remove);root.append(section);
 }
 const grabs=make('section');root.append(grabs);renderThrowEditor({root:grabs,attack,commit,status});
 const clash=make('section');root.append(clash);renderMeleeClashEditor({root:clash,attack,commit,status});
 const guard=make('section');root.append(guard);renderGuardEditor({root:guard,attack,commit,status});
 const feedback=make('section');root.append(feedback);renderContactFeedbackEditor({root:feedback,attack,commit,status});
 const bounce=make('section');root.append(bounce);renderBounceEditor({root:bounce,attack,commit,status});
 const hitstun=make('section');root.append(hitstun);renderHitstunEditor({root:hitstun,attack,commit,status});
 const counter=make('section');root.append(counter);renderCounterHitEditor({root:counter,attack,commit,status});
 const scaling=make('section');root.append(scaling);renderComboScalingEditor({root:scaling,attack,commit,status});
 compactSectionHelp(root);
}
