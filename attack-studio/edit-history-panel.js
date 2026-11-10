import {addContextHelp} from './context-help.js';
const make=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
export function describeEdit({field='',button='',before,after,selected}){
 if(field){const name=field.replace(/([a-z])([A-Z])/g,'$1 $2').replaceAll('_',' ');return 'Edit '+name.toLowerCase();}
 if(after?.attacks?.length>before?.attacks?.length)return 'Add attack';
 if(after?.attacks?.length<before?.attacks?.length)return 'Delete attack';
 const old=before?.attacks?.find(a=>a.id===selected),next=after?.attacks?.find(a=>a.id===selected);
 if(old&&next){
  if(old.name!==next.name)return 'Rename attack';
  const changed=Object.keys({...old,...next}).filter(key=>JSON.stringify(old[key])!==JSON.stringify(next[key]));
  if(changed.length===1&&!['visuals','poseFrames','attackerMotion'].includes(changed[0])){const labels={base:'base amount',coefficient:'stat scaling',startup:'startup',active:'active duration',cost:'energy cost',box:'hitbox',motion:'character animation',poseTiming:'character timing',poseDurations:'character frame durations',hitEvents:'hit sequence',defenseWindows:'defense windows',cancelWindows:'follow-up windows'};return 'Edit '+(labels[changed[0]]||changed[0].replace(/([a-z])([A-Z])/g,'$1 $2').toLowerCase());}
  if(old.visuals.length!==next.visuals.length)return next.visuals.length>old.visuals.length?'Add effect layer':'Remove effect layer';
  if(JSON.stringify(old.poseFrames)!==JSON.stringify(next.poseFrames))return 'Edit character frames';
  if(JSON.stringify(old.attackerMotion)!==JSON.stringify(next.attackerMotion))return 'Edit attacker movement';
  if(JSON.stringify(old.visuals)!==JSON.stringify(next.visuals))return 'Edit effect layer';
 }
 if(JSON.stringify(before?.editorObjects)!==JSON.stringify(after?.editorObjects))return 'Edit object names, groups or preview settings';
 if(JSON.stringify(before?.testBench)!==JSON.stringify(after?.testBench))return 'Edit test scenario';
 if(button&&!/^(Undo|Redo|Save|Download)/i.test(button))return button.trim().slice(0,100);
 return 'Edit attack';
}
export function renderEditHistory({root,history,restore}){
 const previous=root.querySelector('.edit-history-list'),scroll=previous?.scrollTop||0,atEnd=!previous||scroll+previous.clientHeight>=previous.scrollHeight-4;root.replaceChildren();
 const title=make('h2','History'),note=make('p','Recent workspace edits for this session. Return to a step to undo or redo. Layout history stays in Workspace; use Attack revisions in File for saved versions.');root.append(title,note);addContextHelp(root,title,[note]);
 const current=make('p');current.setAttribute('role','status');current.textContent=history.transaction?'Moving object · release to finish, Escape to cancel':`Current: ${history.currentLabel}`;root.append(current);
 const list=make('ol');list.className='edit-history-list';list.setAttribute('aria-label','Recent workspace edits');
 for(const entry of history.entries()){
  const item=make('li'),button=make('button',`${entry.index+1}. ${entry.label}${entry.current?' · current':entry.future?' · redo':''}`);button.type='button';button.disabled=!!history.transaction;button.setAttribute('aria-disabled',String(entry.current||!!history.transaction));
  button.setAttribute('aria-label',`Return to history step ${entry.index+1}: ${entry.label}`);if(entry.current)button.setAttribute('aria-current','step');
  button.onclick=()=>{if(entry.current||history.transaction)return;restore(entry.index);root.querySelector('[aria-current="step"]')?.focus();};item.append(button);list.append(item);
 }
 root.append(list);list.scrollTop=atEnd?list.scrollHeight:scroll;
}
