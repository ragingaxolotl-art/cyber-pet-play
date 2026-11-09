// Authoring links retain concrete hit values for runtime consumers. The editor
// resolves links before validation/save; a per-field override removes that link.
export const LINKABLE_HIT_FIELDS=Object.freeze(['damage','reaction','height','knockback','frames','hold','target','hitstun','bounces']);
const copy=value=>structuredClone(value);
export function resolveHitPropertyLinks(attack){
 const next=copy(attack),links=next.hitPropertyLinks;
 if(links===undefined)return next;
 if(!Array.isArray(links)||links.length>90)throw Error('Use at most 90 hit-property links.');
 const hits=new Map((next.hitEvents||[]).map(hit=>[hit.id,hit])),owners=new Map();
 for(const link of links){
  if(!link||!hits.has(link.sourceId)||!hits.has(link.targetId)||link.sourceId===link.targetId)throw Error('Choose two different existing hits.');
  if(!Array.isArray(link.fields)||!link.fields.length||new Set(link.fields).size!==link.fields.length||link.fields.some(field=>!LINKABLE_HIT_FIELDS.includes(field)))throw Error('Choose supported shared hit properties.');
  for(const field of link.fields){const key=link.targetId+':'+field;if(owners.has(key))throw Error('A hit property can have only one source.');owners.set(key,link.sourceId);}
 }
 const visiting=new Set(),done=new Set();
 function resolve(id,field){
  const key=id+':'+field;if(done.has(key))return;
  if(visiting.has(key))throw Error('Shared hit properties cannot form a loop.');
  visiting.add(key);const source=owners.get(key);
  if(source){resolve(source,field);const from=hits.get(source),to=hits.get(id);if(from[field]===undefined)delete to[field];else to[field]=copy(from[field]);}
  visiting.delete(key);done.add(key);
 }
 for(const link of links)for(const field of link.fields)resolve(link.targetId,field);
 return next;
}
export function linkHitProperties(attack,sourceId,targetIds,fields){
 if(!Array.isArray(targetIds)||!targetIds.length||new Set(targetIds).size!==targetIds.length)throw Error('Choose one or more different target hits.');
 const next=copy(attack);next.hitPropertyLinks??=[];
 for(const targetId of targetIds){
  next.hitPropertyLinks=next.hitPropertyLinks.map(link=>link.targetId===targetId?{...link,fields:link.fields.filter(field=>!fields.includes(field))}:link).filter(link=>link.fields.length);
  next.hitPropertyLinks.push({sourceId,targetId,fields:[...fields]});
 }
 return resolveHitPropertyLinks(next);
}
export function overrideHitProperty(attack,targetId,field,value){
 const next=resolveHitPropertyLinks(attack),hit=next.hitEvents?.find(hit=>hit.id===targetId);
 if(!hit||!LINKABLE_HIT_FIELDS.includes(field))throw Error('Choose an existing hit and supported property.');
 if(next.hitPropertyLinks){next.hitPropertyLinks=next.hitPropertyLinks.map(link=>link.targetId===targetId?{...link,fields:link.fields.filter(key=>key!==field)}:link).filter(link=>link.fields.length);if(!next.hitPropertyLinks.length)delete next.hitPropertyLinks;}
 if(value===undefined)delete hit[field];else hit[field]=copy(value);
 return resolveHitPropertyLinks(next);
}
// Reconcile ordinary editor operations: edited inherited fields become overrides;
// deleting a source keeps its dependents' last concrete values.
export function reconcileHitPropertyLinks(before,after){
 const next=copy(after);if(!next.hitEvents){delete next.hitPropertyLinks;return next;}
 const prior=resolveHitPropertyLinks(before),oldHits=new Map((prior.hitEvents||[]).map(hit=>[hit.id,hit])),hits=new Map(next.hitEvents.map(hit=>[hit.id,hit]));
 if(next.hitPropertyLinks){next.hitPropertyLinks=next.hitPropertyLinks.filter(link=>hits.has(link.sourceId)&&hits.has(link.targetId)).map(link=>({...link,fields:link.fields.filter(field=>{
  const old=oldHits.get(link.targetId);return !old||JSON.stringify(old[field])===JSON.stringify(hits.get(link.targetId)[field]);
 })})).filter(link=>link.fields.length);if(!next.hitPropertyLinks.length)delete next.hitPropertyLinks;}
 return resolveHitPropertyLinks(next);
}

const equivalent=(a,b)=>{if(a===b)return true;if(!a||!b||typeof a!=='object'||typeof b!=='object')return false;const keys=Object.keys(a);return keys.length===Object.keys(b).length&&keys.every(key=>Object.hasOwn(b,key)&&equivalent(a[key],b[key]));};
export function validateHitPropertyLinks(attack){
 if(attack.hitPropertyLinks===undefined)return;
 if(!Array.isArray(attack.hitEvents)||!attack.hitEvents.length)throw Error('Shared hit settings require a hit sequence.');
 const resolved=resolveHitPropertyLinks(attack);
 for(let i=0;i<attack.hitEvents.length;i++)for(const field of LINKABLE_HIT_FIELDS)
  if(!equivalent(attack.hitEvents[i][field],resolved.hitEvents[i][field]))throw Error('Shared hit values are out of date. Resolve links before saving.');
}
