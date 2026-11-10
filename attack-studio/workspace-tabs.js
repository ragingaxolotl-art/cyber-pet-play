import {tabGroup,normalizeTabs} from './workspace-layout-model.js?v=20261110-workspace-sizing';

// Persistent tab buttons retain keyboard focus. Panels keep their existing DOM
// and event listeners: switching a tab must never rebuild an editor or draft.
export function createWorkspaceTabs(state,records,select){
 const views=new Map();
 const record=id=>records.find(r=>r.id===id);
 function destination(id){return views.get(tabGroup(state,id)?.id)?.shell;}
 function sync(stacked=false){
  normalizeTabs(state);
  for(const r of records){
   r.shell.removeAttribute('role');r.shell.removeAttribute('aria-labelledby');
   r.shell.removeAttribute('id');
   if(!stacked)r.shell.hidden=r.state.hidden;
  }
  for(const group of stacked?[]:state.tabs){
   let view=views.get(group.id);
   if(!view){
    const shell=document.createElement('section'),bar=document.createElement('div');
    shell.className='workspace-tab-group';bar.className='workspace-tabs';
    bar.setAttribute('role','tablist');bar.setAttribute('aria-label','Grouped panels');
    shell.append(bar);view={shell,bar,buttons:new Map()};views.set(group.id,view);
   }
   const visible=group.panels.filter(id=>record(id)&&!state.panels[id].hidden);
   const active=visible.includes(group.active)?group.active:visible[0];
   if(active)group.active=active;
   view.shell.hidden=!visible.length;
   view.shell.classList.toggle('pinned',state.panels[group.panels[0]].pinned);
   view.shell.removeAttribute('style');
   for(const [id,button] of view.buttons)if(!group.panels.includes(id)){button.remove();view.buttons.delete(id);}
   for(const id of group.panels){
    const r=record(id);if(!r)continue;
    let button=view.buttons.get(id);
    if(!button){
     button=document.createElement('button');button.type='button';button.textContent=r.title;
     button.setAttribute('role','tab');button.id='workspace-tab-'+id;
     button.onclick=()=>select(id);
     button.onkeydown=e=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
      e.preventDefault();const current=state.tabs.find(g=>g.id===group.id);
      const ids=current?.panels.filter(key=>!state.panels[key].hidden)||[];
      if(!ids.length)return;
      const at=ids.indexOf(id),next=e.key==='Home'?ids[0]:e.key==='End'?ids.at(-1):ids[(at+(e.key==='ArrowRight'?1:-1)+ids.length)%ids.length];
      select(next);view.buttons.get(next)?.focus({preventScroll:true});
     };
     view.buttons.set(id,button);
    }
    button.hidden=r.state.hidden;button.tabIndex=id===active?0:-1;
    button.setAttribute('aria-selected',String(id===active));button.setAttribute('aria-controls','workspace-tab-panel-'+id);
    if(view.bar.children[group.panels.indexOf(id)]!==button)view.bar.append(button);
    r.shell.id='workspace-tab-panel-'+id;r.shell.setAttribute('role','tabpanel');r.shell.setAttribute('aria-labelledby',button.id);
    r.shell.hidden=id!==active;r.shell.classList.remove('pinned');
    if(r.shell.parentElement!==view.shell)view.shell.append(r.shell);
   }
  }
  for(const [id,view] of views)if(stacked||!state.tabs.some(group=>group.id===id)){
   // Move surviving panels out before removing their old group.
   for(const r of records)if(r.shell.parentElement===view.shell)view.shell.parentElement?.append(r.shell);
   view.shell.remove();views.delete(id);
  }
 }
 return {sync,destination,focusActive(id){const group=tabGroup(state,id);views.get(group?.id)?.buttons.get(group?.active)?.focus({preventScroll:true});},element:unit=>unit.group?views.get(unit.group.id)?.shell:record(unit.id)?.shell};
}
