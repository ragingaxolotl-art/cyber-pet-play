import {requestEditorName} from './editor-name-dialog.js?v=20261110-layout-safety';
// Layout changes only move existing DOM panels; they never modify tree records.
const KEY='cyber-pet-tree-workspaces-v1';
export function installTreeWorkspace(){
 const make=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;},layout=document.querySelector('.tree-layout'),workspace=document.querySelector('.workspace');
 const explorer=document.querySelector('.tree-explorer'),stage=document.querySelector('.tree-stage'),inspector=[...workspace.children].find(node=>node.tagName==='ASIDE'&&!node.classList.contains('tree-builder-finder'));
 if(!explorer||!stage||!inspector)return;
 let saved={current:{},presets:[]};try{const value=JSON.parse(localStorage.getItem(KEY)||'null');if(value&&Array.isArray(value.presets))saved=value;}catch{}
 const menu=make('details'),summary=make('summary','Workspace'),controls=make('div');menu.className='tree-workspace-menu';menu.append(summary,controls);document.querySelector('header nav').append(menu);
 const preset=make('select'),label=make('label','Layout'),save=make('button','Save layout as…'),reset=make('button','Reset workspace'),records=[];preset.setAttribute('aria-label','Tree workspace layout');label.append(preset);controls.append(label,save,reset);
 const dataTools=document.getElementById('dataSet').closest('.tree-tools');explorer.prepend(dataTools);const pathMenu=make('details'),pathSummary=make('summary','Paths'),pathBody=make('div');pathMenu.className='tree-workspace-menu';pathMenu.append(pathSummary,pathBody);for(const id of ['activePath','viewPath'])pathBody.append(document.getElementById(id).closest('label'));for(const id of ['newPath','editPath'])pathBody.append(document.getElementById(id));document.querySelector('header nav').append(pathMenu);let z=30;
 const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(saved));}catch{document.getElementById('status').textContent='Workspace changed for this session. Download your trees to keep a backup; layout storage is unavailable.';}};
 const defaults=()=>({explorer:{dock:'left',width:220,height:620},inspector:{dock:'right',width:330,height:620}});
 saved.presets=saved.presets.filter(p=>p&&typeof p.name==='string'&&p.name.length<=80&&p.layout&&typeof p.layout==='object');saved.current=Object.fromEntries(Object.entries(defaults()).map(([id,base])=>[id,{...base,...(saved.current?.[id]&&typeof saved.current[id]==='object'?saved.current[id]:{})}]));
 for(const [id,panel,title] of [['explorer',explorer,'Data sets and trees'],['inspector',inspector,'Attack details']]){
  const bar=make('div'),handle=make('button',title),dock=make('select'),collapse=make('button','Collapse'),show=make('input'),visibleLabel=make('label');bar.className='tree-panel-tools';handle.className='tree-panel-handle';handle.title='Drag to float. Arrow keys move a floating panel.';dock.setAttribute('aria-label','Dock '+title);for(const [v,t]of [['left','Left'],['right','Right'],['float','Float']])dock.add(new Option(t,v));show.type='checkbox';visibleLabel.append(show,document.createTextNode('Show '+title));controls.append(visibleLabel);bar.append(handle,dock,collapse);panel.prepend(bar);panel.classList.add('adjustable-tree-panel');
  const record={id,panel,bar,dock,show,collapse};records.push(record);
  function state(){return saved.current[id];}
  function apply(){const p=state();panel.hidden=!!p.hidden;show.checked=!p.hidden;dock.value=p.dock||'right';panel.classList.toggle('tree-panel-floating',p.dock==='float');panel.classList.toggle('tree-panel-collapsed',!!p.collapsed);collapse.textContent=p.collapsed?'Expand':'Collapse';panel.style.width=Math.max(180,Math.min(700,Number(p.width)||300))+'px';panel.style.height=p.dock==='float'?Math.max(150,Math.min(innerHeight-20,Number(p.height)||500))+'px':'';
   if(p.dock==='float'){panel.style.left=Math.max(0,Math.min(innerWidth-200,Number(p.x)||24))+'px';panel.style.top=Math.max(0,Math.min(innerHeight-80,Number(p.y)||90))+'px';}else{panel.style.left='';panel.style.top='';}
   if(id==='explorer')layout.style.gridTemplateColumns=p.hidden?'minmax(0,1fr)':p.dock==='left'?'auto minmax(0,1fr)':'minmax(0,1fr) auto';
   panel.style.order=p.dock==='left'?'-1':'2';workspace.style.gridTemplateColumns=layout.classList.contains('build-path')?'minmax(240px,320px) minmax(0,1fr) auto':records.find(r=>r.id==='inspector')?.show.checked?'minmax(0,1fr) auto':'minmax(0,1fr)';
  }record.apply=apply;
  show.onchange=()=>{state().hidden=!show.checked;apply();persist();};collapse.onclick=()=>{state().collapsed=!state().collapsed;apply();persist();};dock.onchange=()=>{state().dock=dock.value;apply();persist();};
  handle.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();const p=state(),rect=panel.getBoundingClientRect();Object.assign(p,{dock:'float',x:rect.left,y:rect.top});const start={x:e.clientX,y:e.clientY,px:p.x,py:p.y};handle.setPointerCapture(e.pointerId);panel.style.zIndex=String(++z);apply();handle.onpointermove=v=>{p.x=start.px+v.clientX-start.x;p.y=start.py+v.clientY-start.y;apply();};handle.onpointerup=handle.onpointercancel=()=>{handle.onpointermove=null;persist();};};
  handle.onkeydown=e=>{if(!e.key.startsWith('Arrow'))return;e.preventDefault();const p=state();p.dock='float';p.x=(p.x||24)+(e.key==='ArrowRight'?20:e.key==='ArrowLeft'?-20:0);p.y=(p.y||90)+(e.key==='ArrowDown'?20:e.key==='ArrowUp'?-20:0);apply();persist();};
  for(const [key,text,min,max]of [['width','Width',180,700],['height','Height',150,1000]]){const range=make('input'),l=make('label',title+' '+text);range.type='range';range.min=min;range.max=max;range.value=state()[key]||300;range.setAttribute('aria-label',title+' '+text);range.oninput=()=>{state()[key]=Number(range.value);apply();};range.onchange=persist;l.append(range);controls.append(l);}
  if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(()=>{if(panel.classList.contains('tree-panel-floating')){const rect=panel.getBoundingClientRect();state().width=rect.width;state().height=rect.height;}});observer.observe(panel);panel.addEventListener('pointerup',persist);}
  apply();
 }
 function fill(){preset.replaceChildren(...['Build trees','Edit attacks','Test'].map(name=>new Option(name,name)),...saved.presets.map(p=>new Option(p.name,p.name)));}fill();
 preset.onchange=()=>{saved.current=structuredClone(saved.presets.find(p=>p.name===preset.value)?.layout||defaults());if(preset.value==='Build trees')saved.current.inspector.collapsed=true;if(preset.value==='Edit attacks')saved.current.explorer.hidden=true;if(preset.value==='Test')saved.current.explorer.collapsed=true;records.forEach(r=>r.apply());persist();};
 reset.onclick=()=>{saved.current=defaults();records.forEach(r=>r.apply());persist();};save.onclick=async()=>{const name=await requestEditorName('Save tree workspace layout','My tree workspace');if(!name)return;saved.presets=saved.presets.filter(p=>p.name!==name);saved.presets.push({name,layout:structuredClone(saved.current)});fill();preset.value=name;persist();};
 const previewPanel=make('details'),previewTitle=make('summary','Animation preview'),previewBody=make('div');previewPanel.className='tree-preview-panel';previewPanel.append(previewTitle,previewBody);for(const node of [document.getElementById('clip'),document.querySelector('.playback'),document.getElementById('clipNote')])previewBody.append(node);stage.append(previewPanel);previewPanel.open=saved.previewOpen===true;previewPanel.addEventListener('toggle',()=>{saved.previewOpen=previewPanel.open;persist();});
 const previewLabel=make('label'),preview=make('input');preview.type='checkbox';preview.checked=previewPanel.open;previewLabel.append(preview,document.createTextNode('Show bottom animation preview'));controls.append(previewLabel);preview.onchange=()=>{previewPanel.open=preview.checked;saved.previewOpen=preview.checked;persist();};
 return {refresh:()=>records.forEach(r=>r.apply())};
}

// Menu placement follows the actual wrapped toolbar, including larger text.
export function installTreeMenus(){
 const nav=document.querySelector('header nav');
 const menus=[...nav.querySelectorAll('.tree-workspace-menu')];
 function position(){for(const menu of menus){if(!menu.open)continue;const rect=menu.querySelector('summary').getBoundingClientRect(),bar=nav.getBoundingClientRect();menu.querySelector('div').style.setProperty('--tree-menu-top',Math.max(8,rect.top+rect.height+4,bar.top+bar.height+4)+'px');}}
 for(const menu of menus)menu.addEventListener('toggle',()=>{if(menu.open){for(const other of menus)if(other!==menu)other.open=false;position();}});
 document.addEventListener('keydown',event=>{if(event.key!=='Escape')return;for(const menu of menus)if(menu.open){menu.open=false;menu.querySelector('summary').focus();}});
 document.addEventListener('click',event=>{for(const menu of menus)if(menu.open&&!menu.contains(event.target))menu.open=false;});
 window.addEventListener('resize',position);window.addEventListener('scroll',position);
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(position).observe(nav);
}
