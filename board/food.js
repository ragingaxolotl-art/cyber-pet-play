// Mirrors Cyber Pet's rotating favorite-tag and taste reactions; never edits progress.
export function dayNumber(date=new Date()){
  return Math.floor(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/86400000)+719163;
}
export function foodScore(food,preferences={},day=dayNumber()){
  const favorites=Array.isArray(preferences.favorite_food_tags)?preferences.favorite_food_tags:[];
  const hates=Array.isArray(preferences.hated_food_tags)?preferences.hated_food_tags:[];
  const liked=favorites.length&&food.tags.includes(favorites[day%favorites.length]);
  const disliked=hates.length&&food.tags.includes(hates[day%hates.length]);
  const taste=food.taste===preferences.favorite_taste?1:food.taste===preferences.hated_taste?-1:0;
  if(liked&&!disliked)return taste===1?5:taste===0?4:2;
  if(disliked&&!liked)return taste===1?1:taste===0?-1:-2;
  return taste===1?3:taste===0?1:0;
}
export function favoriteFood(foods,preferences={},day=dayNumber()){
  if(!foods.length)return null;
  return foods.reduce((best,food)=>foodScore(food,preferences,day)>foodScore(best,preferences,day)?food:best);
}
