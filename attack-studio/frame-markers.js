// positions maps each new slot to its old slot. -1 means a newly restored frame.
// Markers follow slots, not source artwork: repeated drawings may have distinct timing.
function nearestSlot(marker, positions) {
 const exact=positions.indexOf(marker);if(exact>=0)return exact;
 const surviving=positions.map((old,index)=>({old,index})).filter(item=>item.old>=0);
 const next=surviving.filter(item=>item.old>marker).sort((a,b)=>a.old-b.old)[0];
 const previous=surviving.filter(item=>item.old<marker).sort((a,b)=>b.old-a.old)[0];
 return (next||previous)?.index??0;
}
export function remapPoseImpact(impact, positions) {
 return impact>0?nearestSlot(impact-1,positions)+1:0;
}
export function remapEffectLoop(visual, positions, oldCount) {
 const start=(visual.loopStart||1)-1,end=(visual.loopEnd||oldCount)-1;
 const members=positions.flatMap((old,index)=>old>=start&&old<=end?[index]:[]);
 // A loop is a continuous range. Reordering keeps every surviving loop member
 // inside it. Deleting the entire loop falls back to the next surviving frame.
 const fallback=nearestSlot(start,positions);
 return {loopStart:members.length?Math.min(...members)+1:fallback+1,
  loopEnd:members.length?Math.max(...members)+1:fallback+1};
}
