import {drawFeeling} from './emotes.js?v=friendship1';
import {clipFrameAt} from './clip-timing.js?v=friendship1';
// Shared clips contain both people, so hands, gaze and embraces stay synchronized.
export const pairActions=['talk','laugh','hug','highfive','selfie'];
export const clipReady=clip=>clip?.image?.complete&&clip.image.naturalWidth>0;
export function availablePairs(hosts){return pairActions.filter(a=>clipReady(hosts.art.pair?.[a]));}
export function choosePair(hosts){
 const available=availablePairs(hosts);
 hosts.pairBag=(hosts.pairBag||[]).filter(a=>available.includes(a));
 if(!hosts.pairBag.length){
  hosts.pairBag=[...available];
  for(let i=hosts.pairBag.length-1;i>0;i--){const j=Math.floor(hosts.random()*(i+1));[hosts.pairBag[i],hosts.pairBag[j]]=[hosts.pairBag[j],hosts.pairBag[i]];}
  if(hosts.pairBag.at(-1)===hosts.lastPair&&hosts.pairBag.length>1)[hosts.pairBag[0],hosts.pairBag[hosts.pairBag.length-1]]=[hosts.pairBag.at(-1),hosts.pairBag[0]];
 }
 const action=hosts.pairBag.pop();if(action)hosts.lastPair=action;return action;
}
export const hostX=(index,w,h)=>.51*w+(index===0?-.5:.5)*h*.122;
export function drawHostPair(c,w,h,hosts,elapsed){
 const state=hosts?.pair,clip=hosts?.art.pair?.[state?.action];if(!state||!clipReady(clip))return false;
 const index=clipFrameAt(clip,state.clock);
 const rest=(index===0||index===clip.count-1)&&clipReady({image:clip.restImage});
 const image=rest?clip.restImage:clip.image,sx=rest?0:index*128,size=h*.122,top=h*(.605-.125);
 c.save();c.imageSmoothingEnabled=false;c.drawImage(image,sx,0,128,64,.51*w-size,top,size*2,size);c.restore();for(const [i,p] of hosts.people.entries())if(p.sparkleTime>0)drawFeeling(c,'hearts',elapsed,hostX(i,w,h),top-h*.025,h*.029);return true;
}
