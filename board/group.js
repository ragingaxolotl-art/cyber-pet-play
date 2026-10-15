export function randomLike(foods,random=Math.random){return foods.length?foods[Math.min(foods.length-1,Math.floor(random()*foods.length))]:null;}

// Preserve the same companion objects so polling keeps their likes, positions and games.
export function withCompanions(classPets,companions){return [...classPets.filter(p=>!p.isSample),...companions.slice(0,5)];}
