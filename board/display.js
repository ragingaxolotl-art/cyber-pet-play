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
 return {scale,desired:data.maxHeight*scale,offsetY:valid(data.config?.display?.pet_y_offset,-2048,2048,0)*unit*(scale/requestedScale)};
}
export const sourceScale=(data,name)=>data.sourceScales?.get(name)||{x:1,y:1};

// Measure every frame in its original canvas coordinates. A shared anchor keeps
// authored hops and sideways sway instead of pinning each opaque crop to the floor.
export function frameCoordinates(bounds,image,original={x:1,y:1}){
 return {left:(bounds.x-image.width/2)*original.x,right:(bounds.x+bounds.w-image.width/2)*original.x,top:(bounds.y-image.height)*original.y,bottom:(bounds.y+bounds.h-image.height)*original.y};
}
export function animationEnvelope(frames){
 return {left:Math.min(...frames.map(f=>f.left)),right:Math.max(...frames.map(f=>f.right)),top:Math.min(...frames.map(f=>f.top)),bottom:Math.max(...frames.map(f=>f.bottom))};
}
export function framePlacement(frame,envelope,scale){
 return {x:(frame.left-(envelope.left+envelope.right)/2)*scale,y:(frame.top-envelope.bottom)*scale,w:(frame.right-frame.left)*scale,h:(frame.bottom-frame.top)*scale};
}

export function artworkDirection(config,action,direction){
 if(action?.endsWith('_front')||action?.endsWith('_back'))return 1;
 return direction*(config.animation_facing?.[action]==='left'?-1:1);
}
