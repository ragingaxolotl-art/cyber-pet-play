import {addContextHelp} from './context-help.js';
const searches=new Map();
const words=value=>String(value||'').replaceAll('_',' ');
export const areaEffectLabel=(id,effect)=>[effect.name||effect.label||id,effect.element,effect.collection,words(effect.slot),effect.variant!==undefined?'v'+effect.variant:''].filter(Boolean).join(' · ');

export function renderImpactAreaArtEditor({root,attack,effects,mutate}){
 const section=document.createElement('fieldset'),legend=document.createElement('legend');
 legend.textContent='Area artwork';section.append(legend);
 const field=(title,input)=>{const label=document.createElement('label');label.textContent=title;input.setAttribute('aria-label',title);label.append(input);section.append(label);return input;};
 const search=field('Search area effects',document.createElement('input'));search.type='search';search.placeholder='Name, element, collection or motion';search.value=searches.get(attack.id)||'';
 const select=field('Area effect',document.createElement('select')),count=document.createElement('p');count.setAttribute('role','status');section.append(count);
 const option=(value,text)=>{const node=document.createElement('option');node.value=value;node.textContent=text;select.append(node);};
 const visual=attack.projectileArea.visual;
 const filter=()=>{
  const terms=search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);select.replaceChildren();option('','Use area outline');let matches=0,selectedIncluded=false;
  for(const [id,effect] of effects){const title=areaEffectLabel(id,effect),text=(title+' '+id).toLowerCase();if(!terms.every(term=>text.includes(term)))continue;option(id,title);matches++;if(id===visual?.effectId)selectedIncluded=true;}
  if(visual&&!selectedIncluded)option(visual.effectId,effects.has(visual.effectId)?'Selected · '+areaEffectLabel(visual.effectId,effects.get(visual.effectId)):'Unavailable effect · '+visual.effectId);
  select.value=visual?.effectId||'';count.textContent=matches+' matching effect'+(matches===1?'':'s')+(visual&&!selectedIncluded?' · current selection kept':'');
 };
 search.oninput=()=>{if(searches.size>=256&&!searches.has(attack.id))searches.delete(searches.keys().next().value);searches.set(attack.id,search.value);filter();};filter();
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
