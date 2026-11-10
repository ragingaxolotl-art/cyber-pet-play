import {renderImpactAreaArtEditor} from './impact-area-art-editor.js?v=20261109-area-search';
import {addContextHelp} from './context-help.js?v=20261109-guard';
import {validateAttack} from './combat-model.js?v=20261110-library-management';
export function renderProjectileAreaEditor({root,attack,commit,status,effects=new Map()}){
 const section=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent='Impact area';section.append(legend);
 const label=document.createElement('label');label.textContent='After first contact';const mode=document.createElement('select');mode.setAttribute('aria-label','Projectile impact area');
 for(const [value,text] of [['off','No area'],['on','Leave a stationary damaging area'],['blast','Expanding explosion · one hit']]){const option=document.createElement('option');option.value=value;option.textContent=text;mode.append(option);}const currentMode=()=>attack.projectileArea?.blastFrames!==undefined?'blast':attack.projectileArea?'on':'off';mode.value=currentMode();label.append(mode);section.append(label);
 const mutate=fn=>{try{const next=structuredClone(attack);fn(next);validateAttack(next);commit(next);return true;}catch(error){status(error.message);return false;}};
 mode.onchange=()=>{if(!mutate(next=>{if(mode.value==='off')delete next.projectileArea;else {next.projectileContact='single';next.projectileArea=mode.value==='blast'?{width:120,height:120,duration:20,interval:1,hitLimit:1,damage:9,blastFrames:6}:{width:80,height:60,duration:90,interval:15,hitLimit:5,damage:3};}}))mode.value=currentMode();};
 if(attack.projectileArea){
  for(const [key,title,min,max] of [['width','Area width (px)',1,500],['height','Area height (px)',1,500],['duration','Area lifetime (frames)',1,600],['interval','Area hit interval (frames)',1,300],['hitLimit','Area maximum hits per target',1,10],['damage','Area damage per hit',0,500]]){
   if(attack.projectileArea.blastFrames!==undefined&&['interval','hitLimit'].includes(key))continue;
   const label=document.createElement('label');label.textContent=title;const input=document.createElement('input');Object.assign(input,{type:'number',min,max,step:1,value:attack.projectileArea[key]});input.setAttribute('aria-label',title);
   input.onchange=()=>{if(input.value===''||!mutate(next=>next.projectileArea[key]=Number(input.value))){if(input.value==='')status('Enter a whole number in the displayed range.');input.value=attack.projectileArea[key];}};label.append(input);section.append(label);
  }
 }
 if(attack.projectileArea?.blastFrames!==undefined){
  const label=document.createElement('label');label.textContent='Explosion expansion (frames)';const input=document.createElement('input');Object.assign(input,{type:'number',min:1,max:attack.projectileArea.duration,step:1,value:attack.projectileArea.blastFrames});input.setAttribute('aria-label','Explosion expansion (frames)');
  input.onchange=()=>{if(input.value===''||!mutate(next=>next.projectileArea.blastFrames=Number(input.value))){if(input.value==='')status('Enter expansion frames from 1 through the area lifetime.');input.value=attack.projectileArea.blastFrames;}};label.append(input);section.append(label);
 }
 if(attack.projectileArea)renderImpactAreaArtEditor({root:section,attack,effects,mutate});
 const note=document.createElement('p');note.textContent='The first successful hit or block replaces the projectile with an area at that contact position. Damage starts on the following combat frame. Targets must stay inside or return to be hit again. Area damage is fixed, without extra knockback, hitstun or status effects; shields, guard and invulnerability still apply. The area survives owner interruption and ends on expiry, parry, reset or defeat. Maximum 16 areas per owner. Persistent areas require version 20 support. Explosions require version 21: an ellipse grows from the contact center to the selected width and height, hitting each target at most once. Expansion must fit within its lifetime. Both behaviors add fixed damage without extra reactions. Switching behavior loads its defaults; Undo restores your previous settings.';section.append(note);addContextHelp(section,legend,[note]);root.append(section);
}
