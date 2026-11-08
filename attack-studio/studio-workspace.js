const KEY='cyber-pet-studio-layout-v1';
export function safeLayout(value){
 if(!value||value.version!==1)return {version:1,panels:{},widths:[24,48,28]};
 const panels={};
 for(const [id,p] of Object.entries(value.panels||{}))if(p&&['left','center','right'].includes(p.dock))panels[id]={dock:p.dock,floating:!!p.floating,hidden:!!p.hidden,collapsed:!!p.collapsed,x:Number.isFinite(p.x)?p.x:30,y:Number.isFinite(p.y)?p.y:100,w:Number.isFinite(p.w)?p.w:480,h:Number.isFinite(p.h)?p.h:400};
 const widths=Array.isArray(value.widths)&&value.widths.length===3&&value.widths.every(n=>Number.isFinite(n)&&n>=15&&n<=70)?value.widths:[24,48,28];
 return {version:1,panels,widths};
}
export function fitWindow(p,width,height){return {...p,w:Math.max(240,Math.min(p.w,width-16)),h:Math.max(120,Math.min(p.h,height-16)),x:Math.max(0,Math.min(p.x,width-Math.min(p.w,width-16))),y:Math.max(0,Math.min(p.y,height-48))};}
export function installStudioWorkspace(){
 const $=id=>document.getElementById(id),make=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
 const nav=document.querySelector('header nav'),layout=document.querySelector('.layout');if(!layout)return;
 let state;try{state=safeLayout(JSON.parse(localStorage.getItem(KEY)));}catch{state=safeLayout(null);}
 const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));}catch{$('status').textContent='Layout works for this session, but browser storage is unavailable.';}};
 function menu(name){const d=make('details'),s=make('summary',name),body=make('div');d.className='workspace-menu';body.className='workspace-menu-body';d.append(s,body);nav.append(d);d.addEventListener('toggle',()=>{if(d.open)for(const other of nav.querySelectorAll('.workspace-menu'))if(other!==d)other.open=false;});return body;}
 const file=menu('File'),tools=menu('Editors'),windows=menu('Workspace');
 for(const id of ['open','save','download'])file.append($(id));
 for(const link of [...nav.children].filter(e=>e.tagName==='A'))tools.append(link);
 const controls=$('editorMode').closest('label');controls.classList.add('workspace-controls');$('export').after(controls);
 const reset=make('button','Reset workspace layout');windows.append(reset);
 const hint=make('p','Drag a panel title to float it. Resize its corner; use Dock to return it to a column.');hint.className='hint';windows.append(hint);
 const originalPanels=[document.querySelector('.library'),document.querySelector('.preview'),...[...document.querySelector('.editor-scroll').children].filter(e=>e.classList.contains('panel')),document.querySelector('.inspector')];
 const columns={};layout.classList.add('custom-workspace');
 for(const name of ['left','center','right']){const c=make('section');c.className='workspace-column';c.setAttribute('aria-label',name+' workspace column');columns[name]=c;}
 const records=[];let front=20;
 function columnWidths(){layout.style.gridTemplateColumns=`minmax(190px,${state.widths[0]}fr) 8px minmax(260px,${state.widths[1]}fr) 8px minmax(190px,${state.widths[2]}fr)`;}
 function show(r){
  const p=r.state;r.shell.hidden=p.hidden;r.body.hidden=p.collapsed;r.collapse.textContent=p.collapsed?'Expand':'Collapse';r.collapse.setAttribute('aria-expanded',String(!p.collapsed));r.checkbox.checked=!p.hidden;r.dock.value=p.floating?'float':p.dock;
  r.shell.classList.toggle('floating',p.floating);r.shell.classList.toggle('collapsed',p.collapsed);
  if(p.floating){Object.assign(p,fitWindow(p,innerWidth,innerHeight));Object.assign(r.shell.style,{left:p.x+'px',top:p.y+'px',width:p.w+'px',height:p.collapsed?'auto':p.h+'px'});}
  else{r.shell.removeAttribute('style');if(r.shell.parentElement!==columns[p.dock])columns[p.dock].append(r.shell);}
 }
 function float(r){if(r.state.floating)return;const rect=r.shell.getBoundingClientRect();Object.assign(r.state,{floating:true,x:rect.left,y:rect.top,w:Math.max(320,rect.width),h:Math.max(220,rect.height)});r.shell.style.zIndex=String(++front);show(r);}
 for(const [i,panel] of originalPanels.entries()){
  const id=panel.id||['library','preview'][i]||('panel-'+i),title=panel.querySelector('h2,summary')?.textContent.trim()||({attackTimeline:'Attack timeline',sequenceEditor:'Hit sequence',defenseEditor:'Defense',cancelEditor:'Cancels'}[id])||'Attack settings';
  const home=i===0?'left':i===originalPanels.length-1?'right':'center';
  const p=state.panels[id]||{dock:home,floating:false,hidden:false,collapsed:false,x:30,y:100,w:480,h:400};state.panels[id]=p;
  const shell=make('section'),bar=make('div'),handle=make('button',i===1?'Attack preview':title),body=make('div'),collapse=make('button','Collapse'),hide=make('button','Hide'),dock=make('select'),resize=make('button','↘');
  shell.className='workspace-panel';bar.className='workspace-panel-bar';body.className='workspace-panel-body';handle.className='workspace-drag';handle.title='Drag to move panel; arrow keys move a floating panel';handle.setAttribute('aria-label','Move '+handle.textContent);dock.setAttribute('aria-label','Dock '+handle.textContent);
  for(const [value,text] of [['left','Dock left'],['center','Dock center'],['right','Dock right'],['float','Float']])dock.add(new Option(text,value));
  resize.className='workspace-resize';resize.setAttribute('aria-label','Resize '+handle.textContent);resize.title='Drag to resize; arrow keys adjust size';
  bar.append(handle,dock,collapse,hide);body.append(panel);shell.append(bar,body,resize);columns[p.dock].append(shell);
  const label=make('label'),checkbox=make('input');checkbox.type='checkbox';label.append(checkbox,document.createTextNode(handle.textContent));windows.append(label);
  const r={shell,body,state:p,collapse,checkbox,dock};records.push(r);
  checkbox.onchange=()=>{p.hidden=!checkbox.checked;show(r);persist();};hide.onclick=()=>{p.hidden=true;show(r);persist();};collapse.onclick=()=>{p.collapsed=!p.collapsed;show(r);persist();};dock.onchange=()=>{if(dock.value==='float')float(r);else{p.floating=false;p.dock=dock.value;}show(r);persist();};
  function drag(target,resizing){target.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();float(r);shell.style.zIndex=String(++front);const start={x:e.clientX,y:e.clientY,...{px:p.x,py:p.y,w:p.w,h:p.h}};target.setPointerCapture(e.pointerId);target.onpointermove=v=>{if(resizing){p.w=start.w+v.clientX-start.x;p.h=start.h+v.clientY-start.y;}else{p.x=start.px+v.clientX-start.x;p.y=start.py+v.clientY-start.y;}show(r);};const end=()=>{target.onpointermove=null;persist();};target.onpointerup=end;target.onpointercancel=end;};target.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();float(r);const dx=e.key==='ArrowLeft'?-20:e.key==='ArrowRight'?20:0,dy=e.key==='ArrowUp'?-20:e.key==='ArrowDown'?20:0;if(resizing){p.w+=dx;p.h+=dy;}else{p.x+=dx;p.y+=dy;}show(r);persist();};}
  drag(handle,false);drag(resize,true);show(r);r.home=home;
 }
 function splitter(index){const s=make('div');s.className='workspace-splitter';s.tabIndex=0;s.setAttribute('role','separator');s.setAttribute('aria-orientation','vertical');s.setAttribute('aria-label','Resize workspace columns');
 const change=delta=>{const amount=Math.max(15-state.widths[index],Math.min(state.widths[index+1]-15,delta));state.widths[index]+=amount;state.widths[index+1]-=amount;columnWidths();};
 s.onpointerdown=e=>{e.preventDefault();s.setPointerCapture(e.pointerId);let x=e.clientX;s.onpointermove=v=>{change((v.clientX-x)/layout.clientWidth*100);x=v.clientX;};s.onpointerup=s.onpointercancel=()=>{s.onpointermove=null;persist();};};s.onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();change(e.key==='ArrowLeft'?-2:2);persist();}};return s;}
 layout.replaceChildren(columns.left,splitter(0),columns.center,splitter(1),columns.right);columnWidths();
 reset.onclick=()=>{state.widths=[24,48,28];for(const r of records){Object.assign(r.state,{dock:r.home,floating:false,hidden:false,collapsed:false});columns[r.home].append(r.shell);show(r);}columnWidths();persist();};
 window.addEventListener('resize',()=>records.forEach(show));
 document.addEventListener('keydown',e=>{if(e.key==='Escape')for(const d of nav.querySelectorAll('.workspace-menu'))d.open=false;});
 document.addEventListener('pointerdown',e=>{for(const d of nav.querySelectorAll('.workspace-menu'))if(!d.contains(e.target))d.open=false;});
}
