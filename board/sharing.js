import {trait,expression,love,travelSpeed,traitFeeling,willing} from './profile.js?v=29';
import {foodScore} from './food.js?v=29';
// One carried item and directional friendships belong only to this board session.
export function chooseItem(pet,foods,random=pet.random){
  if(!foods.length)return null;
  const ranked=foods.map(food=>({food,score:foodScore(food,pet.data.foodPreferences)})).sort((a,b)=>b.score-a.score);
  const best=ranked[0].score;
  const choices=ranked.filter(row=>row.score>=best-(trait(pet,'curiosity')>.65?1:0));
  return choices[Math.min(choices.length-1,Math.floor(random()*choices.length))].food;
}
export function collectItem(pet){
  if(pet.heldItem||!pet.data.food)return false;
  const known=[...(pet.knownFavorites?.entries()||[])];
  const gift=known.length&&pet.random()<expression(pet).giving*(.2+love(pet)*.8)?known[Math.floor(pet.random()*known.length)]:null;
  pet.heldItem=gift?gift[1]:pet.data.food;pet.giftFor=gift?gift[0]:null;pet.heldTime=0;return true;
}
export function friendship(pet,other){return pet.friendships?.get(other.data.id)??50;}
export const itemScore=(item,pet)=>item?.type==='toy'?.5+2*trait(pet,'activity_level')+1.5*trait(pet,'curiosity'):foodScore(item,pet.data.foodPreferences);
export function shareItem(giver,recipient){
  if(!giver.heldItem||recipient.heldItem||giver.shareCooldown>0||recipient.shareCooldown>0)return null;
  const item=giver.heldItem,score=itemScore(item,recipient);
  // Zero includes a hated taste with no stronger favorite-tag match.
  const reaction=score<=0?'disliked':score>=3?'liked':'neutral';
  const change=reaction==='disliked'?-3:reaction==='liked'?4:1;
  recipient.friendships??=new Map();recipient.friendships.set(giver.data.id,Math.max(0,Math.min(100,friendship(recipient,giver)+change)));
  giver.shareCooldown=recipient.shareCooldown=60;
  giver.emote=traitFeeling(giver,'generosity');
  recipient.emote=recipient.socialReply=reaction==='disliked'?(love(recipient)>.5?'thinking':'frustrated'):'hearts';
  if(reaction!=='disliked'){recipient.heldItem=item;recipient.heldTime=0;giver.heldItem=null;}
  return {reaction,change,item};
}
export function trySharing(a,b){
  for(const [giver,recipient] of [[a,b],[b,a]]){
    if(giver.heldItem&&!recipient.heldItem&&giver.shareCooldown<=0&&recipient.shareCooldown<=0&&giver.random()<.15+.7*trait(giver,'generosity'))return shareItem(giver,recipient);
  }
  return null;
}
