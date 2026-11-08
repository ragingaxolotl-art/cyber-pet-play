import {validateAttack} from './combat-model.js?v=20261108-persistence';
export function renderProjectileEditor({root,attack,commit,status}){
 if(attack.delivery!=='projectile'||!['damage','push'].includes(attack.payload))return;
 const section=document.createElement('fieldset'),legend=document.createElement('legend');section.className='projectile-lifetime-editor';legend.textContent='Projectile lifetime';section.append(legend);
 const label=document.createElement('label');label.textContent='After attacker interruption';const mode=document.createElement('select');mode.setAttribute('aria-label','Projectile persistence');
 for(const [value,text] of [['cast','End with the move'],['independent','Keep traveling after launch']]){const option=document.createElement('option');option.value=value;option.textContent=text;mode.append(option);}mode.value=attack.projectileLifetime===undefined?'cast':'independent';label.append(mode);section.append(label);
 const mutate=change=>{try{const next=structuredClone(attack);change(next);validateAttack(next);commit(next);}catch(error){status(error.message);}};
 mode.onchange=()=>mutate(next=>{if(mode.value==='independent'){next.projectileLifetime=120;delete next.projectileStart;}else delete next.projectileLifetime;});
 const note=document.createElement('p');note.textContent='Independent projectiles launch when startup finishes. Interruption before launch cancels them. After launch, expiry, defeat or parry removes them. Enabling this links travel start to startup. Turn persistence off before changing to a different delivery type.';section.append(note);
 if(attack.projectileLifetime!==undefined){
  const label=document.createElement('label');label.textContent='Maximum lifetime after launch (frames)';const input=document.createElement('input');input.type='number';input.min=1;input.max=600;input.step=1;input.value=attack.projectileLifetime;input.setAttribute('aria-label','Projectile lifetime frames');
  input.onchange=()=>{const value=Number(input.value);if(input.value===''||!Number.isInteger(value)||value<1||value>600){input.value=attack.projectileLifetime;status('Use a whole lifetime from 1 to 600 frames.');return;}mutate(next=>next.projectileLifetime=value);};label.append(input);section.append(label);
  const hint=document.createElement('p');hint.textContent='60 frames = 1 second. Contact timing and active duration may end the projectile sooner. Saving requires version 7 support.';section.append(hint);
 }
 root.append(section);
}
