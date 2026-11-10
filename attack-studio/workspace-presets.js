import {safeLayout} from './workspace-layout-model.js';
import {validateWorkspaceBundle,workspaceBundle} from './workspace-transfer.js';

export const PRESETS_KEY='cyber-pet-studio-presets-v3';
const KEYS=[PRESETS_KEY,'cyber-pet-studio-presets-v2','cyber-pet-studio-presets-v1'];
const CONFLICT='Saved layouts changed in another window. Choose Reload saved layouts, then try again. Your current panel arrangement is unchanged.';
function validatePresets(items){
 if(!Array.isArray(items)||items.length>100)throw Error('Keep at most 100 saved layouts. Export a backup before removing any.');
 const ids=new Set();
 for(const item of items){if(typeof item?.id!=='string'||!item.id||ids.has(item.id))throw Error('Invalid or duplicate saved layout ID.');ids.add(item.id);}
 if(items.length)validateWorkspaceBundle(workspaceBundle(items));
 const text=JSON.stringify(items);
 if(new TextEncoder().encode(text).length>1024*1024)throw Error('Saved layouts must fit within 1 MiB. Export a backup before removing any.');
 return items.map(item=>({...item,layout:safeLayout(item.layout)}));
}
// Retain old keys and unreadable data. Failed writes never become in-memory saves.
// Web Locks serialize cooperating windows; without them this is a best-effort
// compare-before-write guard, not a cross-process transaction.
export function createWorkspacePresets(storage,locks=globalThis.navigator?.locks){
 let baseline,items=[],problem;
 const read=()=>KEYS.map(key=>(storage??globalThis.localStorage).getItem(key));
 const load=()=>{
  try{
   const raw=read(),next=validatePresets(JSON.parse(raw.find(value=>value!==null)||'[]'));
   baseline=JSON.stringify(raw);items=next;problem=null;return structuredClone(items);
  }catch(error){problem=error;throw error;}
 };
 try{load();}catch{}
 return {
  get items(){return structuredClone(items);},
  get problem(){return problem;},
  load,
  async save(next){
   const expected=baseline,clean=validatePresets(next);
   const commit=()=>{
    if(problem)throw Error('Saved layouts could not be read. Existing browser data was kept. '+problem.message);
    const raw=read();if(JSON.stringify(raw)!==expected)throw Error(CONFLICT);
    const text=JSON.stringify(clean);(storage??globalThis.localStorage).setItem(PRESETS_KEY,text);
    raw[0]=text;baseline=JSON.stringify(raw);items=clean;return structuredClone(items);
   };
   try{return await (locks?.request?locks.request('cyber-pet-workspace-presets',commit):commit());}
   catch(error){if(error?.name==='QuotaExceededError'||/quota|storage full/i.test(error.message))throw Error('Could not save this layout: browser storage is full. Your panel arrangement is still open; no saved layout was changed.');throw error;}
  }
 };
}
