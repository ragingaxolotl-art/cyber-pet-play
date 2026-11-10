import {renderImpulseEditor} from './impulse-editor.js?v=20261109-momentum-release';
import {validateReactionAlternatives} from './conditional-reactions.js?v=20261110-results-navigation';
const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
export function renderConditionalReactions({root,event,commit,status}){
 const section=el('details');section.open=!!event.reactionAlternatives;
 section.append(el('summary','Grounded / airborne reactions'));
 section.append(el('p','Choose a different reaction based on target height at contact. Damage and hit timing stay unchanged. Each alternative has independent settings. A later hit can replace the reaction before its bounce completes. Saving requires version 33.'));
 const change=fn=>{try{const next=structuredClone(event);fn(next);validateReactionAlternatives(next.reactionAlternatives);commit(next);return true;}catch(error){status(error.message);return false;}};
 for(const when of ['grounded','airborne']){
  const rule=event.reactionAlternatives?.find(r=>r.when===when),group=el('fieldset');group.append(el('legend','When target is '+when));
  if(!rule){const add=el('button','Customize '+when+' reaction');add.type='button';add.onclick=()=>change(next=>{const alternative={when};for(const key of ['reaction','height','knockback','frames','hold','hitstun','bounces','impulse'])if(next[key]!==undefined)alternative[key]=structuredClone(next[key]);(next.reactionAlternatives??=[]).push(alternative);});group.append(add);}
  else{
   const select=el('select');select.setAttribute('aria-label',when+' alternative reaction');for(const value of ['launch','suspend','relaunch','spike','knockback','none'])select.add(new Option(value,value));select.value=rule.reaction;
   select.onchange=()=>{if(!change(next=>next.reactionAlternatives.find(r=>r.when===when).reaction=select.value))select.value=rule.reaction;};group.append(select);
   for(const [key,title,min,max] of [['height','Launch height',0,150],['knockback','Knockback',0,150],['frames','Travel frames',1,120],['hold','Suspend frames',1,30],['hitstun','Hitstun (blank uses reaction)',0,120]]){
    const label=el('label',title),input=el('input');Object.assign(input,{type:'number',min,max,step:1,value:rule[key]??''});input.setAttribute('aria-label',when+' alternative '+key);
    input.onchange=()=>{if(!change(next=>{const r=next.reactionAlternatives.find(r=>r.when===when);if(key==='hitstun'&&input.value==='')delete r[key];else{if(input.value==='')throw Error('Enter a value.');r[key]=Number(input.value);}}))input.value=rule[key]??'';};label.append(input);group.append(label);
   }
   for(const kind of ['wall','floor']){
    const bounce=rule.bounces?.[kind],row=el('fieldset');row.append(el('legend',kind==='wall'?'Wall bounce':'Floor bounce'));
    if(!bounce){const add=el('button','Add '+when+' '+kind+' bounce');add.type='button';add.disabled=['none','suspend'].includes(rule.reaction);add.onclick=()=>change(next=>{const r=next.reactionAlternatives.find(r=>r.when===when);r.bounces??={};r.bounces[kind]={height:30,distance:30,frames:24};});row.append(add);}
    else{
     for(const [key,min,max] of [['height',1,150],['distance',0,150],['frames',1,120]]){
      const label=el('label',key),input=el('input');Object.assign(input,{type:'number',min,max,step:1,value:bounce[key]});input.setAttribute('aria-label',when+' '+kind+' bounce '+key);
      input.onchange=()=>{if(!change(next=>{if(input.value==='')throw Error('Enter a bounce value.');next.reactionAlternatives.find(r=>r.when===when).bounces[kind][key]=Number(input.value);}))input.value=bounce[key];};label.append(input);row.append(label);
     }
     const removeBounce=el('button','Remove '+when+' '+kind+' bounce');removeBounce.type='button';removeBounce.onclick=()=>change(next=>{const r=next.reactionAlternatives.find(r=>r.when===when);delete r.bounces[kind];if(!Object.keys(r.bounces).length)delete r.bounces;});row.append(removeBounce);
    }group.append(row);
   }
   renderImpulseEditor({root:group,event:rule,label:when+' alternative',status,commit:edited=>change(next=>{next.reactionAlternatives[next.reactionAlternatives.findIndex(r=>r.when===when)]=edited;})});
   const remove=el('button','Use default for '+when);remove.type='button';remove.onclick=()=>change(next=>{next.reactionAlternatives=next.reactionAlternatives.filter(r=>r.when!==when);if(!next.reactionAlternatives.length)delete next.reactionAlternatives;});group.append(remove);
  }section.append(group);
 }root.append(section);
}
