import {trimEdgeDetails} from './tree-paths.js';
export function setStarter(tree,id,enabled) {
  const next=structuredClone(tree),node=next.nodes.find(n=>n.id===id);
  if(!node)throw Error('Choose an attack to put in the starter bank.');
  next.starterSkills=(next.starterSkills||[]).filter(value=>value!==id);
  if(enabled){next.starterSkills.push(id);node.requires=[];if(node.state==='ready')node.state='draft';}
  return trimEdgeDetails(next);
}
export function installStarters({getTree,getSelected,commit,applyPending,select,inspect,status,effects}) {
  const $=id=>document.getElementById(id);
  function change(id,enabled){try{applyPending();commit(setStarter(getTree(),id,enabled));inspect();status(enabled?'Added to the starter bank. This skill is granted at the start; incoming prerequisites were cut. Descendants are kept.':'Removed from the starter bank. The attack remains on the tree.');}catch(error){status(error.message);}}
  $('makeStarter').onclick=()=>change(getSelected(),true);
  function refresh(){const tree=getTree(),starterIds=tree.starterSkills||[];$('starterCount').textContent=starterIds.length;$('starterCards').replaceChildren();$('makeStarter').disabled=!getSelected()||starterIds.includes(getSelected());
    for(const id of starterIds){const node=tree.nodes.find(n=>n.id===id);if(!node)continue;const card=document.createElement('article'),image=document.createElement('img'),choose=document.createElement('button'),remove=document.createElement('button');image.src=effects.get(node.effectId)?.preview||effects.get(node.effectId)?.sheet;image.alt=node.name+' clip';image.loading='lazy';choose.textContent=node.name;choose.onclick=()=>{try{applyPending();select(id,true);}catch(error){status(error.message);}};remove.textContent='Remove from starters';remove.onclick=()=>change(id,false);card.append(image,choose,remove);$('starterCards').append(card);}
    if(!starterIds.length)$('starterCards').textContent='No starter skills chosen yet. Select an attack and add it here, or browse animations and choose “Starter bank”.';
  }
  return {refresh};
}
