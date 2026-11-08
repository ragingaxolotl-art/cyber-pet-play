import {createTreeStore,treeStorageMessage} from './tree-storage.js?v=20261108-tree-storage';
import {treeStorageKey} from './tree-cabinet.js?v=20261108-explosion';
import {dataSetKey} from './tree-datasets.js?v=20261108-explosion';
import {TREE_KEY,validateTree,treeVersion} from './skill-tree-model.js?v=20261108-explosion';
import {freshAttack,validateAttack} from './combat-model.js?v=20261108-explosion';
// Tree attacks are independent copies. Explicit save updates only the chosen node.
export async function connectTreeEditor({effects,open,current,status}){
 const id=new URLSearchParams(location.search).get('treeNode');if(!id)return;
 const treeKey=treeStorageKey(new URLSearchParams(location.search).get('dataSet')||'original',new URLSearchParams(location.search).get('tree')||'main');
 const link=document.querySelector('a[href="skill-tree.html?v=20261108-explosion"]');if(link)link.href='skill-tree.html?dataSet='+encodeURIComponent(new URLSearchParams(location.search).get('dataSet')||'original')+'&tree='+encodeURIComponent(new URLSearchParams(location.search).get('tree')||'main');
 const ids=new Set(effects.map(e=>e.id));
 try{
  const storage=await createTreeStore(),read=(source=storage)=>validateTree(JSON.parse(source.getItem(treeKey)),ids,validateAttack);
  const tree=read(),node=tree.nodes.find(n=>n.id===id);if(!node)throw Error('The selected tree attack no longer exists.');
  let original=JSON.stringify(node),attack=node.attack?structuredClone(node.attack):freshAttack();
  if(!node.attack){const effect=effects.find(e=>e.id===node.effectId);attack.name=node.name.slice(0,48);attack.motion=effect.slot;attack.element=effect.element;attack.visuals=[{effectId:effect.id,x:0,y:0,scale:1,start:0,rate:1}];}
  attack.name=node.name.slice(0,48);attack.id=freshAttack().id;const openedId=attack.id;validateAttack(attack,ids);open(attack);
  const button=document.createElement('button');button.textContent='Save attack to tree';button.className='primary';
  button.onclick=async()=>{button.disabled=true;try{let savedNode;await storage.transaction(source=>{const latest=read(source),target=latest.nodes.find(n=>n.id===id);if(!target)throw Error('Tree attack was removed. Download this project to keep your edits.');if(JSON.stringify(target)!==original)throw Error('This tree attack changed in another tab. Download your project before reopening it.');if(current().id!==openedId)throw Error('Select the tree attack draft before saving it to the tree.');const edited=structuredClone(current());validateAttack(edited,ids);target.attack=edited;target.name=edited.name;latest.version=treeVersion(latest);validateTree(latest,ids,validateAttack);source.setItem(treeKey,JSON.stringify(latest));savedNode=JSON.stringify(target);});original=savedNode;status('Attack and animation edits saved to the tree. Return to Skill tree to see it.');}catch(e){status('Could not save to tree: '+treeStorageMessage(e));}finally{button.disabled=false;}};
  document.querySelector('header nav').prepend(button);status('Opened a copy of '+node.name+'. Save attack to tree keeps your timing, frames, layers and hitbox edits.');
 }catch(e){status('Could not open tree attack: '+treeStorageMessage(e));}
}
