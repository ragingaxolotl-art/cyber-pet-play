import {createLocalBankStore,createClassroomBank,validateBank,BANK_KEY,SESSION_KEY,emptyBank} from './attack-bank.js?v=20261109-rotation';
// Reads definitions through existing bank validation; never writes the bank or exposes credentials.
export async function readSavedBrowserAttacks(validate){
 const remote=createClassroomBank(validate);try{remote.restore(JSON.parse(localStorage.getItem(SESSION_KEY)||'null'));}catch{}
 if(remote.connected()){try{const result=await remote.read();return {attacks:result.bank.attacks,label:'Classroom bank',notice:''};}catch(error){const local=await readLocal();return {...local,notice:'Classroom bank unavailable. Showing this device’s saved copies. '+error.message};}}
 return readLocal();
 async function readLocal(){let bank;try{bank=await createLocalBankStore().read();}catch{bank=JSON.parse(localStorage.getItem(BANK_KEY)||'null')||emptyBank();}validateBank(bank,validate);return {attacks:bank.attacks,label:'Saved on this device',notice:''};}
}
