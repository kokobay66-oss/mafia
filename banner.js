import {getApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,doc,getDoc,setDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const db=getFirestore(getApp());
const cache=new Map();
export const ok=s=>typeof s==='string'&&s.startsWith('data:image/')&&!/["')\s]/.test(s);

/* جلب بانر لاعب (من كولكشن banners) */
export async function get(u){
  if(cache.has(u))return cache.get(u);
  let i=null;
  try{const s=await getDoc(doc(db,'banners',u));if(s.exists()&&ok(s.data().img))i=s.data().img}catch(e){}
  cache.set(u,i);return i;
}
/* قص البانر: تحرّك الصورة وتكبّرها داخل إطار بالمقاس الثابت */
function crop(file){
  return new Promise((res,rej)=>{
    const url=URL.createObjectURL(file),im=new Image();
    im.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('صورة غير صالحة'))};
    im.onload=()=>{
      const W=900,H=420,fw=Math.min(window.innerWidth-32,460),fh=Math.round(fw*H/W);
      const k0=Math.max(fw/im.width,fh/im.height);
      let z=1,x=0,y=0;
      const o=document.createElement('div');
      o.style.cssText='position:fixed;inset:0;z-index:10000;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:16px;touch-action:none;color:#fff;direction:rtl';
      const bt='flex:1;padding:12px;border:0;border-radius:12px;font-size:16px;cursor:pointer;margin:0;';
      o.innerHTML='<p style="margin:0;color:#ccc;font-size:14px">حرّك الصورة وكبّرها بالمقاس اللي تبيه</p>'+
        '<div id="cf" style="width:'+fw+'px;height:'+fh+'px;position:relative;overflow:hidden;border:2px solid #fff;border-radius:12px;background:#222;touch-action:none"><img id="ci" alt="" draggable="false" src="'+url+'" style="position:absolute;max-width:none;user-select:none;-webkit-user-drag:none;pointer-events:none"></div>'+
        '<input id="cz" type="range" min="1" max="4" step="0.01" value="1" style="width:'+fw+'px;margin:0;padding:0">'+
        '<div style="display:flex;gap:10px;width:'+fw+'px"><button id="cn" style="'+bt+'background:#333;color:#fff">إلغاء</button><button id="cy" style="'+bt+'background:linear-gradient(135deg,#e0475b,#ff7a59);color:#fff;font-weight:800">تأكيد</button></div>';
      document.body.appendChild(o);
      const q=i=>o.querySelector('#'+i),box=q('cf'),ci=q('ci');
      const sc=()=>k0*z;
      const paint=()=>{
        x=Math.min(0,Math.max(fw-im.width*sc(),x));y=Math.min(0,Math.max(fh-im.height*sc(),y));
        ci.style.width=im.width*sc()+'px';ci.style.height=im.height*sc()+'px';ci.style.left=x+'px';ci.style.top=y+'px';
      };
      x=(fw-im.width*sc())/2;y=(fh-im.height*sc())/2;paint();
      const setZ=nz=>{
        const cx=(fw/2-x)/sc(),cy=(fh/2-y)/sc();
        z=Math.min(4,Math.max(1,nz));
        x=fw/2-cx*sc();y=fh/2-cy*sc();q('cz').value=z;paint();
      };
      q('cz').oninput=e=>setZ(+e.target.value);
      const ps=new Map();let d0=0,z0=1;
      box.onpointerdown=e=>{
        box.setPointerCapture(e.pointerId);ps.set(e.pointerId,{x:e.clientX,y:e.clientY});
        if(ps.size===2){const [a,b]=[...ps.values()];d0=Math.hypot(a.x-b.x,a.y-b.y);z0=z}
      };
      box.onpointermove=e=>{
        const p=ps.get(e.pointerId);if(!p)return;
        if(ps.size===1){x+=e.clientX-p.x;y+=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;paint()}
        else{p.x=e.clientX;p.y=e.clientY;const [a,b]=[...ps.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(d0)setZ(z0*d/d0)}
      };
      const up=e=>{ps.delete(e.pointerId);d0=0};
      box.onpointerup=up;box.onpointercancel=up;
      const close=()=>{o.remove();URL.revokeObjectURL(url)};
      q('cn').onclick=()=>{close();res(null)};
      q('cy').onclick=()=>{
        const c=document.createElement('canvas');c.width=W;c.height=H;
        c.getContext('2d').drawImage(im,-x/sc(),-y/sc(),fw/sc(),fh/sc(),0,0,W,H);
        const out=c.toDataURL('image/jpeg',.78);close();res(out);
      };
    };
    im.src=url;
  });
}
/* اختيار صورة وقصها وحفظها كبانر */
export function pick(uid,done){
  const f=document.createElement('input');f.type='file';f.accept='image/*';
  f.onchange=async()=>{
    const file=f.files[0];if(!file)return;
    try{
      const img=await crop(file);
      if(!img)return;
      await setDoc(doc(db,'banners',uid),{img,at:serverTimestamp()});
      cache.set(uid,img);done(img,null);
    }catch(e){done(null,e)}
  };
  f.click();
}

/* تنسيق البانر في تبويب "أنا" وفي "هكذا يراك اللاعبون" */
const CSS='.meh.hasb{padding-top:140px}'+
'.meh.hasb .mebg{top:0;left:0;width:100%;height:100%;filter:none;opacity:1;object-position:center top;-webkit-mask-image:linear-gradient(#000 50%,transparent 96%);mask-image:linear-gradient(#000 50%,transparent 96%)}'+
'nav{position:fixed;left:0;right:0;bottom:0;max-width:480px;margin:0 auto;z-index:40}body.light nav{background:#fff}#app:has(>nav){padding-bottom:calc(104px + env(safe-area-inset-bottom))}'+
'.bnp{position:absolute;top:12px;right:12px;z-index:5;width:38px;height:38px;border-radius:50%;border:0;background:rgba(0,0,0,.45);color:#fff;font-size:17px;padding:0;margin:0;cursor:pointer}';
const toast=m=>{const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2200)};
function apply(el,img){
  const bg=el.querySelector('.mebg');
  if(bg&&ok(img))bg.src=img;
  el.classList.add('hasb');
}
async function deco(el,uid){
  el.dataset.bn='1';
  if(el.id==='meh'){
    const b=document.createElement('button');b.className='bnp';b.textContent='✏️';
    b.onclick=e=>{e.stopPropagation();pick(uid,(img,err)=>{if(img){apply(el,img);toast('تم تحديث البانر ✅')}else toast('مشكلة: '+((err&&(err.code||err.message))||''))})};
    el.appendChild(b);
  }
  const img=await get(uid);
  if(img)apply(el,img);
}
let ob=null;
function watch(uid){
  if(!document.getElementById('bnc')){const s=document.createElement('style');s.id='bnc';s.textContent=CSS;document.head.appendChild(s)}
  if(ob)ob.disconnect();
  const run=()=>document.querySelectorAll('.meh:not([data-bn])').forEach(el=>deco(el,uid));
  ob=new MutationObserver(run);ob.observe(document.body,{childList:true,subtree:true});run();
}
onAuthStateChanged(getAuth(getApp()),u=>{
  if(u)watch(u.uid);
  else if(ob){ob.disconnect();ob=null}
});
