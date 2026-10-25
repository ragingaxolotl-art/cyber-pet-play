import {ancestors} from './skill-tree-model.js';
import {setEdgeDetails,trimEdgeDetails} from './tree-paths.js';

// Connection edits return a copy and never delete attacks or their descendants.
export function editConnection(tree, action, prerequisiteId, attackId) {
  const next = structuredClone(tree);
  const attack = next.nodes.find(node => node.id === attackId);
  if (!attack) throw Error('Choose an attack first.');
  if (action === 'detach') {
    if (!attack.requires.length) throw Error('This attack is already a starting attack.');
    attack.requires = [];
  } else {
    const prerequisite = next.nodes.find(node => node.id === prerequisiteId);
    if (!prerequisite) throw Error('Choose a prerequisite attack.');
    if (action === 'attach') {
      if ((tree.starterSkills||[]).includes(attackId)) throw Error('Remove this attack from the starter bank before adding a prerequisite.');
      if (attackId === prerequisiteId) throw Error('An attack cannot require itself.');
      if (attack.requires.includes(prerequisiteId)) throw Error('These attacks are already connected.');
      if (ancestors(tree, prerequisiteId).has(attackId)) throw Error('That connection would create a learning loop.');
      attack.requires.push(prerequisiteId);
    } else if (action === 'cut') {
      if (!attack.requires.includes(prerequisiteId)) throw Error('That connection no longer exists.');
      attack.requires = attack.requires.filter(id => id !== prerequisiteId);
    } else throw Error('Unknown connection action.');
  }
  if (attack.state === 'ready') attack.state = 'draft';
  return trimEdgeDetails(next);
}

export function auditTree(tree) {
  const roots = tree.nodes.filter(node => !node.requires.length);
  const parents = new Set(tree.nodes.flatMap(node => node.requires));
  const findings = [];
  for (const node of tree.nodes) {
    if (!node.requires.length && !parents.has(node.id)) findings.push({id:node.id, text:'Isolated attack — attach it, or keep it as a standalone starting attack.'});
    if (!node.description.trim() || node.description.startsWith('Describe what this attack does')) findings.push({id:node.id, text:'Add a description explaining the attack and its learning purpose.'});
    if (node.state === 'needs-edit') findings.push({id:node.id, text:'Animation is marked as needing edits.'});
    if (node.state === 'ready' && !node.attack) findings.push({id:node.id, text:'Marked ready, but no edited or tuned attack definition is attached.'});
    if (node.requires.some(id => tree.nodes.find(parent => parent.id === id)?.x >= node.x)) findings.push({id:node.id, text:'A prerequisite sits to the right of this attack. Arrange the tree for a clearer learning order.'});
  }
  return {attacks:tree.nodes.length, connections:tree.nodes.reduce((sum,node)=>sum+node.requires.length,0), roots:roots.length, starters:(tree.starterSkills||[]).length, drafts:tree.nodes.filter(node=>node.state!=='ready').length, findings};
}

export function installConnections({getTree, getSelected, commit, applyPending, select, inspect, status, undo, canUndo, paths}) {
  const $ = id => document.getElementById(id);
  let mode = null;
  const run = action => {try {applyPending();action();} catch (error) {status(error.message);}};
  function cancel() {
    mode = null;
    $('connectionMode').hidden = true;
    document.body.classList.remove('attaching');
  }
  function change(action, prerequisite, attack) {
    let next = editConnection(getTree(), action, prerequisite, attack);
    if(action==='attach'&&paths.active())next=setEdgeDetails(next,prerequisite,attack,paths.active());
    cancel();commit(next);inspect();
    const target = next.nodes.find(node=>node.id===attack);
    status(action==='attach' ? `Attached. Learn the prerequisite before ${target.name}. Save tree to keep it.` : `${action==='detach'?'Detached this attack from all prerequisites':'Cut the connection'}. Attacks and descendants are kept.${target.requires.length?'':' This attack is now a starting attack.'} Undo is available.`);
  }
  $('attachOnTree').onclick = () => run(() => {
    const source=getSelected();if(!source)return;
    mode=source;
    $('connectionMode').hidden=false;
    $('connectionInstruction').textContent=`Attach after ${getTree().nodes.find(n=>n.id===source).name}: choose the attack that should learn next. You can change the branch filter.`;
    document.body.classList.add('attaching');
  });
  $('cancelConnection').onclick=cancel;
  document.addEventListener('keydown',event=>{if(event.key==='Escape')cancel();});
  $('attachPrerequisite').onclick=()=>run(()=>change('attach',$('attachChoice').value,getSelected()));
  $('detachAttack').onclick=()=>run(()=>change('detach',null,getSelected()));
  $('undoTree').onclick=()=>run(()=>{cancel();undo();inspect();status('Undid the last tree change. Save tree to keep this version.');});
  $('auditTree').onclick=()=>run(()=>{
    const report=auditTree(getTree());$('auditReport').hidden=false;
    $('auditSummary').textContent=`${report.attacks} attacks · ${report.connections} connections · ${report.roots} attacks with no prerequisites · ${report.starters} starter skills · ${report.drafts} drafts. No learning loops or missing prerequisites. Suggestions below are for review; separate starting attacks are allowed.`;
    $('auditFindings').replaceChildren();
    for(const finding of report.findings){const item=document.createElement('li'),button=document.createElement('button');button.textContent=getTree().nodes.find(n=>n.id===finding.id).name;button.onclick=()=>run(()=>{cancel();select(finding.id,true);});item.append(button,document.createTextNode(' '+finding.text));$('auditFindings').append(item);}
    if(!report.findings.length)$('auditFindings').textContent='No additional review suggestions.';
    $('auditReport').scrollIntoView({block:'nearest'});
  });
  $('closeAudit').onclick=()=>$('auditReport').hidden=true;
  function refresh() {
    $('undoTree').disabled=!canUndo();
    // Reports describe a snapshot; hide them after a tree change/selection.
    $('auditReport').hidden=true;
    const node=getTree().nodes.find(n=>n.id===getSelected());
    $('connectionEditor').hidden=!node;if(!node)return;
    $('connectionTitle').textContent='Connections for '+node.name;
    $('incomingConnections').replaceChildren();
    for(const id of node.requires){const parent=getTree().nodes.find(n=>n.id===id),row=document.createElement('div'),text=document.createElement('span'),cut=document.createElement('button');text.textContent=parent.name+' → '+node.name;cut.textContent='Cut';cut.setAttribute('aria-label','Cut '+parent.name+' to '+node.name);cut.onclick=()=>run(()=>change('cut',id,node.id));row.className='connection-row';row.append(text,cut);paths.controls(row,id,node.id);$('incomingConnections').append(row);}
    if(!node.requires.length)$('incomingConnections').textContent='Starting attack — no incoming connections.';
    const previous=$('attachChoice').value;$('attachChoice').replaceChildren();
    for(const parent of getTree().nodes){if(parent.id===node.id||node.requires.includes(parent.id)||ancestors(getTree(),parent.id).has(node.id))continue;$('attachChoice').add(new Option(parent.name+' · '+parent.branch,parent.id));}
    if([...$('attachChoice').options].some(option=>option.value===previous))$('attachChoice').value=previous;
    $('attachPrerequisite').disabled=!$('attachChoice').options.length;
    $('detachAttack').disabled=!node.requires.length;
  }
  return {
    refresh,cancel,
    choose(id) {if(!mode)return false;run(()=>{change('attach',mode,id);select(id);});return true;},
    edge(path,prerequisite,attack) {
      path.setAttribute('tabindex','0');path.setAttribute('role','button');
      const nodes=getTree().nodes,from=nodes.find(n=>n.id===prerequisite),to=nodes.find(n=>n.id===attack);
      path.setAttribute('aria-label',`Cut connection from ${from.name} to ${to.name}`);
      const cut=()=>run(()=>change('cut',prerequisite,attack));
      path.onclick=cut;path.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();cut();}};
    }
  };
}
