// Shared 60 Hz status timing. Beneficial effects are not shortened by resistance.
export function statusDuration(attack, resistance=1) {
 const harmful=['burn','poison','slow','weaken','stun'].includes(attack.status);
 return Math.max(1,Math.round(attack.statusDuration*(harmful?resistance:1)));
}
// Refresh duration and power without postponing an already scheduled tick.
export function refreshStatus(previous, attack, frame, resistance=1) {
 return {type:attack.status,power:attack.statusPower,interval:attack.statusInterval,
  next:previous?.next??frame+attack.statusInterval,
  until:frame+statusDuration(attack,resistance)};
}
export function statusTickDue(status,frame) {
 return frame>=status.next&&frame<=status.until;
}

// Different speed effects multiply; repeated copies use the strongest percentage.
export function statusMultiplier(statuses, kind) {
 const power=Math.max(0,...statuses.filter(s=>(s.type??s.kind)===kind).map(s=>Math.max(0,Math.min(100,s.power))));
 return kind==='haste'?1+power/100:1-power/100;
}
export function movementMultiplier(statuses) {
 return statusMultiplier(statuses,'slow')*statusMultiplier(statuses,'haste');
}
