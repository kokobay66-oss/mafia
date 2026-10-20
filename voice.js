let stream=null,want=false,spk=true,forced=null,denied=false;
const $=i=>document.getElementById(i);
const eff=()=>forced==='on'?true:forced==='off'?false:want;
async function ensure(){
  if(stream)return true;
  if(denied)return false;
  try{stream=await navigator.mediaDevices.getUserMedia({audio:true});return true}
  catch(e){denied=true;return false}
}
function apply(){
  if(stream)stream.getAudioTracks().forEach(t=>t.enabled=eff());
  paint();
}
export const html=()=>'<button id="vm" style="border-radius:50%;font-size:20px"></button><button id="vs" style="border-radius:50%;font-size:20px"></button>';
export function paint(){
  const m=$('vm'),s=$('vs');
  if(m){const on=eff();m.textContent='🎙️';m.style.background=on?'#2fbf71':'#4a4660';m.style.opacity=(forced&&!on)?'.5':'1'}
  if(s){s.textContent=spk?'🔊':'🔇';s.style.background=spk?'#2fbf71':'#4a4660'}
}
export function bind(toast){
  const m=$('vm'),s=$('vs');
  if(m)m.onclick=async()=>{
    if(forced==='on'){toast('مايكك مفتوح وقت دورك');return}
    if(forced==='off'){toast('المايك مقفل في هذي المرحلة');return}
    if(!want){
      if(!(await ensure())){toast('اسمح للمتصفح باستخدام المايك');return}
      want=true;
    }else want=false;
    apply();
  };
  if(s)s.onclick=()=>{spk=!spk;apply()};
  paint();
}
export function force(f,toast){
  if(f===forced)return;
  forced=f;
  if(f==='on'&&!stream)ensure().then(ok=>{if(!ok&&toast)toast('اسمح للمتصفح باستخدام المايك');apply()});
  apply();
}
export function release(){
  if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}
  want=false;forced=null;denied=false;paint();
}
export const speaker=()=>spk;
export const micOn=eff;
