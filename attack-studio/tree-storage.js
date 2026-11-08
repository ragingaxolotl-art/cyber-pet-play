// Tree records use a separate IndexedDB database; old localStorage saves stay intact.
// Each mutation reads the latest records and commits tree + registry together.
export function treeStorageMessage(error){
 if(error?.name==='QuotaExceededError'||/quota|storage full/i.test(error?.message||''))return 'Tree storage has no space available. Your open edits are still here. Download this tree or the entire data set to keep a backup; do not clear browser data.';
 if(error?.name==='SecurityError'||/blocked|unavailable|denied/i.test(error?.message||''))return 'This browser is blocking tree storage. Your open edits are still here. Download a backup, then allow site storage or import it in another browser.';
 return error?.message||'The tree could not be saved. Download a backup to keep your edits.';
}
export async function createTreeStore({legacy=localStorage,database=globalThis.indexedDB}={}){
 if(!database)return {getItem:key=>legacy.getItem(key),refresh:async()=>{},transaction:async fn=>fn(legacy)};
 const db=await new Promise((resolve,reject)=>{
  const request=database.open('cyber-pet-tree-storage',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('records');
  request.onsuccess=()=>{request.result.onversionchange=()=>request.result.close();resolve(request.result);};
  request.onerror=()=>reject(request.error);request.onblocked=()=>reject(Error('Tree storage is blocked by another open editor. Close that editor and reload.'));
 });
 let cached=new Map();
 const legacyRead=key=>{try{return legacy.getItem(key);}catch{return null;}};
 function run(mode,fn){return new Promise((resolve,reject)=>{
  const tx=db.transaction('records',mode),store=tx.objectStore('records'),records=new Map(),writes=new Map();let result,failure;
  const cursor=store.openCursor();cursor.onsuccess=()=>{const row=cursor.result;if(row){records.set(row.key,row.value);row.continue();return;}
   try{const draft={getItem:key=>writes.has(key)?writes.get(key):records.has(key)?records.get(key):legacyRead(key),setItem:(key,value)=>{if(mode!=='readwrite')throw Error('Read-only tree storage');writes.set(key,String(value));}};
    result=fn?.(draft);if(result?.then)throw Error('Tree storage transactions must be synchronous.');for(const [key,value] of writes)store.put(value,key);
   }catch(error){failure=error;tx.abort();}
  };
  tx.oncomplete=()=>{for(const [key,value] of writes)records.set(key,value);cached=records;resolve(result);};
  tx.onabort=tx.onerror=()=>reject(failure||tx.error||Error('Tree save was interrupted. Your edits remain open.'));
 });}
 await run('readonly');
 return {getItem:key=>cached.has(key)?cached.get(key):legacyRead(key),refresh:()=>run('readonly'),transaction:fn=>run('readwrite',fn)};
}
