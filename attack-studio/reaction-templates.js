import {REACTION_BLOCKS} from './behavior-sequence.js?v=20261109-split';
export const REACTION_TEMPLATES_KEY='cyber-pet-reaction-templates-v1';
export const REACTION_TEMPLATES_FORMAT='cyber-pet-reaction-templates';
export function validateReactionTemplate(value){
 if(!value||typeof value.name!=='string'||!value.name.trim()||value.name.trim().length>60)throw Error('Give the template a name of 1–60 characters.');
 if(!Number.isInteger(value.interval)||value.interval<1||value.interval>25)throw Error('Template spacing must be 1–25 whole frames.');
 if(!Array.isArray(value.blocks)||!value.blocks.length||value.blocks.length>10)throw Error('A template needs 1–10 reaction blocks.');
 let count=0;const blocks=value.blocks.map(block=>{
  if(!block||!REACTION_BLOCKS.includes(block.type)||!Number.isInteger(block.repeat)||block.repeat<1||block.repeat>10)throw Error('Invalid reaction block or repeat count.');
  count+=block.repeat;if(count>10)throw Error('A template can generate at most ten hits.');
  if(typeof block.damage!=='number'||!Number.isFinite(block.damage)||block.damage<0||block.damage>500)throw Error('Template damage must be 0–500.');
  // Templates are portable recipes, not attack-specific geometry references.
  return {type:block.type,repeat:block.repeat,damage:block.damage};
 });return {name:value.name.trim(),interval:value.interval,blocks};
}
export function validateReactionTemplateBundle(bundle){
 if(bundle?.format!==REACTION_TEMPLATES_FORMAT||bundle.version!==1||!Array.isArray(bundle.templates)||bundle.templates.length>50)throw Error('Choose a version 1 reaction-template backup with at most 50 templates.');
 const names=new Set();const templates=bundle.templates.map(item=>{const value=validateReactionTemplate(item),key=value.name.toLowerCase();if(names.has(key))throw Error('Template names must be unique.');names.add(key);return value;});
 return {format:REACTION_TEMPLATES_FORMAT,version:1,templates};
}
function readStore(storage){
 const raw=storage.getItem(REACTION_TEMPLATES_KEY);
 if(raw===null)return {...reactionTemplateBackup([]),removed:[]};
 let bundle;try{bundle=JSON.parse(raw);}catch{throw Error('Saved reaction templates could not be read. Existing data was preserved.');}
 const checked=validateReactionTemplateBundle(bundle),removed=bundle.removed??[];
 if(!Array.isArray(removed)||removed.length>50)throw Error('Removed-template recovery data is invalid. Existing data was preserved.');
 return {...checked,removed:removed.map(validateReactionTemplate)};
}
function writeStore(storage,state){const checked={...reactionTemplateBackup(state.templates),removed:state.removed};storage.setItem(REACTION_TEMPLATES_KEY,JSON.stringify(checked));return checked.templates;}
export function readReactionTemplates(storage){return readStore(storage).templates;}
export function removedReactionTemplateCount(storage){return readStore(storage).removed.length;}
export function reactionTemplateBackup(templates){return validateReactionTemplateBundle({format:REACTION_TEMPLATES_FORMAT,version:1,templates});}
export function saveReactionTemplate(storage,value){
 const state=readStore(storage);state.templates.push(validateReactionTemplate(value));return writeStore(storage,state);
}
export function importReactionTemplates(storage,bundle){
 const imported=validateReactionTemplateBundle(bundle),state=readStore(storage);state.templates.push(...imported.templates);return writeStore(storage,state);
}
export function renameReactionTemplate(storage,oldName,newName){
 const state=readStore(storage),item=state.templates.find(t=>t.name===oldName);if(!item)throw Error('Template no longer exists. Refresh the list.');
 item.name=newName;return writeStore(storage,state);
}
export function removeReactionTemplate(storage,name){
 const state=readStore(storage),index=state.templates.findIndex(t=>t.name===name);if(index<0)throw Error('Template no longer exists. Refresh the list.');
 if(state.removed.length>=50)throw Error('Restore removed templates before removing more.');
 state.removed.push(state.templates.splice(index,1)[0]);return writeStore(storage,state);
}
export function restoreReactionTemplate(storage){
 const state=readStore(storage);if(!state.removed.length)throw Error('There is no removed template to restore.');
 const item=state.removed.at(-1);if(state.templates.some(t=>t.name.toLowerCase()===item.name.toLowerCase()))throw Error('Rename the active template with the same name before restoring.');
 state.templates.push(state.removed.pop());return writeStore(storage,state);
}
