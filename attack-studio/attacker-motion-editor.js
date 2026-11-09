import {movementPreset,ATTACKER_MOTION_PRESETS} from './attacker-motion-presets.js?v=20261109-conditional-release';
import {addContextHelp} from './context-help.js';
import {validateAttack} from './combat-model.js?v=20261109-presentation-release';
const make=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
export function renderAttackerMotionEditor({root,attack,commit,status,timing}){
 const section=make('fieldset'),legend=make('legend','Attacker movement');section.style.gridColumn='1 / -1';section.append(legend);
 const mutate=change=>{try{const next=structuredClone(attack);change(next);next.attackerMotion?.sort((a,b)=>a.start-b.start);validateAttack(next);commit(next);return true;}catch(error){status(error.message);return false;}};
 const starter=make('select');starter.setAttribute('aria-label','Attacker movement starter');for(const [value,title] of ATTACKER_MOTION_PRESETS)starter.add(new Option(title,value));const apply=make('button','Apply movement starter');apply.type='button';apply.disabled=!!attack.attackerMotion?.length;apply.onclick=()=>mutate(next=>Object.assign(next,movementPreset(next,starter.value,timing)));section.append(starter,apply);
 const add=make('button','Add attacker movement');add.type='button';add.disabled=(attack.attackerMotion?.length||0)>=8;add.onclick=()=>mutate(next=>{const start=Math.max(0,...(next.attackerMotion||[]).map(s=>s.start+s.duration));(next.attackerMotion??=[]).push({id:'move_'+crypto.randomUUID().replaceAll('-',''),start,duration:6,forward:30,rise:0});});section.append(add);
 for(const [index,motion] of (attack.attackerMotion||[]).entries()){
  const row=make('fieldset');row.append(make('legend','Movement '+(index+1)));
  for(const [key,title,min,max] of [['start','Start frame',0,899],['duration','Duration',1,180],['forward','Forward distance',-300,300],['rise','Rise',-150,150]]){
   const label=make('label',title),input=make('input');Object.assign(input,{type:'number',min,max,step:1,value:motion[key]});input.setAttribute('aria-label',`Attacker movement ${index+1} ${title.toLowerCase()}`);
   input.onchange=()=>{if(input.value===''){status('Enter a movement value.');input.value=motion[key];return;}if(!mutate(next=>next.attackerMotion.find(s=>s.id===motion.id)[key]=Number(input.value)))input.value=motion[key];};label.append(input);row.append(label);
  }
  const remove=make('button','Delete movement '+(index+1));remove.type='button';remove.onclick=()=>mutate(next=>{next.attackerMotion=next.attackerMotion.filter(s=>s.id!==motion.id);if(!next.attackerMotion.length)delete next.attackerMotion;});row.append(remove);section.append(row);
 }
 const note=make('p','Moves the fighter and cast-owned hitboxes, separate from the artwork/hitbox path. Positive forward follows the cast facing; negative moves backward. Positive rise moves up; negative moves down. Segments cannot overlap. Vertical segments control height; ordinary gravity resumes in gaps. Walls and floor stop travel. Hits, stun and throws interrupt movement. The last segment can extend recovery, but never active hit windows. Independently launched projectiles keep their launch origin. Timing uses combat frames; impact pauses freeze movement. Saving requires version 32 support.');section.append(note);addContextHelp(section,legend,[note]);root.append(section);
}
