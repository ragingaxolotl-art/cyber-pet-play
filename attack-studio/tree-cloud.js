const API='https://cyber-pet-classroom-settings.ragingaxolotl.chatgpt.site/attack-bank';
export function treeCloud(request=fetch){let token=null;
 async function call(path,method='GET',body,extra={}){const response=await request(API+path,{method,headers:{'Content-Type':'application/json','X-Attack-Bank-Version':'34',...(token?{'X-Attack-Bank-Session':token}:{}),...extra},...(body?{body:JSON.stringify(body)}:{}),credentials:'omit',redirect:'error'});const value=await response.json();if(!response.ok)throw Error(value.error||'Classroom tree request failed.');return value;}
 return {async connect(password){const result=await call('/connect','POST',undefined,{'X-Teacher-Password':password});token=result.token;},read:()=>call('/trees'),save:(release,revision)=>call('/trees','PUT',{release,revision}),async close(){try{if(token)await call('/disconnect','POST');}finally{token=null;}}};
}
