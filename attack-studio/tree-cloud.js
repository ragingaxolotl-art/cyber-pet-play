const API='https://cyber-pet-classroom-settings.ragingaxolotl.chatgpt.site/attack-bank';
export function treeCloud(request=fetch) {
 let token=null,generation=0;
 async function call(path,method='GET',body,extra={},session=token) {
  const response=await request(API+path,{method,headers:{'Content-Type':'application/json','X-Attack-Bank-Version':'36',...(session?{'X-Attack-Bank-Session':session}:{}),...extra},...(body?{body:JSON.stringify(body)}:{}),credentials:'omit',redirect:'error'});
  let value;
  try {value=await response.json();} catch {throw Error('Classroom returned an unreadable response. Refresh releases or reconnect.');}
  if(!response.ok)throw Error(value?.error||'Classroom tree request failed.');
  return value;
 }
 const disconnect=session=>session?call('/disconnect','POST',undefined,{},session):Promise.resolve();
 return {
  async connect(password) {
   const attempt=++generation,previous=token;token=null;
   await disconnect(previous).catch(()=>{});
   if(attempt!==generation)throw Error('Connection closed.');
   const result=await call('/connect','POST',undefined,{'X-Teacher-Password':password});
   if(!result||typeof result.token!=='string'||!result.token)throw Error('Classroom did not return a valid session. Reconnect.');
   // Closing a dialog during authentication must not leave the late session active.
   if(attempt!==generation){await disconnect(result.token).catch(()=>{});throw Error('Connection closed.');}
   token=result.token;
  },
  read:()=>call('/trees'),
  save:(release,revision)=>call('/trees','PUT',{release,revision}),
  async close(){++generation;const previous=token;token=null;await disconnect(previous);}
 };
}
