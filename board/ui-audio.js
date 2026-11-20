// Shared, opt-in feedback for classroom/editor pages. Ambient activity stays silent.
export const CUES = new Set(['ui_select','ui_back','ui_item_place','ui_unlock','save_success','ui_operation_error']);
export function createFeedback({playerFactory=()=>new Audio(),storage=null,clock=()=>Date.now(),base=new URL('./sounds/',import.meta.url)}={}) {
  let player=null,enabled=false,volume=.3,last=-10000,lastCue='',active=true;
  try { const data=JSON.parse(storage?.getItem('cyber-pet-ui-audio-v1')||'{}');enabled=data.enabled===true;if(Number.isFinite(data.volume))volume=Math.max(0,Math.min(1,data.volume)); } catch {}
  const stop=()=>{if(player){player.pause();player.currentTime=0;}};
  const save=()=>{try{storage?.setItem('cyber-pet-ui-audio-v1',JSON.stringify({enabled,volume}));}catch{}};
  return {
    get enabled(){return enabled;}, get volume(){return volume;}, stop,
    setEnabled(value){enabled=!!value;stop();save();},
    setVolume(value){volume=Number.isFinite(value)?Math.max(0,Math.min(1,value)):0;stop();save();},
    setActive(value){active=!!value;if(!active)stop();},
    play(cue){
      if(!active||!enabled||!volume||!CUES.has(cue))return false;
      if(clock()-last<100&&(cue===lastCue||cue==='ui_select'||cue==='ui_back'))return false;
      last=clock();lastCue=cue;player ||= playerFactory();stop();player.volume=volume;
      player.src=new URL(cue+'.mp3',base).href;player.play()?.catch(()=>{});return true;
    }
  };
}
let active=null;
export function feedback(cue){return active?.play(cue)||false;}
export function installFeedback(host=document.querySelector('header')||document.body) {
  if(active)return active;
  let storage=null;try{storage=window.localStorage;}catch{}
  active=createFeedback({storage});
  const box=document.createElement('span'),button=document.createElement('button'),volume=document.createElement('input');
  box.dataset.soundControl='true';box.style.cssText='display:inline-flex;align-items:center;gap:8px;margin:8px';
  button.type='button';const refresh=()=>{button.textContent=active.enabled?'UI sounds: on':'UI sounds: off';button.setAttribute('aria-pressed',String(active.enabled));};
  button.onclick=()=>{active.setEnabled(!active.enabled);refresh();feedback('ui_select');};
  volume.type='range';volume.min='0';volume.max='100';volume.step='5';volume.value=String(active.volume*100);volume.style.width='90px';volume.setAttribute('aria-label','UI sound volume');
  volume.oninput=()=>active.setVolume(Number(volume.value)/100);
  box.append(button,volume);host.append(box);refresh();
  document.addEventListener('click',event=>{
    const target=event.target.closest('button');
    if(!event.isTrusted||!target||target.disabled||target.closest('[data-sound-control]')||target.dataset.soundSilent)return;
    feedback(target.classList.contains('close')||target.id.toLowerCase().startsWith('close')?'ui_back':'ui_select');
  });
  window.addEventListener('blur',()=>active.setActive(false));
  window.addEventListener('focus',()=>active.setActive(!document.hidden));
  document.addEventListener('visibilitychange',()=>active.setActive(!document.hidden&&document.hasFocus()));
  return active;
}
