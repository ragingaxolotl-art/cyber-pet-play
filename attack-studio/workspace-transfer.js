export const WORKSPACE_FORMAT='cyber-pet-workspace-layouts';
export function workspaceBundle(presets){return {format:WORKSPACE_FORMAT,version:1,layouts:presets.map(p=>({name:p.name,layout:structuredClone(p.layout)}))};}
export function validateWorkspaceBundle(value){
 if(value?.format!==WORKSPACE_FORMAT||value.version!==1||!Array.isArray(value.layouts)||!value.layouts.length||value.layouts.length>100)throw Error('Choose a workspace backup with 1–100 layouts.');
 for(const item of value.layouts){
  if(typeof item?.name!=='string'||!item.name.trim()||item.name.length>80||![1,2,3].includes(item.layout?.version))throw Error('Invalid layout name or version.');
  const {panels,widths}=item.layout;if(!panels||typeof panels!=='object'||Array.isArray(panels)||Object.keys(panels).length>100)throw Error('Invalid panel settings.');
  if(!Array.isArray(widths)||widths.length!==3||widths.some(n=>!Number.isFinite(n)||n<15||n>70))throw Error('Invalid workspace column widths.');
  for(const [id,p] of Object.entries(panels))if(!/^[a-zA-Z0-9-]+$/.test(id)||!p||!(item.layout.version===1?['left','center','right']:['left','center','right','top','bottom']).includes(p.dock)||['x','y','w','h'].some(key=>!Number.isFinite(p[key])))throw Error('Invalid panel position or size.');
  if(item.layout.version>=2)for(const p of Object.values(panels))if(!Number.isSafeInteger(p.order)||p.order<0||typeof p.pinned!=='boolean')throw Error('Invalid panel order or pin setting.');
  if(item.layout.version===3){
   if(item.layout.dockHeights!==undefined){
    const heights=item.layout.dockHeights;
    if(!heights||typeof heights!=='object'||Array.isArray(heights)||Object.keys(heights).some(key=>!['top','bottom'].includes(key))||Object.values(heights).some(n=>n!==null&&(!Number.isFinite(n)||n<100||n>1200)))throw Error('Invalid dock height.');
   }
   if(!Array.isArray(item.layout.tabs)||item.layout.tabs.length>50)throw Error('Invalid tab groups.');
   const used=new Set(),ids=new Set();
   for(const group of item.layout.tabs){
    if(!group||typeof group.id!=='string'||!/^[a-zA-Z0-9-]+$/.test(group.id)||ids.has(group.id)||!Array.isArray(group.panels)||group.panels.length<2||!group.panels.includes(group.active))throw Error('Invalid tab group.');
    ids.add(group.id);let first;
    for(const id of group.panels){const p=panels[id];if(typeof id!=='string'||!p||used.has(id)||p.floating||first&&(p.dock!==first.dock||p.pinned!==first.pinned))throw Error('Invalid tab membership.');used.add(id);first??=p;}
   }
  }
 }
 return structuredClone(value);
}
export function downloadJson(value,name){
 const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
