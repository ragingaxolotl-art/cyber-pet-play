import {workspaceObjects,objectEntry,objectState,setObjectState,groupObjects,duplicateWorkspaceObjects} from './workspace-objects.js?v=20261110-browser-audit';
import {addContextHelp} from './context-help.js';
const selections=new Map(),make=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
export function renderWorkspaceObjects({root,project,attack,effects,selected,select,commit,status}){
 const scroll=root.scrollTop,focus=root.contains?.(document.activeElement)?document.activeElement.getAttribute('aria-label'):null;root.replaceChildren();const title=make('h2','Layers & Objects'),note=make('p','Select an object to edit or drag it. Check several objects to group or duplicate them. Visible in preview changes only this editor picture, never damage or Arena behavior. Lock dragging prevents canvas movement and resizing; numeric settings remain editable. Names, groups and preview preferences are saved in your workspace backup, not the classroom attack bank.');root.append(title,note);addContextHelp(root,title,[note]);
 const objects=workspaceObjects(attack,effects),keys=new Set(objects.map(o=>o.key));let selection=selections.get(attack.id)||new Set();selection=new Set([...selection].filter(k=>keys.has(k)));selections.set(attack.id,selection);
 const mutate=fn=>{try{const next=structuredClone(project);fn(next);commit(next);return true;}catch(error){status(error.message);return false;}};
 const button=(host,text,action)=>{const b=make('button',text);b.type='button';b.onclick=action;host.append(b);return b;};
 const controls=make('div');controls.className='object-actions';const groupLabel=make('label','Group name'),groupName=make('input');groupName.maxLength=60;groupName.value='New group';groupName.setAttribute('aria-label','Object group name');groupLabel.append(groupName);controls.append(groupLabel);
 const groupButton=button(controls,'Group selected objects',()=>mutate(next=>groupObjects(next,attack.id,[...selection],groupName.value)));
 const duplicate=button(controls,'Duplicate selected objects',()=>{try{const result=duplicateWorkspaceObjects(project,attack.id,[...selection],effects);selections.set(attack.id,new Set(result.keys));commit(result.project);select(result.keys[0]);status('Duplicated objects. Hitboxes share their original hit group to avoid duplicate damage.');}catch(error){status(error.message);}});
 button(controls,'Clear object selection',()=>{selection.clear();for(const input of root.querySelectorAll('[data-object-selection]'))input.checked=false;update();});
 const count=make('output');const update=()=>{count.textContent=selection.size+' selected';groupButton.disabled=!selection.size;duplicate.disabled=!selection.size||objects.some(o=>selection.has(o.key)&&!o.duplicate);};controls.append(count);root.append(controls);
 function toggle(host,label,checked,change,text=label){const l=make('label',text),input=make('input');input.type='checkbox';input.checked=checked;input.setAttribute('aria-label',label);input.onchange=()=>change(input.checked);l.append(input);host.append(l);return input;}
 const state=objectEntry(project,attack.id);
 function objectRow(object,host){
  const settings=objectState(project,attack.id,object.key),name=settings.name||object.name,row=make('div');row.className='workspace-object-row';row.setAttribute('data-object-key',object.key);
  const pick=toggle(row,'Include '+name,selection.has(object.key),checked=>{checked?selection.add(object.key):selection.delete(object.key);update();},'Select');pick.setAttribute('data-object-selection',object.key);
  const active=button(row,name,()=>select(object.key));active.setAttribute('aria-pressed',String(selected===object.key));active.className='object-select';
  toggle(row,'Visible in preview · '+name,!settings.hidden,visible=>mutate(next=>setObjectState(next,attack.id,[object.key],{hidden:!visible})), 'Visible');
  toggle(row,'Lock dragging · '+name,!!settings.locked,locked=>mutate(next=>setObjectState(next,attack.id,[object.key],{locked})), 'Lock dragging');
  host.append(row);
 }
 const grouped=new Set();for(const group of state.groups){const section=make('fieldset'),legend=make('legend',group.name);section.append(legend);const rename=make('input');rename.value=group.name;rename.maxLength=60;rename.setAttribute('aria-label','Rename object group '+group.name);rename.onchange=()=>mutate(next=>{next.editorObjects.attacks[attack.id].groups.find(g=>g.id===group.id).name=rename.value.trim();});section.append(rename);const members=group.members.filter(k=>keys.has(k));members.forEach(k=>grouped.add(k));
  toggle(section,'Show group in preview · '+group.name,members.every(k=>!objectState(project,attack.id,k).hidden),visible=>mutate(next=>setObjectState(next,attack.id,members,{hidden:!visible})));
  toggle(section,'Lock group dragging · '+group.name,members.every(k=>objectState(project,attack.id,k).locked),locked=>mutate(next=>setObjectState(next,attack.id,members,{locked})));
  button(section,'Ungroup '+group.name,()=>mutate(next=>{next.editorObjects.attacks[attack.id].groups=next.editorObjects.attacks[attack.id].groups.filter(g=>g.id!==group.id);}));
  for(const object of objects.filter(o=>members.includes(o.key)))objectRow(object,section);root.append(section);
 }
 for(const object of objects.filter(o=>!grouped.has(o.key)))objectRow(object,root);
 update();root.scrollTop=scroll;if(focus)[...root.querySelectorAll('[aria-label]')].find(n=>n.getAttribute('aria-label')===focus)?.focus({preventScroll:true});
}
