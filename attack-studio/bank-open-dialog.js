// Property order does not make an otherwise identical saved attack a conflict.
function canonical(value){
 if(Array.isArray(value))return value.map(canonical);
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])]));
 return value;
}
export function bankOpenConflicts(working,incoming){
 return incoming.filter(saved=>{const draft=working.find(item=>item.id===saved.id);return draft&&JSON.stringify(canonical(draft))!==JSON.stringify(canonical(saved));}).map(item=>item.name);
}
export function confirmBankReplacement(names){
 return new Promise(resolve=>{
  const previous=document.activeElement,dialog=document.createElement('dialog');dialog.className='editor-name-dialog';dialog.setAttribute('aria-label','Replace working attack edits?');dialog.style.cssText='max-width:min(560px,90vw);max-height:85dvh;overflow:auto';
  const heading=document.createElement('h2');heading.textContent='Replace working attack edits?';
  const description=document.createElement('p');description.textContent='The saved bank version differs from these working attacks. Opening it will replace their current settings. Other working attacks stay in your workspace.';
  const list=document.createElement('ul');for(const name of names){const item=document.createElement('li');item.textContent=name;list.append(item);}
  const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Keep working edits';
  const replace=document.createElement('button');replace.type='button';replace.textContent='Open saved version';
  let finished=false;const finish=value=>{if(finished)return;finished=true;dialog.close();dialog.remove();previous?.focus();resolve(value);};
  cancel.onclick=()=>finish(false);replace.onclick=()=>finish(true);dialog.addEventListener('cancel',event=>{event.preventDefault();finish(false);});dialog.addEventListener('close',()=>finish(false));
  dialog.append(heading,description,list,cancel,replace);document.body.append(dialog);dialog.showModal();cancel.focus();
 });
}
