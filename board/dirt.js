// A private visual seed per pet/session prevents identical patches or frame flicker.
export function makeDirt(random=Math.random){return Array.from({length:48},()=>({x:8+random()*176,y:8+random()*176,rx:3+random()*10,ry:2+random()*7,angle:random()*Math.PI,shade:random()>.5?'#745138':'#96704a'}));}
export function splashDirt(p,amount=.07){p.cleanliness=Math.max(0,(p.cleanliness??.35)-amount);}
