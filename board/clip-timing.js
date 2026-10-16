// Seconds per playback frame separate quick movement from an intentional pose hold.
export function clipFrameAt(clip,time){
 const t=Math.max(0,time);
 if(clip.frameDurations){let end=0;for(let i=0;i<clip.count;i++){end+=clip.frameDurations[i];if(t<end-1e-9)return i;}return clip.count-1;}
 return Math.min(clip.count-1,Math.floor(t/(clip.duration||2.4)*clip.count));
}
