import {LINKABLE_HIT_FIELDS,linkHitProperties,overrideHitProperty,resolveHitPropertyLinks} from './hit-property-links.js?v=20261109-hit-links';
export function renderHitPropertyLinks(root,attack,selected,commit){
 const make=(tag,text)=>{const el=document.createElement(tag);if(text)el.textContent=text;return el;};
 const section=make('details'),summary=make('summary','Shared hit settings');section.append(summary);
 section.append(make('p','Link selected properties to another hit. Changing the source updates linked hits. Editing a linked value creates an individual override. Timing stays independent.'));
 const status=make('p');status.setAttribute('role','status');
 const source=make('select');source.setAttribute('aria-label','Shared settings source hit');
 attack.hitEvents.forEach((hit,i)=>{if(hit.id!==selected)source.add(new Option('Hit '+(i+1),hit.id));});section.append(source);
 const choices=[];
 for(const field of LINKABLE_HIT_FIELDS){const label=make('label',field),input=make('input');input.type='checkbox';input.setAttribute('aria-label','Share '+field);label.append(input);section.append(label);choices.push([field,input]);}
 const apply=make('button','Link selected properties');apply.type='button';apply.disabled=attack.hitEvents.length<2;
 apply.onclick=()=>{try{commit(linkHitProperties(attack,source.value,[selected],choices.filter(([,input])=>input.checked).map(([field])=>field)));}catch(error){status.textContent=error.message;}};section.append(apply);
 for(const link of attack.hitPropertyLinks||[]){if(link.targetId!==selected)continue;const index=attack.hitEvents.findIndex(hit=>hit.id===link.sourceId);
 const row=make('p','From Hit '+(index+1)+': '+link.fields.join(', ')),unlink=make('button','Unlink these properties');unlink.type='button';unlink.onclick=()=>{let next=resolveHitPropertyLinks(attack);for(const field of link.fields)next=overrideHitProperty(next,selected,field,next.hitEvents.find(hit=>hit.id===selected)[field]);commit(next);};row.append(unlink);section.append(row);}
 section.append(status);root.append(section);
}
