/** Review a local import before committing it to browser storage. */
export function reviewImport({title,description,items,action='Import as new data set'}){
 return new Promise(resolve=>{
  const previous=document.activeElement,dialog=document.createElement('dialog'),heading=document.createElement('h2'),note=document.createElement('p'),list=document.createElement('ul'),accept=document.createElement('button'),cancel=document.createElement('button');
  dialog.className='editor-import-dialog';dialog.setAttribute('aria-label',title);heading.textContent=title;note.textContent=description;
  for(const text of items){const item=document.createElement('li');item.textContent=text;list.append(item);}
  accept.textContent=action;cancel.textContent='Cancel';const finish=result=>{dialog.close();dialog.remove();const menu=previous?.closest('details');(menu&&!menu.open?menu.querySelector('summary'):previous)?.focus();resolve(result);};
  accept.onclick=()=>finish(true);cancel.onclick=()=>finish(false);dialog.addEventListener('cancel',event=>{event.preventDefault();finish(false);});
  dialog.append(heading,note,list,accept,cancel);document.body.append(dialog);dialog.showModal();cancel.focus();
 });
}
