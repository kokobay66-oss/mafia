/* الصوت: موسيقى الغرفة + خانة الصوت في الإعدادات (المؤثرات تنربط بالأزرار لاحقًا) */
const KM='mj_music',KS='mj_sfx';
const rd=(k,d)=>{try{const v=localStorage.getItem(k);if(v===null)return d;const n=+v;return isNaN(n)?d:Math.max(0,Math.min(100,n))}catch(e){return d}};
const wr=(k,v)=>{try{localStorage.setItem(k,String(v))}catch(e){}};
/* الافتراضي 30% لين اللاعب يغيّرها بنفسه */
export const music=()=>rd(KM,30);
export const sfx=()=>rd(KS,100);
let a=null,inRoom=false,prev=false,lastM=30,lastF=100;
function el(){if(!a){a=new Audio('music.mp3');a.loop=true;a.preload='auto'}return a}
function apply(){
  const v=music()/100,x=el();
  x.volume=v;
  if(v===0||(!inRoom&&!prev)){x.pause();return}
  x.play().catch(()=>{});
}
export function startRoom(){inRoom=true;apply()}
export function stopRoom(){inRoom=false;apply();if(!prev&&a)try{a.currentTime=0}catch(e){}}

const CSS='.snd-r{-webkit-appearance:none;appearance:none;height:8px;border-radius:6px;outline:none;padding:0!important;margin:0!important;border:0!important;background:linear-gradient(to right,#e0475b var(--p,30%),#d9d6e8 var(--p,30%))!important}'+
'.snd-r::-webkit-slider-thumb{-webkit-appearance:none;width:26px;height:26px;border-radius:50%;background:#fff;border:4px solid #e0475b;box-shadow:0 2px 8px rgba(0,0,0,.35)}'+
'.snd-r::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:#fff;border:4px solid #e0475b;box-shadow:0 2px 8px rgba(0,0,0,.35)}';
const sl=(id,t,v)=>'<div style="margin:16px 0"><div style="display:flex;justify-content:space-between;font-weight:700"><span>'+t+'</span><span id="'+id+'v">'+v+'%</span></div><div style="display:flex;align-items:center;gap:12px;direction:ltr;margin-top:10px"><span id="'+id+'i" style="cursor:pointer;font-size:22px;width:28px;text-align:center">'+(v?'🔊':'🔇')+'</span><input class="snd-r" id="'+id+'" type="range" min="0" max="100" step="1" value="'+v+'" style="flex:1;--p:'+v+'%"></div></div>';
function sheet(){
  prev=false;
  const o=document.createElement('div');o.className='ov';
  o.innerHTML='<div class="sh"><div class="shh"><b>🔊 الصوت</b><button class="mini" id="sx">✕</button></div>'+sl('sm','🎵 الموسيقى',music())+sl('sf','🔔 المؤثرات الصوتية',sfx())+'<p class="c" style="font-size:12px;margin:4px 0 0">الموسيقى تشتغل تلقائي بـ 30% لما تدخل الغرفة، وإذا غيّرتها هنا تنحفظ على اختيارك</p></div>';
  document.body.appendChild(o);
  const q=i=>o.querySelector('#'+i);
  const close=()=>{prev=false;o.remove();apply()};
  o.onclick=e=>{if(e.target===o||e.target.id==='sx')close()};
  const bind=(id,key,get,onSet)=>{
    const r=q(id),set=v=>{
      v=Math.max(0,Math.min(100,v));wr(key,v);r.value=v;r.style.setProperty('--p',v+'%');
      q(id+'v').textContent=v+'%';q(id+'i').textContent=v?'🔊':'🔇';
      if(v>0){if(id==='sm')lastM=v;else lastF=v}
      onSet(v);
    };
    r.oninput=()=>set(+r.value);
    q(id+'i').onclick=()=>set(get()>0?0:(id==='sm'?lastM:lastF)||30);
  };
  bind('sm',KM,music,()=>{prev=true;apply()});
  bind('sf',KS,sfx,()=>{});
}
/* يضيف زر "الصوت" في صفحة الإعدادات */
function run(){
  const g=document.getElementById('s-gn');
  if(!g||document.getElementById('s-snd'))return;
  const row=document.createElement('div');row.className='ir';row.id='s-snd';
  row.innerHTML='<span class="k">🔊 الصوت</span><span class="v"></span>';
  g.after(row);
  row.onclick=sheet;
}
export function init(){
  if(!document.getElementById('sndc')){const s=document.createElement('style');s.id='sndc';s.textContent=CSS;document.head.appendChild(s)}
  new MutationObserver(run).observe(document.body,{childList:true,subtree:true});
}
