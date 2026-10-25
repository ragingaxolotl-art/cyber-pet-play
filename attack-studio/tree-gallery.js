// Paged artwork browser reuses existing public previews, without generating artwork.
export function installTreeGallery({effects,getTree,add,status,applyPending}) {
  const $=id=>document.getElementById(id);let page=0;
  const all=[...effects.values()];
  for(const element of [...new Set(all.map(e=>e.element))].sort())$('galleryElement').add(new Option(element,element));
  function render(){
    const query=$('gallerySearch').value.toLowerCase(),element=$('galleryElement').value;
    const matches=all.filter(e=>(!element||e.element===element)&&`${e.name} ${e.slot} ${e.collection}`.toLowerCase().includes(query));
    const pages=Math.max(1,Math.ceil(matches.length/12));page=Math.min(page,pages-1);
    $('galleryCount').textContent=`${matches.length} animations · page ${page+1} of ${pages}`;
    $('galleryCards').replaceChildren();
    for(const effect of matches.slice(page*12,page*12+12)){
      const card=document.createElement('article'),image=document.createElement('img'),title=document.createElement('h3'),info=document.createElement('p'),button=document.createElement('button');
      image.src=effect.preview||effect.frames?.[0]||effect.sheet;image.alt=effect.name+' animation preview';image.loading='lazy';
      image.onerror=()=>{image.alt='Preview unavailable — '+effect.name;};
      title.textContent=effect.name;info.textContent=`${effect.element} · ${effect.slot.replaceAll('_',' ')}${getTree().nodes.some(n=>n.effectId===effect.id)?' · Already on tree':''}`;
      button.textContent='Add to tree';button.setAttribute('aria-label','Add '+effect.name+' to tree');
      button.onclick=()=>{try{applyPending();add(effect.id,$('galleryPlacement').value);render();status('Added '+effect.name+'. It remains editable; review its description and learning connections.');}catch(error){status(error.message);$('galleryCount').textContent=error.message;}};
      card.append(image,title,info,button);$('galleryCards').append(card);
    }
    $('galleryPrevious').disabled=page===0;$('galleryNext').disabled=page>=pages-1;
  }
  $('browseAttacks').onclick=()=>{try{applyPending();render();$('galleryDialog').showModal();}catch(error){status(error.message);}};
  $('gallerySearch').oninput=()=>{page=0;render();};$('galleryElement').onchange=()=>{page=0;render();};
  $('galleryPrevious').onclick=()=>{page--;render();};$('galleryNext').onclick=()=>{page++;render();};
  $('closeGallery').onclick=()=>$('galleryDialog').close();
}
