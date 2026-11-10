import {reconcileHitPropertyLinks} from './hit-property-links.js?v=20261109-hit-links';
import {validateAttack} from './combat-model.js?v=20261110-status-support-audit';
const make=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
export function renderBounceEditor({root,attack,eventId=null,commit,status}){
 root.replaceChildren();root.append(make('h3',eventId?'Selected hit bounces':'Boundary bounces'));
 if(attack.hitEvents&&!eventId){root.append(make('p','Choose a moving hit in Hit sequence to edit its bounces.'));return;}
 const subject=eventId?attack.hitEvents.find(e=>e.id===eventId):attack;
 const eligible=eventId?!['none','suspend'].includes(subject.reaction):['damage','push'].includes(attack.payload);
 root.append(make('p','One wall rebound and one floor rebound per airborne chain. Landing to bounce preserves juggle and air-recovery limits; final landing resets them. No extra damage is added. Requires version 16 saving.'));
 const mutate=fn=>{try{const next=structuredClone(attack),target=eventId?next.hitEvents.find(e=>e.id===eventId):next;fn(target);const resolved=reconcileHitPropertyLinks(attack,next);validateAttack(resolved);commit(resolved);return true;}catch(e){status(e.message);return false;}};
 for(const kind of ['wall','floor']){
  const title=kind==='wall'?'Wall':'Floor',rule=subject.bounces?.[kind],section=make('fieldset');section.append(make('legend',title+' bounce'));
  if(!rule){const add=make('button','Add '+kind+' bounce');add.type='button';add.disabled=!eligible||(!eventId&&attack[kind+'Slam']);add.onclick=()=>mutate(n=>{n.bounces??={};n.bounces[kind]={height:30,distance:30,frames:24};});section.append(add);if(add.disabled)section.append(make('p',eligible?'Turn off the matching slam before adding this bounce.':'Choose a moving damage or push reaction first.'));}
  else{
   for(const [key,label,min,max] of [['height','height (px)',1,150],['distance','distance (px)',0,150],['frames','duration (frames)',1,120]]){
    const l=make('label',title+' bounce '+label),input=make('input');Object.assign(input,{type:'number',min,max,step:1,value:rule[key]});input.setAttribute('aria-label',(eventId?'Selected hit ':'')+title+' bounce '+label);
    input.onchange=()=>{if(input.value===''||!mutate(n=>n.bounces[kind][key]=Number(input.value))){if(input.value==='')status('Enter a whole number within the displayed range.');input.value=rule[key];}};l.append(input);section.append(l);
   }
   const remove=make('button','Remove '+kind+' bounce');remove.type='button';remove.onclick=()=>mutate(n=>{delete n.bounces[kind];if(!Object.keys(n.bounces).length)delete n.bounces;});section.append(remove);
  }
  root.append(section);
 }
}
