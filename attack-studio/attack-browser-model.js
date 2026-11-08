export const BROWSER_PREFS='cyber-pet-attack-browser-v1';
const aliases={knock:'knockback',push:'knockback',pushing:'knockback',healing:'heal',heals:'heal',stuns:'stun',burning:'burn',burns:'burn',projectiles:'projectile',shots:'projectile',shot:'projectile',bolts:'projectile',shields:'shield',guard:'block',blocking:'block',multihit:'multi-hit'};
const normalize=text=>String(text||'').toLowerCase().replace(/[_–—]/g,' ').replace(/[^a-z0-9 -]/g,' ').trim();
export function behaviorTags(attack){
 if(!attack)return [];
 const tags=new Set([attack.payload,attack.status].filter(v=>v&&v!=='none'));
 if(attack.payload==='push')tags.add('knockback');
 for(const hit of [attack,...attack.hitEvents||[]]){if(hit.knockback>0||hit.push>0)tags.add('knockback');if(hit.launchHeight>0)tags.add('launch');if(hit.status&&hit.status!=='none')tags.add(hit.status);}
 if(attack.hitEvents?.length>1)tags.add('multi-hit');
 for(const window of attack.defenseWindows||[])if(window.kind)tags.add(window.kind);
 if(attack.projectileLifetime!==undefined)tags.add('persistent');
 if(attack.projectileDurability)tags.add('clash');
 return [...tags];
}
export function catalogEntries({effects,setups,drafts=[],saved=[],savedLabel='Saved attacks'}){
 const effectList=effects instanceof Map?[...effects.values()]:effects,effectMap=new Map(effectList.map(e=>[e.id,e])),setupMap=setups instanceof Map?setups:new Map((setups||[]).map(s=>[s.effectId,s]));
 const result=[];
 const entry=(source,id,name,attack,effect,sourceLabel)=>({id:source+':'+id,source,name,attack,effect,sourceLabel,element:attack?.element||effect?.element||'mixed',delivery:attack?.delivery||'',behaviors:behaviorTags(attack),description:attack?.notes||effect?.description||'',search:normalize([name,effect?.name,effect?.slot,attack?.element,effect?.element,attack?.delivery,...behaviorTags(attack),...(attack?.tags||[]),attack?.notes,effect?.description].join(' '))});
 for(const attack of saved)result.push(entry('saved',attack.id,attack.name,attack,effectMap.get(attack.visuals?.[0]?.effectId),savedLabel));
 for(const attack of drafts)result.push(entry('draft',attack.id,attack.name,attack,effectMap.get(attack.visuals?.[0]?.effectId),'Working draft'));
 for(const effect of effectList){const setup=setupMap.get(effect.id);result.push(entry(setup?'template':'artwork',effect.id,setup?.attack.name||effect.name,setup?.attack,effect,setup?'Tuned template':'Artwork only'));}
 return result;
}
export function filterCatalog(entries,{query='',element='',delivery='',behavior='',source='',collection='',favorites=[],recent=[],collections=[]}={}){
 const stop=new Set(['a','an','the','that','with','enemies','enemy','opponent','opponents','back','and','does','something']);
 const tokens=normalize(query).split(/\s+/).filter(t=>t&&!stop.has(t)).map(t=>aliases[t]||t);
 return entries.filter(e=>(!element||e.element===element)&&(!delivery||e.delivery===delivery)&&(!behavior||e.behaviors.includes(behavior))&&(!source||e.source===source)&&(!collection||collection==='favorites'&&favorites.includes(e.id)||collection==='recent'&&recent.includes(e.id)||collections.some(c=>'collection:'+c.id===collection&&c.items.includes(e.id)))&&tokens.every(t=>e.search.includes(t))).sort((a,b)=>collection==='recent'?recent.indexOf(a.id)-recent.indexOf(b.id):a.name.localeCompare(b.name)||a.source.localeCompare(b.source));
}
export function readBrowserPreferences(storage){try{const p=JSON.parse(storage.getItem(BROWSER_PREFS)||'{}');return {favorites:Array.isArray(p.favorites)?p.favorites.filter(x=>typeof x==='string').slice(0,3000):[],recent:Array.isArray(p.recent)?p.recent.filter(x=>typeof x==='string').slice(0,80):[],size:[120,160,220].includes(p.size)?p.size:160,motion:p.motion===true};}catch{return {favorites:[],recent:[],size:160,motion:false};}}
export function recordRecent(prefs,id){return {...prefs,recent:[id,...prefs.recent.filter(x=>x!==id)].slice(0,80)};}
