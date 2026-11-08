import {validateAttack} from './combat-model.js?v=20261108-counter-hit';
const make=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
export function renderCounterHitEditor({root,attack,commit,status}){
 root.replaceChildren();root.append(make('h3','Counter-hit bonus'));
 root.append(make('p','Optional direct damage bonus when hitting an opponent during a selected offensive attack phase. Guard, armor and periodic status damage are excluded. Requires version 14 saving.'));
 const mutate=change=>{try{const next=structuredClone(attack);change(next);validateAttack(next);commit(next);return true;}catch(error){status(error.message);return false;}};
 if(attack.counterHit===undefined){const add=make('button','Customize counter-hit bonus');add.type='button';add.onclick=()=>mutate(next=>next.counterHit={phases:['startup','active'],damagePercent:100});root.append(add);return;}
 const label=make('label','Counter-hit damage (%)'),input=make('input');Object.assign(input,{type:'number',min:100,max:300,step:1,value:attack.counterHit.damagePercent});input.setAttribute('aria-label','Counter-hit damage percent');input.onchange=()=>{if(input.value===''||!mutate(next=>next.counterHit.damagePercent=Number(input.value))){if(input.value==='')status('Enter a whole percentage from 100 to 300.');input.value=attack.counterHit.damagePercent;}};label.append(input);root.append(label);
 for(const phase of ['startup','active','recovery']){
  const label=make('label',phase[0].toUpperCase()+phase.slice(1)),input=make('input');input.type='checkbox';input.checked=attack.counterHit.phases.includes(phase);input.setAttribute('aria-label','Counter-hit during '+phase);input.onchange=()=>{if(!mutate(next=>next.counterHit.phases=input.checked?[...next.counterHit.phases,phase]:next.counterHit.phases.filter(p=>p!==phase)))input.checked=attack.counterHit.phases.includes(phase);};label.append(input);root.append(label);
 }
 root.append(make('p','100% keeps normal damage; 150% adds half; 200% doubles it. The bonus applies before combo scaling and shields. Simultaneous contacts use the phases captured before either hit resolves. A lingering projectile does not extend its owner’s attack phase.'));
 root.append(make('p','The single-attack preview has no authored opposing attack and does not demonstrate counter-hits. Use Arena two-attack comparison. This bonus changes damage only, not hitstun or movement.'));
 const remove=make('button','Remove counter-hit bonus');remove.type='button';remove.onclick=()=>mutate(next=>delete next.counterHit);root.append(remove);
}
