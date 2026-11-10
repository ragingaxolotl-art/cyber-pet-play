import {fitDockHeights,pinnedAreaSize} from './workspace-sizing.js?v=20261110-workspace-sizing';
import {workspaceBundle,validateWorkspaceBundle,downloadJson} from './workspace-transfer.js?v=20261110-workspace-sizing';
import {reviewImport} from './import-preview.js?v=20261108-workflow';
import {requestEditorName} from './editor-name-dialog.js?v=20261108-scheduled-sequences';
import {installAccessibility} from './editor-accessibility.js?v=20261110-workspace-docks';
import {safeLayout,panelDefaults,orderedPanels,movePanel,createLayoutHistory,findDockDrop,LAYOUT_KEY,PREVIOUS_LAYOUT_KEY,LEGACY_LAYOUT_KEY,DOCKS,tabGroup,groupTabs,detachTab,dockUnits} from './workspace-layout-model.js?v=20261110-workspace-sizing';
export {safeLayout} from './workspace-layout-model.js?v=20261110-workspace-sizing';
import {createWorkspaceTabs} from './workspace-tabs.js?v=20261110-properties-versions';
export const PRESETS_KEY='cyber-pet-studio-presets-v3';
const PREVIOUS_PRESETS_KEY='cyber-pet-studio-presets-v2';
const LEGACY_PRESETS_KEY='cyber-pet-studio-presets-v1';
export function fitWindow(p,width,height){return {...p,w:Math.max(240,Math.min(p.w,width-16)),h:Math.max(120,Math.min(p.h,height-16)),x:Math.max(0,Math.min(p.x,width-Math.min(p.w,width-16))),y:Math.max(0,Math.min(p.y,height-48))};}
export function installStudioWorkspace(){
 const $=id=>document.getElementById(id),make=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
 const nav=document.querySelector('header nav'),layout=document.querySelector('.layout');if(!layout)return;
 let state;try{state=safeLayout(JSON.parse((localStorage.getItem(LAYOUT_KEY)||localStorage.getItem(PREVIOUS_LAYOUT_KEY)||localStorage.getItem(LEGACY_LAYOUT_KEY))));}catch{state=safeLayout(null);}
 let history=null,replaying=false,undoLayout,redoLayout;
 const persist=()=>{arrangePanels();if(history&&!replaying)history.record(state);updateHistory();try{localStorage.setItem(LAYOUT_KEY,JSON.stringify(state));}catch{$('status').textContent='Layout works for this session, but browser storage is unavailable.';}};
 function updateHistory(){if(undoLayout){undoLayout.disabled=!history?.canUndo;redoLayout.disabled=!history?.canRedo;}}

 function menu(name){const d=make('details'),s=make('summary',name),body=make('div');d.className='workspace-menu';body.className='workspace-menu-body';d.append(s,body);nav.append(d);d.addEventListener('toggle',()=>{if(d.open)for(const other of nav.querySelectorAll('.workspace-menu'))if(other!==d)other.open=false;});return body;}
 const file=menu('File'),tools=menu('Editors'),windows=menu('Workspace'),panelWindows=menu('Windows');
 const panelHint=make('p','Choose which panels are visible. Hiding a panel keeps its settings.');panelHint.className='hint';panelWindows.append(panelHint);
 for(const id of ['open','save','download','attackRevisions'])if($(id))file.append($(id));
 for(const link of [...nav.children].filter(e=>e.tagName==='A'))tools.append(link);
 const controls=$('editorMode').closest('label');controls.classList.add('workspace-controls');$('export').after(controls);
 const buildPath=make('a','Build paths');buildPath.href='skill-tree.html?workspace=build-path';tools.append(buildPath);
 const reset=make('button','Reset workspace layout');undoLayout=make('button','Undo layout');redoLayout=make('button','Redo layout');windows.append(undoLayout,redoLayout,reset);
 undoLayout.onclick=()=>restoreHistory('undo');redoLayout.onclick=()=>restoreHistory('redo');
 function restoreHistory(action){const next=history?.[action]();if(!next)return;replaying=true;try{applyState(next);}finally{replaying=false;updateHistory();} $('status').textContent='Layout '+(action==='undo'?'restored.':'reapplied.')+' Attack edits are unchanged.';}

 const hint=make('p','Drag a title into a dock; the bright line shows its position. Use Earlier/Later to reorder without dragging. Pin keeps a panel visible while its neighbors scroll. Double-click its bottom edge to pin or unpin.');hint.className='hint';windows.append(hint);
 const originalPanels=[document.querySelector('.library'),document.querySelector('.preview'),...[...document.querySelector('.editor-scroll').children].filter(e=>e.classList.contains('panel')),document.querySelector('.inspector')];
 const columns={};layout.classList.add('custom-workspace');
 for(const name of DOCKS){const c=make('section');c.className='workspace-column workspace-dock-'+name;c.setAttribute('aria-label',name+' workspace column');columns[name]=c;}
 const records=[],pinnedAreas={},unpinnedAreas={},heightInputs={},heightDividers={};let front=20,below=null;
 const tabView=createWorkspaceTabs(state,records,id=>{const group=tabGroup(state,id);if(group){group.active=id;persist();}});
 const indicator=make('div');indicator.className='workspace-drop-indicator';indicator.hidden=true;document.body.append(indicator);
 function arrangePanels(){
  if(!records.length)return;
  const active=document.activeElement;
  tabView.sync(state.previewStack);updateTabControls();columnWidths();
  for(const [dock,column] of Object.entries(columns)){
   if(state.previewStack){pinnedAreas[dock]?.remove();unpinnedAreas[dock]?.remove();delete pinnedAreas[dock];delete unpinnedAreas[dock];column.classList.remove('has-pins');continue;}
   const units=dockUnits(state,dock).map(unit=>({...unit,element:tabView.element(unit)})).filter(unit=>unit.element);
   const pins=units.filter(unit=>unit.pinned&&!unit.hidden),horizontal=['top','bottom'].includes(dock);
   const scrolling=units.filter(unit=>!pins.includes(unit));
   let area=pinnedAreas[dock],flow=unpinnedAreas[dock];
   if(pins.length&&!horizontal){
    if(!area){area=make('section');area.className='workspace-pinned-area';area.setAttribute('aria-label','Pinned panels in '+dock+' dock');const title=make('small','Pinned panels · scroll here for more');title.className='workspace-pinned-label';area.append(title);pinnedAreas[dock]=area;}
    if(!flow){flow=make('section');flow.className='workspace-unpinned-area';flow.setAttribute('aria-label','Other panels in '+dock+' dock');unpinnedAreas[dock]=flow;}
    column.classList.add('has-pins');const hasUnpinned=scrolling.some(unit=>!unit.hidden);flow.hidden=!hasUnpinned;
    const size=pinnedAreaSize(column.clientHeight||innerHeight,pins.length,hasUnpinned);area.style.maxHeight=size.area+'px';
    const desired=[area,flow];if(desired.some((node,i)=>column.children[i]!==node))for(const node of desired)column.append(node);
    if(scrolling.some((unit,i)=>flow.children[i]!==unit.element))for(const unit of scrolling)flow.append(unit.element);
    for(const [index,unit] of pins.entries()){
     unit.element.style.top='';unit.element.style.maxHeight=size.panel+'px';
     if(area.children[index+1]!==unit.element)area.append(unit.element);
    }
   }else{
    const desired=units.map(unit=>unit.element);
    if(desired.some((node,i)=>column.children[i]!==node))for(const node of desired)column.append(node);
    if(area){area.remove();delete pinnedAreas[dock];}if(flow){flow.remove();delete unpinnedAreas[dock];}column.classList.remove('has-pins');
    for(const unit of units){unit.element.style.top='';unit.element.style.maxHeight='';}
   }
   if(['top','bottom'].includes(dock)){column.hidden=!units.some(unit=>!unit.hidden)&&!document.body.classList.contains('workspace-dragging');}
  }
  if(active&&document.activeElement!==active)active.focus?.({preventScroll:true});
 }
 function reorder(r,direction){
  if(state.locked||state.previewStack||r.state.floating)return;
  const units=dockUnits(state,r.state.dock),peers=units.filter(unit=>!unit.hidden&&unit.pinned===r.state.pinned),unit=peers.find(unit=>unit.members.includes(r.id)),index=peers.indexOf(unit),other=peers[index+direction];if(!other)return;
  const first=units.indexOf(unit),second=units.indexOf(other);[units[first],units[second]]=[units[second],units[first]];
  units.flatMap(unit=>unit.members).forEach((id,order)=>state.panels[id].order=order);persist();r.shell.scrollIntoView({block:'nearest'});
 }
 function dropAt(x,y,r){
  const zones=Object.entries(columns).filter(([,el])=>!el.hidden).map(([dock,el])=>({dock,...rect(el)}));
  const panels=DOCKS.flatMap(dock=>dockUnits(state,dock).filter(unit=>!unit.hidden&&!unit.pinned&&!unit.members.includes(r.id)).map(unit=>({id:unit.id,dock,...rect(tabView.element(unit))})));
  return findDockDrop(zones,panels,x,y,r.id);
 }
 function rect(element){const r=element.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right??r.left+r.width,bottom:r.bottom??r.top+r.height};}
 function showDrop(drop){indicator.hidden=!drop;if(drop)Object.assign(indicator.style,{left:drop.x+'px',top:drop.y+'px',width:drop.width+'px',height:drop.height+'px'});}

 function columnWidths(){
  const height=layout.clientHeight||innerHeight*.75,visible={},tabbed={};
  for(const dock of ['top','bottom']){const units=dockUnits(state,dock);visible[dock]=!state.previewStack&&units.some(unit=>!unit.hidden);tabbed[dock]=units.some(unit=>unit.group&&!unit.hidden);}
  const fitted=fitDockHeights(height,state.dockHeights,visible,tabbed);autoSizes.disabled=state.locked||state.previewStack;
  for(const dock of ['top','bottom']){
   columns[dock].style.maxHeight=fitted[dock]+'px';columns[dock].style.height=state.dockHeights[dock]===null?'':fitted[dock]+'px';
   if(heightInputs[dock]){heightInputs[dock].value=state.dockHeights[dock]??'';heightInputs[dock].disabled=state.locked||state.previewStack;}
   const divider=heightDividers[dock];if(divider){divider.hidden=!visible[dock];divider.setAttribute('aria-valuenow',String(Math.round(fitted[dock])));divider.setAttribute('aria-disabled',String(state.locked||state.previewStack));}
  }
  const dragging=document.body.classList.contains('workspace-dragging'),sideVisible={};
  for(const dock of ['left','right']){sideVisible[dock]=state.previewStack||dockUnits(state,dock).some(unit=>!unit.hidden);columns[dock].hidden=!sideVisible[dock]&&!dragging;}
  const tracks=['left','right'].map((dock,i)=>sideVisible[dock]?`minmax(190px,${state.widths[i===0?0:2]}fr)`:dragging?'56px':'0px');
  for(const [i,split] of [...layout.querySelectorAll('.workspace-splitter')].entries())split.hidden=!sideVisible[i===0?'left':'right'];
  layout.style.gridTemplateColumns=`${tracks[0]} ${sideVisible.left?'8px':'0px'} minmax(260px,${state.widths[1]}fr) ${sideVisible.right?'8px':'0px'} ${tracks[1]}`;
 }

 function show(r){
  const p=r.state,stacked=state.previewStack&&below,isPreview=r.id==='preview',floating=p.floating&&!stacked;r.shell.hidden=stacked&&isPreview?false:p.hidden;r.body.hidden=stacked&&isPreview?false:p.collapsed;r.collapse.textContent=p.collapsed?'Expand':'Collapse';r.collapse.setAttribute('aria-expanded',String(!p.collapsed));r.checkbox.checked=!p.hidden;r.dock.value=p.floating?'float':p.dock;r.dock.disabled=state.locked===true||!!stacked;
  r.collapse.disabled=!!stacked&&isPreview;r.hide.disabled=!!stacked&&isPreview;r.checkbox.disabled=!!stacked&&isPreview;
  r.shell.classList.toggle('floating',floating);r.shell.classList.toggle('collapsed',p.collapsed);r.shell.classList.toggle('pinned',p.pinned&&!floating&&!stacked);r.pin.textContent=p.pinned?'Unpin':'Pin';r.pin.setAttribute('aria-pressed',String(p.pinned));r.pin.disabled=state.locked===true||!!stacked||floating;
  r.earlier.disabled=r.later.disabled=state.locked===true||!!stacked||floating;
  r.summary.hidden=!p.collapsed;r.summary.textContent=[...r.body.querySelectorAll('input,select')].filter(el=>el.getAttribute('aria-label')&&el.type!=='checkbox'&&el.type!=='file').slice(0,3).map(el=>el.getAttribute('aria-label')+': '+el.value).join(' · ')||'Expand to edit';
  if(floating){if(r.shell.parentElement!==document.body)document.body.append(r.shell);Object.assign(p,fitWindow(p,innerWidth,innerHeight));Object.assign(r.shell.style,{left:p.x+'px',top:p.y+'px',width:p.w+'px',height:p.collapsed?'auto':p.h+'px'});}
  else{r.shell.removeAttribute('style');const destination=stacked?(isPreview?columns.center:r.id==='library'?columns.left:below):tabView.destination(r.id)||(p.pinned?pinnedAreas[p.dock]:unpinnedAreas[p.dock])||columns[p.dock];if(r.shell.parentElement!==destination)destination.append(r.shell);}
 }
 function float(r){if(r.state.floating)return;const rect=r.shell.getBoundingClientRect();detachTab(state,r.id);Object.assign(r.state,{floating:true,x:rect.left,y:rect.top,w:Math.max(320,rect.width),h:Math.max(220,rect.height)});r.shell.style.zIndex=String(++front);show(r);}
 for(const [i,panel] of originalPanels.entries()){
  const id=panel.id||['library','preview'][i]||('panel-'+i),title=panel.querySelector('h2,summary')?.textContent.trim()||({attackTimeline:'Attack timeline',sequenceEditor:'Hit sequence',defenseEditor:'Defense',cancelEditor:'Cancels'}[id])||'Attack settings';
  const preferred=panel.getAttribute('data-workspace-home'),home=DOCKS.includes(preferred)?preferred:i===0?'left':i===originalPanels.length-1?'right':'center';
  const p=state.panels[id]||panelDefaults(home,i);state.panels[id]=p;
  const pin=make('button','Pin'),earlier=make('button','Earlier'),later=make('button','Later'),edge=make('button'),summary=make('small');
  const shell=make('section'),bar=make('div'),handle=make('button',i===1?'Attack preview':title),body=make('div'),collapse=make('button','Collapse'),hide=make('button','Hide'),dock=make('select'),resize=make('button','↘');
  shell.className='workspace-panel';bar.className='workspace-panel-bar';body.className='workspace-panel-body';handle.className='workspace-drag';handle.title='Drag to dock or float; arrow keys reorder docked panels or move floating panels';handle.setAttribute('aria-label','Move '+handle.textContent);dock.setAttribute('aria-label','Dock '+handle.textContent);
  for(const [value,text] of [['left','Dock left'],['center','Dock center'],['right','Dock right'],['top','Dock top'],['bottom','Dock bottom'],['float','Float']])dock.add(new Option(text,value));
  resize.className='workspace-resize';resize.setAttribute('aria-label','Resize '+handle.textContent);resize.title='Drag to resize; arrow keys adjust size';
  for(const [button,action] of [[pin,'Pin'],[earlier,'Move earlier'],[later,'Move later']]){button.type='button';button.setAttribute('aria-label',action+' '+handle.textContent);}
  edge.type='button';edge.className='workspace-pin-edge';edge.setAttribute('aria-label','Toggle pin '+handle.textContent);edge.title='Double-click to pin or unpin; Enter also toggles pin';summary.className='workspace-collapsed-summary';
  bar.append(handle,dock,earlier,later,pin,collapse,hide,summary);body.append(panel);shell.append(bar,body,resize,edge);columns[p.dock].append(shell);
  const label=make('label'),checkbox=make('input');checkbox.type='checkbox';label.append(checkbox,document.createTextNode(handle.textContent));panelWindows.append(label);
  const r={shell,body,state:p,collapse,hide,checkbox,dock,id,pin,earlier,later,summary,title:handle.textContent};records.push(r);
  const togglePin=()=>{if(state.locked||state.previewStack||p.floating)return;const pinned=!p.pinned;for(const id of tabGroup(state,r.id)?.panels||[r.id]){state.panels[id].pinned=pinned;show(records.find(item=>item.id===id));}persist();};pin.onclick=togglePin;edge.ondblclick=togglePin;edge.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();togglePin();}};
  earlier.onclick=()=>reorder(r,-1);later.onclick=()=>reorder(r,1);
  checkbox.onchange=()=>{p.hidden=!checkbox.checked;const group=tabGroup(state,id);if(group&&!p.hidden)group.active=id;show(r);persist();};hide.onclick=()=>{p.hidden=true;show(r);persist();tabView.focusActive(id);};collapse.onclick=()=>{p.collapsed=!p.collapsed;show(r);persist();};dock.onchange=()=>{if(dock.value==='float')float(r);else{movePanel(state,id,dock.value);p.pinned=false;}show(r);persist();};
  function drag(target,resizing){
   target.onpointerdown=e=>{
    if(state.locked||state.previewStack||e.button!==0)return;e.preventDefault();
    const original=structuredClone(p),originalTabs=structuredClone(state.tabs),start={x:e.clientX,y:e.clientY};let moving=false,drop=null;
    target.setPointerCapture(e.pointerId);
    target.onpointermove=v=>{
     if(!moving&&Math.hypot(v.clientX-start.x,v.clientY-start.y)<5)return;
     if(!moving){float(r);target.setPointerCapture(e.pointerId);moving=true;Object.assign(start,{px:p.x,py:p.y,w:p.w,h:p.h});document.body.classList.add('workspace-dragging');columnWidths();columns.top.hidden=columns.bottom.hidden=false;}
     if(resizing){p.w=start.w+v.clientX-start.x;p.h=start.h+v.clientY-start.y;}
     else{p.x=start.px+v.clientX-start.x;p.y=start.py+v.clientY-start.y;drop=dropAt(v.clientX,v.clientY,r);showDrop(drop);}
     show(r);
    };
    const end=cancel=>{target.onpointermove=null;target.onpointerup=null;target.onpointercancel=null;document.body.classList.remove('workspace-dragging');showDrop(null);
     if(cancel){Object.assign(p,original);state.tabs=originalTabs;}else if(moving&&drop&&!resizing){movePanel(state,id,drop.dock,drop.beforeId);p.pinned=false;}
     show(r);persist();
    };target.onpointerup=()=>end(false);target.onpointercancel=()=>end(true);
   };
   target.onkeydown=e=>{
    if(state.locked||state.previewStack||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();
    if(!resizing&&!p.floating){reorder(r,['ArrowLeft','ArrowUp'].includes(e.key)?-1:1);return;}
    float(r);const dx=e.key==='ArrowLeft'?-20:e.key==='ArrowRight'?20:0,dy=e.key==='ArrowUp'?-20:e.key==='ArrowDown'?20:0;
    if(resizing){p.w+=dx;p.h+=dy;}else{p.x+=dx;p.y+=dy;}show(r);persist();
   };
  }
  drag(handle,false);drag(resize,true);show(r);r.home=home;r.id=id;
 }
 const tabSettings=make('fieldset'),tabLegend=make('legend','Group panels as tabs'),tabSource=make('select'),tabTarget=make('select'),groupButton=make('button','Group as tabs'),detachButton=make('button','Separate selected tab');
 tabSource.setAttribute('aria-label','Panel to group');tabTarget.setAttribute('aria-label','Group with panel');
 for(const r of records){tabSource.add(new Option(r.title,r.id));tabTarget.add(new Option(r.title,r.id));}
 tabSource.value='attackTimeline';tabTarget.value='preview';
 const sourceLabel=make('label','Panel'),targetLabel=make('label','With');sourceLabel.append(tabSource);targetLabel.append(tabTarget);
 const tabHint=make('p','Tabs share one dock position. Use a panel’s Dock control or drag its title to separate it. Earlier/Later and Pin apply to the whole group.');tabHint.className='hint';
 tabSettings.append(tabLegend,sourceLabel,targetLabel,groupButton,detachButton,tabHint);panelWindows.append(tabSettings);
 function updateTabControls(){groupButton.disabled=state.locked||state.previewStack||tabSource.value===tabTarget.value;detachButton.disabled=state.locked||state.previewStack||!tabGroup(state,tabSource.value);}
 tabSource.onchange=tabTarget.onchange=updateTabControls;
 groupButton.onclick=()=>{if(groupButton.disabled)return;if(groupTabs(state,tabSource.value,tabTarget.value)){records.forEach(show);persist();$('status').textContent='Panels grouped as tabs. Arrow keys switch tabs; Undo layout restores the previous arrangement.';}};
 detachButton.onclick=()=>{if(detachButton.disabled)return;detachTab(state,tabSource.value);records.forEach(show);persist();$('status').textContent='Panel separated from its tab group.';};
 const sizes=make('fieldset'),sizeLegend=make('legend','Dock sizes');sizes.append(sizeLegend);
 for(const dock of ['top','bottom']){
  const label=make('label',dock==='top'?'Top dock height (px)':'Bottom dock height (px)'),input=make('input');input.type='number';input.min='100';input.max='1200';input.step='1';input.placeholder='Auto';input.setAttribute('aria-label',label.textContent);heightInputs[dock]=input;label.append(input);sizes.append(label);
  input.onchange=()=>{if(state.locked||state.previewStack)return;const value=input.value===''?null:Number(input.value);if(value!==null&&(!Number.isFinite(value)||value<100||value>1200)){input.value=state.dockHeights[dock]??'';$('status').textContent='Use a dock height from 100 to 1200 pixels, or leave it blank for automatic sizing.';return;}state.dockHeights[dock]=value;persist();};
 }
 const autoSizes=make('button','Automatic dock heights');autoSizes.onclick=()=>{if(state.locked||state.previewStack)return;state.dockHeights={top:null,bottom:null};persist();};
 const sizeHint=make('small','Drag the divider beneath the top dock or above the bottom dock. Arrow keys resize; Home or double-click returns to automatic sizing. Heights fit the screen so the center stays available.');sizes.append(autoSizes,sizeHint);windows.append(sizes);
 function heightDivider(dock){
  const divider=make('div');divider.className='workspace-height-divider workspace-height-'+dock;divider.tabIndex=0;divider.setAttribute('role','separator');divider.setAttribute('aria-orientation','horizontal');divider.setAttribute('aria-label','Resize '+dock+' dock');divider.setAttribute('aria-valuemin','0');divider.setAttribute('aria-valuemax','1200');divider.title='Drag or use Up/Down to resize. Double-click or Home for automatic sizing.';heightDividers[dock]=divider;
  const allowed=()=>!state.locked&&!state.previewStack;
  const setSize=value=>{state.dockHeights[dock]=Math.max(100,Math.min(1200,Math.round(value)));arrangePanels();};
  divider.onpointerdown=e=>{if(!allowed()||e.button!==0)return;e.preventDefault();divider.setPointerCapture(e.pointerId);const start=e.clientY,height=columns[dock].getBoundingClientRect().height,original=state.dockHeights[dock];
   divider.onpointermove=v=>setSize(height+(v.clientY-start)*(dock==='top'?1:-1));
   const finish=cancel=>{divider.onpointermove=null;divider.onpointerup=null;divider.onpointercancel=null;if(cancel)state.dockHeights[dock]=original;persist();};divider.onpointerup=()=>finish(false);divider.onpointercancel=()=>finish(true);
  };
  divider.onkeydown=e=>{if(!allowed()||!['ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home')state.dockHeights[dock]=null;else setSize(columns[dock].getBoundingClientRect().height+(e.key==='ArrowDown'?20:-20)*(dock==='top'?1:-1));persist();};
  divider.ondblclick=()=>{if(!allowed())return;state.dockHeights[dock]=null;persist();};return divider;
 }
 function splitter(index){const s=make('div');s.className='workspace-splitter';s.tabIndex=0;s.setAttribute('role','separator');s.setAttribute('aria-orientation','vertical');s.setAttribute('aria-label','Resize workspace columns');
 const change=delta=>{const amount=Math.max(15-state.widths[index],Math.min(state.widths[index+1]-15,delta));state.widths[index]+=amount;state.widths[index+1]-=amount;columnWidths();};
 s.onpointerdown=e=>{if(state.locked)return;e.preventDefault();s.setPointerCapture(e.pointerId);let x=e.clientX;const original=[...state.widths];s.onpointermove=v=>{change((v.clientX-x)/layout.clientWidth*100);x=v.clientX;};const finish=cancel=>{s.onpointermove=null;s.onpointerup=null;s.onpointercancel=null;if(cancel)state.widths=original;persist();};s.onpointerup=()=>finish(false);s.onpointercancel=()=>finish(true);};s.onkeydown=e=>{if(state.locked)return;if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();change(e.key==='ArrowLeft'?-2:2);persist();}};return s;}
 layout.replaceChildren(columns.top,heightDivider('top'),columns.left,splitter(0),columns.center,splitter(1),columns.right,heightDivider('bottom'),columns.bottom);columnWidths();
 reset.onclick=()=>{state.previewStack=false;state.previewFocus=false;state.tabs=[];state.locked=false;lockBox.checked=false;document.body.classList.remove('workspace-locked');state.widths=[24,48,28];state.dockHeights={top:null,bottom:null};for(const r of records){Object.assign(r.state,panelDefaults(r.home,records.indexOf(r)));columns[r.home].append(r.shell);show(r);}columnWidths();arrangePreview();persist();};

 const stackLabel=make('label'),stackToggle=make('input');stackToggle.type='checkbox';stackLabel.append(stackToggle,document.createTextNode('Keep preview above scrolling controls'));windows.prepend(stackLabel);
 const previewRecord=records.find(r=>r.id==='preview'),controlsDrawer=make('div'),drawerTitle=make('button','Editing controls');controlsDrawer.className='preview-controls-drawer';controlsDrawer.classList.add('is-open');drawerTitle.type='button';drawerTitle.setAttribute('aria-expanded','true');below=make('div');below.className='preview-controls-scroll';below.setAttribute('aria-label','Controls below preview');drawerTitle.onclick=()=>{const open=drawerTitle.getAttribute('aria-expanded')!=='true';drawerTitle.setAttribute('aria-expanded',String(open));controlsDrawer.classList.toggle('is-open',open);below.hidden=!open;};controlsDrawer.append(drawerTitle,below);previewRecord.body.append(controlsDrawer);
 const focusPreview=make('button','Expand preview workspace');focusPreview.type='button';previewRecord.shell.querySelector('.workspace-panel-bar').append(focusPreview);
 const arrangePreview=()=>{const enabled=state.previewStack===true;stackToggle.checked=enabled;controlsDrawer.hidden=!enabled;layout.classList.toggle('preview-stack',enabled);layout.classList.toggle('preview-focus',enabled&&state.previewFocus===true);previewRecord.shell.classList.toggle('preview-stack-panel',enabled);focusPreview.textContent=enabled&&state.previewFocus?'Restore workspace columns':'Expand preview workspace';records.forEach(show);for(const dock of ['top','bottom'])columns[dock].hidden=enabled;arrangePanels();};
 stackToggle.onchange=()=>{state.previewStack=stackToggle.checked;if(!state.previewStack)state.previewFocus=false;arrangePreview();persist();};
 focusPreview.onclick=()=>{const restore=state.previewFocus===true;state.previewStack=!restore;state.previewFocus=!restore;arrangePreview();persist();};
 arrangePreview();
 const presetBox=make('div');presetBox.className='workspace-presets';const presetLabel=make('label','Workspace layout'),presetPicker=make('select'),applyLayout=make('button','Open layout'),saveLayout=make('button','Save layout as…'),renameLayout=make('button','Rename saved layout'),lockLabel=make('label'),lockBox=make('input');lockBox.type='checkbox';lockBox.checked=state.locked===true;lockLabel.append(lockBox,document.createTextNode('Lock panel positions and sizes'));presetLabel.append(presetPicker);presetBox.append(presetLabel,applyLayout,saveLayout,renameLayout,lockLabel);windows.prepend(presetBox);installAccessibility(windows);
 let presets=[];try{const stored=JSON.parse(localStorage.getItem(PRESETS_KEY)||localStorage.getItem(PREVIOUS_PRESETS_KEY)||localStorage.getItem(LEGACY_PRESETS_KEY)||'[]');if(Array.isArray(stored))presets=stored.filter(p=>p&&typeof p.id==='string'&&typeof p.name==='string'&&p.name.length<=80&&[1,2,3].includes(p.layout?.version)).map(p=>({...p,layout:safeLayout(p.layout)}));}catch{}
 function fillPresets(selected='default'){presetPicker.replaceChildren();for(const [id,name] of [['default','Default workspace'],['browse','Find attacks'],['animate','Animate'],['balance','Balance and test']])presetPicker.add(new Option(name,id));for(const preset of presets)presetPicker.add(new Option(preset.name,preset.id));presetPicker.value=selected;}
 function persistPresets(){try{localStorage.setItem(PRESETS_KEY,JSON.stringify(presets));}catch{$('status').textContent='Could not save this layout. Browser storage is full.';return false;}return true;}
 function applyState(next){const clean=safeLayout(next);state.version=3;state.tabs=clean.tabs;state.widths=clean.widths;state.dockHeights=clean.dockHeights;state.locked=clean.locked;state.previewStack=clean.previewStack;state.previewFocus=clean.previewFocus;lockBox.checked=!!state.locked;document.body.classList.toggle('workspace-locked',!!state.locked);for(const r of records){Object.assign(r.state,clean.panels[r.id]||panelDefaults(r.home,records.indexOf(r)));state.panels[r.id]=r.state;show(r);}columnWidths();arrangePreview();persist();}
 function builtIn(kind){const layout={version:3,tabs:[],widths:kind==='browse'?[40,40,20]:kind==='balance'?[18,52,30]:[20,55,25],panels:{},locked:false};for(const r of records){const showIds=kind==='animate'?['library','preview','attackTimeline','panel-8','panel-10','panel-11','workspaceObjects','objectProperties']:kind==='balance'?['preview','attackTimeline','sequenceEditor','defenseEditor','cancelEditor','panel-6','panel-12','panel-13','objectProperties']:kind==='browse'?['library','preview']:records.map(r=>r.id);layout.panels[r.id]={...panelDefaults(r.home,records.indexOf(r)),hidden:!showIds.includes(r.id)};}return layout;}
 applyLayout.onclick=()=>{const named=presets.find(p=>p.id===presetPicker.value);applyState(named?.layout||builtIn(presetPicker.value));$('status').textContent='Workspace layout opened. Hidden panels remain available in the Windows menu.';if(presetPicker.value==='browse')$('findAttacks')?.click();};
 saveLayout.onclick=async()=>{const name=await requestEditorName('Name this workspace layout');if(!name?.trim())return;if(name.trim().length>80){$('status').textContent='Use a layout name under 80 characters.';return;}const id=crypto.randomUUID();presets.push({id,name:name.trim(),layout:structuredClone(state)});if(persistPresets()){fillPresets(id);$('status').textContent='Saved '+name.trim()+' in this browser.';}};
 renameLayout.onclick=async()=>{const preset=presets.find(p=>p.id===presetPicker.value);if(!preset){$('status').textContent='Choose one of your saved layouts to rename. Built-in layouts keep their names.';return;}const name=await requestEditorName('Layout name',preset.name);if(!name?.trim()||name.trim().length>80)return;preset.name=name.trim();if(persistPresets())fillPresets(preset.id);};
 const updateLayout=make('button','Update this layout'),duplicateLayout=make('button','Duplicate layout'),deleteLayout=make('button','Delete saved layout'),restoreLayout=make('button','Restore deleted layout'),exportLayouts=make('button','Export saved layouts'),importLayouts=make('button','Import layouts'),layoutFile=make('input');layoutFile.type='file';layoutFile.accept='.json';layoutFile.hidden=true;restoreLayout.hidden=true;presetBox.append(updateLayout,duplicateLayout,deleteLayout,restoreLayout,exportLayouts,importLayouts,layoutFile);
 let lastDeleted=null;
 function selectedPreset(){const preset=presets.find(p=>p.id===presetPicker.value);if(!preset)throw Error('Choose one of your saved layouts first.');return preset;}
 function writePresets(next,selected){localStorage.setItem(PRESETS_KEY,JSON.stringify(next));presets=next;fillPresets(selected);}
 const manage=fn=>async()=>{try{await fn();}catch(error){$('status').textContent=error.message;}};
 updateLayout.onclick=manage(()=>{const preset=selectedPreset();writePresets(presets.map(p=>p.id===preset.id?{...p,layout:structuredClone(state)}:p),preset.id);$('status').textContent='Updated '+preset.name+'.';});
 duplicateLayout.onclick=manage(async()=>{const original=presets.find(p=>p.id===presetPicker.value),name=await requestEditorName('Name the copied layout',(original?.name||presetPicker.options[presetPicker.selectedIndex]?.textContent||'Workspace')+' copy');if(!name)return;const copy={id:crypto.randomUUID(),name,layout:structuredClone(original?.layout||builtIn(presetPicker.value))};writePresets([...presets,copy],copy.id);$('status').textContent='Created independent layout '+name+'.';});
 deleteLayout.onclick=manage(()=>{const preset=selectedPreset();writePresets(presets.filter(p=>p.id!==preset.id),'default');lastDeleted=preset;restoreLayout.hidden=false;$('status').textContent='Removed '+preset.name+'. Restore deleted layout can undo this during this session.';});
 restoreLayout.onclick=manage(()=>{if(!lastDeleted)return;writePresets([...presets,lastDeleted],lastDeleted.id);lastDeleted=null;restoreLayout.hidden=true;$('status').textContent='Restored deleted layout.';});
 exportLayouts.onclick=manage(()=>{if(!presets.length)throw Error('Save a named layout first.');downloadJson(workspaceBundle(presets),'cyber-pet-workspace-layouts.json');$('status').textContent='Downloaded '+presets.length+' saved layouts.';});
 importLayouts.onclick=()=>layoutFile.click();layoutFile.onchange=manage(async()=>{try{const file=layoutFile.files[0];if(!file)return;if(file.size>1024*1024)throw Error('Choose a layout backup under 1 MiB.');const bundle=validateWorkspaceBundle(JSON.parse(await file.text()));if(!await reviewImport({title:'Import workspace layouts',description:'Imported layouts get separate copies. Your saved layouts stay in place.',items:bundle.layouts.map(item=>item.name),action:'Import layouts'}))return;const added=bundle.layouts.map(item=>({id:crypto.randomUUID(),name:item.name,layout:safeLayout(item.layout)}));writePresets([...presets,...added],added[0].id);$('status').textContent='Imported '+added.length+' layouts. Choose Open layout to use one.';}finally{layoutFile.value='';}});
 lockBox.onchange=()=>{state.locked=lockBox.checked;document.body.classList.toggle('workspace-locked',state.locked);records.forEach(show);persist();};document.body.classList.toggle('workspace-locked',!!state.locked);fillPresets();arrangePanels();history=createLayoutHistory(state);updateHistory();
 window.addEventListener('resize' ,()=>{columnWidths();records.forEach(show);arrangePanels();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')for(const d of nav.querySelectorAll('.workspace-menu'))d.open=false;});
 document.addEventListener('pointerdown',e=>{for(const d of nav.querySelectorAll('.workspace-menu'))if(!d.contains(e.target))d.open=false;});
 return {reveal(id){
  const record=records.find(r=>r.id===id);if(!record)return false;
  if(state.previewStack){state.previewStack=false;state.previewFocus=false;arrangePreview();}
  record.state.hidden=false;record.state.collapsed=false;const group=tabGroup(state,id);if(group)group.active=id;
  show(record);persist();record.shell.scrollIntoView({block:'nearest',inline:'nearest'});record.shell.querySelector('.workspace-drag')?.focus({preventScroll:true});return true;
 }};
}
