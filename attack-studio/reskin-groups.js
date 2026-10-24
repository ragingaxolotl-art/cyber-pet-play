// A linked family shares behavior; each member keeps its own identity and artwork.
export function familyKey(effect){return ['reskin','detailed-reskin'].includes(effect?.collection)?`${effect.collection}:${effect.slot}:${effect.variant}`:null;}
export function matchingReskins(effect,effects){const key=familyKey(effect);return key?effects.filter(e=>familyKey(e)===key).sort((a,b)=>a.element.localeCompare(b.element)):[];}
function mappedVisuals(source,element,effects){
 const byId=new Map(effects.map(e=>[e.id,e]));
 return source.visuals.map(v=>{const effect=byId.get(v.effectId),key=familyKey(effect);if(!key)return structuredClone(v);
 const replacement=effects.find(e=>familyKey(e)===key&&e.element===element);
 if(!replacement||!replacement.times.length)throw Error(`No ${element} reskin for ${effect.name}.`);
 const sequence=v.frames||effect.times.map((_,i)=>i),last=Math.max(1,effect.times.length-1);
 // Retain normalized positions across 12/16-frame skins, avoiding round-trip drift.
 const positions=Array.isArray(v.reskinPositions)&&v.reskinPositions.length===sequence.length&&v.reskinPositions.every((p,i)=>Number.isFinite(p)&&p>=0&&p<=1&&Math.round(p*last)===sequence[i])?v.reskinPositions:sequence.map(i=>i/last);
 const frames=positions.map(p=>Math.round(p*(replacement.times.length-1)));
 const sourceMs=sequence.reduce((sum,i)=>sum+(effect.times[i]||80),0),targetMs=frames.reduce((sum,i)=>sum+replacement.times[i],0);
 return {...structuredClone(v),effectId:replacement.id,frames,reskinPositions:[...positions],rate:Math.max(.25,Math.min(4,v.rate*targetMs/sourceMs))};});
}
export function updateReskinMember(source,target,effects){
 const copy=structuredClone(source);
 for(const key of ['id','name','notes','tags','element','reskinGroupId','reskinElement']){if(target[key]===undefined)delete copy[key];else copy[key]=structuredClone(target[key]);}
 copy.visuals=mappedVisuals(source,target.reskinElement||target.element,effects);return copy;
}
export function synchronizeReskins(attacks,source,effects){
 if(!source.reskinGroupId)return attacks;
 return attacks.map(a=>a.id!==source.id&&a.reskinGroupId===source.reskinGroupId?updateReskinMember(source,a,effects):a);
}
export function createReskinGroup(attacks,source,effect,effects,newId){
 if(source.reskinGroupId)throw Error('This attack already belongs to a linked group.');
 const matches=matchingReskins(effect,effects);if(matches.length<2)throw Error('Choose a shared reskin layer with at least two matching elements.');
 if(new Set(matches.map(e=>e.element)).size!==matches.length)throw Error('This family has ambiguous element matches.');
 if(attacks.length+matches.length-1>256)throw Error('There is not enough room in this workspace for the reskin group.');
 const groupId=newId(),base={...structuredClone(source),reskinGroupId:groupId,reskinElement:effect.element,element:effect.element,visuals:mappedVisuals(source,effect.element,effects)};
 const members=matches.map(e=>e.id===effect.id?base:updateReskinMember(base,{id:newId(),name:e.name.slice(0,48),notes:source.notes,tags:source.tags,element:e.element,reskinElement:e.element,reskinGroupId:groupId},effects));
 return [...attacks.map(a=>a.id===source.id?base:a),...members.filter(a=>a.id!==source.id)];
}
export function groupMembers(attacks,source){return source.reskinGroupId?attacks.filter(a=>a.reskinGroupId===source.reskinGroupId):[source];}

export function ensureReskinGroup(attacks,source,effects,newId){
 if(source.reskinGroupId)return attacks;
 const effect=source.visuals.map(v=>effects.find(e=>e.id===v.effectId)).find(e=>matchingReskins(e,effects).length>1);
 return effect?createReskinGroup(attacks,source,effect,effects,newId):attacks;
}
