import {getApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getFirestore,collection,addDoc,setDoc,getDoc,deleteDoc,doc,query,where,limit,getDocs,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
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
export function screen(){
  X.th(true);
  const p=X.prof,l=lvl();
  const g=p.games||0,w=p.wins||0,pc=g?Math.round(w/g*100):0;
  const st=[[g,'ألعاب'],[w,'فوز'],[pc+'%','نسبة الفوز']];
  X.A.innerHTML='<div class="meh" id="meh"><img class="mebg" src="'+esc(p.photo)+'" alt=""><div class="mer"><img class="mepic" src="'+esc(p.photo)+'" alt=""><div class="men"><div class="mnm">'+esc(p.name)+'</div><div class="lvr"><span>Lv.'+l.n+'</span><div class="lvb"><i style="width:'+Math.min(100,Math.round(l.xp/l.need*100))+'%"></i></div><span>'+l.xp+'/'+l.need+'</span></div></div><span class="chv">‹</span></div></div>'+
    '<div class="list"><div class="stats">'+st.map(s=>'<div><b>'+s[0]+'</b><span>'+s[1]+'</span></div>').join('')+'</div>'+
    '<div class="ir" id="m-mo"><span class="k">📸 لحظاتي</span><span class="v"></span></div><div class="sg"></div>'+
    '<div class="ir" id="m-vi"><span class="k">👀 الزوار</span><span class="v"></span></div></div>'+X.nav();
  X.bindNav();
  $('meh').onclick=()=>edit();
  $('m-mo').onclick=()=>moments();
  $('m-vi').onclick=()=>X.toast('الزوار قريبًا');
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
/* ===== اللحظات ===== */
const PV={public:['🌐','عام'],friends:['👥','الأصدقاء فقط'],private:['🔒','خاص']};
let mom=[],feed=[];
const pc={};
const p2=n=>String(n).padStart(2,'0');
const ms=t=>t&&t.toMillis?t.toMillis():Date.now();
const when=t=>{const d=new Date(ms(t));return d.getDate()+'/'+(d.getMonth()+1)+' '+p2(d.getHours())+':'+p2(d.getMinutes())};
const bigImg=f=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>{const k=Math.min(1,640/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*k);c.height=Math.round(i.height*k);c.getContext('2d').drawImage(i,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.6))};i.onerror=rej;i.src=URL.createObjectURL(f)});
const pics=m=>m.photos||(m.photo?[m.photo]:[]);
const getP=async u=>{
  if(pc[u])return pc[u];
  try{const s=await getDoc(doc(db,'profiles',u));pc[u]=s.exists()?s.data():{name:'لاعب',photo:''}}
  catch(e){pc[u]={name:'لاعب',photo:''}}
  return pc[u];
};
function zoom(src){
  const o=document.createElement('div');o.className='lb';o.innerHTML='<img src="'+src+'" alt="">';
  o.onclick=()=>o.remove();document.body.appendChild(o);
}
function card(m,own){
  const p=m.uid===X.me.uid?X.prof:(pc[m.uid]||{name:m.name||'لاعب',photo:''}),ph=pics(m);
  return '<div class="mc"><div class="mt"><span class="who"><img class="av" src="'+esc(p.photo)+'" alt="">'+esc(p.name)+'</span><span>'+PV[m.privacy||'public'][0]+' '+when(m.at)+(own?' <button class="mini" data-d="'+m.id+'">🗑</button>':'')+'</span></div>'+
    (m.text?'<p class="tx">'+esc(m.text)+'</p>':'')+
    (ph.length?'<div class="mph '+(ph.length>1?'nm':'n1')+'">'+ph.map(s=>'<img src="'+esc(s)+'" alt="">').join('')+'</div>':'')+'</div>';
}
function bindCards(el){
  el.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>del(b.dataset.d));
  el.querySelectorAll('.mph img').forEach(i=>i.onclick=()=>zoom(i.src));
}

/* صفحة لحظاتي */
export function moments(){
  X.th(true);
  X.A.innerHTML='<div class="mh"><button class="ib" id="bk">➜</button><h1 style="font-size:22px">لحظاتي</h1><div class="ics"><button class="ib" id="mb">🔔</button><button class="ib" id="mc">📷</button></div></div><div class="list" id="ml"></div>';
  $('bk').onclick=()=>screen();
  $('mb').onclick=()=>X.toast('إشعارات اللحظات قريبًا');
  $('mc').onclick=()=>compose(load);
  load();
}
async function load(){
  const el=$('ml');if(el)el.innerHTML='<div class="empty">...</div>';
  try{
    const s=await getDocs(query(collection(db,'moments'),where('uid','==',X.me.uid),limit(50)));
    mom=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>ms(b.at)-ms(a.at));
  }catch(e){X.toast('مشكلة: '+e.code);mom=[]}
  paint();
}
function paint(){
  const el=$('ml');if(!el)return;
  el.innerHTML=mom.length?mom.map(m=>card(m,true)).join(''):'<div class="empty">ما نشرت لحظات بعد<br>اضغط 📷 وشارك أول لحظة</div>';
  bindCards(el);
}

/* تبويب اللحظات (الكل) */
export function feedTab(){
  X.th(true);
  X.A.innerHTML='<div class="mh"><h1>اللحظات</h1><div class="ics"><button class="ib" id="fr2">🔄</button><button class="ib" id="fc">📷</button></div></div><div class="list" id="mf"></div>'+X.nav();
  X.bindNav();
  $('fr2').onclick=()=>loadFeed();
  $('fc').onclick=()=>compose(loadFeed);
  loadFeed();
}
async function loadFeed(){
  const el=$('mf');if(el)el.innerHTML='<div class="empty">...</div>';
  const me=X.me.uid,C=collection(db,'moments');
  const qs=[getDocs(query(C,where('privacy','==','public'),limit(40))),getDocs(query(C,where('uid','==',me),limit(20)))];
  try{
    const fs=await getDocs(collection(db,'users',me,'friends'));
    fs.docs.filter(d=>d.data().status==='friends').slice(0,20).forEach(d=>qs.push(getDocs(query(C,where('uid','==',d.id),where('privacy','==','friends'),limit(10)))));
  }catch(e){}
  const rs=await Promise.allSettled(qs),m=new Map();
  rs.forEach(r=>{if(r.status==='fulfilled')r.value.docs.forEach(d=>m.set(d.id,{id:d.id,...d.data()}))});
  feed=[...m.values()].sort((a,b)=>ms(b.at)-ms(a.at));
  await Promise.all([...new Set(feed.map(x=>x.uid))].map(getP));
  paintFeed();
}
function paintFeed(){
  const el=$('mf');if(!el)return;
  el.innerHTML=feed.length?feed.map(m=>card(m,m.uid===X.me.uid)).join(''):'<div class="empty">ما فيه لحظات بعد<br>كن أول من ينشر 📷</div>';
  bindCards(el);
}
function del(id){
  const s=sheet('حذف اللحظة','<p class="c">متأكد تبي تحذفها؟</p><button class="btn" id="dy2">حذف</button>');
  s.o.querySelector('#dy2').onclick=async()=>{
    try{
      await deleteDoc(doc(db,'moments',id));s.close();
      mom=mom.filter(m=>m.id!==id);feed=feed.filter(m=>m.id!==id);paint();paintFeed();
    }catch(e){X.toast('مشكلة: '+e.code)}
  };
}

/* شاشة النشر */
function compose(done){
  let txt='',photos=[],pv='public';
  const o=document.createElement('div');o.className='cmp';
  o.innerHTML='<div class="cmh"><button class="ib" id="cx">✕</button><button class="pub" id="cp" disabled>نشر</button></div><textarea id="ct" maxlength="500" placeholder="ماذا يدور بعقلك؟"></textarea><div class="cps" id="cph"></div><input type="file" id="cf" accept="image/*" multiple hidden><div class="cft"><button class="pvb" id="cv">🌐 عام</button></div>';
  document.body.appendChild(o);
  const q=s=>o.querySelector(s);
  const draw=()=>{
    q('#cph').innerHTML=photos.map((s,i)=>'<div class="ph1"><img src="'+s+'" alt=""><b data-r="'+i+'">✕</b></div>').join('')+(photos.length<6?'<div class="ph1" id="ad"><span>+</span></div>':'');
    q('#cp').disabled=!(txt.trim()||photos.length);
  };
  draw();
  q('#ct').oninput=e=>{txt=e.target.value;draw()};
  q('#cx').onclick=()=>o.remove();
  q('#cph').onclick=e=>{
    const r=e.target.dataset?e.target.dataset.r:undefined;
    if(r!==undefined){photos.splice(+r,1);draw();return}
    if(e.target.closest('#ad'))q('#cf').click();
  };
  q('#cf').onchange=async e=>{
    const fs=[...e.target.files].slice(0,6-photos.length);e.target.value='';
    for(const f of fs){try{photos.push(await bigImg(f))}catch(x){X.toast('صورة ما انفتحت')}}
    draw();
  };
  q('#cv').onclick=()=>{
    const s=sheet('من يشوف لحظتك؟',Object.keys(PV).map(k=>'<button class="btn alt" data-p="'+k+'">'+PV[k][0]+' '+PV[k][1]+(pv===k?' ✓':'')+'</button>').join(''));
    s.o.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{pv=b.dataset.p;q('#cv').textContent=PV[pv][0]+' '+PV[pv][1];s.close()});
  };
  q('#cp').onclick=async()=>{
    if(photos.join('').length>900000){X.toast('الصور كبيرة، قلل عددها');return}
    const b=q('#cp');b.disabled=true;
    const id=String(9e12-Date.now()).padStart(13,'0')+Math.random().toString(36).slice(2,6);
    try{
      await setDoc(doc(db,'moments',id),{uid:X.me.uid,name:X.prof.name,text:txt.trim(),photos,privacy:pv,at:serverTimestamp()});
      o.remove();X.toast('انتشرت اللحظة ✅');if(done)done();
    }catch(e){b.disabled=false;X.toast('مشكلة: '+e.code)}
  };
  q('#ct').focus();
}
