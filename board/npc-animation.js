import {availablePairs,choosePair} from './host-interactions.js?v=22';
import {drawFeeling} from './emotes.js?v=22';
export function createHosts(random=Math.random){return {random,pair:null,pendingPair:false,nextPair:10,pairBag:[],art:{},people:[{action:'idle',clock:0,nextBreak:11},{action:'idle',clock:.8,nextBreak:19}],clock:0};}
export async function loadNpcArt(hosts){
 const images=new Map();const load=src=>{if(!images.has(src)){const image=new Image();image.src=src;images.set(src,image);}return images.get(src);};
 const response=await fetch('assets/npcs/clips.json?v=22');if(!response.ok)throw Error('NPC art unavailable');const manifest=await response.json();
 for(const [who,clips] of Object.entries(manifest)){
  hosts.art[who]={};for(const [action,info] of Object.entries(clips)){hosts.art[who][action]={...info,image:load(info.src),restImage:load(info.restSrc)};}
 }
}
const ready=clip=>clip?.image?.complete&&clip.image.naturalWidth>0;
export function advanceHosts(h,c,dt){
 h.clock+=dt;
 // An in-progress gesture finishes its recovery frames even if a pet joins the queue.
 if(h.pair){
  c.hostReady=false;h.pair.clock+=dt;
  if(h.pair.clock>=h.art.pair[h.pair.action].duration){
   h.pair=null;h.nextPair=h.clock+12+h.random()*12;
   for(const p of h.people)Object.assign(p,{action:'idle',clock:0,heldRest:false,feeling:'',reply:false,nextBreak:h.clock+10});
   c.hostReady=true;
  }
  return;
 }
 if(c.customer||c.queue?.length)h.pendingPair=false;
 else if(h.clock>=h.nextPair&&availablePairs(h).length)h.pendingPair=true;
 const next=(c.servingHost||0)^1;c.hostReady=false;
 for(let i=0;i<2;i++){
  const s=h.people[i],clips=h.art['host'+(i+1)]||{};
  if(s.heldRest){if(h.pendingPair)continue;s.heldRest=false;}
  if(c.customer&&c.servingHost===i){s.action='serve';s.clock=c.clock;s.customer=c.customer;continue;}
  if(s.action==='serve'){s.action='talk';s.clock=0;s.feeling='hearts';}
  s.clock+=dt;const duration=clips[s.action]?.duration||2.4;
  if(s.clock>=duration){
   s.clock=0;s.feeling='';s.action='idle';
   if(h.pendingPair){s.heldRest=true;continue;}
   if(c.queue?.length){if(i===next)c.hostReady=true;else if(h.clock>s.nextBreak&&ready(clips.talk)){s.action='talk';s.nextBreak=h.clock+9;s.feeling='cute';}}
   else if(s.reply||h.clock>s.nextBreak){
    // Alternate short, staggered conversations and occasional selfies, never interrupt service.
    s.breaks=(s.breaks||0)+1;const replying=s.reply;s.reply=false;s.action=!replying&&s.breaks%3===0&&ready(clips.selfie)?'selfie':'talk';if(s.action==='talk'&&!replying)h.people[1-i].reply=true;s.feeling=s.action==='talk'?'hearts':'';s.nextBreak=h.clock+13+i*5;
   }
  }
 }
 if(h.pendingPair&&h.people.every(p=>p.heldRest)){
  const action=choosePair(h);h.pendingPair=false;
  if(action){h.pair={action,clock:0};c.hostReady=false;return;}
 }
 // Fallback to the original mapped attendant if loading/generation assets fail.
 if(!ready(h.art['host'+(next+1)]?.serve))c.hostReady=true;
}
export function drawHost(c,w,h,person,clips,x,elapsed){
 const clip=ready(clips?.[person.action])?clips[person.action]:clips?.idle;if(!ready(clip))return false;
 const duration=clip.duration||2.4,index=Math.min(clip.count-1,Math.floor(Math.min(1,person.clock/duration)*clip.count));
 // A shared, continuous breathing phase carries across every action without a transform reset.
 const resting=(index===0||index===clip.count-1)&&ready({image:clip.restImage}),image=resting?clip.restImage:clip.image,sx=resting?0:(clip.frames?.[index]??index)*64;
 const size=h*.122,top=h*(.605-.125)+Math.sin(elapsed*2.1)*h*.0007;c.save();c.imageSmoothingEnabled=false;c.drawImage(image,sx,0,64,64,x*w-size/2,top,size,size);c.restore();
 if(person.feeling)drawFeeling(c,person.feeling,elapsed,x*w,top-h*.025,h*.029);
 return true;
}
