// Development nudges choices after personality/willingness checks; no saved writes.
const paths={body:['tank','powerhouse','agile','marathoner','all_rounder'],learning:['intelligence','wisdom','concentration','charisma','balanced']};
export function readDevelopment(progress={}){
 const read=(value,kind)=>value&&Number.isInteger(value.stage)&&value.stage>=2&&value.stage<=4&&paths[kind].includes(value.path)?{stage:value.stage,path:value.path}:null;
 const inherited=progress.traits||{};
 return {body:read(progress.body_growth,'body'),learning:read(progress.disposition_growth,'learning'),constitution:['Hardy','Resilient'].includes(inherited.constitution)?inherited.constitution:'Normal'};
}
export function developmentWeight(p,kind){
 const d=p.data.development;if(!d)return 1;
 const favorites={tank:['ball'],powerhouse:['ball'],agile:['race','tag'],marathoner:['follow','race'],all_rounder:[],intelligence:['treasure','hide'],wisdom:['favorites'],concentration:['freeze'],charisma:['copy'],balanced:[]};
 const bonus=[d.body,d.learning].reduce((n,v)=>n+(v&&favorites[v.path]?.includes(kind)?.05*(v.stage-1):0),0);
 return Math.min(1.2,1+bonus);
}
export function developmentPersistence(p){
 const body=p.data.development?.body;
 return body?.path==='marathoner'?Math.min(.1,(body.stage-1)/30):0;
}
export function developmentReaction(p,fallback){
 const d=p.data.development;
 if(d?.learning?.path==='wisdom')return 'thinking';
 if(d?.learning?.path==='charisma')return 'hearts';
 if(d?.constitution==='Resilient'&&fallback==='frustrated')return 'thinking';
 return fallback;
}
