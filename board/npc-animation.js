import {clipFrameAt} from './clip-timing.js?v=care46';
import {walkCandidate,beginHostWalk,advanceHostWalk} from './host-walks.js?v=care46';
import {availablePairs,choosePair} from './host-interactions.js?v=care46';
import {drawFeeling} from './emotes.js?v=care46';
export function createHosts(random=Math.random){return {random,pair:null,pendingPair:false,nextPair:10,pairBag:[],walker:null,nextWalk:18,nextWalker:0,art:{},people:[{action:'idle',clock:0,nextBreak:11},{action:'idle',clock:.8,nextBreak:19}],clock:0};}
export async function loadNpcArt(hosts){
 const images=new Map();const load=src=>{if(!images.has(src)){const image=new Image();image.src=src;images.set(src,image);}return images.get(src);};
 const response=await fetch('assets/npcs/clips.json?v=31');if(!response.ok)throw Error('NPC art unavailable');const manifest=await response.json();
 for(const [who,clips] of Object.entries(manifest)){
  hosts.art[who]={};for(const [action,info] of Object.entries(clips)){hosts.art[who][action]={...info,image:load(info.src),restImage:load(info.restSrc),targetImage:info.targetSrc?load(info.targetSrc):null};}
 }
}
const ready=clip=>clip?.image?.complete&&clip.image.naturalWidth>0;
export function advanceHosts(h,c,dt){
 h.clock+=dt;
 // Keep breathing independent of clip resets and stagger the two people.
 for(const [i,p] of h.people.entries()){
  p.idleClock=(p.idleClock??i*.43)+dt;
  p.idlePeriod=3.7+i*.61;
  const resting=!h.pair&&!['walk','turn','serve'].includes(p.action);
  p.idleBlend=Math.max(0,Math.min(1,(p.idleBlend||0)+(resting?1:-1)*dt*4));
 }
 advanceHostWalk(h,c,dt);
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
 if(h.walker||c.customer)h.pendingPair=false;
 else if(h.clock>=h.nextPair&&h.clock>=(h.pairNotBefore||0)&&availablePairs(h).length&&(!c.queue?.length||h.clock>=h.nextPair+90))h.pendingPair=true;
 else if(c.queue?.length)h.pendingPair=false;
 const candidate=walkCandidate(h,c);
 const next=c.preferredHost??((c.servingHost||0)^1);c.hostReady=false;
 for(let i=0;i<2;i++){
  if(h.walker?.index===i)continue;
  const s=h.people[i],clips=h.art['host'+(i+1)]||{};
  if(s.heldRest){if(h.pendingPair)continue;s.heldRest=false;}
  if(c.customer&&c.servingHost===i){s.action='serve';s.clock=c.clock;s.customer=c.customer;continue;}
  if(s.action==='serve'){s.action='talk';s.clock=0;s.feeling='hearts';}
  s.clock+=dt;const duration=clips[s.action]?.duration||2.4;
  if(s.clock>=duration){
   s.clock=0;s.feeling='';s.action='idle';
   if(h.pendingPair){s.heldRest=true;continue;}
   if(candidate===i&&beginHostWalk(h,i)){c.preferredHost=1-i;continue;}
   if(c.queue?.length){if(i===next)c.hostReady=true;else if(h.clock>s.nextBreak&&ready(clips.talk)){s.action='talk';s.nextBreak=h.clock+9;s.feeling='cute';}}
   else if(s.reply||h.clock>s.nextBreak){
    // Alternate short, staggered conversations and occasional selfies, never interrupt service.
    s.breaks=(s.breaks||0)+1;const replying=s.reply;s.reply=false;s.action=!replying&&s.breaks%7===0&&ready(clips.sleep)?'sleep':!replying&&s.breaks%2===0&&ready(clips.lean)?'lean':!replying&&s.breaks%3===0&&ready(clips.selfie)?'selfie':'talk';if(s.action==='talk'&&!replying)h.people[1-i].reply=true;s.feeling=s.action==='talk'?'hearts':'';s.nextBreak=h.clock+13+i*5;
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
export function hostIdleScale(person){
 // A small breathing bounce, anchored at the shoes; no whole-sprite floating.
 const breath=Math.sin((person.idleClock||0)*Math.PI*2/(person.idlePeriod||3.7))*(person.idleBlend||0);
 return {x:1,y:1+breath*.006};
}
export function drawHost(c,w,h,person,clips,x,elapsed){
 const clip=ready(clips?.[person.action])?clips[person.action]:clips?.idle;if(!ready(clip))return false;
 let index=clipFrameAt(clip,person.clock);
 if(person.action==='turn'&&person.reverseTurn)index=clip.count-1-index;
 const frame=clip.frames?.[index]??index;
 // Keep counter poses aligned; ease onto the shoe baseline while stepping outside.
 const resting=(clip.restAt?clip.restAt.includes(index):(index===0||index===clip.count-1))&&ready({image:clip.restImage}),target=frame===clip.targetFrame&&ready({image:clip.targetImage}),image=resting?clip.restImage:target?clip.targetImage:clip.image,sx=resting||target?0:frame*64;
 const size=h*.122,feet=resting?clip.restFeet:target?clip.targetFeet:clip.feet?.[frame],groundBlend=Math.min(1,Math.abs(person.offset||0)/.10),homeTop=h*(.605-.125),groundTop=h*.605-(feet??63)/64*size,top=homeTop+(groundTop-homeTop)*groundBlend;c.save();c.imageSmoothingEnabled=false;const center=Math.max(size/2,Math.min(w-size/2,x*w+(person.offset||0)*h)),mirror=['walk','turn'].includes(person.action)&&(person.action==='walk'?(person.travelFacing??person.walkFacing):person.walkFacing)===-1&&!(person.action==='turn'&&resting);const breathe=hostIdleScale(person),anchor=(feet??63)/64*size;c.translate(center,top+anchor*(1-breathe.y));c.scale((mirror?-1:1)*breathe.x,breathe.y);c.drawImage(image,sx,0,64,64,-size/2,0,size,size);c.restore();
 if(person.sparkleTime>0||person.feeling)drawFeeling(c,person.sparkleTime>0?'hearts':person.feeling,elapsed,center,top-h*.025,h*.029);
 return true;
}
