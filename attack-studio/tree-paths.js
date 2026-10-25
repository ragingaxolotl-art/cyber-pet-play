export const PATH_KINDS = ['training','attack','defense','support','mastery','custom'];
export function validateExtras(tree) {
  const text=(value,max)=>typeof value==='string'&&value.length<=max;
  if(tree.notes!==undefined&&!text(tree.notes,8000))throw Error('Tree notes must be under 8,000 characters.');
  for(const node of tree.nodes)if(node.notes!==undefined&&!text(node.notes,4000))throw Error('Attack notes must be under 4,000 characters.');
  const starters=tree.starterSkills||[];
  if(!Array.isArray(starters)||new Set(starters).size!==starters.length||starters.some(id=>!tree.nodes.some(n=>n.id===id&&n.requires.length===0)))throw Error('Starter skills must be existing attacks with no prerequisites.');
  const paths=tree.paths||[],details=tree.edgeDetails||[];
  if(!Array.isArray(paths)||paths.length>128||!Array.isArray(details)||details.length>10000)throw Error('Too many named paths or connection notes.');
  const pathIds=new Set(),edges=new Set();
  for(const path of paths){if(!text(path.id,160)||!path.id||pathIds.has(path.id)||!text(path.name,80)||!path.name.trim()||!PATH_KINDS.includes(path.kind)||!/^#[a-f\d]{6}$/i.test(path.color)||!text(path.notes||'',4000))throw Error('Invalid named path.');pathIds.add(path.id);}
  for(const edge of details){const key=JSON.stringify([edge.from,edge.to]);if(edges.has(key)||!tree.nodes.find(n=>n.id===edge.to)?.requires.includes(edge.from)|| (edge.pathId&&!pathIds.has(edge.pathId))||!text(edge.notes||'',2000))throw Error('Invalid connection path or notes.');edges.add(key);}
  return tree;
}
export function trimEdgeDetails(tree) {
  tree.edgeDetails=(tree.edgeDetails||[]).filter(edge=>tree.nodes.find(n=>n.id===edge.to)?.requires.includes(edge.from));
  return tree;
}
export function setEdgeDetails(tree,from,to,pathId,notes='') {
  const next=structuredClone(tree);next.edgeDetails=(next.edgeDetails||[]).filter(edge=>edge.from!==from||edge.to!==to);
  if(pathId||notes.trim())next.edgeDetails.push({from,to,pathId,notes});
  return validateExtras(next);
}
export function installPaths({getTree,commit,applyPending,status}) {
  const $=id=>document.getElementById(id);
  let editing=null,notesSnapshot=null;
  const run=fn=>{try{applyPending();fn();}catch(error){status(error.message);}};
  function refresh(){
    const old=$('activePath').value;$('activePath').replaceChildren(new Option('Unlabeled connections',''));
    for(const path of getTree().paths||[])$('activePath').add(new Option(path.name+' · '+path.kind,path.id));
    if([...$('activePath').options].some(option=>option.value===old))$('activePath').value=old;
    $('editPath').disabled=!$('activePath').value;
    const notes=getTree().notes||'';if(notesSnapshot!==notes){$('treeNotes').value=notes;notesSnapshot=notes;}
  }
  function open(path){editing=path?.id||null;$('pathName').value=path?.name||'';$('pathKind').value=path?.kind||'training';$('pathColor').value=path?.color||'#8fe1d1';$('pathNotes').value=path?.notes||'';$('pathDialog').showModal();}
  $('newPath').onclick=()=>run(()=>open(null));
  $('editPath').onclick=()=>run(()=>open((getTree().paths||[]).find(p=>p.id===$('activePath').value)));
  $('activePath').onchange=()=>$('editPath').disabled=!$('activePath').value;
  $('cancelPath').onclick=()=>$('pathDialog').close();
  $('pathForm').onsubmit=event=>{event.preventDefault();run(()=>{const next=structuredClone(getTree()),path={id:editing||crypto.randomUUID(),name:$('pathName').value.trim(),kind:$('pathKind').value,color:$('pathColor').value,notes:$('pathNotes').value};next.paths=[...(next.paths||[]).filter(p=>p.id!==path.id),path];validateExtras(next);commit(next);$('activePath').value=path.id;$('editPath').disabled=false;$('pathDialog').close();status('Named path saved. New attachments use this path; existing connections have their own path picker.');});};
  $('saveTreeNotes').onclick=()=>run(()=>{const next=structuredClone(getTree());next.notes=$('treeNotes').value;commit(next);status('Tree notes updated. Save tree to retain them.');});
  return {refresh,active:()=>$('activePath').value,
    decorate(path,from,to){const tree=getTree(),detail=(tree.edgeDetails||[]).find(e=>e.from===from&&e.to===to),route=(tree.paths||[]).find(p=>p.id===detail?.pathId);if(route){path.style.stroke=route.color;path.dataset.pathName=route.name;path.setAttribute('stroke-dasharray',({training:'',attack:'',defense:'10 4',support:'3 5',mastery:'12 4 3 4',custom:'6 4'})[route.kind]);}return route;},
    controls(row,from,to){const tree=getTree(),detail=(tree.edgeDetails||[]).find(e=>e.from===from&&e.to===to),label=document.createElement('label'),select=document.createElement('select');label.textContent='Named path';select.add(new Option('Unlabeled',''));for(const path of tree.paths||[])select.add(new Option(path.name+' · '+path.kind,path.id));select.value=detail?.pathId||'';label.append(select);const noteLabel=document.createElement('label'),notes=document.createElement('textarea');noteLabel.textContent='Connection notes';notes.rows=2;notes.maxLength=2000;notes.value=detail?.notes||'';noteLabel.append(notes);const save=document.createElement('button');save.textContent='Update connection';save.onclick=()=>run(()=>{commit(setEdgeDetails(getTree(),from,to,select.value,notes.value));status('Connection path and notes updated. Save tree to retain them.');});row.append(label,noteLabel,save);}
  };
}
