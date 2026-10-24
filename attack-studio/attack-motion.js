// Paths use arena pixels relative to the attacker; positive X is the authored forward direction.
export function pathSample(attack,frame){
 const points=attack.motionPath||[];if(points.length<2)return {x:0,y:0,dx:1,dy:0};
 const lengths=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.y-points[i].y));
 const total=lengths.reduce((a,b)=>a+b,0),progress=Math.max(0,Math.min(1,frame/(attack.pathDuration||60)));let distance=total*progress;
 for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]||i===lengths.length-1){const t=lengths[i]?distance/lengths[i]:0,a=points[i],b=points[i+1];return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,dx:b.x-a.x,dy:b.y-a.y};}distance-=lengths[i];}
 return {x:0,y:0,dx:1,dy:0};
}
export function visualFrame(effect,visual,frame,impact){
 const order=visual.frames||effect.times.map((_,i)=>i),times=order.map(i=>effect.times[i]??effect.times[0]);
 let elapsed=(frame-visual.start)*1000/60*visual.rate;if(elapsed<0)return -1;
 const total=times.reduce((a,b)=>a+b,0);
 if(visual.loopUntilImpact){
  const start=Math.min(times.length-1,Math.max(0,(visual.loopStart||1)-1)),end=Math.max(start,Math.min(times.length-1,(visual.loopEnd||times.length)-1));
  const prefix=times.slice(0,start).reduce((a,b)=>a+b,0),loop=times.slice(start,end+1).reduce((a,b)=>a+b,0),after=prefix+loop;
  if(frame>=impact)elapsed=after+Math.max(0,frame-Math.max(impact,visual.start))*1000/60*visual.rate;
  else if(elapsed>=prefix)elapsed=prefix+(elapsed-prefix)%loop;
 }else if(visual.loop??effect.loop)elapsed%=total;
 if(elapsed>=total)return -1;
 for(let i=0;i<times.length;i++){if(elapsed<times[i])return i;elapsed-=times[i];}return -1;
}
export function visualEnd(effect,visual,impact){
 const times=(visual.frames||effect.times.map((_,i)=>i)).map(i=>effect.times[i]??effect.times[0]);
 if(visual.loopUntilImpact){const end=Math.min(times.length,Math.max(visual.loopStart||1,visual.loopEnd||times.length));return Math.max(impact,visual.start)+times.slice(end).reduce((a,b)=>a+b,0)*60/1000/visual.rate;}
 return (visual.loop??effect.loop)?0:visual.start+times.reduce((a,b)=>a+b,0)*60/1000/visual.rate;
}

// Optional authored fade smooths art whose source sequence has no transparent tail.
export function visualOpacity(effect,visual,frame,impact){
 const fade=visual.fadeOutFrames||0,end=visualEnd(effect,visual,impact);
 return !fade||!Number.isFinite(end)||end===0?1:Math.max(0,Math.min(1,(end-frame)/fade));
}
