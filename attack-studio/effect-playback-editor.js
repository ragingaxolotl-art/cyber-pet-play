import {addContextHelp} from './context-help.js';

// Contact loops take precedence without discarding the ordinary repeat preference.
export function renderEffectPlayback({root,visual,count,field,commit}){
 const section=document.createElement('fieldset'),heading=document.createElement('legend');
 section.className='supporting-control-group effect-playback';heading.textContent='Artwork playback';section.append(heading);
 const fields=document.createElement('div');fields.className='fields';
 const repeat=field(fields,'Repeat artwork (whole clip)',visual,'loop','checkbox');
 repeat.disabled=!!visual.loopUntilImpact;
 repeat.title=visual.loopUntilImpact?'Loop until impact takes precedence. Your whole-clip repeat setting is kept.':'';
 field(fields,'Loop until impact',visual,'loopUntilImpact','checkbox',null,0,0,1,()=>{
  if(visual.loopUntilImpact)visual.start=0;
  commit();
 });
 for(const [key,label] of [['loopStart','Loop first frame'],['loopEnd','Loop last frame']]){
  const input=field(fields,label,visual,key,'number',null,1,count,1);
  input.disabled=!visual.loopUntilImpact;
  input.title='Frame range used by Loop until impact only.';
 }
 const summary=document.createElement('p');summary.className='hint';
 summary.textContent=visual.loopUntilImpact?'Selected range repeats until impact; remaining frames play afterward.':'First / last frame apply only to Loop until impact.';
 const note=document.createElement('p');
 note.textContent='Repeat artwork repeats the entire edited clip. Loop until impact plays any frames before the selected range once, repeats that range until contact, then plays the remaining frames once. Enabling it sets Start frame to zero. It takes precedence over whole-clip repeat; turning it off restores that saved preference. First and last refer to positions in the edited strip, not source artwork numbers. Reordering or removing frames keeps the range with surviving frames.';
 section.append(fields,summary,note);addContextHelp(section,heading,[note]);root.append(section);
}
