import {getApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getFirestore,doc,updateDoc} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const db=getFirestore(getApp());
let X=null,ob=null,shown=false;
/* مكافآت الأيام السبعة (عملة المحقق) */
const REW=[10,10,15,20,25,30,50];
const num=n=>Number(n||0).toLocaleString('en');
const p2=n=>String(n).padStart(2,'0');
const ds=d=>d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate());
/* الأسبوع يبدأ السبت */
const weekStart=()=>{const d=new Date();d.setDate(d.getDate()-((d.getDay()+1)%7));return ds(d)};
function state(){
  const p=X.prof,d=p.daily||{},today=ds(new Date()),wk=weekStart();
  const n=d.wk===wk?(d.n||0):0,done=d.last===today;
  return {today,wk,n,done,can:!done&&n<7};
}
function grid(){
  const st=state();
  return '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:14px 0">'+REW.map((r,i)=>{
    const claimed=i<st.n,cur=i===st.n&&st.can;
    const bg=claimed?'#24324a':cur?'linear-gradient(135deg,#e0475b,#ff7a59)':'#252040';
    return '<div style="background:'+bg+';border:1px solid '+(cur?'#ffb35c':'#3a3560')+';border-radius:14px;padding:10px 4px;text-align:center;'+(i===6?'grid-column:span 2;':'')+'"><div style="font-size:12px;color:#d6d0f0">اليوم '+(i+1)+'</div><div style="font-size:22px;font-weight:800;margin:4px 0">'+r+'</div><div><i class="ic ic-det" style="width:18px;height:18px"></i></div><div style="font-size:12px;height:16px">'+(claimed?'✔ تم':cur?'اليوم':'')+'</div></div>';
  }).join('')+'</div>';
}
function body(){
  const st=state();
  return grid()+(st.can?'<button class="btn" id="dcl" style="font-size:17px;padding:14px">استلام مكافأة اليوم</button>':'<p style="text-align:center;color:#9d97bd;margin:6px 0">'+(st.n>=7?'خلصت مكافآت هذا الأسبوع، تتجدد يوم السبت':'استلمت مكافأة اليوم، ارجع بكرة')+'</p>');
}
async function claim(done){
  const st=state();if(!st.can)return;
  const r=REW[st.n],p=X.prof,daily={wk:st.wk,n:st.n+1,last:st.today},coins=(p.coins||0)+r;
  try{
    await updateDoc(doc(db,'users',X.me.uid),{coins,daily});
    p.coins=coins;p.daily=daily;
    document.querySelectorAll('.coin[data-w="coin"]').forEach(e=>{if(e.lastChild)e.lastChild.nodeValue=num(coins)});
    X.toast('تم استلام '+r+' عملة محقق ✅');
    if(done)done();
  }catch(e){X.toast('مشكلة: '+e.code)}
}
/* القائمة المربعة عند الدخول */
function popup(){
  const o=document.createElement('div');
  o.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.68);display:flex;align-items:center;justify-content:center;padding:16px';
  const paint=()=>{
    o.innerHTML='<div style="position:relative;width:100%;max-width:360px;background:#1c1930;border:1px solid #2f2b4a;border-radius:22px;padding:18px;color:#f3f0ff;direction:rtl"><button id="dx" style="position:absolute;top:10px;left:10px;width:36px;height:36px;border-radius:50%;border:0;background:rgba(255,255,255,.1);color:#fff;font-size:18px;padding:0;margin:0;cursor:pointer">✕</button><h2 style="margin:0;text-align:center;font-size:20px">🎁 التسجيل اليومي</h2><p style="text-align:center;color:#9d97bd;margin:4px 0 0;font-size:13px">تتجدد كل أسبوع</p>'+body()+'<p style="text-align:center;color:#9d97bd;font-size:12px;margin:8px 0 0">تلقاها بعد في المهام ← التسجيل اليومي</p></div>';
    o.querySelector('#dx').onclick=()=>o.remove();
    const c=o.querySelector('#dcl');if(c)c.onclick=()=>claim(paint);
  };
  document.body.appendChild(o);paint();
  o.onclick=e=>{if(e.target===o)o.remove()};
}
/* شاشة المهام: المهام يمين، التسجيل اليومي يسار */
function missions(){
  const o=document.createElement('div');
  o.style.cssText='position:fixed;inset:0;z-index:9000;background:#120f22;color:#f3f0ff;overflow-y:auto;direction:rtl';
  let tab='m';
  const paint=()=>{
    const st=state();
    const t=(k,txt,dot)=>'<button data-t="'+k+'" style="flex:1;margin:0;padding:12px;border:0;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;position:relative;color:#fff;background:'+(tab===k?'linear-gradient(135deg,#e0475b,#ff7a59)':'#252040')+'">'+txt+(dot?'<span style="position:absolute;top:6px;left:10px;width:9px;height:9px;border-radius:50%;background:#ff3b3b"></span>':'')+'</button>';
    o.innerHTML='<div style="max-width:480px;margin:0 auto;padding:16px"><div style="display:flex;align-items:center;gap:12px;margin-bottom:14px"><button id="mb" style="width:44px;height:44px;margin:0;padding:0;border-radius:50%;border:1px solid #2f2b4a;background:#1c1930;color:#fff;font-size:20px;cursor:pointer;flex:none">➜</button><h1 style="margin:0;font-size:24px">المهام</h1></div><div style="display:flex;gap:8px">'+t('m','المهام')+t('d','التسجيل اليومي',st.can)+'</div>'+
      (tab==='m'?'<div style="text-align:center;color:#9d97bd;padding:60px 10px;line-height:2"><div style="font-size:54px">📋</div>المهام قريبًا</div>':'<div style="background:#1c1930;border:1px solid #2f2b4a;border-radius:20px;padding:16px;margin-top:14px"><h2 style="margin:0;text-align:center;font-size:19px">🎁 التسجيل اليومي</h2><p style="text-align:center;color:#9d97bd;margin:4px 0 0;font-size:13px">تتجدد كل أسبوع</p>'+body()+'</div>')+'</div>';
    o.querySelector('#mb').onclick=()=>o.remove();
    o.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{tab=b.dataset.t;paint()});
    const c=o.querySelector('#dcl');if(c)c.onclick=()=>claim(paint);
  };
  document.body.appendChild(o);paint();
}
/* يربط زر المهام في الرئيسية ويفتح القائمة مرة عند الدخول */
function run(){
  if(!X||!X.prof)return;
  const q=document.getElementById('q2');
  if(!q||q.dataset.dl)return;
  q.dataset.dl='1';q.onclick=missions;
  if(!shown){shown=true;setTimeout(()=>{if(state().can)popup()},700)}
}
export function init(c){
  X=c;
  if(!ob){ob=new MutationObserver(run);ob.observe(document.body,{childList:true,subtree:true})}
}
