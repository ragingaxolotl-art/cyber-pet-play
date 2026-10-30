// Canvas counterparts of scripts/game/condition_original_motifs.gd.
// Coordinates use the character's 192-unit artwork rectangle; no health text.
export const motifIds=new Set(['trademark_001','trademark_006','trademark_008','trademark_011','trademark_016','trademark_020','trademark_021','trademark_023','trademark_032','trademark_050','trademark_054','trademark_055','trademark_059','trademark_061','trademark_063','trademark_064','trademark_073','trademark_079','trademark_096','trademark_100','buffer_bloat','signal_sprain','mental_fatigue','echo_fright']);
const TAU=Math.PI*2,frac=x=>x-Math.floor(x),mix=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const envelope=p=>smooth(0,.12,p)*(1-smooth(.8,1,p));
export function drawMotif(g,id,t,severity,state,frame,drawFrame,still){
 const line=(points,color='#aad9e4',width=1.5)=>{g.strokeStyle=color;g.lineWidth=width;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();};
 const rect=(x,y,w,h,color,fill=false)=>{g[fill?'fillStyle':'strokeStyle']=color;if(fill)g.fillRect(x,y,w,h);else g.strokeRect(x,y,w,h);};
 const dot=(x,y,r,color)=>{g.fillStyle=color;g.beginPath();g.arc(x,y,r,0,TAU);g.fill();};
 const poly=(pts,color)=>{g.fillStyle=color;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();};
 const alpha=(a,fn)=>{g.save();g.globalAlpha*=a;fn();g.restore();};
 const turn=(x,y,a,fn)=>{g.save();g.translate(x,y);g.rotate(a);fn();g.restore();};
 switch(id){
 case 'trademark_001':
  for(let i=0;i<3+severity;i++){const p=frac(t/6+i*.19),d=smooth(0,.32,p)*(1-smooth(.62,.93,p))*125,a=-Math.PI*.82+i*.39,x=96+Math.cos(a)*d,y=65+Math.sin(a)*d,w=14+i%3*4;alpha(envelope(p),()=>{line([[x-w/2,y-4],[x+w/2,y-4],[x+w/2,y+1]],'#8cefd4',2);line([[x-w/2,y-1],[x-w/2,y+5],[x-w*.18,y+5]],'#8cefd4');for(let j=0;j<(p>.62?1:2);j++)line([[x-w*.25,y-2+j*3],[x+w*.24,y-2+j*3]],'#72c9b4');});}break;
 case 'trademark_006':
  for(let v=0;v<3;v++)line(Array.from({length:33},(_,i)=>[96+(i-16)*2,44+(v-1)*7+Math.sin(i*.4+t*(1+v*.37)+v*2)*(3+severity)*Math.sin(i/32*Math.PI)]),['#80cfe0','#a9afdf','#cd92db'][v]);break;
 case 'trademark_008':{const p=frac(t/8),partition=mix(50,142,smooth(.2,.75,p));alpha(envelope(p)*.7,()=>{line([[4,163],[4,25],[188,25],[188,163]],'#b0d1b8');line([[partition,25],[partition,87]],'#b0d1b8');line([[partition,109],[partition,163]],'#b0d1b8');});break;}
 case 'trademark_011':
  for(let i=0;i<3;i++){const p=frac(t/6+i*.27),x=192*(.22+i*.19);alpha(envelope(p)*.3,()=>{drawFrame(frame,x+(i-1)*p*(12+severity*3),38-Math.sin(p*Math.PI)*8,25,119,{x:x/192,y:.2,w:.13,h:.62});});}break;
 case 'trademark_016':
  for(let i=0;i<3;i++){const stretch=Math.sin(t*.8+i*2)*(3+severity),n=i+3,pts=Array.from({length:n+1},(_,j)=>[96+(i-1)*18+Math.cos(j*TAU/n-Math.PI/2)*12*(1+stretch/25),142+stretch+Math.sin(j*TAU/n-Math.PI/2)*12]);line(pts,'#e3b67d');rect(pts[1][0]-2,pts[1][1]-2,4,4,'#ffe5ac',true);}break;
 case 'trademark_020':
  line([[150,110],[150,67]],'#bd7b61');for(let i=0;i<3;i++){const p=frac(t/4.8+i/3),side=p>=.5?1:-1,x=150+side*5,y=110-Math.sin(p*Math.PI)*43;line([[x-3,y-side*3],[x,y],[x+3,y-side*3]],side>0?'#ff7336':'#fad46b');}alpha(.4+.2*Math.sin(t*2),()=>dot(150,110,3+severity*.5,'#ff591f'));break;
 case 'trademark_021':{const active=[0,3,1,5,2,4][Math.floor(t/1.2)%6],squeeze=Math.sin(frac(t/1.2)*Math.PI);for(let i=0;i<6;i++){const x=96+(i%3-1)*12,y=129+Math.floor(i/3)*12,h=8-(i===active?squeeze*4:0);alpha(i===active?.8:.45,()=>{rect(x-4,y-h/2,8,h,'#a3d97a');if(i===active)dot(x,y,1+severity*.2,'#a3d97a');});}break;}
 case 'trademark_023':
  for(let repeat=0;repeat<2;repeat++){const p=frac(t/7-repeat*.22),pts=Array.from({length:41},(_,i)=>[96+(i-20)*2,161+Math.sin(i*.32+p*TAU)*2-Math.exp(-Math.pow((i/40-p)*7,2))*9+repeat*6]);alpha(envelope(p)*(.7-repeat*.22),()=>{line(pts,'#5ecaf0',1.5+severity*.15);for(let i=0;i<5;i++)dot(pts[i*8][0],pts[i*8][1]-3,1,'#cdf5ff');});}break;
 case 'trademark_032':
  for(const side of [-1,1]){const x=96+side*92,top=x+side*7+Math.sin(t*.65+side)*6;line([[x-7,120],[top-7,78],[top+7,78],[x+7,120]],'#70cad6');for(let n=0;n<3;n++)alpha(.3,()=>line(Array.from({length:17},(_,i)=>{const u=i/16;return [mix(96+side*10,x,u),mix(96+(n-1)*8,101,u)+Math.sin(u*Math.PI)*Math.sin(t+n+side)*5];}),'#8cd6e8'));}break;
 case 'trademark_050':{const p=frac(t/3),season=[0,2,1,3][Math.floor(t/3)%4];alpha(envelope(p),()=>turn(159+Math.sin(p*TAU)*3,127-p*6,season===2?t*.8:0,()=>{if(season===0){line([[0,9],[0,-9*p]],'#57b85c',2);poly([[0,0],[-11,-9],[-10,-2]],'#8cd647');poly([[0,0],[12,-13],[10,-4]],'#8cd647');}else if(season===1){line([[0,10],[0,-11]],'#b88f4a',2);for(let i=0;i<4;i++)line([[0,i*3-9],[(i%2?1:-1)*6,-10+i*4]],'#e8b866',3);for(let i=0;i<3;i++)dot((i-1)*8*p,p*15+i*2,1.5,'#e8b866');}else if(season===2){poly([[0,-14],[4,-7],[10,-10],[8,-3],[14,0],[4,5],[0,10],[-4,5],[-14,0],[-8,-3],[-10,-10],[-4,-7]],'#e86e2b');line([[0,-9],[0,14]],'#853621');}else{for(let j=0;j<6;j++){const a=j*TAU/6,r=12*(1-p*.65);line([[0,0],[Math.cos(a)*r,Math.sin(a)*r]],'#b0e0ff');for(const side of [-1,1])line([[Math.cos(a)*r*.55,Math.sin(a)*r*.55],[Math.cos(a)*r*.55+Math.cos(a+side*.8)*r*.3,Math.sin(a)*r*.55+Math.sin(a+side*.8)*r*.3]],'#b0e0ff');}dot(0,p*14,2*p,'#59c2f5');}}));break;}
 case 'trademark_054':
  for(let moon=0;moon<3;moon++){const x=96+(moon-1)*24,y=-20+Math.sin(t*.36+moon*2)*4,r=8+moon,p=.25+.55*(.5+.5*Math.sin(t*(.2+moon*.07)+moon*2)),pts=[];for(let i=0;i<=24;i++){const a=-Math.PI/2+i/24*Math.PI;pts.push([x+Math.cos(a)*r,y+Math.sin(a)*r]);}for(let i=24;i>=0;i--){const a=-Math.PI/2+i/24*Math.PI;pts.push([x+Math.cos(a)*(1-p)*r,y+Math.sin(a)*r]);}poly(pts,'#c5cffaa0');const drop=frac(t/6+moon*.31);alpha(Math.sin(drop*Math.PI)*.45,()=>line([[x,y+r+drop*16],[x,y+r+drop*16+3]],'#b8c5f0'));}break;
 case 'trademark_055':{const p=frac(t/5);for(let i=0;i<3;i++){const x=92+(i-1)*18,y=167+i*5;line([[x-8,y],[x+8,y],[x+8,y+5]],'#c5a675',2);if(i===1){const slip=Math.sin(p*Math.PI)*16;line([[x+slip-8,y+2],[x+slip+8,y-2]],'#6ed6f0',2);for(let j=0;j<3;j++){const fall=frac(p+j*.25);alpha(Math.sin(fall*Math.PI)*.7,()=>dot(x+slip+(j-1)*5,y+fall*fall*15,1+severity*.2,'#7ad4ed'));}}}break;}
 case 'trademark_059':{const pts=[[96,-6]];for(let i=0;i<=24;i++){const a=Math.PI+i/24*Math.PI;pts.push([96+Math.cos(a)*14,-6+Math.sin(a)*14]);}poly(pts,'#ffb04da6');line([[73,-6],[119,-6]],'#f0d69e',2);for(let i=0;i<5;i++){const p=frac(t/5.5+i*.14),a=Math.PI*1.12+i*Math.PI*.19,r=18+p*8;alpha(Math.sin(p*Math.PI)*.75,()=>line([[96+Math.cos(a)*r,-6+Math.sin(a)*r],[96+Math.cos(a)*(r+4+severity),-6+Math.sin(a)*(r+4+severity)]],'#ffd970'));}for(const x of [-8,0,8])line([[96+x,-9],[96+x,-3]],'#9c7d64');break;}
 case 'trademark_061':
  for(const side of [-1,1]){const shift=Math.sin(t*.75)*side*10,pts=Array.from({length:13},(_,i)=>[96+(i-6)*5+shift,111+side*(3+i%2*3)]);poly([...pts,[126+shift,111+side*11],[66+shift,111+side*11]],'#9ed1f840');line(pts,'#cceaff');}break;
 case 'trademark_063':
  if(still){for(let i=0;i<3;i++)line([[86+i*10,173],[92+i*10,173],[92+i*10,177]],'#dec792');break;}
  for(const step of state.steps){const age=state.now-step.time,catchUp=smooth(1.2,3.8,age),oldX=(frame.facing<0?1-(step.x-frame.screenX)/frame.screenWidth:(step.x-frame.screenX)/frame.screenWidth)*192,oldY=(step.y-frame.screenY)/frame.screenHeight*192;alpha(smooth(0,.15,age)*(1-smooth(3.1,3.8,age)),()=>{const x=mix(oldX,96,catchUp)+step.side*5,y=mix(oldY,163,catchUp);rect(x-2.5,y-4,5,8,'#ccb07a',true);dot(x,y-7,2.5,'#dec792');});}break;
 case 'trademark_064':{const old=still?frame:state.history.findLast(s=>s.time<=state.now-2)||state.history[0]||frame;alpha(.22+severity*.035,()=>{g.save();g.translate(0,182);g.scale(1,-1);drawFrame(old,0,-65,192,65);g.restore();});for(let i=0;i<3;i++)line([[31,184+i*7],[161,184+i*7]],'#96deff38');break;}
 case 'trademark_073':
  for(let q=0;q<4;q++){const a=q*TAU/4,dx=Math.cos(a),dy=Math.sin(a),tx=-dy,ty=dx;line([[96+dx*115-tx*15,96+dy*115-ty*15],[96+dx*115+tx*15,96+dy*115+ty*15]],'#d9b8fa7a');for(let i=0;i<2+severity;i++){const p=frac(t/4.5+i*.21+q*.13),r=mix(52,115,Math.min(1,Math.pow(p/.76,2)));alpha(envelope(p)*.85,()=>turn(96+dx*r+tx*(i-2)*5,96+dy*r+ty*(i-2)*5,a,()=>rect(-2,-2,4+i%2,4+i%2,'#ccabf2',true)));}}break;
 case 'trademark_079':{const w=11+Math.sin(t*.7)*5,pts=Array.from({length:4},(_,i)=>[96+(i-1.5)*w,138+(i%2?6:-6)]);for(let i=0;i<4;i++){const [x,y]=pts[i];if(i){const [ax,ay]=pts[i-1];poly([[ax,ay-8],[x,y-8],[x,y+8],[ax,ay+8]],i%2?'#bfcc8a40':'#bfcc8a73');}line([[x,y-8],[x,y+8]],'#e0ebad');}line(pts,'#f7ad59');const spacing=5.5-Math.sin(t*.7)*1.8;for(let i=0;i<7;i++)line([[96+(i-3)*spacing,158],[96+(i-3)*spacing,155-severity]],'#d9deb0');break;}
 case 'trademark_096':
  line([[96,109],[96,141]],'#d9caab',2);for(const side of [-1,1]){const x=96+side*14,ink=side<0?'#73cfff':'#ffab47';rect(x-11,110,22,30,side<0?'#73cfff20':'#ffab4720',true);for(let i=0;i<3;i++){const p=frac(t/4+i*.3),px=x+(i-1)*5,y=125+(p-.5)*22*side;alpha(Math.sin(p*Math.PI)*.8,()=>{if(side<0){for(let j=0;j<3;j++){const a=j*Math.PI/3;line([[px-Math.cos(a)*3,y-Math.sin(a)*3],[px+Math.cos(a)*3,y+Math.sin(a)*3]],ink);}}else dot(px,y,2+severity*.15,ink);});}}break;
 case 'trademark_100':
  for(let i=0;i<4;i++){const a=t*.38-i*.48,d=23+i*16,x=96+Math.cos(a)*d,y=54+Math.sin(a)*d,r=7-i;alpha((.43-i*.08)*(1+severity*.05),()=>poly([[x-Math.sin(a)*r,y+Math.cos(a)*r],[x+Math.cos(a)*r*2,y+Math.sin(a)*r*2],[x+Math.sin(a)*r,y-Math.cos(a)*r]],'#ffe37a'));}break;
 case 'buffer_bloat':
  for(const side of [-1,1])line(Array.from({length:13},(_,i)=>[138+i*3,125+side*(3+Math.sin(i/12*Math.PI)*(5+(.5+.5*Math.sin(t*.9))*5))]),'#f0a847');for(let i=0;i<5+severity;i++){const p=frac(t/5+i*.13),h=mix(9,3,smooth(.55,.95,p));alpha(envelope(p),()=>rect(138+p*p*40,125-h/2,3,h,'#ffd16b',true));}break;
 case 'signal_sprain':{const pull=Math.pow(.5+.5*Math.sin(t*1.5),3),pts=[[122,119],[127,119],[134,112-pull*7],[139,129+pull*3],[147+pull*9,128]],p=frac(t*.55),i=Math.min(3,Math.floor(p*4));line(pts,'#ffa852',2);for(const [x,y] of [pts[0],pts[4]])rect(x-3,y-3,6,6,'#e0edf0');dot(mix(pts[i][0],pts[i+1][0],frac(p*4)),mix(pts[i][1],pts[i+1][1],frac(p*4)),1.5+severity*.2,'#fffac2');break;}
 case 'mental_fatigue':{const p=frac(t/7);for(let i=0;i<3;i++){const drop=smooth(.3+i*.1,.8,p)*(i+1)*5,x=96+(i-1)*11,y=22+drop;alpha(envelope(p)*(1-drop/30),()=>{rect(x-4,y-4,8,8,'#adc7e8');if(i<2)line([[x+4,y],[x+7,y]],'#adc7e8');else line([[x-2,y-2],[x+2,y+2]],'#f2cf8c');});}dot(96,35,1.4+severity*.15,'#adc7e880');break;}
 case 'echo_fright':
  for(const side of [-1,1])for(let i=0;i<2;i++){const p=frac(t/4.8+i*.45+(side===1?.25:0)),x=96+side*mix(148,90,p),h=mix(18,6,p);alpha(smooth(0,.16,p)*(1-smooth(.68,1,p)),()=>line([[x+side*6,84-h],[x,84],[x+side*6,84+h]],'#b8a3e8'));}break;
 }
}
