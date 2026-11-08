const KEY='cyber-pet-editor-accessibility-v1';
export function installAccessibility(container){
 let settings;try{settings=JSON.parse(localStorage.getItem(KEY)||'{}');}catch{settings={};}if(!settings||typeof settings!=='object')settings={};
 const make=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
 function toggle(key,title){const label=make('label'),box=make('input');box.type='checkbox';box.checked=settings[key]===true;label.append(box,document.createTextNode(title));container.append(label);box.onchange=()=>{settings[key]=box.checked;apply();try{localStorage.setItem(KEY,JSON.stringify(settings));}catch{}};}
 function apply(){document.body.classList.toggle('editor-large-controls',settings.controls===true);document.body.classList.toggle('editor-large-text',settings.text===true);}
 toggle('controls','Larger buttons and controls');toggle('text','Larger text');apply();
}
