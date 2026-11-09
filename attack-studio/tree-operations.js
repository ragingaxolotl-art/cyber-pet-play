// Independent copies keep internal follow-ups, never share an editable identity.
export function copyAttack(attack, id='attack_'+crypto.randomUUID().replaceAll('-','_')) {
 const next=structuredClone(attack),old=next.id;next.id=id;
 for(const window of next.cancelWindows||[])window.attacks=window.attacks.map(value=>value===old?id:value);
 delete next.reskinGroupId;delete next.reskinElement;return next;
}
export function copyBranch(tree, selected, makeId=()=>crypto.randomUUID()) {
 const wanted=new Set(selected),nodes=tree.nodes.filter(n=>wanted.has(n.id));
 if(!nodes.length)throw Error('Select attacks on the canvas first.');
 if(tree.nodes.length+nodes.length>512)throw Error('This copy would exceed 512 attacks.');
 const next=structuredClone(tree),ids=new Map(nodes.map(n=>[n.id,makeId()])),attacks=new Map(nodes.filter(n=>n.attack).map(n=>[n.id,'attack_'+makeId().replaceAll('-','_')]));
 for(const node of nodes){const copy=structuredClone(node);copy.id=ids.get(node.id);copy.name=(copy.name+' copy').slice(0,80);copy.x=Math.min(49500,copy.x+60);copy.y=Math.min(49500,copy.y+60);copy.requires=copy.requires.filter(id=>ids.has(id)).map(id=>ids.get(id));
  if(copy.attack){copy.attack=copyAttack(copy.attack,attacks.get(node.id));for(const window of copy.attack.cancelWindows||[])window.attacks=window.attacks.map(id=>{const source=nodes.find(n=>n.attack?.id===id);return source?attacks.get(source.id):id;});}
  next.nodes.push(copy);
 }
 next.starterSkills=[...(next.starterSkills||[]),...(tree.starterSkills||[]).filter(id=>ids.has(id)).map(id=>ids.get(id))];
 next.edgeDetails=[...(next.edgeDetails||[]),...(tree.edgeDetails||[]).filter(e=>ids.has(e.from)&&ids.has(e.to)).map(e=>({...e,from:ids.get(e.from),to:ids.get(e.to)}))];
 return {tree:next,ids:[...ids.values()]};
}
export function moveGroup(tree, selected, dx, dy){
 const next=structuredClone(tree),nodes=next.nodes.filter(n=>selected.includes(n.id));if(!nodes.length)throw Error('Select attacks on the canvas first.');
 dx=Math.max(-Math.min(...nodes.map(n=>n.x)),Math.min(50000-Math.max(...nodes.map(n=>n.x)),dx));dy=Math.max(-Math.min(...nodes.map(n=>n.y)),Math.min(50000-Math.max(...nodes.map(n=>n.y)),dy));
 for(const n of nodes){n.x+=dx;n.y+=dy;}return next;
}
export function connectGroup(tree, selected){
 if(selected.length<2)throw Error('Select at least two attacks in the order you want to connect them.');
 const next=structuredClone(tree);
 selected.slice(1).forEach((id,i)=>{const n=next.nodes.find(n=>n.id===id);if(!n)throw Error('A selected attack no longer exists.');if(next.starterSkills?.includes(id))throw Error('A starter cannot require another skill. Put starters first.');if(!n.requires.includes(selected[i]))n.requires.push(selected[i]);if(n.state==='ready')n.state='draft';});
 return next; // The editor validates cycles before committing this whole operation.
}
export function readiness(tree){
 const issues=[],attackIds=new Set();
 for(const n of tree.nodes){if(n.state!=='ready'||!n.attack)issues.push({id:n.id,text:'Finish attack setup and mark Ready.'});if(n.attack){if(attackIds.has(n.attack.id))issues.push({id:n.id,text:'Duplicate attack identity: make an independent copy.'});attackIds.add(n.attack.id);}if(n.cost!==undefined&&(!Number.isInteger(n.cost)||n.cost<0||n.cost>100))issues.push({id:n.id,text:'Learning cost must be a whole number from 0 to 100.'});}
 return issues;
}
