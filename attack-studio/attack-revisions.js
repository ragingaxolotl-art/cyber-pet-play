import {validateObjectWorkspace,workspaceObjects} from './workspace-objects.js?v=20261110-properties-versions';
import {validateDesign} from './combat-model.js';
import {attackVersion} from './attack-format.js';
export const REVISION_KEY='cyber-pet-attack-revisions-v1';
export const LEGACY_REVISION_BACKUP_KEY=REVISION_KEY+'-before-object-versions';
const FORMAT='cyber-pet-attack-revisions',MAX_BYTES=3*1024*1024;
function checkedRecord(value){
 if(!value||typeof value.id!=='string'||!/^revision_[a-zA-Z0-9_]{1,80}$/.test(value.id)||typeof value.name!=='string'||!value.name.trim()||value.name.length>80||!Number.isSafeInteger(value.created)||value.created<0)throw Error('Invalid attack revision. Existing history was preserved.');
 const attack=structuredClone(value.attack);validateDesign({format:'cyber-pet-combat-design',version:value.attackVersion,attacks:[attack]});
 const record={id:value.id,name:value.name.trim(),created:value.created,attackVersion:attackVersion(attack),attack};
 if(value.objectWorkspace!==undefined){
  const objects=structuredClone(value.objectWorkspace);validateObjectWorkspace({editorObjects:{version:1,attacks:{[attack.id]:objects}}});
  const keys=new Set(workspaceObjects(attack).map(o=>o.key));if([...Object.keys(objects.objects),...objects.groups.flatMap(g=>g.members)].some(k=>!keys.has(k)))throw Error('Revision object settings refer to a missing object. Existing history was preserved.');
  record.objectWorkspace=objects;
 }
 return record;
}
export function validateRevisionBundle(value){
 if(value?.format!==FORMAT||![1,2].includes(value.version)||!Array.isArray(value.revisions)||value.revisions.length>100||!Array.isArray(value.removed??[])||(value.removed??[]).length>20)throw Error('Choose a version 1 or 2 revision backup (up to 100 revisions and 20 removed revisions).');
 if(value.version===1&&[...value.revisions,...(value.removed??[])].some(r=>r?.objectWorkspace!==undefined))throw Error('Object settings require a version 2 revision backup.');
 const revisions=value.revisions.map(checkedRecord),removed=(value.removed??[]).map(checkedRecord),ids=new Set();
 for(const r of [...revisions,...removed]){if(ids.has(r.id))throw Error('Duplicate revision ID. Existing history was preserved.');ids.add(r.id);}
 const result={format:FORMAT,version:value.version,revisions,removed};if(new TextEncoder().encode(JSON.stringify(result)).length>MAX_BYTES)throw Error('Revision history exceeds 3 MiB. Export a backup and remove unneeded revisions.');return result;
}
export function readRevisions(storage){const raw=storage.getItem(REVISION_KEY);if(raw===null)return {format:FORMAT,version:1,revisions:[],removed:[]};let value;try{value=JSON.parse(raw);}catch{throw Error('Revision history could not be read. Existing data was preserved.');}return validateRevisionBundle(value);}
function write(storage,value){const next=validateRevisionBundle(value),previous=storage.getItem(REVISION_KEY);if(next.version===2&&previous&&JSON.parse(previous).version===1&&storage.getItem(LEGACY_REVISION_BACKUP_KEY)===null)storage.setItem(LEGACY_REVISION_BACKUP_KEY,previous);storage.setItem(REVISION_KEY,JSON.stringify(next));return next;}
export function saveRevision(storage,attack,name,{now=Date.now(),id='revision_'+crypto.randomUUID().replaceAll('-',''),objectWorkspace}={}){const state=readRevisions(storage);if(objectWorkspace!==undefined)state.version=2;state.revisions.push(checkedRecord({id,name,created:now,attackVersion:attackVersion(attack),attack,...(objectWorkspace!==undefined?{objectWorkspace}:{})}));return write(storage,state);}
export function removeRevision(storage,id){const state=readRevisions(storage),index=state.revisions.findIndex(r=>r.id===id);if(index<0)throw Error('Choose a saved revision.');if(state.removed.length===20)throw Error('Removed-revision recovery is full. Export history before removing more.');state.removed.push(state.revisions.splice(index,1)[0]);return write(storage,state);}
export function restoreRemovedRevision(storage){const state=readRevisions(storage);if(!state.removed.length)throw Error('No removed revision to restore.');state.revisions.push(state.removed.pop());return write(storage,state);}
export function importRevisions(storage,bundle){const incoming=validateRevisionBundle(bundle),state=readRevisions(storage),known=new Map([...state.revisions,...state.removed].map(r=>[r.id,JSON.stringify(r)]));for(const r of [...incoming.revisions,...incoming.removed]){if(known.has(r.id)){if(known.get(r.id)!==JSON.stringify(r))throw Error('A revision ID conflicts with saved history. Existing history was preserved.');continue;}state.revisions.push(r);}if(incoming.version===2)state.version=2;return write(storage,state);}
// Compare complete authored properties, including nested timing/physics/artwork.
export function revisionChanges(saved,current){return [...new Set([...Object.keys(saved),...Object.keys(current)])].sort().filter(key=>key!=='id'&&JSON.stringify(saved[key])!==JSON.stringify(current[key])).map(key=>({key,saved:saved[key],current:current[key]}));}
export function emptyRemovedRevisions(storage){const state=readRevisions(storage);state.removed=[];return write(storage,state);}
