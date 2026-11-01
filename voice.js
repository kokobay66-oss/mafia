/* الصوت المباشر (المايكات) عبر Agora: قناة لكل غرفة، والمايك والسماعة */
const APP='698790109ce54564bc4dbc51d038666c';
const SDK='https://cdn.jsdelivr.net/npm/agora-rtc-sdk-ng@4.20/AgoraRTC_N.js';
let RTC=null,cl=null,code=null,me=null,mic=null,userMic=false,forced=null,tt=()=>{},muted=false,connected=false,timer=null,gen=0;
let status='idle',lastErr='',lastJoin=null;
/* صوت اللاعبين: 100 افتراضي، ويتغير بس من الإعدادات وينحفظ */
const vol=()=>{try{const v=localStorage.getItem('mj_voice');return v===null?100:Math.max(0,Math.min(100,+v||0))}catch(e){return 100}};
const eff=()=>forced==='on'?true:forced==='off'?false:userMic;
const errText=e=>String((e&&(e.code||e.message))||e||'غير معروف');
/* رسالة تبقى فترة أطول من التوست العادي */
function note(msg,ms){
  const t=document.createElement('div');t.className='toast';t.textContent=msg;
  document.body.appendChild(t);setTimeout(()=>t.remove(),ms||3000);
}
function load(){
  if(window.AgoraRTC)return Promise.resolve(window.AgoraRTC);
  return new Promise((res,rej)=>{
    const s=document.createElement('script');s.src=SDK;
    s.onload=()=>window.AgoraRTC?res(window.AgoraRTC):rej(new Error('sdk'));
    s.onerror=()=>rej(new Error('تعذر تحميل مكتبة الصوت (جرّب تحدّث الصفحة)'));
    document.head.appendChild(s);
  });
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
    m.style.cssText=base+'background:'+(on?'#2fbf71':'#3a3560')+';opacity:'+(forced?.6:1);
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
    }
  }catch(e){
    console.error('mic',e);
    mic=null;
    if(forced==null)userMic=false;
    note((e&&e.code==='PERMISSION_DENIED')?'اسمح للمتصفح باستخدام المايك (من إعدادات الموقع)':'تعذر تشغيل المايك: '+errText(e),6000);
  }
  updateUI();
}
export async function release(keep){
  gen++;
  clearInterval(timer);timer=null;
  const c=cl,m=mic;
  cl=null;mic=null;connected=false;userMic=false;forced=null;code=null;status='idle';
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
    /* لو المتصفح منع تشغيل الصوت أوتوماتيك: أي ضغطة تشغله */
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
    await c.join(APP,'mafia-'+room,null,uid);
    if(my!==gen){try{await c.leave()}catch(e){}return}
    cl=c;connected=true;status='ok';lastErr='';
    timer=setInterval(tick,300);
    applyVolume();updateUI();note('🎙️ متصل بالصوت',1800);
    await syncMic();
  }catch(e){
    console.error('join',e);
    status='err';lastErr='مشكلة بالصوت: '+errText(e);updateUI();
    note(lastErr,7000);
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
    if(forced){note(forced==='on'?'دورك تتكلم، المايك شغال':'المايك مقفل الحين',2000);return}
    userMic=!userMic;updateUI();syncMic();
  };
  if(s)s.onclick=()=>{muted=!muted;applyVolume();updateUI()};
  updateUI();
}
/* 'on' = المايك مفتوح غصب (دورك) ، 'off' = مقفل غصب ، null = على اختيار اللاعب */
export function force(f,t){
  if(t)tt=t;
  const ch=forced!==(f||null);
  forced=f||null;
  updateUI();
  if(ch)syncMic();
}
