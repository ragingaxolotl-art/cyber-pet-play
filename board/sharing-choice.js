import {shareItem} from './sharing.js?v=outbreak1';
import {freeForActivity as free} from './activity-state.js?v=outbreak1';
export function sharingChoices(pets){
 const choices=[];
 for(const giver of pets)for(const recipient of pets){
  if(giver===recipient||!free(giver)||!free(recipient)||!giver.heldItem||giver.heldItem.type==='toy'||recipient.heldItem||giver.shareCooldown>0||recipient.shareCooldown>0)continue;
  if((giver.data.stats?.fullness??100)<=20||giver.level!==recipient.level||Math.abs(giver.x-recipient.x)>.18)continue;
  choices.push({giver,recipient,item:giver.heldItem});
 }
 return choices;
}
export function confirmSharing(pets,choice){
 const current=sharingChoices(pets).find(c=>c.giver===choice.giver&&c.recipient===choice.recipient&&c.item===choice.item);
 if(!current)return null;
 const result=shareItem(current.giver,current.recipient);
 if(result){for(const p of [current.giver,current.recipient]){p.mode='idle';p.timer=5;p.emoteTime=5;p.socialCooldown=35;}current.giver.displayItem=null;}
 return result;
}
export function installSharingChoice(getPets,onSavedSharing=null){
 const dialog=document.createElement('dialog');dialog.id='sharing-choice';
 const heading=document.createElement('h2');heading.textContent='Share a carried snack';
 const note=document.createElement('p');note.textContent='Choose a nearby pair. Only the food carried on this board is offered. Saved food bags stay unchanged. Board mood is temporary; a teacher may separately authorize a saved reward after accepted sharing.';
 const select=document.createElement('select');select.setAttribute('aria-label','Food and pets');select.style.cssText='width:100%;padding:12px;margin:12px 0';
 const status=document.createElement('p');status.setAttribute('role','status');
 const confirm=document.createElement('button');confirm.textContent='Confirm share';
 const close=document.createElement('button');close.textContent='Close';close.style.marginLeft='12px';close.onclick=()=>dialog.close();
 const saveReward=document.createElement('button');saveReward.textContent='Teacher: save sharing reward';saveReward.hidden=true;saveReward.style.marginLeft='12px';
 dialog.append(heading,note,select,status,confirm,saveReward,close);document.body.append(dialog);
 let choices=[];
 const refresh=()=>{saveReward.hidden=true;choices=sharingChoices(getPets());select.replaceChildren();for(const [i,c] of choices.entries()){const o=document.createElement('option');o.value=String(i);o.textContent=`${c.giver.data.name||'Pet'} → ${c.recipient.data.name||'Pet'} · ${c.item.name||'snack'}`;select.append(o);}confirm.disabled=!choices.length;status.textContent=choices.length?'The recipient can accept or dislike the food.':'No nearby pair is ready. Let pets collect food and approach one another, then try again.';};
 document.getElementById('share-food').onclick=()=>{refresh();dialog.showModal();};
 confirm.onclick=()=>{const choice=choices[Number(select.value)];if(!choice)return;const result=confirmSharing(getPets(),choice);confirm.disabled=true;status.textContent=!result?'The pair changed. Close and choose again.':result.reaction==='disliked'?'The recipient declined. The giver keeps the snack.':'Snack shared! Friendship improved; generous givers also gain a small board mood lift.';if(result&&result.reaction!=='disliked'&&onSavedSharing&&choice.giver.data.boardId){saveReward.hidden=false;saveReward.onclick=()=>{dialog.close();onSavedSharing(choice.giver);};}};
}
