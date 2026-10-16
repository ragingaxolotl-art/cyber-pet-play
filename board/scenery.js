import {floor,stairs,stations} from './motion.js?v=28';
const ellipse=(c,x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
function box(c,x,y,w,h,r,color){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
function cloud(c,x,y,size,color='#f1f9fc'){
  ellipse(c,x,y,size,size*.25,color);ellipse(c,x-size*.4,y-size*.12,size*.42,size*.30,color);ellipse(c,x+size*.16,y-size*.2,size*.44,size*.38,color);ellipse(c,x+size*.55,y-size*.06,size*.36,size*.24,color);
}
function leaf(c,x,y,size,angle,color){c.save();c.translate(x,y);c.rotate(angle);ellipse(c,0,0,size,size*.32,color);c.strokeStyle='#b5d48e45';c.lineWidth=size*.025;c.beginPath();c.moveTo(-size,0);c.lineTo(size,0);c.stroke();c.restore();}
function sign(c,text,x,y,width,height,color){box(c,x-width/2,y,width,height,height*.2,color);c.fillStyle='#fff3cf';c.font=`700 ${height*.39}px system-ui`;c.textAlign='center';c.fillText(text,x,y+height*.64);}
export function drawLandscape(c,w,h,backdrop){
  const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#78bdd0');sky.addColorStop(.4,'#d6ebdb');sky.addColorStop(.65,'#3b7566');sky.addColorStop(1,'#182f43');c.fillStyle=sky;c.fillRect(0,0,w,h);
  ellipse(c,w*.86,h*.13,h*.045,h*.045,'#fff1ba');ellipse(c,w*.86,h*.13,h*.068,h*.068,'#fff1ba25');
  for(let i=0;i<9;i++)cloud(c,w*(i*.135-.03),h*(.13+(i%3)*.053),w*.055,'#eaf5efb0');
  // Courtyard retains the user's original First Place artwork below the jungle.
  if(backdrop?.naturalWidth){c.save();c.beginPath();c.rect(0,h*.67,w,h*.33);c.clip();c.drawImage(backdrop,0,h*.50,w,h*.52);c.fillStyle='#1b374a22';c.fillRect(0,h*.67,w,h*.33);c.restore();}
  // Layered jungle canopy: geometry stays sharp at native 4K.
  c.fillStyle='#36776e';c.beginPath();c.moveTo(0,h*.38);for(let i=0;i<=30;i++)c.lineTo(i*w/30,h*(.36+.035*Math.sin(i*1.7)));c.lineTo(w,h*.67);c.lineTo(0,h*.67);c.fill();
  for(let i=0;i<20;i++){
    const x=i*w/19,y=h*(.46+(i%4)*.024),size=w*(.032+(i%3)*.007);
    c.fillStyle='#275e56';c.fillRect(x-size*.06,y,size*.12,h*.20);
    ellipse(c,x,y,size,size*.64,i%2?'#427f69':'#4e8d70');ellipse(c,x-size*.55,y+size*.24,size*.65,size*.43,'#306e60');
  }
  // Tall palms stay to the edges so the pets and the feeding house remain legible.
  for(const [nx,flip] of [[.045,1],[.94,-1],[.27,1],[.80,-1]]){
    const x=nx*w,base=floor(1)*h,top=base-h*.18;
    c.strokeStyle='#654d38';c.lineWidth=h*.012;c.beginPath();c.moveTo(x,base);c.quadraticCurveTo(x+flip*w*.012,top+h*.07,x,top);c.stroke();
    for(let j=0;j<6;j++)leaf(c,x+Math.cos(j)*w*.022,top+Math.sin(j)*h*.02,w*.045,j*.7+flip*.2,j%2?'#226349':'#468e59');
  }
  for(let level=0;level<3;level++){
    const y=floor(level)*h,colors=level===2?['#f5fbf5','#b1d7df','#7ca5b6']:level===1?['#9fc371','#795c40','#3f4c36']:['#e8dbc4','#7a91a2','#263f52'];
    c.fillStyle=colors[2];c.fillRect(0,y+h*.009,w,h*.021);c.fillStyle=colors[1];c.fillRect(0,y,w,h*.014);c.fillStyle=colors[0];c.fillRect(0,y,w,h*.004);
    if(level===2)for(let i=0;i<22;i++)cloud(c,i*w/21,y+h*.024,w*.034,'#e5f3ef');
    if(level===1){for(let i=0;i<55;i++){const x=i*w/54;leaf(c,x,y+h*.018,h*.018,i%2?1:-1,'#428258');}}
  }
  for(const s of stairs){
    const x0=s.a*w,x1=s.b*w,y0=floor(s.from)*h,y1=floor(s.to)*h;
    for(let i=0;i<18;i++){const a=x0+(x1-x0)*i/18,b=x0+(x1-x0)*(i+1)/18,y=y0+(y1-y0)*i/18;box(c,Math.min(a,b),y,Math.abs(b-a)+1,h*.013,h*.002,s.to===2?'#d6e9df':'#9c8059');c.fillStyle=s.to===2?'#f6f8e8':'#e5cd98';c.fillRect(Math.min(a,b),y,Math.abs(b-a)+1,h*.003);}
    c.strokeStyle='#f5dfae99';c.lineWidth=h*.002;c.beginPath();c.moveTo(x0,y0-h*.025);c.lineTo(x1,y1-h*.025);c.stroke();
    for(let i=0;i<5;i++){const t=i/4,x=x0+(x1-x0)*t,y=y0+(y1-y0)*t;c.beginPath();c.moveTo(x,y-h*.025);c.lineTo(x,y);c.stroke();}
  }
  feedingHouse(c,w,h);cloudWash(c,w,h);
  sign(c,'THE COURTYARD',w*.10,h*.91,w*.13,h*.035,'#1b3449c9');
}
function feedingHouse(c,w,h){
  const x=w*.51,y=floor(1)*h,ww=w*.19,hh=h*.18;
  box(c,x-ww*.45,y-hh*.75,ww*.9,hh*.75,h*.01,'#805e3b');
  box(c,x-ww*.38,y-hh*.63,ww*.76,hh*.63,h*.01,'#253e32');
  c.fillStyle='#b79b65';c.fillRect(x-ww*.5,y-hh*.08,ww,hh*.08);
  for(const side of [-1,1]){c.fillStyle='#d7b77b';c.fillRect(x+side*ww*.43-ww*.018,y-hh*.76,ww*.036,hh*.76);}
  c.fillStyle='#225841';c.beginPath();c.moveTo(x-ww*.58,y-hh*.72);c.lineTo(x,y-hh*1.10);c.lineTo(x+ww*.58,y-hh*.72);c.closePath();c.fill();
  for(let i=0;i<9;i++)leaf(c,x+(i-4)*ww*.12,y-hh*.77+Math.abs(i-4)*hh*.014,ww*.095,i%2?.24:-.24,i%2?'#51935c':'#73aa64');
  sign(c,'FAVORITE FOOD HOUSE',x,y-hh*.88,ww*.77,hh*.22,'#82633a');
  for(const side of [-1,1]){const px=x+side*ww*.62;box(c,px-ww*.045,y-hh*.19,ww*.09,hh*.19,4,'#a4784b');for(let i=0;i<4;i++)leaf(c,px+(i-1.5)*ww*.018,y-hh*.26,ww*.045,i-.9,'#78ac67');}
}
function cloudWash(c,w,h){
  const zone=stations.wash,x=(zone.left+zone.right)/2*w,y=floor(2)*h,ww=(zone.right-zone.left)*w,hh=h*.19;
  box(c,x-ww*.5,y-hh,ww,hh,h*.02,'#dbf2ee38');
  for(const side of [-1,1]){box(c,x+side*ww*.5-ww*.025,y-hh*.90,ww*.05,hh*.9,h*.008,'#95c8ce');box(c,x+side*ww*.5-ww*.015,y-hh*.86,ww*.012,hh*.78,h*.004,'#e9ffff');}
  cloud(c,x,y-hh,ww*.53,'#f3fbf2');sign(c,'CLOUD WASH',x,y-hh*1.04,ww*.68,hh*.20,'#4a8899');
  c.fillStyle='#d6f5f5';for(let i=0;i<9;i++)c.fillRect(x-ww*.38+i*ww*.095,y-hh*.79,ww*.025,hh*.025);
  c.fillStyle='#eaf5e8';c.font=`600 ${h*.017}px system-ui`;c.textAlign='center';c.fillText('WALK THROUGH · FRESHEN UP',x,y-hh*.59);
}
export function drawWash(c,w,h,pets,time){
  const zone=stations.wash,active=pets.filter(p=>p.washActive);if(!active.length)return;
  c.save();c.strokeStyle='#c9f8ffb0';c.lineWidth=Math.max(1,h*.0016);
  for(let i=0;i<28;i++){const x=w*(zone.left+.012+(zone.right-zone.left-.024)*i/27),t=(time*.62+i*.137)%1,y=h*(floor(2)-.14+t*.135);c.beginPath();c.moveTo(x,y);c.lineTo(x,y+h*.012);c.stroke();}
  for(const p of active)for(let i=0;i<5;i++){const phase=(time*.4+i*.19)%1,x=p.x*w+Math.sin(i*2+time)*h*.019,y=floor(2)*h-phase*h*.11;c.globalAlpha=(1-phase)*.8;ellipse(c,x,y,h*.003+i*h*.001,h*.003+i*h*.001,'#edffff');}
  c.restore();
}
