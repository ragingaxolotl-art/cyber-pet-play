// A long frame strip repeats the same source list hundreds of times. Keep the
// current drawing visible, then build the complete native list when it is used.
// Focus covers keyboard and assistive navigation; pointerdown precedes opening
// the native picker with a mouse, pen or touch.
export function frameSourceSelect(count,source,position){
 const select=document.createElement('select');
 select.setAttribute('aria-label','Source frame for position '+position);
 if(Number.isInteger(source)&&source>=0&&source<count)select.add(new Option('Frame '+(source+1),source));
 select.value=source;
 let populated=false;
 const populate=()=>{
  if(populated)return;
  const value=select.value;
  select.replaceChildren();
  for(let i=0;i<count;i++)select.add(new Option('Frame '+(i+1),i));
  select.value=value;
  populated=true;
 };
 select.onfocus=populate;
 select.onpointerdown=populate;
 return select;
}
