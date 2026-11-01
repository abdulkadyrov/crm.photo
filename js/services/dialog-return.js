// Capture the actual originating control, expanded menu and scroll, not a default route.
export function captureDialogReturn(doc=document,win=window,source=doc.activeElement) {
 const origin=source,menu=origin?.closest?.('details'),expanded=menu?.open;
 const x=win.scrollX,y=win.scrollY;
 return ()=>{if(menu?.isConnected&&expanded)menu.open=true;origin?.focus?.({preventScroll:true});win.scrollTo(x,y);};
}
