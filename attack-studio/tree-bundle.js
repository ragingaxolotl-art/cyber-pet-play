import {DATASETS_KEY} from './tree-datasets.js?v=20261109-rotation';
import {MAIN_TREE,readCabinet,treeStorageKey} from './tree-cabinet.js?v=20261109-rotation';
export const BUNDLE_FORMAT='cyber-pet-tree-data-set';
// Validate the entire bundle before any new tree is written or made visible.
export function validateBundle(value,validateTree){
 if(!value||value.format!==BUNDLE_FORMAT||value.version!==1||typeof value.name!=='string'||!value.name.trim()||value.name.length>80)throw Error('Choose a valid data-set backup.');
 if(!Array.isArray(value.trees)||!value.trees.length||value.trees.length>128)throw Error('A data-set backup must contain 1–128 trees.');
 const ids=new Set();
 for(const item of value.trees){
  if(!item||typeof item.id!=='string'||!item.id||item.id.length>160||ids.has(item.id)||typeof item.name!=='string'||!item.name.trim()||item.name.length>80)throw Error('The backup contains an invalid or duplicate tree.');
  ids.add(item.id);validateTree(item.tree);
 }
 if(!ids.has(MAIN_TREE))throw Error('The backup is missing its main tree.');
 return value;
}
export function exportDataSet(storage,id,validateTree){
 const dataSet=readCabinet(storage).find(d=>d.id===id);if(!dataSet)throw Error('Data set no longer exists.');
 const bundle={format:BUNDLE_FORMAT,version:1,name:dataSet.name,trees:dataSet.trees.map(item=>{
  const raw=storage.getItem(treeStorageKey(id,item.id));if(!raw)throw Error('A tree is missing. No incomplete backup was created.');
  return {id:item.id,name:item.name,tree:JSON.parse(raw)};
 })};
 return validateBundle(bundle,validateTree);
}
export function importDataSet(storage,bundle,validateTree){
 validateBundle(bundle,validateTree);const cabinet=readCabinet(storage),id=crypto.randomUUID();
 const trees=bundle.trees.map(item=>({...item,id:item.id===MAIN_TREE?MAIN_TREE:crypto.randomUUID()}));
 // A failed write cannot replace an existing data set. Publish the registry last.
 for(const item of trees)storage.setItem(treeStorageKey(id,item.id),JSON.stringify(item.tree));
 cabinet.push({id,name:bundle.name,trees:trees.map(({id,name})=>({id,name}))});
 storage.setItem(DATASETS_KEY,JSON.stringify(cabinet));return id;
}
export function bundleSummary(bundle){return bundle.trees.map(item=>({name:item.name,attacks:item.tree.nodes.length,paths:item.tree.paths?.length||0}));}
