import {renderConditionalReactions} from './conditional-reaction-editor.js?v=20261110-library-management';
import {renderImpulseEditor} from './impulse-editor.js';
import {renderReactionTemplates} from './reaction-template-editor.js?v=20261110-suspension-recovery';
import {buildReactionSequence,reactionBlockSettings,REACTION_BLOCKS} from './behavior-sequence.js?v=20261110-suspension-recovery';
const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
export function renderReactionBuilder(root,attack,commit){
 const panel=el('details'),summary=el('summary','Build a reaction sequence');panel.append(summary,el('p','Arrange reaction blocks, preview, then replace the current hits. Each repeat makes one editable hit. Artwork and other attack settings stay unchanged. With grouped hitboxes, new hits use the first hit’s group; review contact in the test results.'));
 let blocks=[{type:'launch',repeat:1,damage:6},{type:'suspend',repeat:3,damage:3},{type:'knockback',repeat:1,damage:12}],proposal=null;
 const rows=el('div'),spacing=el('input'),label=el('label','Frames between generated hits '),add=el('button','Add reaction block'),preview=el('button','Preview reaction sequence'),apply=el('button','Replace hits with preview'),result=el('p');
 spacing.type='number';spacing.min=1;spacing.max=25;spacing.value=5;spacing.setAttribute('aria-label','Reaction block spacing');label.append(spacing);result.setAttribute('role','status');add.type=preview.type=apply.type='button';apply.disabled=true;
 const invalidate=()=>{proposal=null;apply.disabled=true;result.textContent='Preview the changed blocks before applying.';};spacing.oninput=invalidate;
 function renderRows(){rows.replaceChildren();blocks.forEach((block,index)=>{
  const row=el('fieldset'),type=el('select'),repeat=el('input'),damage=el('input');
  row.append(el('legend','Reaction block '+(index+1)));
  type.setAttribute('aria-label','Reaction block '+(index+1));for(const name of REACTION_BLOCKS)type.add(new Option(name,name));type.value=block.type;
  repeat.type='number';repeat.min=1;repeat.max=10;repeat.value=block.repeat;repeat.setAttribute('aria-label','Block '+(index+1)+' repeats');
  damage.type='number';damage.min=0;damage.max=500;damage.step='any';damage.value=block.damage;damage.setAttribute('aria-label','Block '+(index+1)+' damage');
  type.onchange=()=>{block.type=type.value;invalidate();renderRows();};repeat.oninput=()=>{block.repeat=repeat.value===''?NaN:Number(repeat.value);invalidate();};damage.oninput=()=>{block.damage=damage.value===''?NaN:Number(damage.value);invalidate();};
  row.append(el('span','Block '+(index+1)+' '),type,el('span',' repeats '),repeat,el('span',' damage '),damage);
  for(const [name,direction] of [['Move block up',-1],['Move block down',1]]){const button=el('button',name);button.type='button';button.setAttribute('aria-label',name+' '+(index+1));button.disabled=index+direction<0||index+direction>=blocks.length;button.onclick=()=>{[blocks[index],blocks[index+direction]]=[blocks[index+direction],blocks[index]];invalidate();renderRows();};row.append(button);}
  const remove=el('button','Remove block');remove.type='button';remove.setAttribute('aria-label','Remove block '+(index+1));remove.onclick=()=>{blocks.splice(index,1);invalidate();renderRows();};row.append(remove);rows.append(row);renderImpulseEditor({root:row,event:{reaction:block.type==='hit'?'none':block.type,...(block.impulse?{impulse:block.impulse}:{})},label:'Block '+(index+1),status:text=>{result.textContent=text;},commit:next=>{if(next.impulse)block.impulse=next.impulse;else delete block.impulse;invalidate();renderRows();}});
  renderConditionalReactions({root:row,event:reactionBlockSettings(block,Number(spacing.value)),status:text=>{result.textContent=text;},commit:next=>{if(next.reactionAlternatives)block.reactionAlternatives=next.reactionAlternatives;else delete block.reactionAlternatives;invalidate();renderRows();}});
 });add.disabled=blocks.length>=10;}
 add.onclick=()=>{blocks.push({type:'hit',repeat:1,damage:3});invalidate();renderRows();};
 preview.onclick=()=>{try{proposal=buildReactionSequence(attack,blocks,{interval:Number(spacing.value)});result.textContent=`Replace ${attack.hitEvents.length} hits with ${proposal.hitEvents.length}: ${blocks.map(b=>b.type+' ×'+b.repeat).join(' → ')}. Total authored damage ${proposal.hitEvents.reduce((n,h)=>n+h.damage,0)}. Last hit at ${attack.sequenceTiming==='cast'?'startup':'contact'} + ${proposal.hitEvents.at(-1).offset}. Actual connections depend on collisions. Undo restores the previous hits.`;apply.disabled=false;}catch(error){proposal=null;apply.disabled=true;result.textContent=error.message;}};
 apply.onclick=()=>{if(proposal)commit(proposal);};renderRows();panel.append(rows,add,label,preview,apply,result);root.append(panel);
 renderReactionTemplates(panel,{getRecipe:()=>({interval:Number(spacing.value),blocks:structuredClone(blocks)}),loadRecipe:recipe=>{blocks=structuredClone(recipe.blocks);spacing.value=recipe.interval;invalidate();renderRows();}});
}
