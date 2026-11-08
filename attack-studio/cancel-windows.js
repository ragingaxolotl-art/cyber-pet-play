import {activeEnd} from './contact-timing.js?v=20261108-scheduled-sequences';
// Cancel windows are absolute cast frames, with an exclusive end.
export function validateCancelWindows(windows){
 if(windows===undefined)return;
 if(!Array.isArray(windows)||!windows.length||windows.length>16)throw Error('Use 1–16 cancel windows.');
 const ids=new Set();
 for(const w of windows){
  if(!w||!/^cancel_[a-zA-Z0-9_]{1,80}$/.test(w.id)||ids.has(w.id))throw Error('Each cancel window needs a unique ID.');ids.add(w.id);
  if(!Number.isInteger(w.start)||w.start<0||!Number.isInteger(w.duration)||w.duration<1||w.start+w.duration>900)throw Error('Cancel windows must fit within 900 frames.');
  if(w.automatic!==undefined&&typeof w.automatic!=='boolean')throw Error('Automatic follow-up must be true or false.');
  if(w.automatic&&w.attacks?.length!==1)throw Error('Choose exactly one attack for an automatic follow-up.');
  if(!['any','hit','block','parry','whiff'].includes(w.condition))throw Error('Invalid cancel condition.');
  if(!Array.isArray(w.attacks)||!w.attacks.length||w.attacks.length>16||new Set(w.attacks).size!==w.attacks.length||w.attacks.some(id=>typeof id!=='string'||!/^attack_[a-zA-Z0-9_]{1,80}$/.test(id)))throw Error('Choose 1–16 unique follow-up attacks.');
 }
}
export const MAX_AUTOMATIC_FOLLOWUPS=8;
export function cancelWindowReady(cast,window,age){
 return age>=window.start&&age<window.start+window.duration&&(window.condition==='any'||(window.condition==='whiff'?['damage','push'].includes(cast.a.payload)&&age>=activeEnd(cast.impact,cast.tm)&&!cast.outcomes.size:cast.outcomes.has(window.condition)));
}
export function canCancel(cast,next,age,automatic=false){
 if(!cast||!next)return false;
 return (cast.a.cancelWindows||[]).some(w=>!!w.automatic===automatic&&w.attacks.includes(next.id)&&cancelWindowReady(cast,w,age));
}
export function automaticFollowup(cast,age,ignoreLimit=false){
 if(!cast||(!ignoreLimit&&(cast.automaticDepth||0)>=MAX_AUTOMATIC_FOLLOWUPS))return null;
 return (cast.a.cancelWindows||[]).find(w=>w.automatic&&cancelWindowReady(cast,w,age))||null;
}

// A copied move keeps self-follow-ups local; named links to other moves stay intact.
export function remapSelfCancels(attack,previousId){
 if(attack.cancelWindows)for(const window of attack.cancelWindows)window.attacks=[...new Set(window.attacks.map(id=>id===previousId?attack.id:id))];
 return attack;
}
