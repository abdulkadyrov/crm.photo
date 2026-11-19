// Unlock from a user gesture; failed/muted audio never blocks scanning or saving.
export function createScanFeedback({storage=globalThis.localStorage,AudioContext=globalThis.AudioContext||globalThis.webkitAudioContext}={}){
 let context=null,enabled=true;try{enabled=storage?.getItem('crm-scan-sound')!=='off';}catch{}
 const unlock=()=>{try{if(enabled&&AudioContext){context ||= new AudioContext();void context.resume().catch(()=>{});}}catch{}};
 return {get enabled(){return enabled;},unlock,toggle(){enabled=!enabled;try{storage?.setItem('crm-scan-sound',enabled?'on':'off');}catch{}if(enabled)unlock();return enabled;},
  play(kind='read'){if(!enabled||!context||context.state!=='running')return;try{const tones=kind==='saved'?[1046,1397]:kind==='duplicate'?[330]:[880];tones.forEach((frequency,i)=>{const at=context.currentTime+i*.085,osc=context.createOscillator(),gain=context.createGain();osc.type='sine';osc.frequency.value=frequency;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.12,at+.008);gain.gain.exponentialRampToValueAtTime(.001,at+.065);osc.connect(gain);gain.connect(context.destination);osc.start(at);osc.stop(at+.075);});}catch{}},dispose(){void context?.close().catch(()=>{});context=null;}};
}
