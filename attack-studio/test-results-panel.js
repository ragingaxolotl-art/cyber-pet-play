import {attackDiagnostics} from './attack-diagnostics.js?v=20261110-library-management';
import {hitInspection,diagnosticDestination} from './result-navigation.js?v=20261110-library-management';
const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
export function renderTestResults({root,attack,simulation:sim,attacks,seek,editHit,inspectBox,reveal}){
 root.replaceChildren();if(!sim)return;
 const clock=!sim.cast?'attack did not start':attack.sequenceTiming==='cast'||attack.impactTrigger!=='contact'?`active from ${sim.timing.startup}f`:sim.impactFrame===null?'contact not reached':`contact clock starts ${sim.impactFrame}f`;
 const summary=el('strong',`${sim.frames.at(-1).hits} contact(s)${sim.frames.at(-1).areaHits?` · ${sim.frames.at(-1).areaHits} area hit(s)`:''} · ${sim.cost} energy${sim.cast?'':' required'} · ${clock}`);root.append(summary);
 if(sim.combos?.length){const combo=sim.combos.find(c=>c.attacker==='self');if(combo)root.append(el('p',`Outgoing damage chain: up to ${combo.bestHits} hit(s); maximum chain HP damage ${combo.bestDamage}. Guard contacts are excluded. This single-attack preview does not test a follow-up attack; use Arena comparison for cross-attack combos.`));}
 const button=(host,text,run)=>{const b=el('button',text);b.type='button';b.onclick=run;host.append(b);return b;};
 if(sim.hitResults?.length){const list=el('ol');list.className='hit-result-list';list.setAttribute('aria-label','Hit-by-hit test results');
  sim.hitResults.forEach((result,index)=>{const item=hitInspection(attack,sim,result,index),row=el('li');row.dataset.hitResult=result.id;row.append(el('strong',`Hit ${item.number}${item.projectileId!=null?' · projectile '+item.projectileId:''} — ${sim.cast?result.result:'Not run'}`),el('p',`Window: ${item.expected} · ${attack.sequenceTiming==='cast'?'startup':'contact'} + ${result.offset}f · Actual contact: ${item.actual===null?'none recorded':item.actual+'f'}`));
   if(!sim.cast)row.append(el('p','The attack did not start. Check the test fighter’s energy.'));else if(result.reason)row.append(el('p',result.reason));if(item.evidence)row.append(el('p',item.evidence));
   const actions=el('div');actions.className='result-actions';button(actions,item.frameLabel,()=>seek(item.frame));if(item.eventId)button(actions,'Edit hit '+item.number,()=>editHit(item.eventId));button(actions,'Inspect collision',()=>inspectBox(item.boxId,item.frame));row.append(actions);list.append(row);
  });root.append(list);
 }
 const findings=attackDiagnostics(attack,sim,attacks),warnings=findings.filter(f=>f.level==='warning'),notes=findings.filter(f=>f.level!=='warning');
 const diagnostics=el('section');diagnostics.setAttribute('aria-label','Attack compatibility and test checks');diagnostics.append(el('h3',`Problems to check · ${warnings.length}`));
 function findingList(items){const list=el('ul');for(const finding of items){const item=el('li');item.dataset.diagnostic=finding.code;item.append(el('strong',finding.level==='warning'?'Check: ':'Note: '),el('span',finding.message),el('p',finding.action));const destination=diagnosticDestination(finding.code);button(item,destination.label,()=>reveal(destination.panel));list.append(item);}return list;}
 if(warnings.length)diagnostics.append(findingList(warnings));else diagnostics.append(el('p','No warnings in these checks. Use Arena comparison to test interactions with another attack.'));
 if(notes.length){const details=el('details');details.append(el('summary',`Combat rules & compatibility · ${notes.length}`),findingList(notes));diagnostics.append(details);}root.append(diagnostics);
 const log=el('details');log.className='test-contact-log';log.append(el('summary',`Contact & reaction log · ${sim.events.length}`));const entries=el('ol');
 for(const event of sim.events){const row=el('li');button(row,`${event.frame}f · ${event.text}`,()=>seek(event.frame));entries.append(row);}if(!sim.events.length)entries.append(el('li','No events recorded.'));log.append(entries);root.append(log);
}
