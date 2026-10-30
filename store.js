import {getApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getFirestore,doc,updateDoc} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const db=getFirestore(getApp());
let X=null,ob=null;
/* [الدور, الاسم, الإيموجي, سعر عملة المافيا, سعر عملة المحقق, صورة] */
export const CARDS=[
  ['mafia','المافيا','🔪',25,500,'card-mafia.jpg'],
  ['doctor','الطبيب','💉',15,350,'card-doctor.jpg'],
  ['detective','المحقق','🕵️',25,450,'card-detective.jpg'],
  ['sorcerer','الساحر','🧙',25,450,''],
  ['sniper','القناص','🎯',15,350,''],
  ['joker','الجوكر','🃏',25,500,'']
];
const num=n=>Number(n||0).toLocaleString('en');
const esc=s=>X.esc(s);
export function init(c){
  X=c;
  if(!ob){ob=new MutationObserver(run);ob.observe(document.body,{childList:true,subtree:true})}
}
/* يستبدل "المتجر قريبًا" بالمتجر الحقيقي */
function run(){
  if(!X||!X.prof)return;
  const e=document.querySelector('#app .list > .empty');
  if(!e||!e.textContent.includes('المتجر'))return;
  const l=e.parentElement;
  if(l.dataset.st)return;
  l.dataset.st='1';render(l);
}
function render(l){
  const p=X.prof,have=p.cards||{};
  const chip='display:flex;align-items:center;gap:6px;background:#f4f3fa;border-radius:20px;padding:6px 14px;font-weight:700';
  const btn=(c,cur)=>'<button class="mini ok" data-r="'+c[0]+'" data-c="'+cur+'" style="margin:2px;padding:8px 10px">'+(cur==='gems'?c[3]:c[4])+' <i class="ic ic-'+(cur==='gems'?'mafia':'det')+'" style="width:16px;height:16px;vertical-align:middle"></i></button>';
  l.style.padding='0 12px 16px';
  l.innerHTML='<div style="display:flex;gap:10px;justify-content:center;margin:6px 0 14px"><span style="'+chip+'"><i class="ic ic-mafia"></i>'+num(p.gems)+'</span><span style="'+chip+'"><i class="ic ic-det"></i>'+num(p.coins)+'</span></div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'+CARDS.map(c=>
      '<div style="background:#f4f3fa;border-radius:16px;padding:12px;text-align:center">'+
      (c[5]?'<img src="'+c[5]+'" alt="" style="width:80px;height:auto;border-radius:10px">':'<div style="font-size:52px;height:100px;line-height:100px">'+c[2]+'</div>')+
      '<div style="font-weight:800;margin:6px 0 2px">'+c[1]+'</div>'+
      '<div style="color:#8a8aa0;font-size:12px;margin-bottom:6px">عندك: '+(have[c[0]]||0)+'</div>'+
      btn(c,'gems')+btn(c,'coins')+'</div>').join('')+'</div>'+
    '<p style="text-align:center;font-size:12px;color:#8a8aa0">استخدم البطاقة في أول 10 ثواني من اللعبة لتضمن دورك</p>';
  l.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>buy(l,b.dataset.r,b.dataset.c));
}
function buy(l,r,cur){
  const c=CARDS.find(x=>x[0]===r),price=cur==='gems'?c[3]:c[4],p=X.prof;
  if((p[cur]||0)<price){X.toast('رصيدك ما يكفي');return}
  const o=document.createElement('div');o.className='ov dlg';
  o.innerHTML='<div class="dg"><p>تشتري كرت '+esc(c[1])+' بـ '+price+' <i class="ic ic-'+(cur==='gems'?'mafia':'det')+'" style="width:16px;height:16px;vertical-align:middle"></i> ؟</p><div class="two"><button class="btn alt" id="sn">إلغاء</button><button class="btn" id="sy">تأكيد</button></div></div>';
  document.body.appendChild(o);
  o.onclick=e=>{if(e.target===o)o.remove()};
  o.querySelector('#sn').onclick=()=>o.remove();
  o.querySelector('#sy').onclick=async()=>{
    o.remove();
    const cards={...(p.cards||{})};cards[r]=(cards[r]||0)+1;
    const bal=(p[cur]||0)-price;
    try{
      await updateDoc(doc(db,'users',X.me.uid),{[cur]:bal,cards});
      p[cur]=bal;p.cards=cards;
      X.toast('تم الشراء ✅');
      if(l.isConnected)render(l);
    }catch(e){X.toast('مشكلة: '+e.code)}
  };
}
