import {validateAttack} from './combat-model.js?v=20261108-steering';
const PREFIX='cyber-pet-comparison-transfer:',MAX_BYTES=2*1024*1024,MAX_AGE=10*60*1000;
export function validateComparisonTransfer(data,now=Date.now()){
 if(!data||data.version!==1||!Number.isFinite(data.created)||now-data.created>MAX_AGE||data.created>now+60000)throw Error('This Studio test has expired. Open it again from Studio.');
 if(!Array.isArray(data.attacks)||!data.attacks.length||data.attacks.length>256)throw Error('Invalid Studio test attacks.');
 const ids=new Set();for(const attack of data.attacks){validateAttack(attack);if(ids.has(attack.id))throw Error('Duplicate test attack.');ids.add(attack.id);}
 if(!ids.has(data.first)||!ids.has(data.followup)||!Number.isInteger(data.frame)||data.frame<0||data.frame>899)throw Error('The follow-up or its timing is missing from this project.');
 if(data.automatic!==undefined&&typeof data.automatic!=='boolean')throw Error('Invalid follow-up activation.');
 return data;
}
// Remove only disposable handoff entries; never inspect profiles or saved attacks.
export function cleanupComparisonTransfers(storage,now=Date.now()){
 if(typeof storage.key!=='function'||!Number.isInteger(storage.length))return;
 const keys=[];for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key?.startsWith(PREFIX))keys.push(key);}
 for(const key of keys){
  let expired=false;
  try{const raw=storage.getItem(key);if(!raw)continue;const data=JSON.parse(raw);expired=!Number.isFinite(data?.created)||now-data.created>MAX_AGE||data.created>now+60000;}
  catch{expired=true;}
  if(expired)storage.removeItem(key);
 }
}
export function prepareComparisonTransfer(attacks,first,window,arenaUrl,storage=localStorage,now=Date.now()){
 const url=new URL(arenaUrl,location.href);if(url.origin!==location.origin)throw Error('Open Studio and Arena on the same website to transfer a test.');
 const data=validateComparisonTransfer({version:1,created:now,attacks:structuredClone(attacks),first,followup:window.attacks[0],frame:window.start,automatic:!!window.automatic},now),raw=JSON.stringify(data);
 if(new TextEncoder().encode(raw).length>MAX_BYTES)throw Error('This project is too large to transfer. Download it and open the design in Arena.');
 cleanupComparisonTransfers(storage,now);
 const token=crypto.randomUUID();storage.setItem(PREFIX+token,raw);url.hash='studio-test='+token;return url.href;
}
export function consumeComparisonTransfer(hash,storage=localStorage,now=Date.now()){
 const match=/^#studio-test=([a-f0-9-]{36})$/.exec(hash||'');if(!match)return null;
 const key=PREFIX+match[1],raw=storage.getItem(key);if(!raw)throw Error('This Studio test was already opened or is unavailable. Open it again from Studio.');
 storage.removeItem(key);if(new TextEncoder().encode(raw).length>MAX_BYTES)throw Error('Studio test is too large.');
 return validateComparisonTransfer(JSON.parse(raw),now);
}
