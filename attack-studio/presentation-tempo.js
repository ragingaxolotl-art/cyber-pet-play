// Slow motion changes wall-clock playback only; every combat frame still runs.
// Overlaps choose the slowest active event, never multiply into a near-freeze.
export function presentationTempo(sources,{reducedMotion=false}={}){
 if(reducedMotion)return 1;
 let rate=1;
 for(const source of sources){
  if(source.interrupted||!Number.isFinite(source.age)||source.age<0)continue;
  for(const event of source.events||[]){
   if(event.kind==='slow'&&source.age>=event.start&&source.age<event.start+event.duration&&Number.isFinite(event.amount))rate=Math.min(rate,Math.max(.25,Math.min(1,event.amount)));
  }
 }
 return rate;
}
// A budget is measured in normal-speed frames. Re-evaluate after each step so
// the rate at an event boundary is independent of browser refresh frequency.
export function consumePlaybackBudget(budget,rate,step){
 if(!Number.isFinite(budget)||budget<0)throw Error('Playback needs a finite nonnegative frame budget.');
 let steps=0;
 while(true){const speed=rate();if(!Number.isFinite(speed)||speed<.25||speed>1)throw Error('Playback rate must be between 0.25 and 1.');const cost=1/speed;if(budget+1e-10<cost)break;budget=Math.max(0,budget-cost);steps++;if(step()===false)return {budget:0,steps};}
 return {budget,steps};
}
