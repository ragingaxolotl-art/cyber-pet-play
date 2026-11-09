import {addContextHelp} from './context-help.js?v=20261109-guard';

// Only explicitly marked instructions move into pop-ups. Status messages,
// compatibility warnings, and live counts remain visible in the workspace.
export function installStaticHelp(root=document){
 for(const note of root.querySelectorAll('[data-context-help]')){
  if(note.hidden)continue;
  const siblings=[...note.parentElement.children];
  const heading=siblings.slice(0,siblings.indexOf(note)).reverse().find(node=>['H2','H3','SUMMARY'].includes(node.tagName));
  if(heading)addContextHelp(document.body,heading,[note]);
 }
}
