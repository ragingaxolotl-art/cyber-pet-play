import {validateAttack} from './combat-model.js?v=20261108-area-final';
import {scaledHitstun} from './hitstun-scaling.js?v=20261108-hitstun';
const make=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
export function renderHitstunEditor({root,attack,commit,status}){
 root.replaceChildren();root.append(make('h3','Hitstun deterioration'),make('p','Optionally shorten this attack’s hitstun after earlier uninterrupted hits. Counts span attacks and reset when the defender regains control. Requires version 15 saving.'));
 const mutate=fn=>{try{const next=structuredClone(attack);fn(next);validateAttack(next);commit(next);return true;}catch(e){status(e.message);return false;}};
 if(attack.hitstunScaling===undefined){const b=make('button','Customize hitstun deterioration');b.type='button';b.onclick=()=>mutate(n=>n.hitstunScaling={step:0,minimum:0});root.append(b);return;}
 for(const [key,title] of [['step','Hitstun reduction per prior hit'],['minimum','Minimum hitstun']]){
  const l=make('label',title+' (frames)'),input=make('input');Object.assign(input,{type:'number',min:0,max:120,step:1,value:attack.hitstunScaling[key]});input.setAttribute('aria-label',title+' frames');input.onchange=()=>{if(input.value===''||!mutate(n=>n.hitstunScaling[key]=Number(input.value))){if(input.value==='')status('Enter whole frames from 0 to 120.');input.value=attack.hitstunScaling[key];}};l.append(input);root.append(l);
 }
 const e=attack.hitEvents?.[0],base=e?(e.hitstun??(e.reaction==='none'?0:e.reaction==='suspend'?e.hold:e.frames)):attack.hitstun;
 root.append(make('p',`Using ${base} authored hitstun frames${e?' from the first event':''}, the first four hitstun durations are: `+[0,1,2,3].map(h=>scaledHitstun(base,h,attack.hitstunScaling)+'f').join(', ')+'. A shorter authored duration is never increased.'));
 root.append(make('p','Motion, suspension, knockdown and status stun can keep the target locked after hitstun ends. This setting does not shorten those requirements. Guard, armor, push and support reactions are excluded. Zero reduction keeps existing hitstun. Test escape gaps in Arena comparison.'));
 const b=make('button','Remove hitstun deterioration');b.type='button';b.onclick=()=>mutate(n=>delete n.hitstunScaling);root.append(b);
}
