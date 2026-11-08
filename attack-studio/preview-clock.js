// Authoring uses combat frames; playback additionally shows frozen impact ticks.
// Keep the combat snapshots intact so timeline edits never acquire hitstop offsets.
export function presentationFrames(frames){
 const playback=[];
 for(const snapshot of frames){
  const stop=snapshot.impactStop??0;
  if(!Number.isInteger(stop)||stop<0||stop>20)throw Error('Preview impact stop must be 0–20 frames.');
  playback.push({...snapshot,combatFrame:snapshot.frame,presentationFrame:playback.length,hitstopRemaining:stop});
  for(let remaining=stop-1;remaining>=0;remaining--)playback.push({...snapshot,combatFrame:snapshot.frame,presentationFrame:playback.length,hitstopRemaining:remaining});
 }
 return playback;
}
