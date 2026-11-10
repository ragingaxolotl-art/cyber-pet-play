// localStorage has atomic single-key writes, not multi-record transactions.
// Keep original values in one durable journal until every write succeeds.
export const TREE_RECOVERY_KEY='cyber-pet-tree-storage-recovery-v1';
function readRecovery(storage){
 const raw=storage.getItem(TREE_RECOVERY_KEY);if(raw===null)return null;
 let recovery;try{recovery=JSON.parse(raw);}catch{}
 if(recovery?.version!==1||!Array.isArray(recovery.entries)||recovery.entries.some(row=>!Array.isArray(row)||row.length!==2||typeof row[0]!=='string'||row[0]===TREE_RECOVERY_KEY||(row[1]!==null&&typeof row[1]!=='string'))||new Set(recovery.entries.map(row=>row[0])).size!==recovery.entries.length)throw Error('The tree recovery record could not be read. Keep this browser data and download your open work before trying another browser.');
 return recovery.entries;
}
function recover(storage){
 const entries=readRecovery(storage);if(!entries)return;
 try{
  // Free the changed records first so restoring a larger original can fit.
  // The journal remains available if restoration is interrupted again.
  for(const [key] of entries)storage.removeItem(key);
  for(const [key,value] of entries)if(value!==null)storage.setItem(key,value);
  storage.removeItem(TREE_RECOVERY_KEY);
 }catch(cause){throw new Error('The interrupted tree save could not be restored yet. Keep this browser data, download your open work, then allow storage and reload.',{cause});}
}
function exclusive(callback){const locks=globalThis.navigator?.locks;return locks?locks.request('cyber-pet-tree-storage-legacy',callback):Promise.resolve().then(callback);}
export function recoverLegacyTreeStorage(storage){return exclusive(()=>recover(storage));}
export async function createLegacyTreeStore(storage){
 await recoverLegacyTreeStorage(storage);
 return {
  getItem(key){key=String(key);const original=readRecovery(storage)?.find(row=>row[0]===key);return original?original[1]:storage.getItem(key);},
  refresh:()=>recoverLegacyTreeStorage(storage),
  transaction:callback=>exclusive(()=>{
   recover(storage);const writes=new Map();
   const result=callback?.({getItem:key=>writes.has(String(key))?writes.get(String(key)):storage.getItem(String(key)),setItem:(key,value)=>{key=String(key);if(key===TREE_RECOVERY_KEY)throw Error('The tree recovery key is reserved.');writes.set(key,String(value));}});
   if(result?.then){Promise.resolve(result).catch(()=>{});throw Error('Tree storage transactions must be synchronous.');}
   const originals=[];for(const [key,value] of writes){const previous=storage.getItem(key);if(previous!==value)originals.push([key,previous]);}
   if(!originals.length)return result;
   // If this fails, no application record has changed.
   storage.setItem(TREE_RECOVERY_KEY,JSON.stringify({version:1,entries:originals}));
   try{for(const [key] of originals)storage.setItem(key,writes.get(key));storage.removeItem(TREE_RECOVERY_KEY);}
   catch(error){recover(storage);throw error;}
   return result;
  })
 };
}
