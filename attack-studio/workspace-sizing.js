// Requested sizes are saved; fitted sizes respond to the available screen.
// Shrinking a laptop window must not overwrite the designer's preferred size.
export function fitDockHeights(height,requested={},visible={},tabbed={}){
 const result={top:0,bottom:0};
 const docks=['top','bottom'].filter(dock=>visible[dock]);
 const usable=Math.max(0,height-Math.min(200,height*.45)-docks.length*8);
 for(const dock of docks)result[dock]=requested[dock]??Math.max(80,height*(tabbed[dock]?.3:.22));
 const total=result.top+result.bottom;
 if(total>usable)for(const dock of docks)result[dock]*=usable/total;
 return result;
}

export function pinnedAreaSize(height,count,hasUnpinned){
 const area=Math.max(0,height*(hasUnpinned?.6:1)-(hasUnpinned?8:20));
 // An overflowing set scrolls inside the pinned area instead of piling sticky
 // panels on top of one another or obscuring the remaining column.
 return {area,panel:Math.max(180,(area-24)/Math.max(1,count)-10)};
}
