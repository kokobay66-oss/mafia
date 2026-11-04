/* زر "يلعب الأصدقاء": يعرض أصدقاءك اللي داخل غرف الحين وتنضم لهم */
import {getApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getFirestore,doc,getDoc,setDoc,deleteDoc,getDocs,collection,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const db=getFirestore(getApp());
let X=null,join=null,hb=null,cur=null,ob=null;
const esc=s=>X?X.esc(s):String(s||'');

/* ===== حضورك: وين أنت الحين (يتجدد كل 25 ثانية وأنت داخل غرفة) ===== */
async function beat(){
  if(!cur||!X||!X.me)return;
  try{await setDoc(doc(db,'presence',X.me.uid),{room:cur,at:serverTimestamp()})}catch(e){}
}
export function setRoom(code){cur=code;beat();clearInterval(hb);hb=setInterval(beat,25000)}
export function clearRoom(){
  const had=cur;cur=null;clearInterval(hb);hb=null;
  if(had&&X&&X.me)deleteDoc(doc(db,'presence',X.me.uid)).catch(()=>{});
}

/* ===== معلومات صديق وغرفته ===== */
async function info(fid){
  try{
    const p=await getDoc(doc(db,'presence',fid));
    if(!p.exists())return null;
    const d=p.data(),t=d.at&&d.at.toMillis?d.at.toMillis():0;
    if(Date.now()-t>120000)return null;
    const rs=await getDoc(doc(db,'rooms',d.room));
    if(!rs.exists())return null;
    const r=rs.data();
    const [ps,pl]=await Promise.all([getDoc(doc(db,'profiles',fid)),getDocs(collection(db,'rooms',d.room,'players'))]);
    const pr=ps.exists()?ps.data():{};
    return {fid,code:d.room,name:pr.name||'لاعب',photo:pr.photo||'',mode:r.mode||'classic',locked:!!r.pwh,status:r.status,max:r.max||10,n:pl.docs.filter(x=>!x.data().spec).length,rname:r.name||''};
  }catch(e){return null}
}

/* ===== الشاشة ===== */
function screen(){
  if(!X||!X.me)return;
  const o=document.createElement('div');
  o.style.cssText='position:fixed;inset:0;z-index:9000;background:#120f22;color:#f3f0ff;overflow-y:auto;direction:rtl';
  o.innerHTML='<div style="max-width:480px;margin:0 auto;padding:16px"><div style="display:flex;align-items:center;gap:12px;margin-bottom:14px"><button id="fb" style="width:44px;height:44px;margin:0;padding:0;border-radius:50%;border:1px solid #2f2b4a;background:#1c1930;color:#fff;font-size:20px;cursor:pointer;flex:none">➜</button><h1 style="margin:0;font-size:22px;flex:1">يلعب الأصدقاء</h1><button id="fr" style="width:44px;height:44px;margin:0;padding:0;border-radius:50%;border:1px solid #2f2b4a;background:#1c1930;color:#fff;font-size:18px;cursor:pointer;flex:none">🔄</button></div><div id="fl"></div></div>';
  document.body.appendChild(o);
  const el=o.querySelector('#fl');
  let alive=true;
  const close=()=>{alive=false;clearInterval(t);o.remove()};
  o.querySelector('#fb').onclick=close;
  const tag=m=>'<span style="background:'+(m==='mad'?'#b3122a':'#8b5a2b')+';color:#fff;border-radius:10px;padding:2px 10px;font-size:11px">'+(m==='mad'?'دموي':'كلاسيكي')+'</span>';
  const load=async()=>{
    if(!el.children.length)el.innerHTML='<p style="text-align:center;color:#9d97bd;padding:30px">جاري البحث...</p>';
    let list=[];
    try{
      const fs=await getDocs(collection(db,'users',X.me.uid,'friends'));
      const ids=fs.docs.filter(d=>d.data().status==='friends').map(d=>d.id);
      list=(await Promise.all(ids.map(info))).filter(Boolean);
    }catch(e){if(alive)el.innerHTML='<p style="text-align:center;color:#ff7a7a">مشكلة: '+esc(e.code||e.message)+'</p>';return}
    if(!alive)return;
    if(!list.length){el.innerHTML='<div style="text-align:center;color:#9d97bd;padding:50px 10px;line-height:2"><div style="font-size:50px">🎮</div>ما فيه أصدقاء يلعبون الحين</div>';return}
    el.innerHTML=list.map(f=>{
      const full=f.n>=f.max,playing=f.status==='playing';
      const btn=f.locked?'<button data-a="lock" style="width:auto;margin:0;padding:10px 16px;border:1px solid #3a3560;border-radius:14px;background:#252040;color:#fff;font-size:18px">🔒</button>'
        :(full||playing)?'<button data-a="spec" data-c="'+f.code+'" style="width:auto;margin:0;padding:10px 14px;border:0;border-radius:14px;background:#3a3560;color:#fff;font-size:14px;cursor:pointer">👁 مشاهدة</button>'
        :'<button data-a="join" data-c="'+f.code+'" style="width:auto;margin:0;padding:10px 16px;border:0;border-radius:14px;background:linear-gradient(135deg,#e0475b,#ff7a59);color:#fff;font-size:15px;font-weight:700;cursor:pointer">انضمام</button>';
      return '<div style="display:flex;align-items:center;gap:12px;background:#1c1930;border:1px solid #2f2b4a;border-radius:18px;padding:12px;margin-bottom:10px"><img src="'+esc(f.photo)+'" alt="" style="width:50px;height:50px;border-radius:50%;object-fit:cover;background:#333;flex:none"><div style="flex:1;min-width:0"><div style="font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(f.name)+'</div><div style="display:flex;align-items:center;gap:8px;margin-top:5px;font-size:12px;color:#b9b3d8">'+tag(f.mode)+'<span>👥 '+f.n+'/'+f.max+'</span>'+(playing?'<span>▶️ بدأت</span>':'')+'</div></div>'+btn+'</div>';
    }).join('');
    el.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{
      if(b.dataset.a==='lock'){X.toast('الغرفة مقفلة بكلمة سر');return}
      close();join&&join(b.dataset.c,b.dataset.a==='spec');
    });
  };
  const t=setInterval(load,10000);
  o.querySelector('#fr').onclick=load;
  load();
}

/* ===== يربط زر "يلعب الأصدقاء" في الرئيسية ===== */
function run(){
  const q=document.getElementById('q3');
  if(!q||q.dataset.fr)return;
  q.dataset.fr='1';q.onclick=screen;
}
export function init(c,j){
  X=c;join=j;
  if(!ob){ob=new MutationObserver(run);ob.observe(document.body,{childList:true,subtree:true})}
}
