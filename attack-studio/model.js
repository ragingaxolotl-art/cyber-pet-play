export const slots={upper_hit_side:'Upper Hit',lower_hit_side:'Lower Hit',thrust_hit_side:'Thrust Hit',sweep_hit_side:'Sweep Hit',body_bash_side:'Body Bash',spin_hit_side:'Spin Hit',ground_slam_side:'Ground Slam',side_push_side:'Side Push',up_summon_side:'Up Summon',down_summon_side:'Down Summon',gather_power_side:'Gather Power',release_power_side:'Release Power',channel_power_side:'Channel Power'};
export function validateCatalog(c){
 if(!c||c.version!==1||!Array.isArray(c.attacks)||c.attacks.length<1||c.attacks.length>32)throw Error('A catalog needs 1–32 attacks and version 1.');
 const ids=new Set(),names=new Set();
 for(const a of c.attacks){
  if(!a||typeof a.id!=='string'||!/^[a-zA-Z_][a-zA-Z0-9_]{0,63}$/.test(a.id)||Object.hasOwn(Object.prototype,a.id)||ids.has(a.id))throw Error('Each attack needs a unique ID.');
  if(typeof a.name!=='string'||!a.name.trim()||a.name.length>48||names.has(a.name.toLowerCase()))throw Error('Attack names must be different and 1–48 characters long.');
  if(!Object.hasOwn(slots,a.required_animation)||typeof a.description!=='string'||a.description.length>240||typeof (a.tags??'')!=='string'||(a.tags||'').length>320)throw Error('Invalid attack requirements or instructions.');
  ids.add(a.id);names.add(a.name.toLowerCase());
 }
 return c;
}
export function timingProblem(t,count){
 if(!Number.isInteger(count)||count<1||!t||!Number.isInteger(t.first)||!Number.isInteger(t.last)||!Number.isInteger(t.impact)||t.first<1||t.last>count||t.last<t.first||t.impact<t.first||t.impact>t.last||!Number.isFinite(t.speed)||t.speed<.25||t.speed>2)return 'Keep First ≤ Impact ≤ Last within the available frames; speed must be ¼×–2×.';
 return '';
}
export function requirement(a,character){
 const clip=character.clips[a.required_animation];
 if(!clip?.frames?.length)return 'Missing '+slots[a.required_animation]+' artwork.';
 if(clip.reviewed!==true)return 'Artwork is a draft. Save & Back in the compiler, then import a new backup.';
 return '';
}
export function mappingValid(a,character){const m=character.mappings[a.id];return !requirement(a,character)&&m?.animation===a.required_animation&&!timingProblem(m,character.clips[a.required_animation].frames.length);}
export function validateProject(p){
 if(p?.format!=='cyber-pet-attack-studio'||p.version!==1)throw Error('Choose an Attack Studio project JSON.');validateCatalog(p.catalog);
 const c=p.character;if(!c||typeof c.name!=='string'||c.name.length>60||!c.clips||typeof c.clips!=='object'||!c.mappings||typeof c.mappings!=='object')throw Error('Invalid character data.');
 let total=0;
 for(const [slot,clip] of Object.entries(c.clips)){
  if(!Object.hasOwn(slots,slot)||!Array.isArray(clip.frames)||!clip.frames.length||clip.frames.length>300||typeof clip.reviewed!=='boolean')throw Error('Invalid character animation.');
  if(clip.times!==undefined&&(!Array.isArray(clip.times)||clip.times.length!==clip.frames.length||clip.times.some(t=>!Number.isFinite(t)||t<=0||t>10)))throw Error('Invalid frame timing.');
  if(clip.timing&&timingProblem(clip.timing,clip.frames.length))throw Error('Invalid animation timing.');
  for(const f of clip.frames){if(typeof f!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(f)||f.length>12*1024*1024)throw Error('Projects must contain PNG frames.');total+=f.length;}
 }
 if(total>100*1024*1024)throw Error('This project is too large.');
 for(const [id,m] of Object.entries(c.mappings)){const a=p.catalog.attacks.find(a=>a.id===id);if(!a||m?.animation!==a.required_animation||timingProblem(m,c.clips[a.required_animation]?.frames.length||0))throw Error('Invalid attack assignment.');}
 return p;
}
