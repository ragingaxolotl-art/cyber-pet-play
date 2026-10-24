import {TREE_KEY,validateTree} from './skill-tree-model.js';
import {freshAttack,validateAttack} from './combat-model.js?v=20261024-review-support2';
// Tree attacks are independent copies. Explicit save updates only the chosen node.
export function connectTreeEditor({effects,open,current,status}){
 const id=new URLSearchParams(location.search).get('treeNode');if(!id)return;
 const ids=new Set(effects.map(e=>e.id)),read=()=>validateTree(JSON.parse(localStorage.getItem(TREE_KEY)),ids,validateAttack);
 try{
  const tree=read(),node=tree.nodes.find(n=>n.id===id);if(!node)throw Error('The selected tree attack no longer exists.');
  let original=JSON.stringify(node),attack=node.attack?structuredClone(node.attack):freshAttack();
  if(!node.attack){const effect=effects.find(e=>e.id===node.effectId);attack.name=node.name.slice(0,48);attack.motion=effect.slot;attack.element=effect.element;attack.visuals=[{effectId:effect.id,x:0,y:0,scale:1,start:0,rate:1}];}
  attack.name=node.name.slice(0,48);attack.id=freshAttack().id;const openedId=attack.id;validateAttack(attack,ids);open(attack);
  const button=document.createElement('button');button.textContent='Save attack to tree';button.className='primary';
  button.onclick=()=>{try{const latest=read(),target=latest.nodes.find(n=>n.id===id);if(!target)throw Error('Tree attack was removed. Download this project to keep your edits.');if(JSON.stringify(target)!==original)throw Error('This tree attack changed in another tab. Download your project before reopening it.');if(current().id!==openedId)throw Error('Select the tree attack draft before saving it to the tree.');const edited=structuredClone(current());validateAttack(edited,ids);target.attack=edited;target.name=edited.name;validateTree(latest,ids,validateAttack);localStorage.setItem(TREE_KEY,JSON.stringify(latest));original=JSON.stringify(target);status('Attack and animation edits saved to the tree. Return to Skill tree to see it.');}catch(e){status('Could not save to tree: '+e.message);}};
  document.querySelector('header nav').prepend(button);status('Opened a copy of '+node.name+'. Save attack to tree keeps your timing, frames, layers and hitbox edits.');
 }catch(e){status('Could not open tree attack: '+e.message);}
}
