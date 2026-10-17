// Preserve authored proportions below a board-only cap; never change saved pet settings.
const valid=(v,min,max,fallback)=>Number.isFinite(v)&&v>=min&&v<=max?v:fallback;
export function displayMetrics(data,width,height,count){
 const slot=Math.min(height*.115,Math.max(14,width/(Math.ceil(count/3)+2)*.70));
 const unit=slot/220*1.25;
 const requestedScale=valid(data.config?.display?.pet_scale,.01,16,3)*unit;
 // Cap the complete animation envelope, not individual frames, to avoid pulsing.
 // One pet occupies at most 17.25% of scene height and 14% of scene width.
 // Crowded boards reduce that envelope further with the existing slot sizing.
 const maxHeight=Math.max(1,Number.isFinite(data.maxHeight)?data.maxHeight:1);
 const maxWidth=Math.max(1,Number.isFinite(data.maxWidth)?data.maxWidth:maxHeight);
 const scale=Math.min(requestedScale,slot*1.5/maxHeight,Math.min(width*.14,slot*1.8)/maxWidth);
 return {scale,desired:data.maxHeight*scale,offsetY:valid(data.config?.display?.pet_y_offset,-2048,2048,0)*unit};
}
export const sourceScale=(data,name)=>data.sourceScales?.get(name)||{x:1,y:1};
