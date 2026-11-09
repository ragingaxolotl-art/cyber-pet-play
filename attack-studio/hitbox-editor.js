import {renderHitboxRotation} from './hitbox-rotation-editor.js?v=20261109-projectile-flight-release';
import {validateAttack} from './combat-model.js?v=20261109-projectile-flight-release';
const make=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
const unique=prefix=>prefix+crypto.randomUUID().replaceAll('-','');
let selectedBox=null;
export const selectedHitbox=()=>selectedBox;
export function selectHitbox(id){selectedBox=id;}
export function renderHitboxEditor({root,attack,commit,status}){
 const section=make('section');section.setAttribute('aria-label','Multiple hitboxes');root.append(section);
 section.append(make('h3','Multiple hitboxes'));
 function mutate(change){try{const next=structuredClone(attack);change(next);validateAttack(next);commit(next);}catch(e){status(e.message);}}
 function button(text,run,disabled=false){const b=make('button',text);b.type='button';b.disabled=disabled;b.onclick=run;section.append(b);return b;}
 if(!attack.hitboxGroups){
  renderHitboxRotation({root:section,attack,commit,status});
  const supported=(attack.hitEvents||attack.impactTrigger!=='contact')&&attack.payload==='damage'&&attack.delivery!=='self';
  section.append(make('p',supported?'Group overlapping boxes to count them as one hit. Separate groups can hit independently.':'Groups work with timed damage attacks or independent contact sequences.'));
  button('Add multiple hitboxes',()=>mutate(next=>{selectedBox=unique('box_');next.hitboxGroups=[{id:unique('group_'),hitLimit:next.hitLimit,hitInterval:next.hitInterval,boxes:[{...next.box,shape:next.box.shape||'rectangle',id:selectedBox,start:0,duration:next.active}]}];if(next.hitEvents)next.hitEvents.forEach(e=>e.hitboxGroup=next.hitboxGroups[0].id);}),!supported);return;
 }
 const groups=attack.hitboxGroups,all=groups.flatMap(g=>g.boxes),box=all.find(b=>b.id===selectedBox)||all[0];selectedBox=box.id;const group=groups.find(g=>g.boxes.includes(box));
 section.append(make('p',attack.hitEvents?'Group windows start at first contact. Each hit event uses its assigned group and applies damage once; ordinary group hit limits do not apply.':'Timing starts at the first active frame. Boxes in one group share hit limits; separate groups each apply the attack’s damage and reaction.'));
 const list=make('select');list.setAttribute('aria-label','Selected hitbox');all.forEach((b,i)=>{const g=groups.findIndex(g=>g.boxes.includes(b));list.add(new Option(`Box ${i+1} · group ${g+1}`,b.id));});list.value=box.id;list.onchange=()=>{selectedBox=list.value;commit(structuredClone(attack),false);};section.append(list);
 function input(title,key,object,min,max,values){const label=make('label',title),control=make(values?'select':'input');control.setAttribute('aria-label',title);
 if(values)values.forEach(v=>control.add(new Option(v,v)));else{control.type='number';control.min=min;control.max=max;control.step=1;}
 control.value=object[key];control.onchange=()=>{const value=values?control.value:Number(control.value);if(!values&&(control.value===''||!Number.isInteger(value)||value<min||value>max)){status(title+' is outside the allowed range.');control.value=object[key];return;}
 mutate(next=>{const g=next.hitboxGroups.find(g=>g.id===group.id),b=g.boxes.find(b=>b.id===box.id);(object===group?g:b)[key]=value;});};label.append(control);section.append(label);}
 if(!attack.hitEvents){input('Group maximum hits','hitLimit',group,1,10);input('Group frames between hits','hitInterval',group,1,300);}
 renderHitboxRotation({root:section,attack,boxId:box.id,commit,status});
 input('Box shape','shape',box,0,0,['rectangle','ellipse','diamond','triangle']);
 for(const [title,key,min,max] of [['Box forward offset','x',-500,500],['Box vertical offset','y',-500,500],['Box width','w',1,500],['Box height','h',1,500],['Box start frame','start',0,attack.active-1],['Box duration','duration',1,attack.active]])input(title,key,box,min,max);
 button('Duplicate box in group',()=>mutate(next=>{const g=next.hitboxGroups.find(g=>g.id===group.id);selectedBox=unique('box_');g.boxes.push({...box,id:selectedBox});}),all.length>=16);
 button('Duplicate as separate hit group',()=>mutate(next=>{selectedBox=unique('box_');next.hitboxGroups.push({id:unique('group_'),hitLimit:group.hitLimit,hitInterval:group.hitInterval,boxes:[{...box,id:selectedBox}]});}),all.length>=16||groups.length>=8);
 const assignment=make('select');assignment.setAttribute('aria-label','Hitbox group');groups.forEach((g,i)=>assignment.add(new Option('Group '+(i+1),g.id)));assignment.value=group.id;
 assignment.onchange=()=>mutate(next=>{const source=next.hitboxGroups.find(g=>g.id===group.id),target=next.hitboxGroups.find(g=>g.id===assignment.value);if(source===target)return;target.boxes.push(source.boxes.find(b=>b.id===box.id));source.boxes=source.boxes.filter(b=>b.id!==box.id);next.hitboxGroups=next.hitboxGroups.filter(g=>g.boxes.length);});section.append(assignment);
 button('Delete selected box',()=>mutate(next=>{for(const g of next.hitboxGroups)g.boxes=g.boxes.filter(b=>b.id!==box.id);next.hitboxGroups=next.hitboxGroups.filter(g=>g.boxes.length);selectedBox=null;}),all.length===1);
 button('Return to selected box only',()=>mutate(next=>{const {id,start,duration,...geometry}=box;next.box=geometry;next.hitLimit=group.hitLimit;next.hitInterval=group.hitInterval;delete next.hitboxGroups;if(next.hitEvents)next.hitEvents.forEach(e=>delete e.hitboxGroup);}));
}
