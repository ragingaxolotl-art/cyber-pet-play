// Shared state across the board modules; no credentials or saved gameplay data.
export const controls={revision:0,settings:{weather:true,unicorn:true,diseases:true,emotes:'both'},characters:{},selection:[],commands:[]};
export const keyOf=p=>p.data.boardId||p.data.id;
export const weatherOverride={until:0,rain:false};
export function controlledWeather(time,normal){return time<weatherOverride.until?{...normal,rain:weatherOverride.rain}:controls.settings.weather?normal:{...normal,rain:false};}
export function setControls(data){if(!data||!Number.isSafeInteger(data.revision)||data.revision<controls.revision)return false;Object.assign(controls,data);return true;}
export function adjustedMetrics(data,base,height){const l=controls.characters[data.boardId||data.id];if(!l)return base;const scale=Math.max(.5,Math.min(2.5,l.scale));return {...base,scale:base.scale*scale,desired:base.desired*scale,offsetY:base.offsetY+l.offset*height/720};}
