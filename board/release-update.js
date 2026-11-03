// Poll only release metadata; never reload or discard a live classroom session.
export const BOARD_VERSION=52;
export async function availableRelease(fetcher=fetch){
 try{
  const response=await fetcher('./release.json?check='+Date.now(),{cache:'no-store'});
  if(!response.ok)return null;
  const release=await response.json();
  return Number.isSafeInteger(release.version)&&release.version>BOARD_VERSION?release.version:null;
 }catch{return null;}
}
export function updateUrl(href,version){
 const url=new URL(href);url.searchParams.set('board-release',String(version));return url.href;
}
export function watchBoardRelease(){
 const notice=document.createElement('button');notice.type='button';notice.hidden=true;
 notice.style.cssText='position:fixed;bottom:18px;right:18px;z-index:10000;background:#173e50;color:white;border:2px solid #a7f3db;border-radius:12px;padding:14px 18px;font:600 16px system-ui;cursor:pointer';
 notice.setAttribute('aria-live','polite');document.body.append(notice);
 let pending=false;
 const check=async()=>{
  if(document.hidden||pending)return;pending=true;
  try{const version=await availableRelease();if(version){notice.textContent='Board update ready — refresh to version '+version;notice.hidden=false;notice.onclick=()=>location.assign(updateUrl(location.href,version));}}
  finally{pending=false;}
 };
 check();setInterval(check,60000);
 document.addEventListener('visibilitychange',check);
}
