import {installTreeClassroom} from './tree-classroom.js?v=20261109-slow-motion-release';
import {installTreeWorkspace} from './tree-workspace.js?v=20261109-tree-workspace-2';
import {installTreeTools} from './tree-tools.js?v=20261109-tree-workspace-2';
import {readiness} from './tree-operations.js?v=20261109-tree-workspace-2';
import {makePublication,publicationKey} from './tree-library.js?v=20261109-tree-workspace-2';
import {copyAttack,copyTree} from './tree-operations.js?v=20261109-tree-workspace-2';
import {addIndependentAttacks} from './tree-batch.js?v=20261109-tree-workspace-2';
import {createTreeStore,treeStorageMessage} from './tree-storage.js?v=20261108-tree-storage';
import {readTreeSession,writeTreeSession,restoreTreeHistory} from './tree-session.js?v=20261108-workflow';
import {BUNDLE_FORMAT,exportDataSet,importDataSet,validateBundle,bundleSummary} from './tree-bundle.js?v=20261109-slow-motion-release';
import {reviewImport} from './import-preview.js?v=20261108-workflow';
import {requestEditorName} from './editor-name-dialog.js?v=20261108-scheduled-sequences';
import {installAccessibility} from './editor-accessibility.js?v=20261110-workspace-docks';
import {catalogEntries} from './attack-browser-model.js?v=20261108-workflow';
import {installAttackBrowser} from './attack-browser.js?v=20261110-library-management';
import {readSavedBrowserAttacks} from './browser-saved-attacks.js?v=20261109-bank-reopen-release';
import {MAIN_TREE,treeStorageKey,readCabinet,createTree,renameTree,relatedNodeIds,treeBounds} from './tree-cabinet.js?v=20261109-slow-motion-release';
import {DATASETS_KEY,dataSetKey,readDataSets,pathNodeIds} from './tree-datasets.js?v=20261109-slow-motion-release';
import {installTreeZoom} from './tree-zoom.js?v=20261108-scheduled-sequences';
import {installConnections} from './tree-connections.js?v=20261109-slow-motion-release';
import {installPaths,validateExtras,trimEdgeDetails,setEdgeDetails} from './tree-paths.js?v=20261108-scheduled-sequences';
import {installTreeGallery} from './tree-gallery.js?v=20261108-scheduled-sequences';
import {installStarters,setStarter} from './tree-starters.js?v=20261108-scheduled-sequences';
import {TREE_KEY,validateTree,starterTree,ancestors,arrange,treeVersion} from './skill-tree-model.js?v=20261109-slow-motion-release';
import {validateAttack} from './combat-model.js?v=20261110-library-management';
const $=id=>document.getElementById(id),say=t=>$('status').textContent=t;
let treeStore,editRevision=0,tree,effects,ids,setups,selected,dirty=false,baseSaved=null,playing=false,clipFrame=0,clipElapsed=0,last=0;
let dataSets=[],dataSetId='original',treeId=MAIN_TREE,treeKey=TREE_KEY;
let navigationMode='all',zoomControls,treeBrowser;const savedTreeSession=readTreeSession(localStorage),treeViews=new Map(savedTreeSession.views),openTreeTabs=new Map(),treeHistories=new Map();
let connections,paths,starters,treeTools,treeLayout;const history=[];
const images=new Map(),nodeViews=new Map();
const el=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
const current=()=>tree.nodes.find(n=>n.id===selected);
function check(value){return validateExtras(validateTree(value,ids,validateAttack));}
async function save(){applyPending();check(tree);const data=JSON.stringify(tree),revision=editRevision;await treeStore.transaction(storage=>{if(storage.getItem(treeKey)!==baseSaved)throw Error('This tree changed in another tab. Download your edits, then reload before saving.');storage.setItem(treeKey,data);});baseSaved=data;if(editRevision===revision)dirty=false;refreshSaveState();say('Tree saved in this browser. Download a copy to move it to another device.');}
function commit(candidate){candidate.version=treeVersion(candidate);trimEdgeDetails(candidate);candidate.starterSkills=(candidate.starterSkills||[]).filter(id=>candidate.nodes.some(n=>n.id===id));check(candidate);if(JSON.stringify(candidate)===JSON.stringify(tree))return;history.push(structuredClone(tree));if(history.length>20)history.shift();tree=candidate;editRevision++;dirty=true;render();}
function selectNode(id,reveal=false){selected=id;playing=false;if(reveal){navigationMode='all';$('branch').value='';$('search').value='';$('viewPath').value='';}render();inspect();if(reveal)nodeViews.get(id)?.scrollIntoView({block:'nearest',inline:'center'});}
function applyPending(){if(!tree)return;const candidate=structuredClone(tree),n=candidate.nodes.find(n=>n.id===selected);candidate.notes=$('treeNotes').value;if(n&&!$('editor').hidden){for(const key of ['name','description','state','requirement'])n[key]=$(key).value.trim();n.branch=$('nodeBranch').value.trim();n.notes=$('attackNotes').value;if(n.cost!==undefined||Number($('learningCost').value)!==(n.requires.length?2:1))n.cost=Number($('learningCost').value);n.requires=[...$('prerequisites').querySelectorAll('input:checked')].map(input=>input.value);if(JSON.stringify(n.requires)!==JSON.stringify(current().requires)&&n.state==='ready')n.state='draft';}commit(candidate);}
function undo(){if(!history.length)return;tree=history.pop();if(!tree.nodes.some(n=>n.id===selected))selected=tree.nodes[0]?.id;dirty=true;render();}

function visible(){const related=navigationMode==='all'?null:relatedNodeIds(tree,selected,navigationMode);const pathIds=pathNodeIds(tree,$('viewPath').value);const query=$('search').value.toLowerCase();const parents=new Set(tree.nodes.flatMap(n=>n.requires));return tree.nodes.filter(n=>(!tree.starterSkills?.includes(n.id)||parents.has(n.id)||selected===n.id)&&(!related||related.has(n.id))&&(!pathIds||pathIds.has(n.id))&&(!$('branch').value||n.branch===$('branch').value)&&(!query||(n.name+' '+n.description).toLowerCase().includes(query)));}
function branches(){const old=$('branch').value;$('branch').replaceChildren(new Option('All branches',''));for(const branch of [...new Set(tree.nodes.map(n=>n.branch))].sort())$('branch').add(new Option(branch,branch));$('branch').value=[...$('branch').options].some(o=>o.value===old)?old:'';}
function paint(canvas,effect,index){
 const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);if(!effect)return;
 const url=effect.sheet||effect.frames?.[index]||effect.preview;if(!url)return;
 let image=images.get(url);if(!image){image=new Image();images.set(url,image);image.src=url;}
 const draw=()=>{if(!image.naturalWidth)return;const [w,h]=effect.canvas||[image.naturalWidth,image.naturalHeight],cols=effect.columns||1,sx=effect.sheet?index%cols*w:0,sy=effect.sheet?Math.floor(index/cols)*h:0,scale=Math.min(canvas.width/w,canvas.height/h)*.9;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=false;ctx.drawImage(image,sx,sy,w,h,(canvas.width-w*scale)/2,(canvas.height-h*scale)/2,w*scale,h*scale);};if(image.complete)draw();else image.addEventListener('load',draw,{once:true});
}
function drawEdges(nodes){const svg=$('connections');svg.replaceChildren();const ns='http://www.w3.org/2000/svg',defs=document.createElementNS(ns,'defs'),marker=document.createElementNS(ns,'marker');marker.id='arrow';for(const [k,v] of Object.entries({viewBox:'0 0 10 10',refX:'9',refY:'5',markerWidth:'7',markerHeight:'7',orient:'auto-start-reverse'}))marker.setAttribute(k,v);const arrow=document.createElementNS(ns,'path');arrow.setAttribute('d','M 0 0 L 10 5 L 0 10 z');arrow.setAttribute('fill','#7db6bd');marker.append(arrow);defs.append(marker);svg.append(defs);const map=new Map(nodes.map(n=>[n.id,n]));for(const n of nodes)for(const p of n.requires){const source=map.get(p);if(!source)continue;const path=document.createElementNS(ns,'path'),x=source.x+244,y=source.y+100,tx=n.x,ty=n.y+100,bend=Math.max(45,Math.abs(tx-x)/2);path.setAttribute('d',`M ${x} ${y} C ${x+bend} ${y}, ${tx-bend} ${ty}, ${tx} ${ty}`);path.setAttribute('class','edge');const title=document.createElementNS(ns,'title');title.textContent=source.name+' → '+n.name;path.append(title);svg.append(path);const route=paths?.decorate(path,p,n.id);if(route){const text=document.createElementNS(ns,'text');text.textContent=route.name;text.setAttribute('x',(x+tx)/2);text.setAttribute('y',Math.min(source.y,n.y)-10);text.setAttribute('class','path-label');svg.append(text);}const hit=path.cloneNode(true);hit.setAttribute('class','edge-hit');hit.removeAttribute('style');hit.removeAttribute('stroke-dasharray');connections?.edge(hit,p,n.id);svg.append(hit);}}
function render(){refreshTreeNavigation();refreshPathPicker();branches();const nodes=visible();nodeViews.clear();$('nodes').replaceChildren();const minY=nodes.length?Math.min(...nodes.map(n=>n.y))-40:0;const view=nodes.map(n=>({...n,y:n.y-minY}));const width=Math.max(700,...view.map(n=>n.x+280)),height=Math.max(480,...view.map(n=>n.y+240));$('board').style.width=width+'px';$('board').style.height=height+'px';$('connections').setAttribute('width',width);$('connections').setAttribute('height',height);drawEdges(view);
 for(const n of view){const card=el('article');card.className='node'+(selected===n.id?' selected':'');card.style.left=n.x+'px';card.style.top=n.y+'px';const canvas=el('canvas');canvas.width=80;canvas.height=80;canvas.setAttribute('aria-label',n.name+' clip shot');paint(canvas,effects.get(n.effectId),Math.max(0,(effects.get(n.effectId).impact||1)-1));const choose=el('button',n.name);choose.className='choose';choose.onclick=()=>{try{if(connections?.choose(n.id))return;applyPending();selectNode(n.id);}catch(error){say(error.message);}};if((tree.starterSkills||[]).includes(n.id)){card.classList.add('starter');choose.textContent='★ '+n.name;}const detail=el('p',n.description),state=el('small',`${n.branch} · ${n.state==='needs-edit'?'Animation needs editing':n.state==='ready'?'Ready':'Draft'}`),rule=el('small',(tree.starterSkills||[]).includes(n.id)?'Given at start · starter bank':n.requires.length?`Learn ${n.requirement==='all'?'all':'any'} of ${n.requires.length} prerequisites${n.requires.some(id=>!view.some(p=>p.id===id))?' · some hidden':''}`:'Available to learn · no prerequisites');const move=el('button','↔ Move');move.className='move';move.setAttribute('aria-label','Move '+n.name);card.append(canvas,choose,detail,state,rule,move);treeTools?.decorate(card,n);$('nodes').append(card);nodeViews.set(n.id,card);
 move.onpointerdown=e=>{e.preventDefault();move.setPointerCapture(e.pointerId);const origin={x:e.clientX,y:e.clientY,nx:n.x,ny:n.y},zoom=Number($('zoom').value);move.onpointermove=event=>{n.x=Math.max(0,Math.min(50000,origin.nx+(event.clientX-origin.x)/zoom));n.y=Math.max(0,Math.min(50000-minY,origin.ny+(event.clientY-origin.y)/zoom));card.style.left=n.x+'px';card.style.top=n.y+'px';drawEdges(view);};const end=()=>{const candidate=structuredClone(tree),original=candidate.nodes.find(v=>v.id===n.id);original.x=n.x;original.y=Math.max(0,n.y+minY);move.onpointermove=null;commit(candidate);};move.onpointerup=end;move.onpointercancel=end;};
 }
 paths?.refresh();connections?.refresh();starters?.refresh();treeTools?.refresh();refreshSaveState();renderTreeList();
 if(!nodes.length)$('nodes').append(el('p','No matching attacks. Choose another branch or add an animation.'));
}
function prerequisites(){const n=current();if(!n)return;const chosen=new Set([...$('prerequisites').querySelectorAll('input:checked')].map(e=>e.value));if(!$('prerequisites').children.length)for(const id of n.requires)chosen.add(id);const query=$('prerequisiteSearch').value.toLowerCase();$('prerequisites').replaceChildren();for(const p of tree.nodes.filter(p=>p.id!==n.id)){const label=el('label'),input=el('input');input.type='checkbox';input.value=p.id;input.checked=chosen.has(p.id);input.disabled=ancestors(tree,p.id).has(n.id);label.hidden=!(p.name+' '+p.branch).toLowerCase().includes(query);label.append(input,document.createTextNode(p.name+' · '+p.branch));$('prerequisites').append(label);}}
function inspect(){const n=current();$('editor').hidden=!n;if(!n){$('selectedTitle').textContent='Choose an attack';return;}$('selectedTitle').textContent=n.name;for(const key of ['name','description','state','requirement'])$(key).value=n[key];$('attackNotes').value=n.notes||'';$('learningCost').value=n.cost??(n.requires.length?2:1);$('nodeBranch').value=n.branch;$('prerequisiteSearch').value='';$('prerequisites').replaceChildren();prerequisites();const inherited=[...ancestors(tree,n.id)].filter(id=>!n.requires.includes(id)).map(id=>tree.nodes.find(p=>p.id===id).name);$('inherited').textContent=inherited.length?'Earlier prerequisites along these paths: '+inherited.join(', ')+'. ANY choices depend on the path taken.':'No indirect prerequisites yet.';const effect=effects.get(n.effectId);$('frame').max=effect.times.length-1;clipFrame=Math.max(0,(effect.impact||1)-1);showFrame();$('play').textContent='Play clip';}
function showFrame(){if(!current())return;const effect=effects.get(current().effectId);paint($('clip'),effect,clipFrame);$('frame').value=clipFrame;$('frameLabel').textContent=`${clipFrame+1}/${effect.times.length}`;}
function libraryOptions(){const query=$('librarySearch').value.toLowerCase();$('effect').replaceChildren();for(const e of effects.values())if((e.name+' '+e.element+' '+e.slot).toLowerCase().includes(query))$('effect').add(new Option(e.name+' · '+e.element+' · '+e.slot,e.id));$('add').disabled=!$('effect').options.length;}
let actionBusy=false;function guarded(fn){return async event=>{if(actionBusy)return;actionBusy=true;try{await fn(event);}catch(e){say(treeStorageMessage(e));}finally{actionBusy=false;}};}
$('editor').onsubmit=guarded(event=>{event.preventDefault();applyPending();inspect();say('Attack, notes and connections updated. Save tree to retain them.');});
$('prerequisiteSearch').oninput=prerequisites;
$('save').onclick=guarded(save);
$('download').onclick=guarded(()=>{applyPending();check(tree);const url=URL.createObjectURL(new Blob([JSON.stringify(tree,null,2)],{type:'application/json'}));const link=el('a');link.href=url;link.download=(dataSets.find(d=>d.id===dataSetId)?.trees.find(t=>t.id===treeId)?.name||'skill-tree').replace(/[^a-z0-9_-]/gi,'-')+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);say('Tree download started, including saved attack and animation edits.');});
const downloadSet=el('button','Download entire data set');downloadSet.id='downloadDataSet';$('download').after(downloadSet);
downloadSet.onclick=guarded(async()=>{applyPending();check(tree);await treeStore.refresh();const backupStorage={getItem:key=>key===treeKey?JSON.stringify(tree):treeStore.getItem(key)};const bundle=exportDataSet(backupStorage,dataSetId,check),url=URL.createObjectURL(new Blob([JSON.stringify(bundle,null,2)],{type:'application/json'})),link=el('a');link.href=url;link.download=bundle.name.replace(/[^a-z0-9_-]/gi,'-')+'-data-set.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);say('Downloaded all '+bundle.trees.length+' trees in '+bundle.name+'.');});
$('open').textContent='Import tree or data set';$('open').onclick=()=>$('file').click();
$('file').onchange=guarded(async()=>{
 const f=$('file').files[0];if(!f)return;
 try{
  if(f.size>64*1024*1024)throw Error('Choose a backup under 64 MiB.');
  const value=JSON.parse(await f.text()),isBundle=value?.format===BUNDLE_FORMAT;
  const bundle=isBundle?validateBundle(value,check):{format:BUNDLE_FORMAT,version:1,name:f.name.replace(/\.json$/i,'').slice(0,80)||'Imported tree',trees:[{id:MAIN_TREE,name:'Main tree',tree:check(value)}]};
  const accepted=await reviewImport({title:'Import '+bundle.name,description:'This creates a separate data set. Your existing trees stay in place.',items:bundleSummary(bundle).map(item=>item.name+' — '+item.attacks+' attacks, '+item.paths+' paths')});
  if(!accepted)return;await save();const id=await treeStore.transaction(storage=>importDataSet(storage,bundle,check));await openDataSet(id);say('Imported '+bundle.trees.length+' trees into '+bundle.name+'.');
 }finally{$('file').value='';}
});

$('branch').onchange=guarded(()=>{applyPending();render();});$('search').oninput=guarded(()=>{applyPending();render();});zoomControls=installTreeZoom($);
$('arrange').onclick=guarded(()=>{applyPending();const candidate=structuredClone(tree),shown=new Set(visible().map(n=>n.id)),nodes=candidate.nodes.filter(n=>shown.has(n.id));const local={nodes:nodes.map(n=>({...n,requires:n.requires.filter(id=>shown.has(id))}))};const offset=nodes.length?Math.max(0,Math.min(...nodes.map(n=>n.y))-40):0;arrange(local);for(const pos of local.nodes){const n=candidate.nodes.find(n=>n.id===pos.id);n.x=pos.x;n.y=pos.y+offset;}commit(candidate);});
$('librarySearch').oninput=libraryOptions;
function addEffect(effectId,placement='attached',definition=null){
 if(tree.nodes.length>=512)throw Error('A tree can hold 512 attacks.');
 const e=effects.get(effectId),setup=definition?{attack:definition}:setups.get(e.id),parent=placement==='attached'?current():null;
 const node={id:crypto.randomUUID(),name:setup?.attack.name||e.name,description:e.description||'Describe what this attack does and why it follows its prerequisites.',branch:parent?.branch||e.element,effectId:e.id,state:'needs-edit',requirement:'all',requires:parent?[parent.id]:[],x:parent?Math.min(49500,parent.x+300):32,y:Math.min(49500,Math.max(0,...tree.nodes.map(n=>n.y))+244),...(setup?{attack:copyAttack(setup.attack)}:{})};
 if(paths.active())node.pathIds=[paths.active()];
 let candidate=structuredClone(tree);candidate.nodes.push(node);
 if(parent&&paths.active())candidate=setEdgeDetails(candidate,parent.id,node.id,paths.active());
 if(placement==='starter')candidate=setStarter(candidate,node.id,true);
 navigationMode='all';selected=node.id;$('branch').value='';$('search').value='';commit(candidate);inspect();nodeViews.get(node.id)?.scrollIntoView({block:'nearest',inline:'center'});
}
$('add').onclick=guarded(()=>{applyPending();addEffect($('effect').value);say('Added animation as an editable attack. Review its description and prerequisites.');});
$('remove').onclick=guarded(()=>{applyPending();if(!confirm('Remove this attack and its direct prerequisite connections? Dependent attacks will need their learning rules reviewed.'))return;const candidate=structuredClone(tree);candidate.nodes=candidate.nodes.filter(n=>n.id!==selected);for(const n of candidate.nodes)if(n.requires.includes(selected)){n.requires=n.requires.filter(id=>id!==selected);n.state='draft';}selected=candidate.nodes[0]?.id;commit(candidate);inspect();});
$('editAnimation').onclick=guarded(async()=>{await save();location.href='design.html?treeNode='+encodeURIComponent(selected)+'&dataSet='+encodeURIComponent(dataSetId)+'&tree='+encodeURIComponent(treeId);});
$('play').onclick=()=>{playing=!playing;$('play').textContent=playing?'Pause clip':'Play clip';};$('frame').oninput=()=>{playing=false;$('play').textContent='Play clip';clipFrame=Number($('frame').value);showFrame();};
function tick(now){if(playing&&current()){const effect=effects.get(current().effectId);clipElapsed+=Math.min(now-last,100);if(clipElapsed>=(effect.times[clipFrame]||100)){clipElapsed=0;clipFrame=(clipFrame+1)%effect.times.length;showFrame();}}last=now;requestAnimationFrame(tick);}
$('editor').addEventListener('input',event=>{if(!['frame','prerequisiteSearch'].includes(event.target.id)){editRevision++;dirty=true;refreshSaveState();}});$('treeNotes').oninput=()=>{editRevision++;dirty=true;refreshSaveState();};
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
try{treeStore=await createTreeStore();const responses=await Promise.all([fetch('vfx-library.json'),fetch('reviewed-attacks.json')]);if(responses.some(r=>!r.ok))throw Error('Could not load the attack library.');const [library,reviewed]=await Promise.all(responses.map(r=>r.json()));effects=new Map(library.effects.map(e=>[e.id,e]));ids=new Set(effects.keys());setups=new Map(reviewed.attacks.map(s=>[s.effectId,s]));dataSets=readCabinet(treeStore);dataSetId=new URLSearchParams(location.search).get('dataSet')||savedTreeSession.active?.dataSetId||'original';if(!dataSets.some(d=>d.id===dataSetId))dataSetId=dataSets[0].id;treeId=new URLSearchParams(location.search).get('tree')||(!new URLSearchParams(location.search).has('dataSet')?savedTreeSession.active?.treeId:null)||MAIN_TREE;if(!dataSets.find(d=>d.id===dataSetId).trees.some(t=>t.id===treeId)){if(new URLSearchParams(location.search).has('tree'))throw Error('The requested tree is not in this browser. Import its backup to open it.');treeId=MAIN_TREE;}for(const tab of savedTreeSession.tabs)if(dataSets.find(d=>d.id===tab.dataSetId)?.trees.some(t=>t.id===tab.treeId))openTreeTabs.set(treeStorageKey(tab.dataSetId,tab.treeId),tab);treeKey=treeStorageKey(dataSetId,treeId);rememberTab();refreshDataSets();baseSaved=treeStore.getItem(treeKey);tree=baseSaved?check(JSON.parse(baseSaved)):check(starterTree(library.effects,setups));dirty=!baseSaved;branches();$('branch').value='air';selected=tree.nodes.find(n=>n.branch==='air')?.id||tree.nodes[0]?.id;paths=installPaths({getTree:()=>tree,commit,applyPending,status:say});
connections=installConnections({getTree:()=>tree,getSelected:()=>selected,commit,applyPending,select:selectNode,inspect,status:say,undo,canUndo:()=>history.length>0,paths});
starters=installStarters({getTree:()=>tree,getSelected:()=>selected,commit,applyPending,select:selectNode,inspect,status:say,effects});
treeTools=installTreeTools({getTree:()=>tree,commit,applyPending,select:selectNode,status:say,validate:check});installTreeCatalog();treeLayout=installTreeWorkspace();installTreeDelivery();
installAccessibility($('treeAccessibility'));render();restoreView(treeViews.get(treeKey));inspect();libraryOptions();say(`${tree.nodes.length} attacks in the learning tree. ${baseSaved?'Restored saved edits.':'Proposed order — edit and save to keep it.'}`);requestAnimationFrame(tick);}catch(e){say('Could not open tree: '+treeStorageMessage(e));}

function refreshDataSets(){
 $('dataSet').replaceChildren(...dataSets.map(d=>new Option(d.name,d.id)));$('dataSet').value=dataSetId;
}
function refreshPathPicker(){
 const old=$('viewPath').value;$('viewPath').replaceChildren(new Option('All paths',''),...(tree.paths||[]).map(p=>new Option(p.name,p.id)));
 if((tree.paths||[]).some(p=>p.id===old))$('viewPath').value=old;
}
function rememberTab(){openTreeTabs.set(treeKey,{dataSetId,treeId});}
function rememberView(){treeViews.set(treeKey,{selected,branch:$('branch').value,search:$('search').value,path:$('viewPath').value,active:$('activePath').value,left:$('viewport').scrollLeft,top:$('viewport').scrollTop,zoom:Number($('zoom').value),mode:navigationMode,display:$('treeViewMode').value});}
async function openDataSet(id,nextTree=MAIN_TREE){
 await treeStore.refresh();
 const cabinet=readCabinet(treeStore),entry=cabinet.find(d=>d.id===id)?.trees.find(t=>t.id===nextTree);if(!entry)throw Error('That tree is no longer listed. Reload to refresh the sidebar.');
 const key=treeStorageKey(id,nextTree),raw=treeStore.getItem(key);if(!raw)throw Error('This tree has no saved data. Import its backup to restore it.');const next=check(JSON.parse(raw));
 rememberView();treeHistories.set(treeKey,{base:baseSaved,items:structuredClone(history)});connections?.cancel();tree=next;treeKey=key;dataSetId=id;treeId=nextTree;dataSets=cabinet;treeTools?.clear();baseSaved=raw;dirty=false;history.splice(0,history.length,...restoreTreeHistory(treeHistories.get(key),raw,check));playing=false;
 const view=treeViews.get(key);selected=next.nodes.some(n=>n.id===view?.selected)?view.selected:next.nodes[0]?.id;navigationMode=view?.mode||'all';
 $('branch').value='';$('search').value=view?.search||'';$('viewPath').value='';$('activePath').value='';$('treeNotes').value=tree.notes||'';
 rememberTab();refreshDataSets();render();
 if(view){$('branch').value=view.branch;$('viewPath').value=view.path;$('activePath').value=view.active;render();}
 restoreView(view);inspect();persistTreeSession();
 const url=new URL(location.href);url.searchParams.set('dataSet',id);url.searchParams.set('tree',nextTree);window.history.replaceState(null,'',url);
 say('Opened '+entry.name+' in '+dataSets.find(d=>d.id===id).name+'.');
}
function restoreView(view){
 if(!view){$('treeViewMode').value='tree';$('viewport').hidden=false;$('treeList').hidden=true;zoomControls?.setZoom(1);$('viewport').scrollTo(0,0);return;}
 selected=tree.nodes.some(n=>n.id===view.selected)?view.selected:tree.nodes[0]?.id;navigationMode=view.mode||'all';$('branch').value=view.branch;$('search').value=view.search;$('viewPath').value=view.path;$('activePath').value=view.active;$('treeViewMode').value=view.display||'tree';$('viewport').hidden=view.display==='list';$('treeList').hidden=view.display!=='list';render();zoomControls?.setZoom(view.zoom);$('viewport').scrollTo(view.left,view.top);
}
function persistTreeSession(){if(!tree)return;rememberView();try{writeTreeSession(localStorage,{tabs:[...openTreeTabs.values()],views:[...treeViews],active:{dataSetId,treeId}});}catch{ /* View preferences must never block saving tree content. */ }}
window.addEventListener('pagehide',persistTreeSession);window.addEventListener('beforeunload',persistTreeSession);
let sessionTimer;const scheduleSession=()=>{clearTimeout(sessionTimer);sessionTimer=setTimeout(persistTreeSession,250);};
document.addEventListener('click',scheduleSession);document.addEventListener('change',scheduleSession);document.addEventListener('input',scheduleSession);$('viewport').addEventListener('scroll',scheduleSession);$('viewport').addEventListener('pointerup',scheduleSession);$('viewport').addEventListener('wheel',scheduleSession);
async function createDataSet(name,next){
 check(next);const id=await treeStore.transaction(storage=>{const latest=readDataSets(storage),id=crypto.randomUUID();storage.setItem(dataSetKey(id),JSON.stringify(next));latest.push({id,name,trees:[{id:MAIN_TREE,name:'Main tree'}]});storage.setItem(DATASETS_KEY,JSON.stringify(latest));return id;});await openDataSet(id);
}
$('dataSet').onchange=guarded(async()=>{const id=$('dataSet').value;try{await save();await openDataSet(id);}finally{refreshDataSets();}});
$('newDataSet').onclick=guarded(async()=>{const name=await requestEditorName('New data set name');if(!name?.trim())return;if(name.trim().length>80)throw Error('Use a name under 80 characters.');await save();await createDataSet(name.trim(),{format:'cyber-pet-attack-skill-tree',version:1,nodes:[],paths:[],edgeDetails:[],notes:''});});
$('renameDataSet').onclick=guarded(async()=>{const name=await requestEditorName('Data set name',dataSets.find(d=>d.id===dataSetId).name);if(!name?.trim())return;if(name.trim().length>80)throw Error('Use a name under 80 characters.');await treeStore.transaction(storage=>{const latest=readDataSets(storage);latest.find(d=>d.id===dataSetId).name=name.trim();storage.setItem(DATASETS_KEY,JSON.stringify(latest));});dataSets=readCabinet(treeStore);refreshDataSets();refreshTreeNavigation();});
$('viewPath').onchange=guarded(()=>{applyPending();navigationMode='all';$('activePath').value=$('viewPath').value;$('branch').value='';$('search').value='';render();});

function refreshTreeNavigation(){
 if(!tree)return;
 const explorer=$('treeExplorer');explorer.replaceChildren();
 for(const dataSet of dataSets){const group=el('details'),heading=el('summary',dataSet.name);group.open=dataSet.id===dataSetId;group.append(heading);
  for(const item of dataSet.trees){const button=el('button',item.name);button.className='tree-open';button.setAttribute('aria-current',String(dataSet.id===dataSetId&&item.id===treeId));button.onclick=guarded(async()=>{await save();await openDataSet(dataSet.id,item.id);});group.append(button);
   if(dataSet.id===dataSetId&&item.id===treeId)for(const path of tree.paths||[]){const route=el('button','↳ '+path.name);route.className='path-open';route.onclick=guarded(()=>{applyPending();navigationMode='all';$('viewPath').value=path.id;$('activePath').value=path.id;$('branch').value='';$('search').value='';render();fitTree();});group.append(route);}
  }explorer.append(group);
 }
 const tabs=$('treeTabs');tabs.replaceChildren();for(const [key,tab] of openTreeTabs){const set=dataSets.find(d=>d.id===tab.dataSetId),item=set?.trees.find(t=>t.id===tab.treeId);if(!item)continue;const button=el('button',set.name+' / '+item.name);button.setAttribute('aria-pressed',String(key===treeKey));button.onclick=guarded(async()=>{await save();await openDataSet(tab.dataSetId,tab.treeId);});tabs.append(button);}
 treeBrowser?.refreshDestination();
 $('treeBreadcrumb').textContent=dataSets.find(d=>d.id===dataSetId)?.name+' / '+dataSets.find(d=>d.id===dataSetId)?.trees.find(t=>t.id===treeId)?.name;
}
function renderTreeList(){const list=$('treeList');list.replaceChildren();for(const node of visible()){
 const row=el('article'),choose=el('button',node.name);choose.onclick=guarded(()=>{applyPending();selectNode(node.id);});row.append(choose,el('p',node.description),el('small',node.requires.length?'Requires '+node.requires.map(id=>tree.nodes.find(n=>n.id===id)?.name).join(', '):'No prerequisites'));list.append(row);
}if(!visible().length)list.append(el('p','No attacks match these filters. Show all attacks or add one.'));}
function fitTree(){const nodes=visible(),bounds=treeBounds(nodes),minY=nodes.length?Math.min(...nodes.map(n=>n.y))-40:0;zoomControls?.fit({...bounds,y:bounds.y-minY});}
$('newTree').onclick=guarded(async()=>{const name=await requestEditorName('New tree name');if(!name?.trim())return;await save();const id=await treeStore.transaction(storage=>createTree(storage,dataSetId,name,{format:'cyber-pet-attack-skill-tree',version:1,nodes:[],paths:[],edgeDetails:[],notes:''},check));await openDataSet(dataSetId,id);});
$('duplicateTree').onclick=guarded(async()=>{const name=await requestEditorName('Name for the independent copy',dataSets.find(d=>d.id===dataSetId).trees.find(t=>t.id===treeId).name+' copy');if(!name?.trim())return;await save();const id=await treeStore.transaction(storage=>createTree(storage,dataSetId,name,copyTree(tree),check));await openDataSet(dataSetId,id);});
$('renameTree').onclick=guarded(async()=>{const name=await requestEditorName('Tree name',dataSets.find(d=>d.id===dataSetId).trees.find(t=>t.id===treeId).name);if(!name?.trim())return;dataSets=await treeStore.transaction(storage=>renameTree(storage,dataSetId,treeId,name));refreshTreeNavigation();});
$('fitTree').onclick=fitTree;
$('showAllNodes').onclick=guarded(()=>{applyPending();navigationMode='all';$('viewPath').value='';$('branch').value='';$('search').value='';render();fitTree();});
for(const [id,direction] of [['showPrerequisites','before'],['showUnlocks','after']])$(id).onclick=guarded(()=>{applyPending();if(!current())throw Error('Select an attack first.');navigationMode=direction;$('viewPath').value='';$('branch').value='';$('search').value='';render();fitTree();});
$('treeViewMode').onchange=()=>{$('viewport').hidden=$('treeViewMode').value==='list';$('treeList').hidden=$('treeViewMode').value!=='list';renderTreeList();};
for(const [id,dx,dy] of [['moveNodeLeft',-40,0],['moveNodeRight',40,0],['moveNodeUp',0,-40],['moveNodeDown',0,40]])$(id).onclick=guarded(()=>{applyPending();if(!current())throw Error('Select an attack to move.');const next=structuredClone(tree),node=next.nodes.find(n=>n.id===selected);node.x=Math.max(0,Math.min(50000,node.x+dx));node.y=Math.max(0,Math.min(50000,node.y+dy));commit(next);});

function installTreeCatalog(){
 let saved=[],savedLabel='Saved attacks',attachNext=false;
 const browser=treeBrowser=installAttackBrowser({allowKeepAdding:true,getExisting:()=>tree.nodes,batchAction:{available:e=>!!e.effect,run:entries=>{applyPending();const next=addIndependentAttacks(tree,entries,paths.active());commit(next);selected=next.nodes[next.nodes.length-entries.length].id;navigationMode='all';$('branch').value='';$('search').value='';$('viewPath').value='';render();inspect();fitTree();say('Added '+entries.length+' independent attacks. Select an attack and use Attach next attack on tree to connect them. Save this tree to keep your changes.');}},getDestination:()=>{const dataSet=dataSets.find(d=>d.id===dataSetId),board=dataSet?.trees.find(t=>t.id===treeId),path=(tree.paths||[]).find(p=>p.id===$('activePath').value);return 'Destination: '+dataSet?.name+' / '+board?.name+(path?' / '+path.name:'')+(attachNext&&current()?' → next after '+current().name:' → independent attack');},getEntries:()=>{let drafts=[];try{const p=JSON.parse(localStorage.getItem('cyber-pet-combat-design-v1-recovery')||localStorage.getItem('cyber-pet-combat-design-v1')||'null');drafts=(p?.attacks||[]).filter(a=>{try{validateAttack(a,ids);return true;}catch{return false;}});}catch{}return catalogEntries({effects,setups,drafts,saved,savedLabel});},loadSaved:async()=>{const result=await readSavedBrowserAttacks(a=>validateAttack(a,ids));saved=result.attacks;savedLabel=result.label;if(result.notice)say(result.notice);},status:say,actions:[
  {label:()=>attachNext?'Add after selected attack':'Add independent copy to tree',available:e=>!!e.effect,run:e=>{applyPending();addEffect(e.effect.id,attachNext?'attached':'standalone',e.attack);say('Added '+e.name+(attachNext?' after the selected attack.':' as an independent tree attack.'));}},
  {label:'Add after selected attack',available:e=>!!e.effect&&!!current()&&!attachNext,run:e=>{applyPending();addEffect(e.effect.id,'attached',e.attack);say('Added '+e.name+' after the selected attack.');}},
  {label:'Add to starter skills',available:e=>!!e.effect,run:e=>{applyPending();addEffect(e.effect.id,'starter',e.attack);}}
 ]});
 const buildButton=el('button','Build-path workspace'),placementLabel=el('label','Add attacks as'),placement=el('select'),finderHost=el('aside');buildButton.id='buildPathWorkspace';buildButton.setAttribute('aria-pressed','false');placement.setAttribute('aria-label','Build-path placement');placement.append(new Option('Next after selected attack','attached'),new Option('Independent attacks','standalone'));placementLabel.append(placement);placementLabel.hidden=true;finderHost.className='tree-builder-finder';finderHost.hidden=true;document.querySelector('.workspace').prepend(finderHost);$('browseAttacks').after(buildButton);buildButton.after(placementLabel);
 let building=false;
 const setBuilding=on=>{const pageUrl=new URL(location.href);pageUrl.searchParams.delete('workspace');window.history.replaceState(null,'',pageUrl);building=on;document.querySelector('.tree-layout').classList.toggle('build-path',on);buildButton.setAttribute('aria-pressed',String(on));buildButton.textContent=on?'Standard tree workspace':'Build-path workspace';placementLabel.hidden=!on;finderHost.hidden=!on;if(on){attachNext=placement.value==='attached'&&!!current();browser.dock(finderHost);}else browser.undock();treeLayout?.refresh();try{localStorage.setItem('cyber-pet-build-path-workspace',String(on));}catch{}};
 buildButton.onclick=guarded(()=>{applyPending();setBuilding(!building);});placement.onchange=()=>{attachNext=placement.value==='attached'&&!!current();browser.refresh();};
 const refreshDestination=browser.refreshDestination;browser.refreshDestination=()=>{const previous=attachNext;if(building)attachNext=placement.value==='attached'&&!!current();refreshDestination();if(previous!==attachNext)browser.refresh();};
 if(new URLSearchParams(location.search).get('workspace')==='build-path'||localStorage.getItem('cyber-pet-build-path-workspace')==='true')setBuilding(true);
 $('browseAttacks').textContent='Find attacks to add';$('browseAttacks').onclick=guarded(()=>{applyPending();attachNext=building&&placement.value==='attached'&&!!current();browser.open();});
 $('addNextAttack').onclick=guarded(()=>{applyPending();if(!current())throw Error('Select an attack to add its next step.');attachNext=true;browser.open();});
}

function refreshSaveState(){const element=$('treeSaveState');if(element)element.textContent=dirty?'Unsaved tree changes':'Saved in this browser';const published=$('treePublicationState');if(published){let release;try{release=JSON.parse(treeStore?.getItem(publicationKey(dataSetId))||'null');}catch{}const snapshot=release?.trees?.find(item=>item.id===treeId)?.tree;published.textContent=release?'Local release '+release.publication.revision+(dirty||JSON.stringify(snapshot)!==JSON.stringify(tree)?' · newer tree edits':' · ready to share'):'No local release yet';}}
function installTreeDelivery(){
 installTreeClassroom({getRelease:async()=>{await treeStore.refresh();return JSON.parse(treeStore.getItem(publicationKey(dataSetId))||'null');},importRelease:async release=>{await save();const id=await treeStore.transaction(storage=>importDataSet(storage,release,check));await openDataSet(id);}});
 const nav=document.querySelector('header nav'),state=el('span');state.id='treeSaveState';state.setAttribute('role','status');nav.append(state);refreshSaveState();
 const test=el('button','Test this tree in Arena'),publish=el('button','Publish data set'),published=el('span');published.id='treePublicationState';nav.append(test,publish,published);refreshSaveState();
 test.onclick=guarded(async()=>{await save();const url=new URL(location.href);const destination=['localhost','127.0.0.1'].includes(url.hostname)?new URL('/arena/',url):new URL('https://ragingaxolotl-art.github.io/cyber-pet-battle/');destination.searchParams.set('studioTree',treeKey);location.href=destination.href;});
 publish.onclick=guarded(async()=>{await save();await treeStore.refresh();const bundle=exportDataSet(treeStore,dataSetId,check);const issues=bundle.trees.flatMap(item=>readiness(item.tree).map(issue=>item.name+': '+item.tree.nodes.find(n=>n.id===issue.id).name+' — '+issue.text));if(issues.length)throw Error('Not published. '+issues.slice(0,4).join(' ')+(issues.length>4?' Open Check game readiness for each tree.':''));const key=publicationKey(dataSetId);let release;await treeStore.transaction(storage=>{const previous=JSON.parse(storage.getItem(key)||'null');release=makePublication(bundle,previous);storage.setItem(key,JSON.stringify(release));});const url=URL.createObjectURL(new Blob([JSON.stringify(release,null,2)],{type:'application/json'})),link=el('a');link.href=url;link.download=bundle.name+'-release-'+release.publication.revision+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);refreshSaveState();say('Created a versioned data-set release. Import the downloaded file in Arena on another device. This does not change student progress or upload a classroom release.');});
 const file=el('details'),summary=el('summary','File'),body=el('div');file.className='tree-workspace-menu';file.append(summary,body);for(const id of ['download','downloadDataSet','open'])if($(id))body.append($(id));nav.append(file);
}
