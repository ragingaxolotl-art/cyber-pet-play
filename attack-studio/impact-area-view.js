// Render the same sampled bounds used by collision detection, even without debug boxes.
export function drawImpactArea(ctx,box,ground=0){
 ctx.save();ctx.fillStyle=box.shape==='ellipse'?'#ffc36b55':'#d6f48a38';ctx.strokeStyle=box.shape==='ellipse'?'#ffc36b':'#d6f48a';
 if(box.shape==='ellipse'){ctx.beginPath();ctx.ellipse(box.x+box.w/2,ground+box.y+box.h/2,box.w/2,box.h/2,0,0,Math.PI*2);ctx.fill();ctx.stroke();}
 else{ctx.fillRect(box.x,ground+box.y,box.w,box.h);ctx.strokeRect(box.x,ground+box.y,box.w,box.h);}
 ctx.restore();
}
