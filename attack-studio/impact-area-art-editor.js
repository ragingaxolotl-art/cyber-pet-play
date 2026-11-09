import {addContextHelp} from './context-help.js';

export function renderImpactAreaArtEditor({root,attack,effects,mutate}){
 const section=document.createElement('fieldset'),legend=document.createElement('legend');
 legend.textContent='Area artwork';section.append(legend);
 const field=(title,input)=>{const label=document.createElement('label');label.textContent=title;input.setAttribute('aria-label',title);label.append(input);section.append(label);return input;};
 const select=field('Area effect',document.createElement('select'));
 const option=(value,text)=>{const node=document.createElement('option');node.value=value;node.textContent=text;select.append(node);};
 option('','Use area outline');
 for(const [id,effect] of effects)option(id,effect.name||effect.label||id);
 const visual=attack.projectileArea.visual;
 if(visual&&!effects.has(visual.effectId))option(visual.effectId,'Unavailable effect · '+visual.effectId);
 select.value=visual?.effectId||'';
 select.onchange=()=>{if(!mutate(next=>{
  if(!select.value)delete next.projectileArea.visual;
  else {if(!effects.has(select.value))throw Error('Choose available impact-area artwork.');next.projectileArea.visual={scale:1,rate:1,loop:true,...visual,effectId:select.value};}
 }))select.value=visual?.effectId||'';};
 if(visual){
  for(const [key,title] of [['scale','Area artwork size'],['rate','Area artwork speed']]){
   const input=field(title,document.createElement('input'));Object.assign(input,{type:'number',min:.25,max:4,step:.05,value:visual[key]});
   input.onchange=()=>{if(!mutate(next=>{if(input.value==='')throw Error('Enter a value from 0.25 to 4.');next.projectileArea.visual[key]=Number(input.value);}))input.value=visual[key];};
  }
  const repeat=field('Repeat area artwork',document.createElement('input'));repeat.type='checkbox';repeat.checked=visual.loop;
  repeat.onchange=()=>{if(!mutate(next=>next.projectileArea.visual.loop=repeat.checked))repeat.checked=visual.loop;};
 }
 const note=document.createElement('p');note.textContent='Artwork starts at impact and fits inside the area while preserving its proportions. Size and playback speed affect only the picture, not damage, lifetime or collision size. Repeating artwork lasts until the area ends. An unavailable or finished effect shows the area outline. Undo restores artwork changes.';
 section.append(note);addContextHelp(section,legend,[note]);root.append(section);
}
