import {workspaceObjects,objectState,setObjectState} from './workspace-objects.js?v=20261110-properties-versions';
import {attackerDragPlacement} from './preview-drag.js';
const make=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
export function renderObjectProperties({root,project,attack,effects,selected,select,commit,status,reveal,quick=false}){
 const focused=root.contains?.(document.activeElement)?document.activeElement.getAttribute('aria-label'):null;
 root.replaceChildren();const objects=workspaceObjects(attack,effects),current=objects.find(o=>o.key===selected),prefix=quick?'Quick object ':'Selected object ';
 if(!quick)root.append(make('h2','Properties'));
 const row=make('div');row.className='object-properties';const label=make('label',quick?'Object':'Selected object'),picker=make('select');picker.setAttribute('aria-label',quick?'Preview object':'Properties object');
 for(const object of objects)picker.add(new Option(objectState(project,attack.id,object.key).name||object.name,object.key));picker.value=current?.key||'';picker.onchange=()=>select(picker.value);label.append(picker);row.append(label);root.append(row);
 const button=(text,fn)=>{const b=make('button',text);b.type='button';b.onclick=fn;row.append(b);return b;};
 if(!current){root.append(make('p','Choose an object to edit its properties.'));return;}
 const mutate=change=>{try{const next=structuredClone(project);change(next,next.attacks.find(a=>a.id===attack.id));commit(next);return true;}catch(error){status(error.message);return false;}};
 const state=objectState(project,attack.id,current.key);
 if(!quick){const l=make('label','Name'),input=make('input');input.value=state.name||current.name;input.maxLength=60;input.setAttribute('aria-label',prefix+'name');input.onchange=()=>mutate(next=>setObjectState(next,attack.id,[current.key],{name:input.value.trim()}));l.append(input);row.append(l);}
 const source=current.kind==='effect'?attack.visuals[current.index]:current.kind==='hitbox'?(current.boxId?attack.hitboxGroups.flatMap(g=>g.boxes).find(b=>b.id===current.boxId):attack.box):null;
 const properties=current.kind==='effect'?[['x','X',-500,500,1],['y','Y',-500,500,1],['scale','Size',.25,6,.25],['start','Start frame',0,600,1],['rate','Speed',.25,4,.25]]:current.kind==='hitbox'?[['x','X',-500,500,1],['y','Y',-500,500,1],['w','Width',1,500,1],['h','Height',1,500,1]]:[];
 function numeric(title,value,min,max,step,change){const l=make('label',title),input=make('input');Object.assign(input,{type:'number',min,max,step,value});input.setAttribute('aria-label',prefix+title);input.onchange=()=>{if(input.value===''||!input.checkValidity()){input.value=value;status(title+' is outside the allowed range.');return;}if(!mutate((next,a)=>change(next,a,Number(input.value))))input.value=value;};l.append(input);row.append(l);}
 for(const [key,title,min,max,step] of quick?properties.slice(0,2):properties)numeric(title,source[key],min,max,step,(next,a,value)=>{const obj=current.kind==='effect'?a.visuals[current.index]:current.boxId?a.hitboxGroups.flatMap(g=>g.boxes).find(b=>b.id===current.boxId):a.box;obj[key]=value;});
 const options=project.testBench?.options;
 if(options&&current.kind==='target'){
  numeric('Test X',options.distance*options.targetSide,-245,245,1,(next,a,value)=>{Object.assign(next.testBench.options,{distance:Math.abs(value),targetSide:value<0?-1:1});});
  numeric('Test height',options.targetHeight||0,0,60,1,(next,a,value)=>next.testBench.options.targetHeight=value);
 }
 if(options&&current.kind==='attacker')numeric('Test X',(options.previewOrigin??150)/3,15,305,1,(next,a,value)=>{const o=next.testBench.options,position=attackerDragPlacement(o.previewOrigin??150,o.distance*o.targetSide,value-(o.previewOrigin??150)/3);Object.assign(o,{previewOrigin:position.origin,distance:Math.abs(position.targetX),targetSide:position.targetX<0?-1:1});});
 if(quick)button('Properties',()=>reveal('objectProperties'));
 else{
  const note=make('small',state.hidden?'Hidden in preview.':state.locked?'Dragging is locked; numeric edits remain available.':'Visible in preview.');row.append(note);
  if(['attacker','target'].includes(current.kind))root.append(make('p','Test position changes the starting scene, not the attack’s movement animation.'));
  if(current.kind==='attacker')button('Edit attacker movement',()=>reveal('panel-8'));
  if(['attacker','anchor','hurtbox'].includes(current.kind))button('Character frames & anchors',()=>reveal('panel-10'));
  if(current.kind==='effect')button('Effect frames & loops',()=>reveal('panel-11'));
  if(current.kind==='hitbox')button('Collision & hit groups',()=>reveal('panel-13'));
 }
 if(focused)[...root.querySelectorAll('[aria-label]')].find(n=>n.getAttribute('aria-label')===focused)?.focus({preventScroll:true});
}
