// Board-supported student slots. Combat-only poses stay reserved for the game's battles.
export const aliases={idle:['idle_front','idle','idle_side','idle_back'],walking:['walking_side','walking','walking_front','walking_back'],eat:['eat_side','eat'],sleeping:['sleeping_side','sleeping'],jump:['jump_side','jump'],happy:['happy_front','happy'],sad:['sad_front','sad'],tired:['tired_front','tired']};
export const boardActions=[...new Set([...Object.values(aliases).flat(),'sad_idle','sad_walking',...['happy','sad','angry'].flatMap(m=>['idle','walking'].flatMap(a=>['front','side','back'].map(d=>`${m}_${a}_${d}`))),...['a','b','c','d','e'].map(x=>`dance_${x}_front`),'victory_front','wave_side','look_around_front','talk_side','listen_side','laugh_side','sit_side','surprised_front','confused_front','shy_side','refuse_side','offer_side','receive_side','running_front','running_side','running_back','play_side'] )];
export const hasFrames=(data,action)=>Array.isArray(data.config?.animations?.[action])&&data.config.animations[action].length>0&&data.config.animations[action].every(name=>data.images?.has(name));
export const resolveAction=(data,action)=>(aliases[action]||[action]).find(key=>hasFrames(data,key));
export const positiveFeelings=new Set(['hearts','love','cute','laughing','eager','ok']);
const negativeFeelings=new Set(['crying','frustrated']);
const critical=p=>p.foodReactionTime>0||p.mode==='gesture'||p.mode==='social'||p.mode==='startle';
export function visibleFeeling(p){
 if(p.emoteTime>0&&critical(p))return p.emote;
 if(p.sparkleTime>0&&!['eat','snack','counterQueue','counterLeave','seekFood','seekWash','wash','build'].includes(p.mode))return 'hearts';
 return p.emoteTime>0?p.emote:'';
}
function verticalTravel(p){
 if(p.stair)return Math.sign(p.stair.target-p.stair.source);
 const r=p.foodTrip||p.washTrip||p.socialGroup?.routes?.find(r=>r.pet===p);
 return r?.points?.[r.segment+1]?Math.sign(r.points[r.segment+1].level-r.points[r.segment].level):0;
}
export function petIsMoving(p){
 if(p.counterMoving)return true;
 if(['toyPlay','game','build'].includes(p.mode))return !!p.gameMoving;
 if(['seekFood','seekToy','walk','wash','seekWash','tag','together','escort'].includes(p.mode))return true;
 return ['shelter','shelterWait','puddle','watch','explore','celebrate','quiet','startle'].includes(p.mode)&&Math.abs((p.worldTarget??p.x)-p.x)>.002;
}
export function selectPetAction(p){
 const data=p.data,choose=(...keys)=>keys.flatMap(k=>aliases[k]||[k]).find(k=>hasFrames(data,k)),feeling=visibleFeeling(p);
 const lowMood=(data.stats?.happiness??50)<=35&&!(p.comfortTime>0),mood=negativeFeelings.has(feeling)?(feeling==='frustrated'&&(data.love??50)<50?'angry':'sad'):positiveFeelings.has(feeling)?'happy':lowMood?((data.love??50)<35&&(data.personality?.assertiveness??50)>65?'angry':'sad'):null;
 const restDirection=['front','side','back'][((p.animationVariant||0)+(p.idleVisits||0))%3];
 const posture=mode=>mood?[`${mood}_${mode}_side`,`${mood}_${mode}_front`,`${mood}_${mode}_back`,...(mood==='sad'?[mode==='walking'?'sad_walking':'sad_idle']:[])]:[];
 if(['eat','snack'].includes(p.mode)&&!p.awaitingCounter)return choose('eat','idle');
 if(petIsMoving(p)&&resolveAction(data,'walking')){
  const vertical=verticalTravel(p),direction=vertical>0?'back':vertical<0?'front':'side';
  const run=p.mode==='tag'||p.playGroup?.kind==='race'||['seekFood','seekWash'].includes(p.mode)&&(data.personality?.activity_level??50)>75;
  return choose(...(run?[`running_${direction}`,'running_side']:[]),...(mood?[`${mood}_walking_${direction}`]:[]),`walking_${direction}`,...posture('walking'),'walking','idle');
 }
 const g=p.socialGroup;
 if(p.mode==='gesture'&&g){
  const first=g.players[0]===p;
  if(g.kind==='offer')return choose(first?'offer_side':g.time<2?'listen_side':p.offerReaction==='disliked'?'refuse_side':'receive_side',...posture('idle'),'idle');
  if(g.kind==='comfort')return choose(first?'talk_side':g.resolved?'happy':'sad',...posture('idle'),'idle');
  if(g.kind==='learn')return choose((Math.floor(g.time/2)+(first?0:1))%2?'listen_side':'talk_side',...posture('idle'),'idle');
 }
 if(p.mode==='social')return choose((Math.floor(p.clock/2)+(p.socialTurn||0))%2?'listen_side':feeling==='laughing'?'laugh_side':'talk_side',...posture('idle'),'idle');
 if(p.mode==='counterLeave'&&p.counterReceiveTime>0)return choose('receive_side',...posture('idle'),'idle');
 if(p.unicornGreetingTime>0)return choose(p.unicornGreetingTime>3?'wave_side':p.unicornGreetingTime>1.5?'listen_side':'talk_side',...posture('idle'),'idle');
 if(p.mode==='quiet')return choose(p.clock<1.5&&(data.personality?.sociability??50)<40&&(data.love??50)>=50?'shy_side':p.clock<2?'sit_side':feeling==='sleepy'||(data.stats?.energy??100)<35?'sleeping':'sit_side',...posture('idle'),'idle');
 if(p.mode==='startle')return choose(p.clock<1.5?'surprised_front':'confused_front',...posture('idle'),'idle');
 if(p.mode==='watch'||p.mode==='explore')return choose('look_around_front',...(mood?[`${mood}_idle_back`]:[]),'idle_back',...posture('idle'),'idle');
 if(p.mode==='puddle')return choose('jump','play_side',...posture('idle'),'idle');
 if(p.mode==='celebrate'||p.playGroup?.kind==='freeze'&&p.playGroup.time%5<=3){
  const dances=['a','b','c','d','e'].map(x=>`dance_${x}_front`).filter(k=>hasFrames(data,k));
  if(dances.length){let clock=p.clock;const lengths=dances.map(a=>Math.max(1,reactionDuration(data.config,a)));clock%=lengths.reduce((a,b)=>a+b,0);let i=0;while(i<lengths.length-1&&clock>=lengths[i])clock-=lengths[i++];return dances[(i+(p.animationVariant||0)+(p.danceRound||0))%dances.length];}return choose('jump','happy','idle');
 }
 if(p.playGroup?.kind==='race'&&p.playGroup.winner===p.playGroup.players.indexOf(p))return choose('victory_front','happy','idle');
 if(p.mode==='toyPlay'||['ball','balloon','freeze'].includes(p.playGroup?.kind))return choose('play_side','happy','idle');
 if(feeling==='sleepy')return choose('tired','sleeping','idle');
 if(feeling==='question')return choose('confused_front',...posture('idle'),'idle');
 if(feeling==='cute'&&(data.personality?.sociability??50)<40)return choose('shy_side','happy','idle');
 if(negativeFeelings.has(feeling)){const action=choose(mood==='angry'?'angry_idle_front':'sad');if(action&&(p.reactionAge||0)<reactionDuration(data.config,action))return action;return choose(`${mood}_idle_${restDirection}`,...posture('idle'),'idle');}
 if(positiveFeelings.has(feeling)){const action=choose(feeling==='laughing'?'laugh_side':'happy');if(action&&(p.reactionAge||0)<reactionDuration(data.config,action))return action;return choose(`happy_idle_${restDirection}`,...posture('idle'),`idle_${restDirection}`,'idle');}
 return choose(...(mood?[`${mood}_idle_${restDirection}`]:[]),`idle_${restDirection}`,...posture('idle'),'idle');
}
function reactionDuration(config,action){const times=config.animation_frame_times?.[action];return Math.max(.5,Array.isArray(times)?times.reduce((n,t)=>n+(Number.isFinite(t)?t:.25),0):(config.animations[action]?.length||1)*(config.animation_speeds?.[action]||config.frame_time||.25));}
// Rendering and simulation share this clock; one-shot reactions start at frame zero.
export function advancePetPresentation(p,dt){
 const feeling=visibleFeeling(p);if(feeling!==p.renderFeeling){p.renderFeeling=feeling;p.reactionAge=0;}else p.reactionAge=(p.reactionAge||0)+dt;
 if(p.presentationMode!==p.mode){if(p.mode==='celebrate'||p.mode==='game'&&p.playGroup?.kind==='freeze')p.danceRound=(p.danceRound||0)+1;if(p.mode==='idle')p.idleVisits=(p.idleVisits||0)+1;p.presentationMode=p.mode;}
 const action=selectPetAction(p)||resolveAction(p.data,'idle');
 if(action!==p.renderAction){p.renderAction=action;p.renderClock=0;}else p.renderClock=(p.renderClock||0)+dt;
}
