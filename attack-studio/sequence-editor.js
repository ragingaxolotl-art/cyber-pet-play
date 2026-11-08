import {renderBounceEditor} from './bounce-editor.js?v=20261108-bounces';
import {renderReactionBuilder} from './behavior-sequence-editor.js?v=20261108-bounces';
import {editHitBatch,BATCH_HIT_FIELDS} from './hit-batch.js';
import {validateAttack} from './combat-model.js?v=20261108-drag-recovery';
import {attackDiagnostics} from './attack-diagnostics.js?v=20261108-absorption';
import {jugglePreset,resizeHits,validateHitSequence,REACTIONS} from './hit-sequence.js?v=20261108-bounces';
const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
export function installSequenceEditor({getAttack,commit,getSimulation,seek,getAttacks=()=>null}) {
  const root=document.getElementById('sequenceEditor');let selected=null,proposal=null;
  function mutate(update){const next=structuredClone(getAttack());update(next);if(next.hitEvents)next.active=Math.max(...next.hitEvents.map(e=>e.offset+e.duration));validateAttack(next);commit(next);render();}
  function render(){
    const a=getAttack(),scheduled=a.sequenceTiming==='cast',origin=scheduled?'startup':'contact';root.replaceChildren();
    root.append(el('h2','Hit sequence'),el('p',(scheduled?'Startup ends, then the hit windows run even if a hit misses.':'Contact starts the projectile clock.')+' Each hit has its own damage, timing and reaction. Up to ten hits.'));
    if(!a.hitEvents){
      const timed=['melee','area'].includes(a.delivery);
      const create=el('button',timed?'Create three-hit '+a.delivery+' sequence':'Create five-hit juggling projectile');create.type='button';create.disabled=!!a.hitboxGroups;if(a.hitboxGroups)create.title='Return to one hitbox before creating a contact sequence.';
      create.onclick=()=>mutate(n=>{
        const bounces=n.bounces;delete n.bounces;
        if(timed){Object.assign(n,{behaviorVersion:2,sequenceTiming:'cast',payload:'damage',status:'none',impactTrigger:'timed',coefficient:0,hitEvents:jugglePreset(3,5).map((e,i)=>({...e,offset:e.offset+(n.delivery==='area'?6:0),reaction:i===2?'knockback':'none',height:0,knockback:i===2?25:0}))});delete n.projectileMode;}
        else Object.assign(n,{behaviorVersion:2,delivery:'projectile',payload:'damage',status:'none',impactTrigger:'contact',projectileMode:'attached',hitEvents:jugglePreset(),active:21,coefficient:0});
        if(bounces){const moving=n.hitEvents.findLast(e=>!['none','suspend'].includes(e.reaction));if(moving)moving.bounces=bounces;}
      });
      if(a.bounces)root.append(el('p','Creating a sequence moves these bounce settings to its final moving hit. Undo restores the ordinary attack.'));
      root.append(create);return;
    }
    renderReactionBuilder(root,a,next=>{commit(next);render();});
    if(!scheduled){const mode=el('label','Projectile contact behavior'),select=el('select');
    select.add(new Option('Attach after first unblocked hit','attached'));select.add(new Option('Each hit must overlap the target','contact'));select.value=a.projectileMode;
    select.onchange=()=>mutate(n=>n.projectileMode=select.value);mode.append(select);root.append(mode);}
    const quick=el('div');quick.className='sequence-quick';
    const count=el('input');count.type='number';count.min=1;count.max=10;count.value=a.hitEvents.length;
    const interval=el('input');interval.type='number';interval.min=1;interval.max=25;interval.value=a.hitEvents.length>1?a.hitEvents[1].offset-a.hitEvents[0].offset:5;
    const timing=el('select');timing.add(new Option('Extend duration','extend'));timing.add(new Option('Fit original duration','fit'));
    for(const [title,input] of [['Hit count',count],['Spacing (frames)',interval],['Quick Edit timing',timing]]){const l=el('label',title);l.append(input);quick.append(l);}
    const preview=el('button','Preview Quick Edit'),apply=el('button','Apply changes'),note=el('p');apply.disabled=true;
    const invalidate=()=>{proposal=null;apply.disabled=true;note.textContent='Preview again to apply these settings.';};count.oninput=interval.oninput=timing.onchange=invalidate;
    preview.onclick=()=>{try{proposal=resizeHits(a.hitEvents,Number(count.value),Number(interval.value),timing.value);validateHitSequence({...a,hitEvents:proposal});note.textContent=`${a.hitEvents.length} → ${proposal.length} hits; final hit at ${origin} + ${proposal.at(-1).offset}. Existing retained hits keep their damage and reactions; ${Math.max(0,a.hitEvents.length-proposal.length)} hit(s) removed. Undo restores everything.`;apply.disabled=false;}catch(e){note.textContent=e.message;apply.disabled=true;}};
    apply.onclick=()=>mutate(n=>{n.hitEvents=proposal;n.active=Math.max(...proposal.map(e=>e.offset+e.duration));proposal=null;});quick.append(preview,apply,note);root.append(quick);
    if(!a.hitEvents.some(e=>e.id===selected))selected=a.hitEvents[0].id;
    const strip=el('div');strip.className='hit-timeline';strip.setAttribute('aria-label','Select a hit to inspect');
    for(const [i,event] of a.hitEvents.entries()){
      const b=el('button',`${i+1} · +${event.offset}f`);b.setAttribute('aria-pressed',String(selected===event.id));b.onclick=()=>{selected=event.id;const sim=getSimulation();seek((sim?.impactFrame??sim?.timing.startup??0)+event.offset);render();};strip.append(b);
    }root.append(strip);
    const batch=el('details'),batchSummary=el('summary','Edit several hits'),chosen=new Set();batch.append(batchSummary,el('p','Choose hits and one property. Timing and all other properties stay unchanged. One Undo restores the whole edit.'));
    for(const [i,hit] of a.hitEvents.entries()){const label=el('label','Hit '+(i+1)+' '),check=el('input');check.type='checkbox';check.setAttribute('aria-label','Batch edit Hit '+(i+1));check.onchange=()=>check.checked?chosen.add(hit.id):chosen.delete(hit.id);label.append(check);batch.append(label);}
    const property=el('select'),valueHost=el('span'),batchError=el('p'),batchApply=el('button','Apply to selected hits');let value;
    property.setAttribute('aria-label','Batch hit property');for(const [key,name] of Object.entries(BATCH_HIT_FIELDS))property.add(new Option(name,key));property.value='damage';batchError.setAttribute('role','status');batchApply.type='button';
    const showValue=()=>{valueHost.replaceChildren();const key=property.value;value=el(['reaction','target'].includes(key)?'select':'input');value.setAttribute('aria-label','Batch hit value');if(key==='reaction'||key==='target'){for(const choice of key==='reaction'?REACTIONS:['any','grounded','airborne'])value.add(new Option(choice,choice));}else{value.type='number';value.step=key==='damage'?'any':'1';}value.value=String(a.hitEvents[0][key]);valueHost.append(value);};
    property.onchange=showValue;showValue();
    batchApply.onclick=()=>{try{if(value.value==='')throw Error('Enter a value before applying.');const key=property.value,next=editHitBatch(getAttack(),[...chosen],key,['reaction','target'].includes(key)?value.value:Number(value.value));commit(next);render();}catch(e){batchError.textContent=e.message;}};
    batch.append(property,valueHost,batchApply,batchError);root.append(batch);
    const event=a.hitEvents.find(e=>e.id===selected),fields=el('div');fields.className='fields';
    const error=el('p');error.setAttribute('role','status');
    for(const [key,title,min,max] of [['offset',scheduled?'Frames after startup':'Frames after contact',0,299],['duration','Contact window (frames)',1,60],['damage','Damage for this hit',0,500],['height','Launch height (px)',0,150],['knockback','Knockback (px)',0,150],['frames','Reaction travel (frames)',1,120],['hold','Suspend time (frames)',1,30]]){
      const l=el('label',title),input=el('input');input.type='number';input.min=min;input.max=max;input.value=event[key];input.disabled=!scheduled&&key==='offset'&&event===a.hitEvents[0];
      input.onchange=()=>{try{if(!input.checkValidity()||input.value==='')throw Error('Enter a value in the displayed range.');mutate(n=>n.hitEvents.find(e=>e.id===selected)[key]=Number(input.value));}catch(e){error.textContent=e.message;input.value=event[key];}};l.append(input);fields.append(l);
    }
    for(const [key,title,choices] of [['reaction','Reaction',REACTIONS],['target','Eligible target',['any','grounded','airborne']]]){
      const l=el('label',title),input=el('select');for(const choice of choices)input.add(new Option(choice,choice));input.value=event[key];input.onchange=()=>{try{mutate(n=>n.hitEvents.find(e=>e.id===selected)[key]=input.value);}catch(e){error.textContent=e.message;input.value=event[key];}};l.append(input);fields.append(l);
    }
    if(a.hitboxGroups){const label=el('label','Hitbox group for this hit'),select=el('select');select.setAttribute('aria-label','Hitbox group for this hit');a.hitboxGroups.forEach((g,i)=>select.add(new Option('Group '+(i+1),g.id)));select.value=event.hitboxGroup;select.onchange=()=>{try{mutate(n=>n.hitEvents.find(e=>e.id===selected).hitboxGroup=select.value);}catch(e){error.textContent=e.message;select.value=event.hitboxGroup;}};label.append(select);fields.append(label);}
    const stunLabel=el('label','Hitstun override (frames; blank uses reaction timing)'),stunInput=el('input');Object.assign(stunInput,{type:'number',min:0,max:120,step:1,value:event.hitstun??''});stunInput.setAttribute('aria-label','Selected hit hitstun frames');
    stunInput.onchange=()=>{try{mutate(n=>{const hit=n.hitEvents.find(e=>e.id===selected);if(stunInput.value==='')delete hit.hitstun;else hit.hitstun=Number(stunInput.value);});}catch(e){error.textContent=e.message;stunInput.value=event.hitstun??'';}};stunLabel.append(stunInput);fields.append(stunLabel);
    fields.append(el('p','Blank preserves reaction-based hitstun; zero adds no hitstun. Movement or suspension can still lock the target. Explicit values require version 15.'));
    root.append(el('h3','Selected hit '+(a.hitEvents.indexOf(event)+1)),fields,error);
    const bounce=el('section');root.append(bounce);renderBounceEditor({root:bounce,attack:a,eventId:event.id,commit:next=>{commit(next);render();},status:message=>error.textContent=message});
    const legacy=el('button','Return to ordinary '+a.delivery);legacy.onclick=()=>mutate(n=>{delete n.hitEvents;delete n.sequenceTiming;delete n.behaviorVersion;delete n.projectileMode;if(n.hitboxGroups)n.impactTrigger='timed';});root.append(legacy);
  }
  function results(){const output=document.getElementById('hitResults');output.replaceChildren();const sim=getSimulation();if(!sim)return;
    const summary=el('strong',`${sim.frames.at(-1).hits} contact(s) · ${sim.cost} energy · impact ${sim.impactFrame===null?'not reached':sim.impactFrame+'f'}`);output.append(summary);
    if(sim.combos?.length){const combo=sim.combos.find(c=>c.attacker==='self');if(combo)output.append(el('p',`Outgoing damage chain: up to ${combo.bestHits} hit(s); maximum chain HP damage ${combo.bestDamage}. Guard contacts are excluded. This single-attack preview does not test a follow-up attack; use Arena comparison for cross-attack combos.`));}
    if(sim.hitResults){const table=el('table');const head=el('tr');for(const title of ['Hit','Expected','Actual','Result'])head.append(el('th',title));table.append(head);
      sim.hitResults.forEach((r,i)=>{const row=el('tr');for(const value of [i+1,(getAttack().sequenceTiming==='cast'?'startup + ':'contact + ')+r.offset,r.frame??'—',r.result+(r.reason?' · '+r.reason:'')])row.append(el('td',String(value)));table.append(row);});output.append(table);
    }else{const p=el('p',sim.events.at(-1)?.text||'Run a test to see the result.');output.append(p);}
    const diagnostics=el('section');diagnostics.setAttribute('aria-label','Attack compatibility and test checks');diagnostics.append(el('h3','Compatibility & test checks'));
    const list=el('ul');for(const finding of attackDiagnostics(getAttack(),sim,getAttacks())){const item=el('li');item.dataset.diagnostic=finding.code;item.append(el('strong',finding.level==='warning'?'Check: ':'Note: '),el('span',finding.message+' '+finding.action));list.append(item);}diagnostics.append(list);output.append(diagnostics);
  }
  render();return {render,results};
}
