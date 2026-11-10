// Layout state is independent of attack data and attack Undo/Redo.
export const DOCKS = ['left','center','right','top','bottom'];
export const LAYOUT_KEY = 'cyber-pet-studio-layout-v3';
export const PREVIOUS_LAYOUT_KEY = 'cyber-pet-studio-layout-v2';
export const LEGACY_LAYOUT_KEY = 'cyber-pet-studio-layout-v1';
export function panelDefaults(dock='center',order=0){
 return {dock,order,floating:false,hidden:false,collapsed:false,pinned:false,x:30,y:100,w:480,h:400};
}
export function safeLayout(value){
 const valid=!!value&&[1,2,3].includes(value.version),panels={};
 if(valid&&value.panels&&typeof value.panels==='object'&&!Array.isArray(value.panels)){
  for(const [id,p] of Object.entries(value.panels)){
   if(!/^[a-zA-Z0-9-]+$/.test(id)||!p||!DOCKS.includes(p.dock))continue;
   const clean=panelDefaults(p.dock,Object.keys(panels).length);
   for(const key of ['floating','hidden','collapsed','pinned'])clean[key]=p[key]===true;
   for(const key of ['x','y','w','h'])if(Number.isFinite(p[key]))clean[key]=p[key];
   if(Number.isSafeInteger(p.order)&&p.order>=0)clean.order=p.order;
   panels[id]=clean;
  }
 }
 const widths=valid&&Array.isArray(value.widths)&&value.widths.length===3&&value.widths.every(n=>Number.isFinite(n)&&n>=15&&n<=70)?[...value.widths]:[24,48,28];
 const result={version:3,panels,widths,tabs:valid&&value.version===3&&Array.isArray(value.tabs)?structuredClone(value.tabs):[],locked:valid&&value.locked===true,previewStack:valid&&value.previewStack===true,previewFocus:valid&&value.previewFocus===true};
 normalizeTabs(result);return result;
}
// A tab group occupies one dock position. Hidden tabs stay in the group so the
// Windows menu can restore them. Floating panels always leave their group.
export function normalizeTabs(state){
 const used=new Set(),ids=new Set(),groups=[];
 for(const entry of state.tabs||[]){
  if(!entry||typeof entry.id!=='string'||!/^[a-zA-Z0-9-]+$/.test(entry.id)||ids.has(entry.id)||!Array.isArray(entry.panels))continue;
  const members=[];let first;
  for(const id of entry.panels){
   const p=typeof id==='string'?state.panels[id]:null;
   if(!p||p.floating||used.has(id)||members.includes(id))continue;
   if(first&&(p.dock!==first.dock||p.pinned!==first.pinned))continue;
   first??=p;members.push(id);
  }
  if(members.length<2)continue;
  members.forEach(id=>used.add(id));ids.add(entry.id);
  groups.push({id:entry.id,panels:members,active:members.includes(entry.active)?entry.active:members[0]});
 }
 state.tabs=groups;
}
export function tabGroup(state,id){return state.tabs?.find(group=>group.panels.includes(id));}
export function detachTab(state,id){
 const group=tabGroup(state,id);if(!group)return false;
 group.panels=group.panels.filter(member=>member!==id);normalizeTabs(state);return true;
}
export function groupTabs(state,id,target){
 if(id===target||!state.panels[id]||!state.panels[target])return false;
 detachTab(state,id);
 const destination=state.panels[target];destination.floating=false;destination.hidden=false;
 Object.assign(state.panels[id],{dock:destination.dock,pinned:destination.pinned,floating:false,hidden:false});
 let group=tabGroup(state,target);
 if(!group){let key='tabs-'+target;while(state.tabs.some(g=>g.id===key))key+='-new';group={id:key,panels:[target],active:target};state.tabs.push(group);}
 group.panels.push(id);group.active=id;normalizeTabs(state);return true;
}
export function dockUnits(state,dock){
 const units=[],seen=new Set();
 for(const [id,p] of orderedPanels(state,dock)){
  if(seen.has(id))continue;
  const group=tabGroup(state,id),members=group?.panels||[id];members.forEach(key=>seen.add(key));
  units.push({id:members[0],members,group,pinned:p.pinned,hidden:members.every(key=>state.panels[key].hidden)});
 }
 return units.sort((a,b)=>Number(b.pinned)-Number(a.pinned));
}
export function orderedPanels(state,dock,exclude){
 return Object.entries(state.panels).filter(([id,p])=>id!==exclude&&p.dock===dock&&!p.floating).sort((a,b)=>a[1].order-b[1].order);
}
// Move before a specific panel, or to the end. Hidden panels retain their place.
export function movePanel(state,id,dock,beforeId=null){
 if(!DOCKS.includes(dock)||!state.panels[id])return false;
 const siblings=orderedPanels(state,dock,id).map(([key])=>key);
 const at=beforeId===null?siblings.length:siblings.indexOf(beforeId);
 if(at<0)return false;
 detachTab(state,id);
 siblings.splice(at,0,id);Object.assign(state.panels[id],{dock,floating:false});
 siblings.forEach((key,order)=>state.panels[key].order=order);
 return true;
}
export function createLayoutHistory(initial,limit=60){
 let current=structuredClone(initial),past=[],future=[];
 return {
  record(next){if(JSON.stringify(current)===JSON.stringify(next))return;past.push(current);if(past.length>limit)past.shift();current=structuredClone(next);future=[];},
  undo(){if(!past.length)return null;future.push(current);current=past.pop();return structuredClone(current);},
  redo(){if(!future.length)return null;past.push(current);current=future.pop();return structuredClone(current);},
  get canUndo(){return past.length>0;},get canRedo(){return future.length>0;}
 };
}
export function findDockDrop(zones,panels,x,y,movingId){
 const zone=zones.find(z=>x>=z.left&&x<=z.right&&y>=z.top&&y<=z.bottom);
 if(!zone)return null;
 const horizontal=['top','bottom'].includes(zone.dock);
 const candidates=panels.filter(p=>p.id!==movingId&&p.dock===zone.dock).sort((a,b)=>horizontal?a.left-b.left:a.top-b.top);
 const before=candidates.find(p=>horizontal?x<(p.left+p.right)/2:y<(p.top+p.bottom)/2);
 const last=candidates.at(-1);
 return {dock:zone.dock,beforeId:before?.id??null,horizontal,
  x:horizontal?(before?.left??last?.right??zone.left):zone.left,
  y:horizontal?zone.top:(before?.top??last?.bottom??zone.top),
  width:horizontal?4:zone.right-zone.left,height:horizontal?zone.bottom-zone.top:4};
}
