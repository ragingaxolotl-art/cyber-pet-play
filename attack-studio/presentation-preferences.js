const KEY='cyber-pet-presentation-v1';
export function presentationPreferences({storage,systemReducedMotion=false}={}){
 let value={muted:false,volume:.5,reducedMotion:!!systemReducedMotion};
 const valid=input=>input&&typeof input==='object'&&!Array.isArray(input)&&typeof input.muted==='boolean'&&typeof input.reducedMotion==='boolean'&&Number.isFinite(input.volume)&&input.volume>=0&&input.volume<=1;
 try{const saved=JSON.parse(storage?.getItem(KEY)||'null');if(valid(saved))value={muted:saved.muted,volume:saved.volume,reducedMotion:saved.reducedMotion};}catch{}
 return {get:()=>({...value}),set(next){const merged={...value,...next};if(!valid(merged))throw Error('Choose valid sound and motion preferences.');value={muted:merged.muted,volume:merged.volume,reducedMotion:merged.reducedMotion};let persisted=false;try{if(storage){storage.setItem(KEY,JSON.stringify(value));persisted=true;}}catch{}return {value:{...value},persisted};}};
}
