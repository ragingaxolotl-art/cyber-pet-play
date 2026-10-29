// Stable personal timing survives roster refreshes without changing behavior RNG.
export function personalEmoteTime(p,seconds,reduced=false){
 if(reduced)return 0;
 if(!p.emoteTiming){
  let hash=2166136261;for(const c of String(p.data.boardId||p.data.id||p.animationVariant||0))hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;
  p.emoteTiming={phase:(hash%10007)/997,rate:.94+((hash>>>12)%1000)/1000*.12};
 }
 return p.emoteTiming.phase+seconds*p.emoteTiming.rate;
}
