// Saved definitions are separate from working drafts. Credentials never enter saved data.
export const BANK_KEY='cyber-pet-attack-bank-v1';
const ENDPOINT='https://api.github.com/repos/ragingaxolotl-art/cyber-pet-play/contents/attack-studio/attack-bank.json';
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
export function createGitHubBank(validate,request=fetch){
 let token='';
 const headers=()=>({Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(token?{Authorization:'Bearer '+token}:{})});
 async function read(){
  const response=await request(ENDPOINT+'?ref=main',{headers:headers(),cache:'no-store'});
  if(response.status===404)return {bank:emptyBank(),sha:null};
  if(!response.ok)throw Error('GitHub bank could not load ('+response.status+'). Check the connection and try again.');
  const file=await response.json();if(file.type!=='file'||file.encoding!=='base64'||file.size>1000000)throw Error('Unsupported GitHub bank file.');
  return {bank:validateBank(decodeBank(file.content),validate),sha:file.sha};
 }
 return {connect(value){token=value.trim();},disconnect(){token='';},connected:()=>Boolean(token),read,
 async write(bank,sha){
  if(!token)throw Error('Connect GitHub before saving to the shared bank.');
  validateBank(bank,validate);
  const content=encodeBank(bank);if(content.length>1300000)throw Error('The shared bank is too large.');
  const response=await request(ENDPOINT,{method:'PUT',headers:{...headers(),'Content-Type':'application/json'},body:JSON.stringify({message:'Save attack bank',branch:'main',content,...(sha?{sha}:{})})});
  if(response.status===409||response.status===422)throw Error('The bank changed while saving. Refresh the bank and save again; your local copy is safe.');
  if(!response.ok)throw Error('GitHub did not save ('+response.status+'). Check repository access; your local copy is safe.');
  return response.json();
 }};
}
export function installAttackBank({current,validate,status,open}){
 const $=id=>document.getElementById(id),remote=createGitHubBank(validate);let bank=emptyBank(),busy=false;
 const message=text=>{$('bankStatus').textContent=text;status(text);};
 function local(){const raw=localStorage.getItem(BANK_KEY);return raw?validateBank(JSON.parse(raw),validate):emptyBank();}
 function render(){const selected=$('bankList').value;$('bankList').replaceChildren();for(const a of bank.attacks){const option=document.createElement('option');option.value=a.id;option.textContent=a.name;$('bankList').append(option);}if(bank.attacks.some(a=>a.id===selected))$('bankList').value=selected;$('openAttack').disabled=busy||!bank.attacks.length;}
 async function task(action){if(busy)return;busy=true;for(const id of ['saveAttack','refreshBank','openAttack','bankSource','connectBank'])$(id).disabled=true;try{await action();}catch(e){message(e.message);}finally{busy=false;for(const id of ['saveAttack','refreshBank','bankSource','connectBank'])$(id).disabled=false;render();}}
 async function refresh(){bank=emptyBank();render();bank=$('bankSource').value==='github'?(await remote.read()).bank:local();render();message(`${bank.attacks.length} saved attacks · ${$('bankSource').value==='github'?'GitHub shared bank':'this browser'}.`);}
 $('bankSource').onchange=()=>task(refresh);$('refreshBank').onclick=()=>task(refresh);
 $('openAttack').onclick=()=>task(async()=>{const saved=bank.attacks.find(a=>a.id===$('bankList').value);if(saved&&open(structuredClone(saved)))message('Opened '+saved.name+' from the attack bank.');});
 $('saveAttack').onclick=()=>task(async()=>{
  const attack=structuredClone(current());validate(attack);
  // Keep a local recovery copy even if GitHub is unavailable. Never clear the workspace dirty flag here.
  const localBank=saveToBank(local(),attack,validate);localStorage.setItem(BANK_KEY,JSON.stringify(localBank));
  if($('bankSource').value==='github'){
   if(!remote.connected()){message('Saved locally. Connect GitHub, then press Save attack again to share it.');$('bankConnection').showModal();return;}
   const latest=await remote.read(),previous=bank.attacks.find(a=>a.id===attack.id),now=latest.bank.attacks.find(a=>a.id===attack.id);
   if(now&&JSON.stringify(now)!==JSON.stringify(previous)&&!confirm('This attack changed in GitHub since it was loaded. Replace it with your current version?')){message('Saved locally; shared attack was not replaced.');return;}
   const next=saveToBank(latest.bank,attack,validate);await remote.write(next,latest.sha);bank=next;message('Saved '+attack.name+' to GitHub and this browser.');
  }else{bank=localBank;message('Saved '+attack.name+' in this browser. Select it in the bank and press Open attack anytime.');}
  render();$('bankList').value=attack.id;
 });
 $('connectBank').onclick=()=>{$('bankToken').value='';$('bankConnection').showModal();};
 $('bankConnection').addEventListener('close',()=>{const action=$('bankConnection').returnValue,value=$('bankToken').value;$('bankToken').value='';if(action==='disconnect'){remote.disconnect();message('GitHub disconnected. Saved attacks are unchanged.');}else if(action==='connect'&&value.trim()){remote.connect(value);$('bankSource').value='github';task(refresh);}});
 task(refresh);
}
