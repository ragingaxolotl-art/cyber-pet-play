// Only free pets accept invitations. Outcomes get a short visible recovery window.
export const freeForActivity=p=>!p.stair&&!p.socialGroup&&!p.playGroup&&!p.toyPlay&&['idle','walk'].includes(p.mode)&&!(p.decisionCooldown>0)&&!(p.foodReactionTime>0);
export function preserveRecovery(pets,before){for(const p of pets)if(before.get(p)!==p.mode&&['idle','walk'].includes(p.mode)&&!['idle','walk'].includes(before.get(p)))p.decisionCooldown=Math.max(p.decisionCooldown||0,2);}
