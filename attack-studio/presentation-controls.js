// Device preferences belong to this browser, never to an exported attack.
export function installPresentationControls({root,audio,preferences,status,change=()=>{},editing=false}){
 const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Sound & motion preferences';details.className='presentation-preferences';details.append(summary);const controls=document.createElement('div');controls.className='presentation-preference-controls';details.append(controls);
 const enable=document.createElement('button');enable.type='button';enable.textContent='Enable sound';enable.onclick=async()=>{const ready=await audio.enable();enable.textContent=ready?'Sound enabled':'Retry sound';status(ready?'Sound enabled. Mute and volume apply to this browser.':'Sound is unavailable in this browser. You can still edit and test attacks.');};controls.append(enable);
 const values=preferences.get();
 for(const [key,title,type] of [['muted','Mute sounds','checkbox'],['volume','Sound volume','range'],['reducedMotion','Reduce camera motion and slow motion','checkbox']]){
  const label=document.createElement('label'),input=document.createElement('input');label.className='inline';label.textContent=title;input.type=type;input.setAttribute('aria-label',title);
  if(type==='checkbox')input.checked=values[key];else{input.min=0;input.max=1;input.step=.05;input.value=values[key];}
  input.onchange=()=>{const result=preferences.set({[key]:type==='checkbox'?input.checked:Number(input.value)});audio.preferences(result.value);change();if(!result.persisted)status('Sound and motion preferences apply for this session; browser storage is unavailable.');};label.append(input);controls.append(label);
 }
 const note=document.createElement('p');note.textContent=editing?'Camera effects appear during playback. Pausing restores a steady view for precise dragging. Sounds use short synthesized presets.':'Camera effects appear during attacks. Sounds use short synthesized presets. These preferences apply to this browser.';details.append(note);root.append(details);return details;
}
