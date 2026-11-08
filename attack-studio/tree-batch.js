// Build one candidate so a batch is validated and undone as one tree edit.
export function addIndependentAttacks(tree, entries, pathId, makeId=()=>crypto.randomUUID()) {
 if (!entries.length) throw Error('Select at least one attack.');
 if (tree.nodes.length+entries.length>512) throw Error(`This tree has room for ${512-tree.nodes.length} more attacks. Reduce your selection or create another tree.`);
 const next=structuredClone(tree);
 const startY=tree.nodes.length?Math.max(...tree.nodes.map(node=>node.y))+244:32;
 entries.forEach((entry,index)=>{
  if(!entry.effect) throw Error('An attack in this selection no longer has artwork. Select it again.');
  const effect=entry.effect;
  next.nodes.push({id:makeId(),name:entry.attack?.name||entry.name,description:effect.description||'Describe this attack and its learning requirements.',branch:effect.element,effectId:effect.id,notes:'',state:'needs-edit',requirement:'all',requires:[],x:32+(index%4)*300,y:Math.min(49500,startY+Math.floor(index/4)*244),...(pathId?{pathIds:[pathId]}:{}),...(entry.attack?{attack:structuredClone(entry.attack)}:{})});
 });
 return next;
}
