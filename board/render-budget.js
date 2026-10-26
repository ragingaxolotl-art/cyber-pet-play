// Keep simulation time independent of rendering speed, with bounded recovery after stalls.
export function frameSteps(seconds){
 const duration=Math.min(.25,Math.max(0,Number.isFinite(seconds)?seconds:0));
 const count=Math.ceil(duration/.05);
 return count?Array(count).fill(duration/count):[];
}
// 1080p backing buffer scales to the display; avoids four times the work on 4K boards.
export function renderSize(width,height,dpr=1){
 const ratio=Math.min(dpr||1,Math.sqrt(1920*1080/Math.max(1,width*height)));
 return {width:Math.max(1,Math.round(width*ratio)),height:Math.max(1,Math.round(height*ratio))};
}
export function petFilter(tint=0,gray=0){
 const parts=[];if(tint%360)parts.push(`hue-rotate(${tint}deg)`);if(gray>0)parts.push(`grayscale(${gray})`);
 return parts.join(' ')||'none';
}
