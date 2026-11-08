import {addContextHelp} from './context-help.js?v=20261108-static-help';
import {validateAttack} from './combat-model.js?v=20261108-area-final';
export function renderProjectileAreaEditor({root,attack,commit,status}){
 const section=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent='Impact area';section.append(legend);
 const label=document.createElement('label');label.textContent='After first contact';const mode=document.createElement('select');mode.setAttribute('aria-label','Projectile impact area');
 for(const [value,text] of [['off','No area'],['on','Leave a stationary damaging area']]){const option=document.createElement('option');option.value=value;option.textContent=text;mode.append(option);}mode.value=attack.projectileArea?'on':'off';label.append(mode);section.append(label);
 const mutate=fn=>{try{const next=structuredClone(attack);fn(next);validateAttack(next);commit(next);return true;}catch(error){status(error.message);return false;}};
 mode.onchange=()=>{if(!mutate(next=>{if(mode.value==='off')delete next.projectileArea;else {next.projectileContact='single';next.projectileArea={width:80,height:60,duration:90,interval:15,hitLimit:5,damage:3};}}))mode.value=attack.projectileArea?'on':'off';};
 if(attack.projectileArea){
  for(const [key,title,min,max] of [['width','Area width (px)',1,500],['height','Area height (px)',1,500],['duration','Area lifetime (frames)',1,600],['interval','Area hit interval (frames)',1,300],['hitLimit','Area maximum hits per target',1,10],['damage','Area damage per hit',0,500]]){
   const label=document.createElement('label');label.textContent=title;const input=document.createElement('input');Object.assign(input,{type:'number',min,max,step:1,value:attack.projectileArea[key]});input.setAttribute('aria-label',title);
   input.onchange=()=>{if(input.value===''||!mutate(next=>next.projectileArea[key]=Number(input.value))){if(input.value==='')status('Enter a whole number in the displayed range.');input.value=attack.projectileArea[key];}};label.append(input);section.append(label);
  }
 }
 const note=document.createElement('p');note.textContent='The first successful hit or block replaces the projectile with an area at that contact position. Damage starts on the following combat frame. Targets must stay inside or return to be hit again. Area damage is fixed, without extra knockback, hitstun or status effects; shields, guard and invulnerability still apply. The area survives owner interruption and ends on expiry, parry, reset or defeat. Maximum 16 areas per owner. Saving requires version 20 support.';section.append(note);addContextHelp(section,legend,[note]);root.append(section);
}
