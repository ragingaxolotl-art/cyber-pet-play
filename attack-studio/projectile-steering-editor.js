import {addContextHelp} from './context-help.js?v=20261109-guard';
import {validateAttack} from './combat-model.js?v=20261109-projectile-flight-release';
const make=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
export function renderSteeringEditor({root,attack,commit,status}){
 const section=make('fieldset');section.append(make('legend','Projectile steering'));
 const mutate=fn=>{try{const next=structuredClone(attack);fn(next);validateAttack(next);commit(next);return true;}catch(e){status(e.message);return false;}};
 const label=make('label','Travel behavior'),mode=make('select');mode.setAttribute('aria-label','Projectile steering');
 for(const [value,title] of [['off','Straight / authored path'],['homing','Home toward opponent'],['return','Return to owner']])mode.add(new Option(title,value));
 mode.value=attack.projectileSteering?.mode??'off';mode.disabled=!!attack.motionPath?.length||!!attack.projectileFlight;
 mode.onchange=()=>{if(!mutate(n=>{if(mode.value==='off')delete n.projectileSteering;else n.projectileSteering={mode:mode.value,turnRate:n.projectileSteering?.turnRate??10,...(mode.value==='return'?{returnAfter:30}:{})};}))mode.value=attack.projectileSteering?.mode??'off';};label.append(mode);section.append(label);
 if(mode.disabled){const warning=make('p','Turn off ballistic flight and remove any authored movement path to enable steering.');warning.setAttribute('role','status');section.append(warning);}
 if(attack.projectileSteering){
  for(const [key,title,min,max] of [['turnRate','Maximum turn (degrees per frame)',1,180],['returnAfter','Start returning after (combat frames)',1,600]]){
   if(key==='returnAfter'&&attack.projectileSteering.mode!=='return')continue;
   const l=make('label',title),input=make('input');Object.assign(input,{type:'number',min,max,step:1,value:attack.projectileSteering[key]});input.setAttribute('aria-label',title);
   input.onchange=()=>{if(input.value===''||!mutate(n=>n.projectileSteering[key]=Number(input.value))){if(input.value==='')status('Enter a whole number within the displayed range.');input.value=attack.projectileSteering[key];}};l.append(input);section.append(l);
  }
  section.append(make('p','Requires version 17 saving. Speed stays constant. Return delay starts at launch; catching removes the projectile without hurting its owner. Reflection changes the owner without restarting the delay. Attachment takes over movement after contact. Lifetime and active windows can end travel before a return completes.'));
 }
 addContextHelp(section,section.querySelector('legend'),[...section.children].filter(n=>n.tagName==='P'&&n.getAttribute('role')===null));
 root.append(section);
}
