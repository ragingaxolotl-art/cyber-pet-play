import {addContextHelp} from './context-help.js?v=20261109-guard';
import {validateAttack} from './combat-model.js?v=20261109-throw-release';
export function renderProjectileSplitEditor({root,attack,commit,status}) {
 const section=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent='Split projectile';section.append(legend);
 const label=document.createElement('label');label.textContent='During flight';const mode=document.createElement('select');mode.setAttribute('aria-label','Projectile splitting');
 for(const [value,text] of [['off','Keep one projectile'],['on','Split into a fan']]){const option=document.createElement('option');option.value=value;option.textContent=text;mode.append(option);}
 mode.value=attack.projectileSplit?'on':'off';label.append(mode);section.append(label);
 const mutate=fn=>{try{const next=structuredClone(attack);fn(next);validateAttack(next);commit(next);return true;}catch(error){status(error.message);return false;}};
 mode.onchange=()=>{if(!mutate(next=>{if(mode.value==='off')delete next.projectileSplit;else next.projectileSplit={afterFrames:Math.min(10,next.projectileLifetime-1),count:3,spread:30,speed:4,lifetime:60};}))mode.value=attack.projectileSplit?'on':'off';};
 if(attack.projectileSplit)for(const [key,title,min,max] of [['afterFrames','Split delay after launch (frames)',1,Math.min(300,attack.projectileLifetime-1)],['count','Child projectiles',2,5],['spread','Fan spread (degrees)',0,180],['speed','Child speed (px per frame)',1,12],['lifetime','Child lifetime (frames)',1,300]]){
  const label=document.createElement('label');label.textContent=title;const input=document.createElement('input');Object.assign(input,{type:'number',min,max,step:1,value:attack.projectileSplit[key]});input.setAttribute('aria-label',title);
  input.onchange=()=>{if(input.value===''||!mutate(next=>next.projectileSplit[key]=Number(input.value))){if(input.value==='')status('Enter a whole number in the displayed range.');input.value=attack.projectileSplit[key];}};label.append(input);section.append(label);
 }
 const note=document.createElement('p');note.textContent='The parent ends at the chosen delay after launch. Children begin on the next combat frame, spreading evenly around its travel direction. Each child inherits artwork, damage, reactions and contact rules, with its own hit budget. Children travel straight; homing, return paths and further splits are not inherited. Contact can end the parent before it splits. Saving requires version 22 support. Undo restores previous settings.';section.append(note);addContextHelp(section,legend,[note]);root.append(section);
}
