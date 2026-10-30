import {foodScore} from './food.js?v=illness47';
// A board-only appetite, never a saved nutrient/stat or pantry mutation.
export function advanceHydration(p,dt){
 if(!Number.isFinite(dt)||dt<=0)return;
 if(p.mode==='tag'||p.mode==='game'&&['race','follow','ball','balloon'].includes(p.playGroup?.kind)){
  p.hydrationEffort=Math.min(90,(p.hydrationEffort||0)+dt);
 }
 if(p.mode==='eat'&&p.hydrationMeal){
  p.hydrationEffort=0;p.hydrationMeal=false;
  p.speech='That was refreshing!';
 }
}
export function hydrationChoice(p,foods){
 if((p.hydrationEffort||0)<30)return null;
 const refreshing=foods.filter(f=>Number.isFinite(f.water)&&f.water>=10&&foodScore(f,p.data.foodPreferences)>0);
 if(!refreshing.length)return null;
 return refreshing.reduce((best,f)=>foodScore(f,p.data.foodPreferences)>foodScore(best,p.data.foodPreferences)?f:best);
}
