import {getApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getFirestore,collection,addDoc,deleteDoc,doc,query,where,limit,getDocs,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const db=getFirestore(getApp());
let X;
const $=i=>document.getElementById(i);
const esc=s=>X.esc(s);
const C=[['DZ','الجزائر'],['SA','السعودية'],['AE','الإمارات'],['KW','الكويت'],['QA','قطر'],['BH','البحرين'],['OM','عُمان'],['IQ','العراق'],['SY','سوريا'],['JO','الأردن'],['LB','لبنان'],['PS','فلسطين'],['EG','مصر'],['SD','السودان'],['LY','ليبيا'],['TN','تونس'],['MA','المغرب'],['MR','موريتانيا'],['YE','اليمن'],['SO','الصومال'],['DJ','جيبوتي'],['KM','جزر القمر'],['TR','تركيا']];
const flag=c=>String.fromCodePoint(...[...c].map(ch=>127397+ch.charCodeAt(0)));
const cname=c=>{const f=C.find(x=>x[0]===c);return f?flag(c)+' '+f[1]:'غير محدد'};
const gname=g=>g==='m'?'ذكر':g==='f'?'أنثى':'غير محدد';
const lvl=()=>{const n=X.prof.lv||1,xp=X.prof.xp||0,need=n*100;return {n,xp,need}};
export function init(c){X=c}

/* تبويب أنا: الجزء العلوي فقط */
export function screen(){
  X.th(true);
  const p=X.prof,l=lvl();
  X.A.innerHTML='<div class="meh" id="meh"><img class="mebg" src="'+esc(p.photo)+'" alt=""><div class="mer"><img class="mepic" src="'+esc(p.photo)+'" alt=""><div class="men"><div class="mnm">'+esc(p.name)+'</div><div class="lvr"><span>Lv.'+l.n+'</span><div class="lvb"><i style="width:'+Math.min(100,Math.round(l.xp/l.need*100))+'%"></i></div><span>'+l.xp+'/'+l.need+'</span></div></div><span class="chv">‹</span></div></div><div class="list"></div>'+X.nav();
  X.bindNav();
  $('meh').onclick=()=>edit();
}

/* نافذة سفلية للتعديل */
function sheet(title,html){
  const o=document.createElement('div');o.className='ov';
  o.innerHTML='<div class="sh"><div class="shh"><b>'+title+'</b><button class="mini" id="shx">✕</button></div>'+html+'</div>';
  document.body.appendChild(o);
  const close=()=>o.remove();
  o.onclick=e=>{if(e.target===o||e.target.id==='shx')close()};
  return {o,close};
}
const fdate=b=>b?b.replace(/-/g,'/'):'غير محدد';

/* الإعدادات */
export function settings(){
  X.th(true);
  const row=(id,k,red)=>'<div class="ir" id="'+id+'"><span class="k"'+(red?' style="color:#e0475b"':'')+'>'+k+'</span><span class="v"></span></div>';
  X.A.innerHTML=X.hdr('الإعدادات')+'<div class="irs">'+
    row('s-ac','إدارة الحساب')+
    '<div class="sg"></div>'+
    row('s-pv','الخصوصية')+row('s-gn','عام')+
    '<div class="sg"></div>'+
    row('s-sw','تبديل الحساب')+row('s-lo','تسجيل الخروج',true)+
    '</div>';
  $('bk').onclick=()=>X.home();
  $('s-ac').onclick=()=>edit(settings);
  $('s-pv').onclick=()=>X.toast('الخصوصية قريبًا');
  $('s-gn').onclick=()=>X.toast('الإعدادات العامة قريبًا');
  $('s-sw').onclick=()=>X.logout();
  $('s-lo').onclick=()=>{
    const s=sheet('تسجيل الخروج','<p class="c">متأكد تبي تسجل خروج؟</p><button class="btn" id="lo-y">تسجيل الخروج</button>');
    s.o.querySelector('#lo-y').onclick=()=>{s.close();X.logout()};
  };
}

/* صفحة تعديل المعلومات */
export function edit(back){
  back=back||screen;
  X.th(true);
  const p=X.prof,l=lvl();
  const row=(id,k,v,go)=>'<div class="ir" id="'+id+'"><span class="k">'+k+'</span><span class="v'+(go===false?' nc':'')+'">'+v+'</span></div>';
  X.A.innerHTML=X.hdr('تعديل المعلومات')+'<div class="irs">'+
    row('r-ph','صورة','<img src="'+esc(p.photo)+'" alt="">')+row('r-nm','الاسم',esc(p.name))+row('r-id','ID المستخدم',esc(p.pid))+
    '<div class="sg"></div>'+
    row('r-gd','الجنس',gname(p.gender))+row('r-bd','عيد ميلاد',fdate(p.birth)+' · '+X.age(p.birth)+' سنة')+row('r-rg','منطقة',cname(p.region))+
    '<div class="sg"></div>'+
    row('r-lv','المستوى','Lv.'+l.n,false)+row('r-tt','اللقب','لا يوجد',false)+row('r-bg','الشارات','لا يوجد',false)+
    '</div><input type="file" id="phf" accept="image/*" hidden>';
  const save=async(patch,close)=>{try{await X.update(patch);if(close)close();edit(back)}catch(x){X.toast('مشكلة: '+x.code)}};
  $('bk').onclick=()=>back();
  $('r-id').onclick=()=>{try{navigator.clipboard.writeText(p.pid);X.toast('تم نسخ الـ ID')}catch(e){}};
  $('r-ph').onclick=()=>$('phf').click();
  $('phf').onchange=async e=>{const f=e.target.files[0];if(f)save({photo:await X.readImg(f)})};
  $('r-nm').onclick=()=>{
    const s=sheet('الاسم','<input id="sn" maxlength="14" value="'+esc(p.name)+'"><div class="err" id="se"></div><button class="btn" id="ss">حفظ</button>');
    $('ss').onclick=()=>{const n=$('sn').value.trim();if(n.length<2){$('se').textContent='الاسم قصير';return}save({name:n},s.close)};
  };
  $('r-gd').onclick=()=>{
    const s=sheet('الجنس','<button class="btn alt" data-g="m">ذكر</button><button class="btn alt" data-g="f">أنثى</button>');
    s.o.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>save({gender:b.dataset.g},s.close));
  };
  $('r-bd').onclick=()=>{
    const s=sheet('عيد الميلاد',X.picker.html()+'<div class="err" id="se"></div><button class="btn" id="ss">حفظ</button>');
    X.picker.set(p.birth);X.picker.bind();
    $('ss').onclick=()=>{
      const b=X.picker.get(),[y,m,d]=b.split('-').map(Number);
      if(new Date(y,m-1,d).getMonth()!==m-1){$('se').textContent='تاريخ غير صحيح';return}
      if(X.age(b)<13){$('se').textContent='اللعبة للعمر 13 سنة وفوق';return}
      save({birth:b},s.close);
    };
  };
  $('r-rg').onclick=()=>{
    const s=sheet('المنطقة',C.map(c=>'<div class="fr" data-c="'+c[0]+'"><span class="fi">'+flag(c[0])+' '+c[1]+'</span></div>').join(''));
    s.o.querySelectorAll('[data-c]').forEach(r=>r.onclick=()=>save({region:r.dataset.c},s.close));
  };
}

/* ملفي كما يراه الآخرون */
export function view(){
  const p=X.prof,l=lvl();
  const row=(k,v)=>'<div class="ir"><span class="k">'+k+'</span><span class="v nc">'+v+'</span></div>';
  const o=document.createElement('div');o.className='ov pvo';
  o.innerHTML='<div class="pvs"><div class="meh" style="cursor:default"><img class="mebg" src="'+esc(p.photo)+'" alt=""><button class="ib pvx" id="pvx">➜</button><div class="mer"><img class="mepic" src="'+esc(p.photo)+'" alt=""><div class="men"><div class="mnm">'+esc(p.name)+'</div><div class="lvr"><span>Lv.'+l.n+'</span><div class="lvb"><i style="width:'+Math.min(100,Math.round(l.xp/l.need*100))+'%"></i></div></div></div></div></div><div class="irs">'+row('ID',esc(p.pid))+row('الجنس',gname(p.gender))+row('المنطقة',cname(p.region))+row('المستوى','Lv.'+l.n)+'</div><p class="c" style="font-size:12px;color:#8a8aa0">هكذا يراك اللاعبون</p></div>';
  document.body.appendChild(o);
  o.onclick=e=>{if(e.target===o||e.target.id==='pvx')o.remove()};
}

/* العملات */
const ico=n=>'<i class="ic ic-'+n+'"></i>';
const num=n=>Number(n||0).toLocaleString('en');
export function coin(){X.toast('عملة المحقق تكسبها من اللعب (قريبًا)')}
export function charge(){
  sheet('شحن عملة المافيا','<p class="c" style="display:flex;justify-content:center;align-items:center;gap:6px">رصيدك: '+ico('mafia')+'<b>'+num(X.prof.gems)+'</b></p><div class="pks">'+[60,300,680,1500].map(n=>'<div class="pk">'+ico('mafia')+'<b>'+n+'</b><button class="mini" disabled>قريبًا</button></div>').join('')+'</div><p class="c" style="font-size:12px">الشحن بالدفع الحقيقي يتفعّل لما نربط نظام الدفع.</p>');
}
