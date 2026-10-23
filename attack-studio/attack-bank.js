// Saved definitions are separate from working drafts. Credentials never enter saved data.
export const BANK_KEY='cyber-pet-attack-bank-v1';
export function emptyBank(){return {format:'cyber-pet-attack-bank',version:1,attacks:[]};}
export function validateBank(bank,validate){
 if(bank?.format!=='cyber-pet-attack-bank'||bank.version!==1||!Array.isArray(bank.attacks)||bank.attacks.length>256)throw Error('Invalid attack bank.');
 const ids=new Set();for(const a of bank.attacks){validate(a);if(ids.has(a.id))throw Error('Duplicate saved attack ID.');ids.add(a.id);}return bank;
}
export function saveToBank(bank,attack,validate){
 const next=structuredClone(bank),copy=structuredClone(attack);validate(copy);
 const index=next.attacks.findIndex(a=>a.id===copy.id);
 if(index<0){if(next.attacks.length>=256)throw Error('The bank is full (256 attacks).');next.attacks.push(copy);}else next.attacks[index]=copy;
 validateBank(next,validate);
 if(new TextEncoder().encode(JSON.stringify(next)).length>900000)throw Error('This bank is too large. Download a project backup before starting another bank.');
 return next;
}
export function encodeBank(bank){const bytes=new TextEncoder().encode(JSON.stringify(bank,null,2));let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary);}
export function decodeBank(content){return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(content.replace(/\s/g,'')),c=>c.charCodeAt(0))));}
export const SESSION_KEY='cyber-pet-attack-classroom-session-v1';
const API='https://cyber-pet-classroom-settings.ragingaxolotl.chatgpt.site/attack-bank';
export function createClassroomBank(validate,request=fetch){
 let session=null;
 const headers=()=>({'Content-Type':'application/json',...(session?{'X-Attack-Bank-Session':session.token}:{})});
 async function call(path='',options={}){
  const response=await request(API+path,{cache:'no-store',...options,headers:{...headers(),...options.headers}});
  const data=await response.json();if(!response.ok){if(response.status===401)session=null;const error=Error(data.error||'Classroom saving is unavailable. Your local copy is safe.');error.status=response.status;throw error;}return data;
 }
 return {
  restore(value){session=value&&/^[a-f0-9]{64}$/.test(value.token)&&value.expires>Date.now()/1000?value:null;},
  connected:()=>!!session&&session.expires>Date.now()/1000,
  async connect(password){session=await call('/connect',{method:'POST',headers:{'X-Teacher-Password':password}});return session;},
  async disconnect(){try{if(session)await call('/disconnect',{method:'POST'});}finally{session=null;}},
  async read(){const data=await call();validateBank(data.bank,validate);return data;},
  async write(bank,revision){validateBank(bank,validate);return call('',{method:'PUT',body:JSON.stringify({bank,revision})});}
 };
}
export function installAttackBank({current,validate,status,open}){
 const $=id=>document.getElementById(id),remote=createClassroomBank(validate);let bank=emptyBank(),busy=false,pendingSave=false;
 try{remote.restore(JSON.parse(localStorage.getItem(SESSION_KEY)||'null'));}catch{}
 const message=text=>{$('bankStatus').textContent=text;status(text);};
 function local(){const raw=localStorage.getItem(BANK_KEY);return raw?validateBank(JSON.parse(raw),validate):emptyBank();}
 function render(){const selected=$('bankList').value;$('bankList').replaceChildren();for(const a of bank.attacks){const option=document.createElement('option');option.value=a.id;option.textContent=a.name;$('bankList').append(option);}if(bank.attacks.some(a=>a.id===selected))$('bankList').value=selected;$('openAttack').disabled=busy||!bank.attacks.length;$('connectBank').textContent=remote.connected()?'Teacher connection':'Teacher sign in';}
 async function task(action){if(busy)return;busy=true;for(const id of ['saveAttack','refreshBank','openAttack','bankSource','connectBank'])$(id).disabled=true;try{await action();}catch(e){if(e.status===401)localStorage.removeItem(SESSION_KEY);message(e.message);}finally{busy=false;for(const id of ['saveAttack','refreshBank','bankSource','connectBank'])$(id).disabled=false;render();}}
 function signIn(){ $('bankPassword').value='';$('bankConnection').showModal(); }
 async function refresh(){
  if($('bankSource').value==='classroom'&&!remote.connected()){bank=local();render();message('Sign in with your teacher password for classroom saves. Showing local recovery copies.');return;}
  bank=emptyBank();render();bank=$('bankSource').value==='classroom'?(await remote.read()).bank:local();render();message(`${bank.attacks.length} saved attacks · ${$('bankSource').value==='classroom'?'classroom bank':'this browser'}.`);
 }
 async function save(){
  const attack=structuredClone(current());validate(attack);
  const localBank=saveToBank(local(),attack,validate);localStorage.setItem(BANK_KEY,JSON.stringify(localBank));
  if($('bankSource').value==='classroom'){
   if(!remote.connected()){pendingSave=true;bank=localBank;message('Recovery copy saved on this device. Sign in to finish saving to the classroom bank.');signIn();return;}
   let latest;try{latest=await remote.read();}catch(e){if(e.status===401){localStorage.removeItem(SESSION_KEY);pendingSave=true;signIn();}throw e;}
   const previous=bank.attacks.find(a=>a.id===attack.id),now=latest.bank.attacks.find(a=>a.id===attack.id);
   if(now&&JSON.stringify(now)!==JSON.stringify(previous)&&!confirm('This attack changed on another device. Replace it with your current version?')){message('Saved locally; classroom attack was not replaced.');return;}
   const next=saveToBank(latest.bank,attack,validate);await remote.write(next,latest.revision);bank=next;message('Saved '+attack.name+' to the classroom bank and this device.');
  }else{bank=localBank;message('Saved '+attack.name+' on this device.');}
  render();$('bankList').value=attack.id;
 }
 $('bankSource').onchange=()=>task(refresh);$('refreshBank').onclick=()=>task(refresh);
 $('openAttack').onclick=()=>task(async()=>{const saved=bank.attacks.find(a=>a.id===$('bankList').value);if(saved&&open(structuredClone(saved)))message('Opened '+saved.name+' from the attack bank.');});
 $('saveAttack').onclick=()=>task(save);
 $('connectBank').onclick=()=>{pendingSave=false;signIn();};
 $('bankConnection').addEventListener('close',()=>{
  const action=$('bankConnection').returnValue,password=$('bankPassword').value;$('bankPassword').value='';
  if(action==='disconnect')task(async()=>{pendingSave=false;localStorage.removeItem(SESSION_KEY);await remote.disconnect();await refresh();});
  else if(action==='connect'&&password)task(async()=>{const session=await remote.connect(password);if($('rememberBank').checked)localStorage.setItem(SESSION_KEY,JSON.stringify(session));else localStorage.removeItem(SESSION_KEY);$('bankSource').value='classroom';if(pendingSave){pendingSave=false;await save();}else await refresh();});
  else pendingSave=false;
 });
 task(refresh);
}
