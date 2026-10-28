export const FOUNDLING_CUTOFF='2026-11-14';
export function validBirthday(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;}
export function creationRecord(record,{legacy=false,today=new Date().toISOString().slice(0,10)}={}){
 const date=validBirthday(record?.birthday)?record.birthday:'';
 const unknown=legacy&&!date || record?.birthday===''&&record?.foundling===true&&record?.year===2026&&record?.quarter===1;
 const birthday=date||(unknown?'':today),foundling=unknown||birthday<=FOUNDLING_CUTOFF;
 const result={birthday,foundling};
 if(foundling)Object.assign(result,{quarter:1,year:2026});
 else if(Number.isInteger(record?.quarter)&&record.quarter>=1&&record.quarter<=4&&Number.isInteger(record?.year)&&record.year>=2000&&record.year<=9999)Object.assign(result,{quarter:record.quarter,year:record.year});
 if(record?.birthday_source==='earliest_known_upload')result.birthday_source='earliest_known_upload';
 return result;
}
export function earliestKnownUpload(entries,petId){
 const dates=entries.filter(e=>e.pet_id===petId&&Number.isFinite(e.created_at)&&e.created_at>0).map(e=>e.created_at);
 if(!dates.length)return null;
 return {birthday:new Date(Math.min(...dates)*1000).toISOString().slice(0,10),birthday_source:'earliest_known_upload'};
}
