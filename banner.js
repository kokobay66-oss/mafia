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
const shrink=file=>new Promise((res,rej)=>{
  const r=new FileReader();r.onerror=rej;
  r.onload=()=>{const im=new Image();im.onerror=rej;im.onload=()=>{
    const W=900,H=420,c=document.createElement('canvas');c.width=W;c.height=H;
    const x=c.getContext('2d'),k=Math.max(W/im.width,H/im.height),w=im.width*k,h=im.height*k;
    x.drawImage(im,(W-w)/2,(H-h)/2,w,h);res(c.toDataURL('image/jpeg',.72));
  };im.src=r.result};
  r.readAsDataURL(file);
});
/* اختيار صورة وحفظها كبانر */
export function pick(uid,done){
  const f=document.createElement('input');f.type='file';f.accept='image/*';
  f.onchange=async()=>{
    const file=f.files[0];if(!file)return;
    try{
      const img=await shrink(file);
      await setDoc(doc(db,'banners',uid),{img,at:serverTimestamp()});
      cache.set(uid,img);done(img,null);
    }catch(e){done(null,e)}
  };
  f.click();
}

/* تنسيق البانر في تبويب "أنا" وفي "هكذا يراك اللاعبون" */
const CSS='.meh.hasb{padding-top:140px}'+
'.meh.hasb .mebg{top:0;left:0;width:100%;height:100%;filter:none;opacity:1;object-position:center top;-webkit-mask-image:linear-gradient(#000 50%,transparent 96%);mask-image:linear-gradient(#000 50%,transparent 96%)}'+
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
