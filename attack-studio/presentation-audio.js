import {SOUND_PRESETS} from './presentation-events.js?v=20261109-presentation-release';
// Small synthesized presets avoid external media requests and keep exports portable.
const voices={impact:{type:'triangle',from:180,to:45},whoosh:{type:'sine',from:700,to:100},zap:{type:'sawtooth',from:950,to:120},chime:{type:'sine',from:660,to:880}};
export function createPresentationAudio({createContext=()=>new (globalThis.AudioContext||globalThis.webkitAudioContext)()}={}){
 let context=null,enabled=false,muted=false,volume=.5;
 const active=new Set();
 const stop=(owner)=>{for(const voice of [...active]){if(owner!==undefined&&voice.owner!==owner)continue;try{voice.oscillator.stop();}catch{}voice.oscillator.disconnect();voice.gain.disconnect();active.delete(voice);}};
 return {
  // Invoke from a click/key handler, never from animation playback initialization.
  async enable(){try{context??=createContext();await context.resume();enabled=context.state==='running';return enabled;}catch{enabled=false;return false;}},
  preferences(next){if(typeof next.muted==='boolean')muted=next.muted;if(Number.isFinite(next.volume))volume=Math.max(0,Math.min(1,next.volume));if(muted||volume===0)stop();},
  play(event,owner){
   if(!enabled||muted||volume===0||context.state!=='running'||!SOUND_PRESETS.includes(event.preset)||!Number.isFinite(event.volume)||event.volume<0||event.volume>1)return false;
   const frames=event.remainingFrames??event.duration;if(!Number.isFinite(frames)||frames<=0||frames>60||event.volume===0)return false;
   if(active.size>=8)return false;
   const preset=voices[event.preset],now=context.currentTime,duration=frames/60,oscillator=context.createOscillator(),gain=context.createGain(),voice={oscillator,gain,owner};
   oscillator.type=preset.type;oscillator.frequency.setValueAtTime(preset.from,now);oscillator.frequency.exponentialRampToValueAtTime(preset.to,now+duration);
   // Short attack and decay avoid clicks. Headroom limits stacked classroom sounds.
   gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(event.volume*volume*.08,now+Math.min(.008,duration/3));gain.gain.linearRampToValueAtTime(0,now+duration);
   oscillator.connect(gain);gain.connect(context.destination);active.add(voice);
   oscillator.onended=()=>{active.delete(voice);oscillator.disconnect();gain.disconnect();};oscillator.start(now);oscillator.stop(now+duration+.01);return true;
  },
  stop,
  async close(){stop();enabled=false;if(context){await context.close();context=null;}},
  get activeVoices(){return active.size;}
 };
}
