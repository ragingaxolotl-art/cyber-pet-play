// Love changes the expression of an axis, never its direction or inherent worth.
// Saved fields are read-only. Missing older fields use a neutral midpoint.
const clamp=(n,lo=0,hi=1)=>Math.max(lo,Math.min(hi,n));
export const trait=(p,key)=>Number.isFinite(p.data.personality?.[key])?clamp(p.data.personality[key]/100):.5;
export const love=p=>Number.isFinite(p.data.love)?clamp(p.data.love/100):.5;
export function expression(p){
 const l=love(p),s=trait(p,'sociability'),c=trait(p,'curiosity'),b=trait(p,'bravery'),g=trait(p,'generosity'),a=trait(p,'activity_level'),assertive=trait(p,'assertiveness');
 return {care:l,withdrawal:(1-s)*(1-l),intrusion:s*(1-l),routine:(1-c),reckless:b*(1-l),caution:1-b,
   cooperation:.12+.6*l+.18*(1-assertive),insistence:assertive*(1-l),
   giving:g*(.7+.3*l),help:.15+.65*l+.2*g,
   restlessness:a*(1-l),rest:(1-a)*(.5+.5*l),inertia:(1-a)*(1-l)};
}
// Skill levels are 0..99 in Godot. Speed affects every kind of travel.
export function travelSpeed(p){
 const level=Number.isFinite(p.data.speed)?clamp(p.data.speed,0,99):25;
 const activity=trait(p,'activity_level'),l=love(p);
 return .018*(.55+level/99*1.9)*(.7+activity*.6)*(1+(1-l)*(activity-.5)*.25);
}
export function willing(p,leader){
 const s=trait(p,'sociability'),l=love(p),a=trait(p,'assertiveness');
 // Secure solitary pets can decline peacefully; insecure accommodating pets can overcommit.
 return p.random()<clamp(.18+s*.6+l*.12+(1-l)*(1-a)*.12);
}
export function traitFeeling(p,key){
 const high=trait(p,key)>=.5,secure=love(p)>=.5;
 const pairs={sociability:secure?['thinking','hearts']:['silence','question'],curiosity:secure?['ok','question']:['frustrated','eager'],bravery:secure?['thinking','eager']:['sweat','frustrated'],generosity:secure?['ok','hearts']:['frustrated','sweat'],assertiveness:secure?['hearts','ok']:['sweat','frustrated'],activity_level:secure?['sleepy','laughing']:['silence','eager']};
 return (pairs[key]||['thinking','cute'])[high?1:0];
}
export function isClassPet(data){return !data.isSample&&!/\b(?:test[\s_-]*(?:char(?:acter)?s?|pets?)|demo[\s_-]*(?:characters?|pets?)|anonymous[\s_-]*fixture)\b/i.test(data.name||'');}

// Enjoying mud is a preference, not a bad trait. Love moderates fussiness/neglect.
export const mudEnjoyment=p=>.4*trait(p,'activity_level')+.35*trait(p,'curiosity')+.25*trait(p,'bravery');
export function washThreshold(p){const tidy=1-mudEnjoyment(p);return .18+.6*tidy+.12*(1-love(p))*(2*tidy-1);}
export function wantsRainShelter(p,cycle){
 if(p.rainWishCycle!==cycle){p.rainWishCycle=cycle;p.rainWantsShelter=p.random()<.2+.8*(1-mudEnjoyment(p));}
 return p.rainWantsShelter;
}
export function shelterHelpChance(p){return .1+.5*love(p)+.25*trait(p,'generosity')+.15*trait(p,'sociability');}
