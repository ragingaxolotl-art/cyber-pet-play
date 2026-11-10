// Authoring-only metadata lives beside attacks, never inside combat behavior.
const id=prefix=>prefix+crypto.randomUUID().replaceAll('-','');
const keyPattern=/^(attacker|target|hurtboxes|anchors|effect:(?:[0-9]|1[01])|hitbox:primary|hitbox:box_[A-Za-z0-9_]{1,80})$/;
const plain=value=>value&&typeof value==='object'&&!Array.isArray(value);
export function validateObjectWorkspace(project){
 const state=project.editorObjects;if(state===undefined)return project;
 if(!plain(state)||state.version!==1||!plain(state.attacks)||Object.keys(state).some(k=>!['version','attacks'].includes(k))||Object.keys(state.attacks).length>256)throw Error('Invalid Layers & Objects workspace.');
 for(const [attackId,entry] of Object.entries(state.attacks)){
  if(!/^attack_[A-Za-z0-9_]{1,80}$/.test(attackId)||!plain(entry)||Object.keys(entry).some(k=>!['objects','groups'].includes(k))||!plain(entry.objects)||Object.keys(entry.objects).length>40||!Array.isArray(entry.groups)||entry.groups.length>20)throw Error('Invalid object settings for an attack.');
  for(const [key,value] of Object.entries(entry.objects))if(!keyPattern.test(key)||!plain(value)||Object.keys(value).some(k=>!['name','hidden','locked'].includes(k))||(value.name!==undefined&&(typeof value.name!=='string'||value.name.length>60))||['hidden','locked'].some(k=>value[k]!==undefined&&typeof value[k]!=='boolean'))throw Error('Invalid object name or preview setting.');
  const ids=new Set(),members=new Set();for(const group of entry.groups){
   if(!plain(group)||Object.keys(group).some(k=>!['id','name','members'].includes(k))||!/^objects_[A-Za-z0-9_]{1,80}$/.test(group.id)||ids.has(group.id)||typeof group.name!=='string'||!group.name.trim()||group.name.length>60||!Array.isArray(group.members)||!group.members.length||group.members.length>40)throw Error('Invalid named object group.');ids.add(group.id);
   for(const key of group.members){if(typeof key!=='string'||!keyPattern.test(key)||members.has(key))throw Error('An object can belong to only one named group.');members.add(key);}
  }
 }
 return project;
}
export function objectState(project,attackId,key){return project.editorObjects?.attacks?.[attackId]?.objects?.[key]||{};}
export function objectEntry(project,attackId){return project.editorObjects?.attacks?.[attackId]||{objects:{},groups:[]};}
function entry(project,attackId){project.editorObjects??={version:1,attacks:{}};return project.editorObjects.attacks[attackId]??={objects:{},groups:[]};}
export function setObjectState(project,attackId,keys,patch){const e=entry(project,attackId);for(const key of keys)e.objects[key]={...e.objects[key],...patch};validateObjectWorkspace(project);}
export function groupObjects(project,attackId,keys,name){
 if(!keys.length)throw Error('Select objects to group.');const e=entry(project,attackId),selected=[...new Set(keys)];
 e.groups=e.groups.map(g=>({...g,members:g.members.filter(k=>!selected.includes(k))})).filter(g=>g.members.length);e.groups.push({id:id('objects_'),name:name.trim(),members:selected});validateObjectWorkspace(project);
}
export function remapObjectKeys(project,attackId,map){
 const e=project.editorObjects?.attacks?.[attackId];if(!e)return;const objects={};
 for(const [key,value] of Object.entries(e.objects)){const next=Object.hasOwn(map,key)?map[key]:key;if(next!==null)objects[next]=value;}e.objects=objects;
 e.groups=e.groups.map(g=>({...g,members:g.members.map(k=>Object.hasOwn(map,k)?map[k]:k).filter(k=>k!==null)})).filter(g=>g.members.length);
}
export function removeEffectObject(project,attackId,index,count){const map={};for(let i=index;i<count;i++)map['effect:'+i]=i===index?null:'effect:'+(i-1);remapObjectKeys(project,attackId,map);}
export function workspaceObjects(attack,effects=new Map()){
 const objects=[{key:'attacker',name:'Attacker',kind:'attacker'},{key:'target',name:'Test target',kind:'target'}];
 for(const [index,v] of attack.visuals.entries())objects.push({key:'effect:'+index,name:`Effect ${index+1} · ${effects.get(v.effectId)?.name||v.effectId}`,kind:'effect',index,duplicate:true});
 if(attack.hitboxGroups)for(const [i,g] of attack.hitboxGroups.entries())for(const [j,b] of g.boxes.entries())objects.push({key:'hitbox:'+b.id,name:`Hitbox ${j+1} · hit group ${i+1}`,kind:'hitbox',boxId:b.id,duplicate:true});
 else objects.push({key:'hitbox:primary',name:'Attack hitbox',kind:'hitbox',duplicate:(attack.hitEvents||attack.impactTrigger!=='contact')&&attack.payload==='damage'&&attack.delivery!=='self'});
 if(attack.hurtboxes)objects.push({key:'hurtboxes',name:'Character hurtboxes',kind:'hurtbox'});
 if(attack.animationAnchors)objects.push({key:'anchors',name:'Animation anchors',kind:'anchor'});
 return objects;
}
export function duplicateWorkspaceObjects(project,attackId,keys,effects=new Map()){
 const next=structuredClone(project),attack=next.attacks.find(a=>a.id===attackId);if(!attack)throw Error('Choose an attack.');const selected=workspaceObjects(attack,effects).filter(o=>keys.includes(o.key));if(!selected.length||selected.length!==new Set(keys).size||selected.some(o=>!o.duplicate))throw Error('Only effect layers and supported hitboxes can be duplicated.');
 const map={};for(const object of selected){
  if(object.kind==='effect'){
   if(attack.visuals.length>=12)throw Error('This attack already has twelve effect layers.');const index=attack.visuals.length;attack.visuals.push(structuredClone(attack.visuals[object.index]));map[object.key]='effect:'+index;
  }else{
   if(!attack.hitboxGroups){const first=id('box_');attack.hitboxGroups=[{id:id('group_'),hitLimit:attack.hitLimit,hitInterval:attack.hitInterval,boxes:[{...attack.box,id:first,start:0,duration:attack.active}]}];if(attack.hitEvents)attack.hitEvents.forEach(hit=>hit.hitboxGroup=attack.hitboxGroups[0].id);remapObjectKeys(next,attackId,{'hitbox:primary':'hitbox:'+first});}
   const group=object.boxId?attack.hitboxGroups.find(g=>g.boxes.some(b=>b.id===object.boxId)):attack.hitboxGroups[0],source=object.boxId?group.boxes.find(b=>b.id===object.boxId):group.boxes[0];
   if(attack.hitboxGroups.flatMap(g=>g.boxes).length>=16)throw Error('This attack already has sixteen hitboxes.');const newId=id('box_');group.boxes.push({...structuredClone(source),id:newId});map[object.key]='hitbox:'+newId;
  }
  const old=objectState(project,attackId,object.key);setObjectState(next,attackId,[map[object.key]],{name:(old.name||object.name).slice(0,55)+' copy',hidden:false,locked:false});
 }
 return {project:next,keys:Object.values(map)};
}
export function combatProject(project){const next=structuredClone(project);delete next.editorObjects;return next;}
export function pruneObjectWorkspace(project){
 if(!project.editorObjects)return;
 for(const [attackId,e] of Object.entries(project.editorObjects.attacks)){
  const a=project.attacks.find(a=>a.id===attackId);if(!a){delete project.editorObjects.attacks[attackId];continue;}
  const keys=new Set(workspaceObjects(a).map(o=>o.key));for(const key of Object.keys(e.objects))if(!keys.has(key))delete e.objects[key];
  e.groups=e.groups.map(g=>({...g,members:g.members.filter(k=>keys.has(k))})).filter(g=>g.members.length);
 }
}
