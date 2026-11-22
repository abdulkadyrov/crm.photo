// One job at a time; superseding a roster cancels its remaining work.
export function createPortraitCheckQueue(){
 let controller=null,pending=Promise.resolve(),scope='',seen=new Set();
 return {schedule(nextScope,jobs){
  if(nextScope!==scope){controller?.abort();controller=new AbortController();scope=nextScope;seen=new Set();}
  const signal=controller.signal;
  for(const job of jobs){if(seen.has(job.key))continue;seen.add(job.key);
   pending=pending.catch(()=>{}).then(async()=>{if(signal.aborted)return;try{await job.run(signal);}catch(error){if(!signal.aborted)job.onError?.(error);}await new Promise(r=>setTimeout(r,60));});
  }
 },stop(){controller?.abort();scope='';seen=new Set();}};
}
