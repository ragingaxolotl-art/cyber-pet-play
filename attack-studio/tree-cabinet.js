import {DATASETS_KEY,dataSetKey,readDataSets} from './tree-datasets.js?v=20261109-tree-workspace';
export const MAIN_TREE='main';
export function treeStorageKey(dataSetId,treeId=MAIN_TREE){return treeId===MAIN_TREE?dataSetKey(dataSetId):dataSetKey(dataSetId)+':tree:'+treeId;}
export function readCabinet(storage){
 return readDataSets(storage).map(dataSet=>{
  const trees=dataSet.trees??[{id:MAIN_TREE,name:dataSet.name}];
  if(!Array.isArray(trees)||!trees.length||trees.length>128||new Set(trees.map(t=>t?.id)).size!==trees.length||trees.some(t=>!t||typeof t.id!=='string'||!t.id||t.id.length>160||typeof t.name!=='string'||!t.name.trim()||t.name.length>80))throw Error('Invalid tree list. Existing saved trees have been kept.');
  return {...dataSet,trees:trees.map(t=>({...t}))};
 });
}
export function createTree(storage,dataSetId,name,tree,validate){
 name=name.trim();if(!name||name.length>80)throw Error('Give the tree a name under 80 characters.');
 const cabinet=readCabinet(storage),dataSet=cabinet.find(d=>d.id===dataSetId);if(!dataSet)throw Error('Data set no longer exists. Reload the editor.');
 if(dataSet.trees.length>=128)throw Error('This data set already contains 128 trees.');validate(tree);
 const id=crypto.randomUUID();storage.setItem(treeStorageKey(dataSetId,id),JSON.stringify(tree));
 dataSet.trees.push({id,name});storage.setItem(DATASETS_KEY,JSON.stringify(cabinet));return id;
}
export function renameTree(storage,dataSetId,treeId,name){
 name=name.trim();if(!name||name.length>80)throw Error('Give the tree a name under 80 characters.');
 const cabinet=readCabinet(storage),tree=cabinet.find(d=>d.id===dataSetId)?.trees.find(t=>t.id===treeId);if(!tree)throw Error('Tree no longer exists. Reload the editor.');
 tree.name=name;storage.setItem(DATASETS_KEY,JSON.stringify(cabinet));return cabinet;
}
export function relatedNodeIds(tree,id,direction='before'){
 const result=new Set();if(!tree.nodes.some(n=>n.id===id))return result;
 const visit=key=>{if(result.has(key))return;result.add(key);const next=direction==='before'?tree.nodes.find(n=>n.id===key)?.requires||[]:tree.nodes.filter(n=>n.requires.includes(key)).map(n=>n.id);for(const n of next)visit(n);};visit(id);return result;
}
export function treeBounds(nodes){if(!nodes.length)return {x:0,y:0,width:700,height:480};const x=Math.min(...nodes.map(n=>n.x)),y=Math.min(...nodes.map(n=>n.y));return {x,y,width:Math.max(...nodes.map(n=>n.x+244))-x,height:Math.max(...nodes.map(n=>n.y+206))-y};}
