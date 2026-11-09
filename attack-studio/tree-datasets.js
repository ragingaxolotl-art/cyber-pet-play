import {TREE_KEY} from './skill-tree-model.js?v=20261109-conditional-release';
export const DATASETS_KEY='cyber-pet-tree-datasets-v1';
export const dataSetKey=id=>id==='original'?TREE_KEY:TREE_KEY+':'+id;
export function readDataSets(storage){
 const raw=storage.getItem(DATASETS_KEY);
 const value=raw?JSON.parse(raw):[{id:'original',name:'Magic'}];
 if(!Array.isArray(value)||!value.length||value.some(x=>!x||typeof x.id!=='string'||!x.id||typeof x.name!=='string'||!x.name.trim())||new Set(value.map(x=>x.id)).size!==value.length)throw Error('The saved data set list is invalid.');
 return value;
}
export function pathNodeIds(tree,pathId){
 if(!pathId)return null;
 return new Set([...tree.nodes?.filter(n=>n.pathIds?.includes(pathId)).map(n=>n.id)||[],...(tree.edgeDetails||[]).filter(e=>e.pathId===pathId).flatMap(e=>[e.from,e.to])]);
}
