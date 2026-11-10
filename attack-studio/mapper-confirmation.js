// Keep destructive decisions inside the editor, with an explicit keyboard exit.
export function confirmMapperDeletion(name,trigger){
 return new Promise(resolve=>{
  const dialog=document.createElement('dialog'),heading=document.createElement('h2'),description=document.createElement('p'),actions=document.createElement('div');
  dialog.className='mapper-confirmation';heading.id='mapper-delete-heading';heading.textContent='Delete '+name+'?';
  dialog.setAttribute('aria-labelledby',heading.id);description.id='mapper-delete-description';dialog.setAttribute('aria-describedby',description.id);
  description.textContent='Remove this attack and its assignment from the current project. Character artwork and other attacks stay available. You can reopen a previously downloaded project to restore it.';
  const cancel=document.createElement('button'),remove=document.createElement('button');cancel.type=remove.type='button';cancel.textContent='Cancel';remove.textContent='Delete attack';remove.className='danger';actions.className='mapper-confirmation-actions';actions.append(cancel,remove);dialog.append(heading,description,actions);
  let finished=false;
  const finish=answer=>{if(finished)return;finished=true;dialog.close();dialog.remove();trigger?.focus();resolve(answer);};
  cancel.onclick=()=>finish(false);remove.onclick=()=>finish(true);
  dialog.addEventListener('cancel',event=>{event.preventDefault();finish(false);});
  dialog.addEventListener('close',()=>finish(false));
  document.body.append(dialog);dialog.showModal();cancel.focus();
 });
}
