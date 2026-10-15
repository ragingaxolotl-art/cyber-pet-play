export function randomLike(foods,random=Math.random){return foods.length?foods[Math.min(foods.length-1,Math.floor(random()*foods.length))]:null;}
