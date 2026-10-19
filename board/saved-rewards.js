const ENDPOINT='https://cyber-pet-classroom-settings.ragingaxolotl.chatgpt.site/student-backups/teacher/board-rewards';
export const rewardKinds=Object.freeze({participation:'Participation · 5 gold',sharing:'Confirmed sharing · 2 Happiness + up to 1 Love'});
export function rewardPetId(pet){const id=pet?.data?.boardId;return typeof id==='string'&&/^[a-f0-9]{64}$/.test(id)?id:null;}
export async function requestSavedReward(pet,kind,password,fetcher=fetch){
 const display_id=rewardPetId(pet);
 if(!display_id||!Object.hasOwn(rewardKinds,kind))throw Error('Choose a backed-up classroom pet and a supported reward.');
 if(typeof password!=='string'||!password||password.length>256)throw Error('Enter the teacher password.');
 let response;
 try{response=await fetcher(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','X-Teacher-Password':password},body:JSON.stringify({display_id,kind}),cache:'no-store'});}catch{throw Error('Connection lost. Retry is safe; the daily reward cannot be issued twice.');}
 let result;try{result=await response.json();}catch{throw Error('The server response could not be verified. Retry is safe.');}
 if(!response.ok)throw Error(result.error||'The reward could not be saved.');
 if(!Number.isSafeInteger(result.receipt?.sequence)||result.receipt.sequence<1||result.receipt.kind!==kind)throw Error('The reward receipt could not be verified. Retry is safe.');
 return result;
}
export function installSavedRewards(getPets){
 const dialog=document.createElement('dialog');dialog.id='saved-board-rewards';
 const heading=document.createElement('h2');heading.textContent='Teacher: save a board reward';
 const explanation=document.createElement('p');explanation.textContent='Recognize observed participation or a confirmed shared snack. Each account can receive one of each reward per UTC day. Students collect rewards in Character access → Collect board rewards & back up. Ambient board actions do not award saved progress.';
 const pets=document.createElement('select');pets.setAttribute('aria-label','Classroom pet');
 const kind=document.createElement('select');kind.setAttribute('aria-label','Reward');
 for(const [value,label] of Object.entries(rewardKinds)){const option=document.createElement('option');option.value=value;option.textContent=label;kind.append(option);}
 const password=document.createElement('input');password.type='password';password.autocomplete='off';password.maxLength=256;password.placeholder='Teacher password';password.setAttribute('aria-label','Teacher password');
 for(const input of [pets,kind,password])input.style.cssText='display:block;width:100%;padding:12px;margin:12px 0;box-sizing:border-box';
 const status=document.createElement('p');status.setAttribute('role','status');
 const issue=document.createElement('button');issue.textContent='Confirm saved reward';
 const close=document.createElement('button');close.textContent='Close';close.style.marginLeft='12px';
 dialog.append(heading,explanation,pets,kind,password,status,issue,close);document.body.append(dialog);
 let choices=[],busy=false;
 const clear=()=>{password.value='';};
 close.onclick=()=>{if(!busy){clear();dialog.close();}};
 dialog.addEventListener('close',clear);dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();else clear();});
 function open(preselected=null,selectedKind='participation'){
  choices=getPets().filter(p=>rewardPetId(p));pets.replaceChildren();
  for(const [i,pet] of choices.entries()){const option=document.createElement('option');option.value=String(i);option.textContent=pet.data.name||'Cyber Pet';pets.append(option);}
  if(preselected){const index=choices.findIndex(p=>rewardPetId(p)===rewardPetId(preselected));if(index>=0)pets.value=String(index);}
  kind.value=selectedKind;clear();issue.disabled=!choices.length;status.textContent=choices.length?'Confirm only an activity you observed. Saved food bags are not spent.':'No backed-up classroom pets are available. Local ZIPs and residents cannot receive saved rewards.';
  dialog.showModal();
 }
 issue.onclick=async()=>{
  if(busy)return;const selected=choices[Number(pets.value)];if(!selected)return;
  busy=true;issue.disabled=close.disabled=pets.disabled=kind.disabled=password.disabled=true;status.textContent='Saving reward…';
  try{await requestSavedReward(selected,kind.value,password.value);status.textContent='Reward ready for collection. Repeating this action today returns the same reward.';}
  catch(error){status.textContent=error.message;}
  finally{clear();busy=false;issue.disabled=close.disabled=pets.disabled=kind.disabled=password.disabled=false;}
 };
 document.getElementById('saved-reward').onclick=()=>open();
 return {sharing:pet=>open(pet,'sharing')};
}
