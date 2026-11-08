export const TREE_SESSION_KEY='cyber-pet-tree-session-v1';
const text=value=>typeof value==='string'?value:'';
export function safeTreeView(value={}){
 const number=(key,min,max,fallback=0)=>Number.isFinite(value[key])?Math.max(min,Math.min(max,value[key])):fallback;
 return {selected:text(value.selected),branch:text(value.branch),search:text(value.search).slice(0,300),path:text(value.path),active:text(value.active),left:number('left',0,100000),top:number('top',0,100000),zoom:number('zoom',.01,2,1),mode:['before','after'].includes(value.mode)?value.mode:'all',display:value.display==='list'?'list':'tree'};
}
export function readTreeSession(storage){
 try{const raw=JSON.parse(storage.getItem(TREE_SESSION_KEY)||'null');if(raw?.version!==1)return {tabs:[],views:[],active:null};
 const tabs=(Array.isArray(raw.tabs)?raw.tabs:[]).filter(t=>typeof t?.dataSetId==='string'&&typeof t?.treeId==='string').slice(-64);
 const views=(Array.isArray(raw.views)?raw.views:[]).filter(p=>Array.isArray(p)&&typeof p[0]==='string').slice(-64).map(([key,value])=>[key,safeTreeView(value)]);
 return {tabs,views,active:tabs.find(t=>t.dataSetId===raw.active?.dataSetId&&t.treeId===raw.active?.treeId)||null};
 }catch{return {tabs:[],views:[],active:null};}
}
export function writeTreeSession(storage,{tabs,views,active}){storage.setItem(TREE_SESSION_KEY,JSON.stringify({version:1,tabs:tabs.slice(-64),views:views.slice(-64),active}));}
// History stays per tree in this editing session; stale external saves invalidate it.
export function restoreTreeHistory(record,base,validate){
 if(!record||record.base!==base)return [];
 try{const items=record.items.slice(-20);items.forEach(validate);return structuredClone(items);}catch{return [];}
}
