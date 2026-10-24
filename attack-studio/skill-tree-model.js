// Learning order is a directed acyclic graph. Edges point from prerequisite to attack.
export const TREE_KEY='cyber-pet-attack-skill-tree-v1';
export function validateTree(tree,effectIds,validateAttack){
 if(tree?.format!=='cyber-pet-attack-skill-tree'||tree.version!==1||!Array.isArray(tree.nodes)||tree.nodes.length>512)throw Error('Choose a version 1 attack tree with at most 512 attacks.');
 const ids=new Set();
 for(const n of tree.nodes){
  if(!n||typeof n.id!=='string'||!n.id||n.id.length>160||ids.has(n.id))throw Error('Attack IDs must be unique.');ids.add(n.id);
  for(const [key,max] of [['name',80],['description',2000],['branch',80]])if(typeof n[key]!=='string'||n[key].length>max)throw Error('Invalid '+key+'.');
  if(!n.name.trim()||!n.branch.trim()||!effectIds.has(n.effectId)||!['draft','needs-edit','ready'].includes(n.state)||!['all','any'].includes(n.requirement))throw Error('Invalid attack artwork or learning rule.');
  if(!Array.isArray(n.requires)||new Set(n.requires).size!==n.requires.length||n.requires.some(id=>typeof id!=='string'))throw Error('Invalid prerequisites.');
  if(!Number.isFinite(n.x)||!Number.isFinite(n.y)||n.x<0||n.y<0||n.x>50000||n.y>50000)throw Error('Invalid tree position.');
  if(n.attack){if(!validateAttack)throw Error('Attack validation is required.');validateAttack(n.attack,effectIds);}
 }
 const byId=new Map(tree.nodes.map(n=>[n.id,n])),visiting=new Set(),done=new Set();
 function visit(id){if(visiting.has(id))throw Error('That connection creates a learning loop.');if(done.has(id))return;visiting.add(id);for(const p of byId.get(id).requires){if(!ids.has(p))throw Error('A prerequisite attack is missing.');visit(p);}visiting.delete(id);done.add(id);}
 for(const id of ids)visit(id);return tree;
}
export function ancestors(tree,id){const map=new Map(tree.nodes.map(n=>[n.id,n])),result=new Set();function visit(key){for(const p of map.get(key)?.requires||[])if(!result.has(p)){result.add(p);visit(p);}}visit(id);return result;}
export function arrange(tree){const map=new Map(tree.nodes.map(n=>[n.id,n])),depth=new Map(),rows=new Map();function level(n){if(!depth.has(n.id))depth.set(n.id,n.requires.length?1+Math.max(...n.requires.map(id=>level(map.get(id)))):0);return depth.get(n.id);}for(const n of tree.nodes){const col=level(n),row=rows.get(col)||0;n.x=32+col*300;n.y=40+row*244;rows.set(col,row+1);}return tree;}
const steps=[['gather_power_side',[], 'Gather energy and learn to control this element.'],['block_side',[0],'Turn gathered power into a defensive barrier.'],['release_power_side',[0],'Release controlled power toward an opponent.'],['side_push_side',[2],'Shape a release into a directional push.'],['channel_power_side',[1,2],'Combine defense and release control to sustain power.'],['ground_slam_side',[3],'Drive the directional force into the ground.'],['up_summon_side',[4,5],'Combine sustained power and ground control to summon a rising attack.']];
export function starterTree(effects,setups){
 const tree={format:'cyber-pet-attack-skill-tree',version:1,nodes:[]};
 for(const element of ['air','earth','water','fire','metal','ice','electric','plant','light','dark']){
  const chosen=[];
  for(const [slot,parents,description] of steps){
   const matches=effects.filter(e=>e.element===element&&e.slot===slot);const effect=matches.find(e=>setups.has(e.id)&&e.collection==='distinct')||matches.find(e=>e.collection==='distinct')||matches[0];
   if(!effect){chosen.push(null);continue;}
   const setup=setups.get(effect.id),id=element+'-'+slot;chosen.push(id);
   tree.nodes.push({id,name:setup?.attack.name||effect.name,description,branch:element,effectId:effect.id,state:setup?'draft':'needs-edit',requirement:'all',requires:parents.map(i=>chosen[i]).filter(Boolean),x:0,y:0,...(setup?{attack:structuredClone(setup.attack)}:{})});
  }
 }
 // Separate elemental lanes while retaining the same left-to-right learning order.
 let offset=0;for(const branch of [...new Set(tree.nodes.map(n=>n.branch))]){const lane={nodes:tree.nodes.filter(n=>n.branch===branch)};arrange(lane);for(const n of lane.nodes)n.y+=offset;offset+=Math.max(...lane.nodes.map(n=>n.y-offset))+244;}
 return tree;
}
