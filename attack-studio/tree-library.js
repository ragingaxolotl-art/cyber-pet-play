// Same-origin contract used by Studio and Arena. All names are user-facing.
export const TREE_LIBRARY_KEY='cyber-pet-tree-library-v1';
export function savedTreeChoices(storage){
 const dataSets=JSON.parse(storage.getItem('cyber-pet-tree-datasets-v1')||'[{"id":"original","name":"Magic"}]');
 const choices=[];
 for(const dataSet of dataSets){for(const item of dataSet.trees||[{id:'main',name:dataSet.name}]){
  const key='cyber-pet-attack-skill-tree-v1'+(dataSet.id==='original'?'':':'+dataSet.id)+(item.id==='main'?'':':tree:'+item.id),raw=storage.getItem(key);
  if(raw)choices.push({id:key,name:dataSet.name+' / '+item.name,tree:JSON.parse(raw)});
 }}return choices;
}
export function treeChoices(value,validate){
 const items=value?.format==='cyber-pet-tree-data-set'?value.trees?.map(t=>({id:t.id,name:value.name+' / '+t.name,tree:t.tree})):[{id:'imported',name:value?.name||'Imported tree',tree:value}];
 if(!Array.isArray(items)||!items.length||items.length>128)throw Error('Choose a tree or data set containing 1–128 trees.');
 for(const item of items){if(typeof item.id!=='string'||typeof item.name!=='string')throw Error('Invalid tree name or identifier.');validate(item.tree);}return structuredClone(items);
}
export function publicationKey(dataSetId){return 'cyber-pet-tree-release:'+dataSetId;}
export function makePublication(bundle,previous,now=new Date().toISOString()){
 return {...structuredClone(bundle),publication:{id:previous?.publication?.id||crypto.randomUUID(),revision:(previous?.publication?.revision||0)+1,publishedAt:now}};
}
