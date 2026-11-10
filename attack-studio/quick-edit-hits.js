import {resizeHits} from './hit-sequence.js?v=20261110-results-navigation';
// Preserve every retained event exactly. Insert additional middle hits into the
// largest available integer-frame gap; never move the original finisher.
export function resizeAuthoredHits(events,count,interval,mode){
 if(mode!=='keep')return resizeHits(events,count,interval,mode);
 if(!Number.isInteger(count)||count<1||count>10)throw Error('Choose 1–10 hits.');
 const result=structuredClone(events);
 while(result.length>count)result.splice(Math.max(0,result.length-2),1);
 while(result.length<count){
  let index=-1,gap=1;
  for(let i=0;i<result.length-1;i++){const size=result[i+1].offset-result[i].offset;if(size>gap){gap=size;index=i;}}
  if(index<0)throw Error('No free frames remain before the final hit. Choose even spacing or fit duration, or move the final hit later first. Existing hits have not changed.');
  const sample=result[index];result.splice(index+1,0,{...structuredClone(sample),id:'hit_'+crypto.randomUUID().replaceAll('-',''),offset:sample.offset+Math.floor(gap/2),reaction:'suspend',damage:3,knockback:0});
 }
 return result;
}
