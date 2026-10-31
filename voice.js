/* الصوت المباشر (المايكات) عبر Agora: قناة لكل غرفة، والمايك والسماعة */
const APP='698790109ce54564bc4dbc51d038666c';
const SDK='https://cdn.jsdelivr.net/npm/agora-rtc-sdk-ng@4.20/AgoraRTC_N.js';
let RTC=null,cl=null,code=null,me=null,mic=null,userMic=false,forced=null,tt=()=>{},muted=false,connected=false,timer=null,gen=0;
/* صوت اللاعبين: 100 افتراضي، ويتغير بس من الإعدادات وينحفظ */
const vol=()=>{try{const v=localStorage.getItem('mj_voice');return v===null?100:Math.max(0,Math.min(100,+v||0))}catch(e){return 100}};
const eff=()=>forced==='on'?true:forced==='off'?false:userMic;
function load(){
  if(window.AgoraRTC)return Promise.resolve(window.AgoraRTC);
  return new Promise((res,rej)=>{
    const s=document.createElement('script');s.src=SDK;
    s.onload=()=>window.AgoraRTC?res(window.AgoraRTC):rej(new Error('sdk'));
    s.onerror=()=>rej(new Error('تعذر تحميل مكتبة الصوت'));
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
  const base='width:44px;height:44px;border-radius:14px;border:0;margin:0;padding:0;font-size:20px;color:#fff;flex:none;';
  if(m){
    const on=eff();
    m.textContent=on?'🎤':'🔇';
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
    if(mic&&!cl)mic=null;
    if(forced==null)userMic=false;
    tt((e&&e.code==='PERMISSION_DENIED')?'اسمح للمتصفح باستخدام المايك':'تعذر تشغيل المايك');
  }
  updateUI();
}
export async function release(){
  gen++;
  clearInterval(timer);timer=null;
  const c=cl,m=mic;
  cl=null;mic=null;connected=false;userMic=false;forced=null;code=null;
  document.querySelectorAll('.seat.vspk').forEach(e=>e.classList.remove('vspk'));
  try{if(m){m.stop();m.close()}}catch(e){}
  try{if(c)await c.leave()}catch(e){}
}
/* ينادى عند دخول الغرفة: قناة الصوت = كود الغرفة */
export async function join(room,uid){
  await release();
  const my=++gen;
  code=room;me=uid;css();
  try{
    RTC=await load();
    if(my!==gen)return;
    try{RTC.setLogLevel(3)}catch(e){}
    const c=RTC.createClient({mode:'rtc',codec:'vp8'});
    c.on('user-published',async(u,t)=>{
      if(t!=='audio')return;
      try{await c.subscribe(u,t);u.audioTrack.setVolume(muted?0:vol());u.audioTrack.play()}catch(e){}
    });
    await c.join(APP,'mafia-'+room,null,uid);
    if(my!==gen){try{await c.leave()}catch(e){}return}
    cl=c;connected=true;
    timer=setInterval(tick,300);
    applyVolume();updateUI();await syncMic();
  }catch(e){
    tt('مشكلة بالصوت: '+((e&&(e.code||e.message))||e));
  }
}
export function html(){
  return '<button id="vmc" aria-label="المايك">🎤</button><button id="vsp" aria-label="الصوت">🔊</button>';
}
export function bind(t){
  if(t)tt=t;
  const m=document.getElementById('vmc'),s=document.getElementById('vsp');
  if(m)m.onclick=()=>{
    if(forced){tt(forced==='on'?'دورك تتكلم، المايك شغال':'المايك مقفل الحين');return}
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
