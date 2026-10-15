// Same display limits, default scale, offset sign and 1.25 pixel factor as Godot PetAppearance.
const valid=(v,min,max,fallback)=>Number.isFinite(v)&&v>=min&&v<=max?v:fallback;
export function displayMetrics(data,width,height,count){
 const slot=Math.min(height*.115,Math.max(14,width/(Math.ceil(count/3)+2)*.70));
 const unit=slot/220*1.25;
 const scale=valid(data.config?.display?.pet_scale,.01,16,3)*unit;
 return {scale,desired:data.maxHeight*scale,offsetY:valid(data.config?.display?.pet_y_offset,-2048,2048,0)*unit};
}
export const sourceScale=(data,name)=>data.sourceScales?.get(name)||{x:1,y:1};
