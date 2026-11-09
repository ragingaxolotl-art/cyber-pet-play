import {validateAttack} from './combat-model.js?v=20261109-hurtboxes';
import {addContextHelp} from './context-help.js';
export function renderHitboxRotation({root,attack,boxId,commit,status}){
 const box=boxId?attack.hitboxGroups.flatMap(g=>g.boxes).find(b=>b.id===boxId):attack.box;
 const section=document.createElement('section'),heading=document.createElement('h3');heading.textContent='Hitbox rotation';section.append(heading);
 const label=document.createElement('label');label.textContent='Angle (degrees; blank = no rotation)';const input=document.createElement('input');Object.assign(input,{type:'number',min:-180,max:180,step:1,value:box.rotation??''});input.setAttribute('aria-label',boxId?'Selected hitbox rotation':'Hitbox rotation');
 input.onchange=()=>{try{const next=structuredClone(attack),target=boxId?next.hitboxGroups.flatMap(g=>g.boxes).find(b=>b.id===boxId):next.box;if(input.value==='')delete target.rotation;else target.rotation=Number(input.value);validateAttack(next);commit(next);}catch(error){status(error.message);input.value=box.rotation??'';}};
 label.append(input);section.append(label);const note=document.createElement('p');note.textContent='Rotate around the hitbox center. Positive angles turn clockwise when facing right; facing left mirrors the shape. Drag the rotated handles to resize along its own axes. Artwork rotation is separate. Clear the field to remove rotation. Saving an angle requires version 24 support.';section.append(note);addContextHelp(section,heading,[note]);root.append(section);
}
