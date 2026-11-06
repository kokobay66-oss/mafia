/* تعديلات صغيرة: عجلات التاريخ، جنس التسجيل، وتأكيد تبديل الحساب */
let X=null;
const CSS='.wh div{scroll-snap-stop:always}.wh{overscroll-behavior:contain}';
function ask(msg,yes){
  const o=document.createElement('div');o.className='ov dlg';
  o.innerHTML='<div class="dg"><p>'+msg+'</p><div class="two"><button class="btn alt" id="tn">إلغاء</button><button class="btn" id="ty">تأكيد</button></div></div>';
  document.body.appendChild(o);
  o.querySelector('#tn').onclick=()=>o.remove();
  o.querySelector('#ty').onclick=()=>{o.remove();yes()};
  o.onclick=e=>{if(e.target===o)o.remove()};
}
/* الأشهر بالأرقام + اهتزاز خفيف مع كل رقم + ثبات (ما تتخطى أرقام بالسحبة) */
function wheels(){
  document.querySelectorAll('.wheels').forEach(w=>{
    if(w.dataset.tw)return;w.dataset.tw='1';
    const m=w.querySelector('#wm');
    if(m)[...m.children].forEach((d,i)=>{d.textContent=String(i+1)});
    w.querySelectorAll('.wh').forEach(el=>{
      let last=-1;
      el.addEventListener('scroll',()=>{
        const i=Math.round(el.scrollTop/40);
        if(i!==last){if(last!==-1&&navigator.vibrate)try{navigator.vibrate(8)}catch(e){}last=i}
      },{passive:true});
    });
  });
}
/* اختيار الجنس في التسجيل: ذكر أزرق / أنثى وردي */
function gender(){
  const sv=document.getElementById('sv'),nm=document.getElementById('nm');
  if(!sv||!nm||document.getElementById('gpk')||!document.querySelector('.wheels'))return;
  if(!/إنشاء الحساب/.test(sv.textContent))return;
  const box=document.createElement('div');box.id='gpk';
  box.innerHTML='<p class="l">الجنس</p><div style="display:flex;gap:10px"><button type="button" data-g="m">♂ ذكر</button><button type="button" data-g="f">♀ أنثى</button></div>';
  nm.after(box);
  let g=sessionStorage.getItem('mj_gender')||'';
  const col={m:['#60a5fa','#2563eb','#3b82f6'],f:['#f9a8d4','#db2777','#ec4899']};
  const paint=()=>box.querySelectorAll('[data-g]').forEach(b=>{
    const k=b.dataset.g,on=g===k,c=col[k];
    b.style.cssText='flex:1;margin:6px 0;padding:14px;border-radius:14px;font-size:17px;font-weight:800;cursor:pointer;transition:all .2s;'+(on?'border:2px solid '+c[2]+';color:#fff;background:linear-gradient(135deg,'+c[0]+','+c[1]+');box-shadow:0 0 14px '+c[2]+'88;transform:scale(1.03)':'border:2px solid '+c[2]+';color:'+c[2]+';background:transparent');
  });
  box.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{g=b.dataset.g;sessionStorage.setItem('mj_gender',g);paint()});
  paint();
  sv.addEventListener('click',e=>{if(!g){e.stopImmediatePropagation();e.preventDefault();X.toast('اختر الجنس')}},true);
}
/* بعد إنشاء الحساب يحفظ الجنس المختار */
function pending(){
  const g=sessionStorage.getItem('mj_gender');
  if(g&&X&&X.prof&&!X.prof.gender&&X.me){
    sessionStorage.removeItem('mj_gender');
    X.update({gender:g}).catch(()=>{});
  }
}
/* تأكيد قبل تبديل الحساب */
function sw(){
  const r=document.getElementById('s-sw');
  if(!r||r.dataset.cf)return;r.dataset.cf='1';
  r.addEventListener('click',e=>{e.stopImmediatePropagation();e.preventDefault();ask('تبي تبدّل الحساب؟ بيتسجّل خروجك الحين',()=>X.logout())},true);
}
function run(){wheels();gender();sw()}
export function init(c){
  X=c;
  if(!document.getElementById('twc')){const s=document.createElement('style');s.id='twc';s.textContent=CSS;document.head.appendChild(s)}
  new MutationObserver(run).observe(document.body,{childList:true,subtree:true});
  setInterval(pending,1500);
}
