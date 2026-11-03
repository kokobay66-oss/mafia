/* الصوت المباشر (المايكات) عبر Agora. صلاحية الكلام يقررها السيرفر (worker.js) وتنجدد كل ثواني */
import {getApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
/* رابط سيرفر التوكن (Cloudflare Worker) */
const TOKEN_URL='https://mafia-voice.kokobay33.workers.dev/';
/* مصادر المكتبة: لو واحد فشل يجرب اللي بعده */
const URLS=[
  'https://download.agora.io/sdk/release/AgoraRTC_N-4.20.2.js',
  'https://cdn.jsdelivr.net/npm/agora-rtc-sdk-ng@4.20.2/AgoraRTC_N-production.js',
  'https://cdn.jsdelivr.net/npm/agora-rtc-sdk-ng@4.20.2/AgoraRTC_N.js',
  'https://unpkg.com/agora-rtc-sdk-ng@4.20.2/AgoraRTC_N-production.js',
  'https://download.agora.io/sdk/release/AgoraRTC_N-4.18.2.js'
];
let RTC=null,cl=null,code=null,me=null,mic=null,userMic=false,forced=null,tt=()=>{},muted=false,connected=false,timer=null,rtimer=null,gen=0,pubOK=false,busy=false;
let status='idle',lastErr='',lastJoin=null;
/* صوت اللاعبين: 100 افتراضي، ويتغير بس من الإعدادات وينحفظ */
const vol=()=>{try{const v=localStorage.getItem('mj_voice');return v===null?100:Math.max(0,Math.min(100,+v||0))}catch(e){return 100}};
/* المايك يشتغل لو اللاعب يبيه (أو دوره) وكمان السيرفر سمح له */
const eff=()=>(forced==='on'?true:forced==='off'?false:userMic)&&pubOK;
const errText=e=>{
  const c=String((e&&e.code)||''),m=String((e&&e.message)||e||'');
  if(c==='CAN_NOT_GET_GATEWAY_SERVER'||/dynamic use static key|authorized failed|invalid token/i.test(m))
    return 'Agora رفض التوكن: تأكد من AGORA_APP_ID و AGORA_CERT في Cloudflare';
  if(/invalid vendor key|INVALID_VENDOR_KEY/i.test(c+m))return 'الـ App ID غلط';
  return c||m||'غير معروف';
};
function note(msg,ms){
  const t=document.createElement('div');t.className='toast';t.textContent=msg;
  document.body.appendChild(t);setTimeout(()=>t.remove(),ms||3000);
}
function loadOne(u){
  return new Promise((res,rej)=>{
    const s=document.createElement('script');s.src=u;s.async=true;
    s.onload=()=>window.AgoraRTC?res():(s.remove(),rej(new Error('no global')));
    s.onerror=()=>{s.remove();rej(new Error('fail '+u))};
    document.head.appendChild(s);
  });
}
async function load(){
  if(window.AgoraRTC)return window.AgoraRTC;
  for(const u of URLS){
    try{await loadOne(u);return window.AgoraRTC}catch(e){console.warn('agora sdk',u,e)}
  }
  throw new Error('تعذر تحميل مكتبة الصوت من كل المصادر، تأكد إن النت يفتح download.agora.io');
}
async function fetchToken(ch){
  if(!TOKEN_URL)throw new Error('رابط سيرفر التوكن ما انحط في voice.js (TOKEN_URL)');
  const idt=await getAuth(getApp()).currentUser.getIdToken();
  const rs=await fetch(TOKEN_URL+'?channel='+encodeURIComponent(ch),{headers:{Authorization:'Bearer '+idt}});
  const d=await rs.json().catch(()=>({}));
  if(!rs.ok)throw new Error('سيرفر التوكن: '+(d.error||rs.status));
  return d;
}
function applyVolume(){
  if(!cl)return;
  cl.remoteUsers.forEach(u=>{if(u.audioTrack)u.audioTrack.setVolume(muted?0:vol())});
}
window.addEventListener('mj-voice',applyVolume);
function css(){
  if(document.getElementById('vcss'))return;
  const s=document.createElement('style');s.id='vcss';
  s.textContent='.seat.vspk{box-shadow:0 0 0 3px #4ade80,0 0 16px #4ade80!important}';
  document.head.appendChild(s);
}
function tick(){
  if(!cl)return;
  const sp=new Set();
  try{
    cl.remoteUsers.forEach(u=>{if(u.audioTrack&&u.audioTrack.getVolumeLevel()>.05)sp.add(String(u.uid))});
    if(mic&&eff()&&mic.getVolumeLevel()>.05)sp.add(String(me));
  }catch(e){}
  document.querySelectorAll('.seat[data-p],.seat[data-u]').forEach(e=>e.classList.toggle('vspk',sp.has(e.dataset.p||e.dataset.u)));
}
function updateUI(){
  const m=document.getElementById('vmc'),s=document.getElementById('vsp');
  const base='position:relative;width:44px;height:44px;border-radius:14px;border:0;margin:0;padding:0;font-size:20px;color:#fff;flex:none;';
  if(m){
    const on=eff(),dot=status==='ok'?'#4ade80':status==='err'?'#ff3b3b':'#ffb020';
    m.innerHTML=(on?'🎤':'🔇')+'<i style="position:absolute;top:4px;right:4px;width:9px;height:9px;border-radius:50%;background:'+dot+';box-shadow:0 0 4px '+dot+'"></i>';
    m.style.cssText=base+'background:'+(on?'#2fbf71':'#3a3560')+';opacity:'+((forced||(connected&&!pubOK))?.6:1);
  }
  if(s){
    s.textContent=muted?'🔈':'🔊';
    s.style.cssText=base+'background:'+(muted?'#c0392b':'#1f8f4e');
  }
}
async function syncMic(){
  if(!cl||!connected)return;
  const want=eff();
  try{
    if(want&&!mic){
      mic=await RTC.createMicrophoneAudioTrack({AEC:true,ANS:true,AGC:true});
      await cl.publish([mic]);
    }else if(mic){
      await mic.setEnabled(want);
      if(want&&!cl.localTracks.includes(mic))await cl.publish([mic]);
    }
  }catch(e){
    console.error('mic',e);
    try{if(mic)mic.close()}catch(x){}
    mic=null;
    if(forced==null)userMic=false;
    note((e&&e.code==='PERMISSION_DENIED')?'اسمح للمتصفح باستخدام المايك (من إعدادات الموقع)':'تعذر تشغيل المايك: '+errText(e),6000);
  }
  updateUI();
}
/* يجدد التوكن ويعرف صلاحية الكلام الحالية من السيرفر */
async function refresh(){
  if(!cl||!connected||!code||busy)return;
  busy=true;
  try{
    const d=await fetchToken('mafia-'+code);
    if(!cl)return;
    await cl.renewToken(d.token);
    pubOK=!!d.pub;
    await syncMic();
  }catch(e){console.warn('refresh',e)}
  finally{busy=false}
}
export async function release(keep){
  gen++;
  clearInterval(timer);clearInterval(rtimer);timer=rtimer=null;
  const c=cl,m=mic;
  cl=null;mic=null;connected=false;userMic=false;forced=null;code=null;status='idle';pubOK=false;busy=false;
  if(!keep)lastJoin=null;
  document.querySelectorAll('.seat.vspk').forEach(e=>e.classList.remove('vspk'));
  try{if(m){m.stop();m.close()}}catch(e){}
  try{if(c)await c.leave()}catch(e){}
}
/* ينادى عند دخول الغرفة: قناة الصوت = كود الغرفة */
export async function join(room,uid){
  await release(true);
  const my=++gen;
  lastJoin={room,uid};
  code=room;me=uid;status='busy';css();updateUI();
  try{
    RTC=await load();
    if(my!==gen)return;
    try{RTC.setLogLevel(3)}catch(e){}
    RTC.onAudioAutoplayFailed=()=>{
      note('اضغط أي مكان عشان يشتغل صوت اللاعبين',6000);
      document.addEventListener('click',()=>{if(cl)cl.remoteUsers.forEach(u=>{try{u.audioTrack&&u.audioTrack.play()}catch(e){}})},{once:true});
    };
    const c=RTC.createClient({mode:'rtc',codec:'vp8'});
    c.on('user-published',async(u,t)=>{
      if(t!=='audio')return;
      try{await c.subscribe(u,t);u.audioTrack.setVolume(muted?0:vol());u.audioTrack.play()}catch(e){console.error('sub',e)}
    });
    c.on('connection-state-change',cur=>{
      if(my!==gen)return;
      status=cur==='CONNECTED'?'ok':(cur==='CONNECTING'||cur==='RECONNECTING')?'busy':'err';
      updateUI();
    });
    c.on('token-privilege-will-expire',refresh);
    c.on('token-privilege-did-expire',refresh);
    const ch='mafia-'+room,d=await fetchToken(ch);
    if(my!==gen)return;
    pubOK=!!d.pub;
    await c.join(d.appId,ch,d.token,d.uid);
    if(my!==gen){try{await c.leave()}catch(e){}return}
    cl=c;connected=true;status='ok';lastErr='';
    timer=setInterval(tick,300);
    rtimer=setInterval(refresh,15000);
    applyVolume();updateUI();note('🎙️ متصل بالصوت',1800);
    await syncMic();
  }catch(e){
    console.error('join',e);
    status='err';lastErr='مشكلة بالصوت: '+errText(e);updateUI();
    note(lastErr,9000);
  }
}
export function html(){
  return '<button id="vmc" aria-label="المايك">🎤</button><button id="vsp" aria-label="الصوت">🔊</button>';
}
export function bind(t){
  if(t)tt=t;
  const m=document.getElementById('vmc'),s=document.getElementById('vsp');
  if(m)m.onclick=()=>{
    if(status==='err'&&lastJoin){note(lastErr+' — جاري إعادة المحاولة',5000);join(lastJoin.room,lastJoin.uid);return}
    if(forced==='on'){note('دورك تتكلم، المايك شغال',2000);return}
    if(forced==='off'||(connected&&!pubOK)){note('المايك مقفل الحين',2000);return}
    userMic=!userMic;updateUI();syncMic();
  };
  if(s)s.onclick=()=>{muted=!muted;applyVolume();updateUI()};
  updateUI();
}
/* 'on' = دورك، 'off' = مقفل، null = حر. والسيرفر هو اللي يفرض فعليًا */
export function force(f,t){
  if(t)tt=t;
  const ch=forced!==(f||null);
  forced=f||null;
  updateUI();
  if(ch){syncMic();refresh();setTimeout(refresh,900)}
}
