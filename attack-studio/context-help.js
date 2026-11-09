// Keep instructions available without occupying the editing workspace.
export function addContextHelp(root,heading,paragraphs){
 const notes=paragraphs.filter(p=>p&&p.textContent.trim());if(!heading||!notes.length)return;
 const title=heading.textContent.trim(),button=document.createElement('button'),dialog=document.createElement('dialog'),name=document.createElement('h2'),close=document.createElement('button');
 button.type='button';button.className='context-help-button';button.setAttribute('aria-label','Help: '+title);button.setAttribute('aria-haspopup','dialog');
 dialog.className='context-help-dialog';dialog.setAttribute('aria-label',title+' help');name.textContent=title;dialog.append(name);
 for(const note of notes){const text=document.createElement('p');text.textContent=note.textContent;dialog.append(text);note.hidden=true;}
 close.type='button';close.textContent='Close';close.onclick=()=>dialog.close();dialog.append(close);button.onclick=event=>{event?.preventDefault?.();event?.stopPropagation?.();dialog.showModal();};dialog.addEventListener('close',()=>button.focus());heading.append(button);root.append(dialog);
}
export function compactSectionHelp(root){
 for(const heading of [...root.querySelectorAll('h2,h3')]){
  if(heading.closest('dialog'))continue;
  const parent=heading.parentElement,notes=[...parent.children].filter(n=>n.tagName==='P'&&n.getAttribute('role')===null&&!n.hidden);
  addContextHelp(root,heading,notes);
 }
}
