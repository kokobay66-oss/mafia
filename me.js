import {getApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getFirestore,collection,setDoc,getDoc,updateDoc,addDoc,deleteDoc,doc,query,where,orderBy,limit,getDocs,arrayUnion,arrayRemove,onSnapshot,writeBatch,increment,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
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
  X.A.innerHTML='<div class="meh" id="meh"><img class="mebg" src="'+esc(p.photo)+'" alt=""><div class="mer"><img class="mepic" src="'+esc(p.photo)+'" alt=""><div class="men"><div class="mnm">'+esc(p.name)+'</div><div class="lvr"><span>Lv.'+l.n+'</span><div class="lvb"><i style="width:'+Math.min(100,Math.round(l.xp/l.need*100))+'%"></i></div><span>'+l.xp+'/'+l.need+'</span></div></div><span class="chv">‹</span></div></div>'+
    '<div class="list"><div class="stats" id="sts"></div>'+
    '<div class="ir" id="m-bd"><span class="k">🏅 الشارات</span><span class="v" id="bdn"></span></div><div class="sg"></div>'+
    '<div class="ir" id="m-mo"><span class="k">📸 لحظاتي</span><span class="v"></span></div><div class="sg"></div>'+
    '<div class="ir" id="m-vi"><span class="k">👀 الزوار</span><span class="v"></span></div></div>'+X.nav();
  X.bindNav();
  $('meh').onclick=()=>edit();
  $('m-bd').onclick=()=>badges();
  $('m-mo').onclick=()=>moments();
  $('m-vi').onclick=()=>X.toast('الزوار قريبًا');
  paintTiles();
  loadStats().then(()=>{paintTiles();const e=$('bdn');if(e)e.textContent=BG.filter(isOn).length+'/'+BG.length});
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
const pc={},hdc={};
const ms=t=>t&&t.toMillis?t.toMillis():Date.now();
const when=t=>{const d=new Date(ms(t));return d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear()};
const ago=t=>{
  const s=Math.max(0,(Date.now()-ms(t))/1000);
  const f=(n,a)=>'قبل '+(n===1?a[0]:n===2?a[1]:n+' '+(n<=10?a[2]:a[3]));
  if(s<60)return 'قبل لحظات';
  const m=Math.floor(s/60);if(m<60)return f(m,['دقيقة','دقيقتين','دقائق','دقيقة']);
  const h=Math.floor(m/60);if(h<24)return f(h,['ساعة','ساعتين','ساعات','ساعة']);
  const d=Math.floor(h/24);if(d<30)return f(d,['يوم','يومين','أيام','يوم']);
  return when(t);
};
const openImg=f=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=URL.createObjectURL(f)});
function fit(im,B,sizes,qs){
  let d='';
  for(const mx of sizes){
    const k=Math.min(1,mx/Math.max(im.width,im.height)),c=document.createElement('canvas');
    c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));
    const g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(im,0,0,c.width,c.height);
    for(const q of qs){d=c.toDataURL('image/jpeg',q);if(d.length<=B)return d}
  }
  return d;
}
const pics=m=>m.photos||(m.photo?[m.photo]:[]);
const getP=async u=>{
  if(pc[u])return pc[u];
  try{const s=await getDoc(doc(db,'profiles',u));pc[u]=s.exists()?s.data():{name:'لاعب',photo:''}}
  catch(e){pc[u]={name:'لاعب',photo:''}}
  return pc[u];
};
const pr=u=>u===X.me.uid?X.prof:(pc[u]||{name:'لاعب',photo:''});
const find=id=>feed.find(m=>m.id===id)||mom.find(m=>m.id===id);
const upd=(id,fn)=>[feed,mom].forEach(a=>a.forEach(m=>{if(m.id===id)fn(m)}));
const SV='<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">';
const heart=on=>'<svg viewBox="0 0 24 24" width="28" height="28" fill="'+(on?'#e0475b':'none')+'" stroke="'+(on?'#e0475b':'currentColor')+'" stroke-width="1.8" stroke-linejoin="round"><path d="M12 21s-7.5-4.6-9.5-9.2C1 8.4 3 5 6.4 5c2 0 3.6 1.1 5.6 3.2C14 6.1 15.6 5 17.6 5 21 5 23 8.4 21.5 11.8 19.5 16.4 12 21 12 21z"/></svg>';
const IC_C=SV+'<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>';
const IC_S=SV+'<path d="M14 5l7 7-7 7v-4c-6 0-9.5 1.8-11 5 .5-6 4.5-10 11-10z"/></svg>';
async function zoom(id,i,src){
  const o=document.createElement('div');o.className='lb';o.innerHTML='<img src="'+src+'" alt="">';
  o.onclick=()=>o.remove();document.body.appendChild(o);
  const m=find(id);if(!m||!m.hd)return;
  const k=id+'_'+i;
  try{
    if(!hdc[k]){const s=await getDoc(doc(db,'moments',id,'hd',String(i)));if(s.exists())hdc[k]=s.data().d}
    if(hdc[k]&&o.isConnected)o.firstChild.src=hdc[k];
  }catch(e){}
}
function card(m){
  const me=X.me.uid,p=pr(m.uid),ph=pics(m),lk=m.likes||[],liked=lk.includes(me);
  const names=lk.slice(-8).reverse().map(u=>esc(pr(u).name)).join('، ');
  return '<div class="mc" data-m="'+m.id+'"><div class="mh2"><img class="av" src="'+esc(p.photo)+'" alt=""><div class="mi"><b>'+esc(p.name)+'</b><span>'+ago(m.at)+(m.privacy&&m.privacy!=='public'?' · '+PV[m.privacy][0]:'')+'</span></div><button class="dots" data-o="'+m.id+'">•••</button></div>'+
    (m.text?'<p class="tx">'+esc(m.text)+'</p>':'')+
    (ph.length?'<div class="mph '+(ph.length>1?'nm':'n1')+'">'+ph.map((s,i)=>'<img data-i="'+i+'" src="'+esc(s)+'" alt="">').join('')+'</div>':'')+
    '<div class="act"><button class="ab'+(liked?' on':'')+'" data-l="'+m.id+'">'+heart(liked)+(lk.length?'<span>'+lk.length+'</span>':'')+'</button><button class="ab" data-c="'+m.id+'">'+IC_C+'</button><button class="ab" data-s="'+m.id+'">'+IC_S+'</button></div>'+
    (lk.length?'<div class="lks">♡ '+names+(lk.length>8?' و'+(lk.length-8)+' آخرين':'')+'</div>':'')+'</div>';
}
function bindCards(el){
  const on=(a,f)=>el.querySelectorAll('['+a+']').forEach(b=>b.onclick=()=>f(b.getAttribute(a)));
  on('data-l',like);on('data-c',comments);on('data-s',share);on('data-o',more);
  el.querySelectorAll('.mph img').forEach(i=>i.onclick=()=>{const c=i.closest('[data-m]');zoom(c?c.dataset.m:'',+i.dataset.i,i.src)});
}
function redraw(id){
  document.querySelectorAll('[data-m="'+id+'"]').forEach(c=>{const m=find(id);if(m)c.outerHTML=card(m)});
  const el=$('mf')||$('ml');if(el)bindCards(el);
}
async function like(id){
  const me=X.me.uid,m=find(id);if(!m)return;
  const has=(m.likes||[]).includes(me);
  upd(id,x=>{x.likes=has?(x.likes||[]).filter(u=>u!==me):[...(x.likes||[]),me]});
  redraw(id);
  try{await updateDoc(doc(db,'moments',id),{likes:has?arrayRemove(me):arrayUnion(me)})}
  catch(e){
    upd(id,x=>{x.likes=has?[...(x.likes||[]),me]:(x.likes||[]).filter(u=>u!==me)});
    redraw(id);X.toast('مشكلة: '+e.code);
  }
}
function share(id){
  const m=find(id);if(!m)return;
  const t=(m.text||'لحظة من مجلس المافيا')+'\n'+location.origin+location.pathname;
  if(navigator.share)navigator.share({text:t}).catch(()=>{});
  else{try{navigator.clipboard.writeText(t);X.toast('تم نسخ اللحظة')}catch(e){X.toast('ما قدرت أنسخ')}}
}
function more(id){
  const m=find(id);if(!m)return;
  const own=m.uid===X.me.uid;
  if(!m.text&&!own){X.toast('ما فيه خيارات');return}
  const s=sheet('خيارات',(m.text?'<button class="btn alt" id="mo1">📋 نسخ النص</button>':'')+(own?'<button class="btn alt" id="mo2" style="color:#e0475b">🗑 حذف اللحظة</button>':''));
  const a=s.o.querySelector('#mo1');
  if(a)a.onclick=()=>{try{navigator.clipboard.writeText(m.text);X.toast('تم النسخ')}catch(e){X.toast('ما قدرت أنسخ')}s.close()};
  const d=s.o.querySelector('#mo2');
  if(d)d.onclick=()=>{s.close();del(id)};
}
async function comments(id){
  const m=find(id);if(!m)return;
  const s=sheet('التعليقات','<div class="cmts" id="cl2"><div class="empty" style="padding:24px">...</div></div><div class="cin"><input id="ci" maxlength="300" placeholder="اكتب تعليق..."><button class="pub" id="cs">إرسال</button></div>');
  const L=s.o.querySelector('#cl2'),I=s.o.querySelector('#ci'),B=s.o.querySelector('#cs');
  const C=collection(db,'moments',id,'comments');
  let list=[];
  const paintC=()=>{
    L.innerHTML=list.length?list.map(c=>{const p=pr(c.uid);return '<div class="cm1"><img class="av" src="'+esc(p.photo)+'" alt=""><div class="cb"><b>'+esc(p.name)+'</b><span>'+ago(c.at)+'</span><p>'+esc(c.text)+'</p></div>'+((c.uid===X.me.uid||m.uid===X.me.uid)?'<button class="mini" data-x="'+c.id+'">🗑</button>':'')+'</div>'}).join(''):'<div class="empty" style="padding:24px">ما فيه تعليقات بعد</div>';
    L.querySelectorAll('[data-x]').forEach(b=>b.onclick=async()=>{
      try{await deleteDoc(doc(db,'moments',id,'comments',b.dataset.x));list=list.filter(c=>c.id!==b.dataset.x);paintC()}
      catch(e){X.toast('مشكلة: '+e.code)}
    });
    L.scrollTop=L.scrollHeight;
  };
  try{
    const r=await getDocs(query(C,orderBy('at'),limit(60)));
    list=r.docs.map(d=>({id:d.id,...d.data()}));
    await Promise.all([...new Set(list.map(c=>c.uid))].map(getP));
  }catch(e){X.toast('مشكلة: '+e.code)}
  paintC();
  B.onclick=async()=>{
    const t=I.value.trim();if(!t)return;
    B.disabled=true;
    try{
      const ref=await addDoc(C,{uid:X.me.uid,name:X.prof.name,text:t,at:serverTimestamp()});
      list.push({id:ref.id,uid:X.me.uid,text:t,at:null});I.value='';paintC();
    }catch(e){X.toast('مشكلة: '+e.code)}
    B.disabled=false;
  };
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
    await Promise.all([...new Set(mom.flatMap(x=>(x.likes||[]).slice(-8)))].map(getP));
  }catch(e){X.toast('مشكلة: '+e.code);mom=[]}
  paint();
}
function paint(){
  const el=$('ml');if(!el)return;
  el.innerHTML=mom.length?mom.map(card).join(''):'<div class="empty">ما نشرت لحظات بعد<br>اضغط 📷 وشارك أول لحظة</div>';
  bindCards(el);
}

/* تبويب اللحظات (الكل) */
export function feedTab(){
  X.th(true);
  X.A.innerHTML='<div class="mh"><h1 id="ft" style="cursor:pointer">اللحظات</h1><div class="ics"><button class="ib" id="fb">🔔</button><button class="ib" id="fc">📷</button></div></div><div class="list" id="mf"></div>'+X.nav();
  X.bindNav();
  $('fb').onclick=()=>X.toast('إشعارات اللحظات قريبًا');
  $('fc').onclick=()=>compose(loadFeed);
  $('ft').onclick=()=>loadFeed();
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
  await Promise.all([...new Set(feed.flatMap(x=>[x.uid,...(x.likes||[]).slice(-8)]))].map(getP));
  paintFeed();
}
function paintFeed(){
  const el=$('mf');if(!el)return;
  el.innerHTML=feed.length?feed.map(card).join(''):'<div class="empty">ما فيه لحظات بعد<br>كن أول من ينشر 📷</div>';
  bindCards(el);
}
function del(id){
  const s=sheet('حذف اللحظة','<p class="c">متأكد تبي تحذفها؟</p><button class="btn" id="dy2">حذف</button>');
  s.o.querySelector('#dy2').onclick=async()=>{
    try{
      const m=find(id),n=m&&m.hd?m.hd:0;
      for(let i=0;i<n;i++){try{await deleteDoc(doc(db,'moments',id,'hd',String(i)))}catch(e){}}
      await deleteDoc(doc(db,'moments',id));s.close();
      mom=mom.filter(x=>x.id!==id);feed=feed.filter(x=>x.id!==id);paint();paintFeed();
    }catch(e){X.toast('مشكلة: '+e.code)}
  };
}

/* شاشة النشر */
function compose(done){
  let txt='',photos=[],pv='public',busy=false;
  const o=document.createElement('div');o.className='cmp';
  o.innerHTML='<div class="cmh"><button class="ib" id="cx">✕</button><button class="pub" id="cp" disabled>نشر</button></div><textarea id="ct" maxlength="500" placeholder="ماذا يدور بعقلك؟"></textarea><div class="cps" id="cph"></div><input type="file" id="cf" accept="image/*" multiple hidden><div class="cft"><button class="pvb" id="cv">🌐 عام</button></div>';
  document.body.appendChild(o);
  const q=s=>o.querySelector(s);
  const draw=()=>{
    q('#cph').innerHTML=photos.map((p,i)=>'<div class="ph1"><img src="'+p.u+'" alt=""><b data-r="'+i+'">✕</b></div>').join('')+(photos.length<6?'<div class="ph1" id="ad"><span>+</span></div>':'');
    q('#cp').disabled=busy||!(txt.trim()||photos.length);
  };
  draw();
  q('#ct').oninput=e=>{txt=e.target.value;draw()};
  q('#cx').onclick=()=>{if(busy){X.toast('انتظر لين ينتهي النشر');return}o.remove()};
  q('#cph').onclick=e=>{
    if(busy)return;
    const r=e.target.dataset?e.target.dataset.r:undefined;
    if(r!==undefined){URL.revokeObjectURL(photos[+r].u);photos.splice(+r,1);draw();return}
    if(e.target.closest('#ad'))q('#cf').click();
  };
  q('#cf').onchange=e=>{
    const fs=[...e.target.files].filter(f=>f.type.startsWith('image/')).slice(0,6-photos.length);e.target.value='';
    fs.forEach(f=>photos.push({f,u:URL.createObjectURL(f)}));
    draw();
  };
  q('#cv').onclick=()=>{
    const s=sheet('من يشوف لحظتك؟',Object.keys(PV).map(k=>'<button class="btn alt" data-p="'+k+'">'+PV[k][0]+' '+PV[k][1]+(pv===k?' ✓':'')+'</button>').join(''));
    s.o.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{pv=b.dataset.p;q('#cv').textContent=PV[pv][0]+' '+PV[pv][1];s.close()});
  };
  q('#cp').onclick=async()=>{
    const b=q('#cp'),n=photos.length;
    busy=true;b.disabled=true;
    const id=String(9e12-Date.now()).padStart(13,'0')+Math.random().toString(36).slice(2,6);
    try{
      const tb=Math.min(120000,Math.floor(800000/Math.max(1,n))),th=[],hd=[];
      for(let i=0;i<n;i++){
        b.textContent='تجهيز '+(i+1)+'/'+n;
        await new Promise(r=>setTimeout(r,30));
        const im=await openImg(photos[i].f);
        th.push(fit(im,tb,[800,640,480],[.85,.75,.65]));
        hd.push(fit(im,900000,[2400,2000,1600,1280,1024],[.92,.85,.78]));
      }
      b.textContent='نشر...';
      await setDoc(doc(db,'moments',id),{uid:X.me.uid,name:X.prof.name,text:txt.trim(),photos:th,hd:n,privacy:pv,likes:[],at:serverTimestamp()});
      let fail=false;
      for(let i=0;i<n;i++){
        b.textContent='رفع '+(i+1)+'/'+n;
        try{await setDoc(doc(db,'moments',id,'hd',String(i)),{d:hd[i]})}catch(e){fail=true;console.error(e)}
      }
      photos.forEach(p=>URL.revokeObjectURL(p.u));
      o.remove();
      X.toast(fail?'انتشرت، بس الجودة العالية ما انرفعت لبعض الصور':'انتشرت اللحظة ✅');
      if(done)done();
    }catch(e){busy=false;b.textContent='نشر';draw();X.toast('مشكلة: '+(e.code||e.message))}
  };
  q('#ct').focus();
}
/* ===== البريد ===== */
let mails=[],mU=null,isAdm=false;
const hasRw=m=>(m.coins||0)>0||(m.gems||0)>0;
const unreadN=()=>mails.filter(m=>!m.read||(hasRw(m)&&!m.claimed)).length;
const rw=m=>(m.coins>0?'<span class="rwc"><i class="ic ic-det"></i>'+m.coins+'</span>':'')+(m.gems>0?'<span class="rwc"><i class="ic ic-mafia"></i>'+m.gems+'</span>':'');
export function mailN(){return unreadN()}
export function mailStop(){if(mU){mU();mU=null}mails=[];isAdm=false}
export function mailStart(){
  mailStop();
  const u=X.me.uid;
  mU=onSnapshot(collection(db,'users',u,'mail'),s=>{
    mails=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>ms(b.at)-ms(a.at));
    const b=document.getElementById('ml2');if(b)b.dataset.n=unreadN();
    if($('mlist'))paintMail();
  },()=>{});
  getDoc(doc(db,'admins',u)).then(s=>{isAdm=s.exists()}).catch(()=>{isAdm=false});
}
export function mail(){
  X.th(true);
  X.A.innerHTML='<div class="mh"><button class="ib" id="bk">➜</button><h1 style="font-size:22px">البريد</h1>'+(isAdm?'<button class="ib" id="ms1">✍️</button>':'<span style="width:44px"></span>')+'</div><div class="list" id="mlist"></div>';
  $('bk').onclick=()=>X.home();
  const sb=$('ms1');if(sb)sb.onclick=sendMail;
  paintMail();
}
function paintMail(){
  const el=$('mlist');if(!el)return;
  el.innerHTML=mails.length?mails.map(m=>'<div class="ml1" data-k="'+m.id+'"><div class="mdot'+(m.read?'':' on')+'"></div><div class="mbd"><div class="mtt">'+esc(m.title||'رسالة')+'</div><div class="msb">'+esc((m.text||'').slice(0,60))+'</div>'+(hasRw(m)?'<div class="rws">'+rw(m)+(m.claimed?'<span class="cl">✓ تم الاستلام</span>':'')+'</div>':'')+'</div><div class="mtm">'+ago(m.at)+'</div></div>').join(''):'<div class="empty">ما فيه بريد<br>التنبيهات والجوائز توصلك هنا</div>';
  el.querySelectorAll('[data-k]').forEach(r=>r.onclick=()=>openMail(r.dataset.k));
}
function openMail(id){
  const m=mails.find(x=>x.id===id);if(!m)return;
  if(!m.read)updateDoc(doc(db,'users',X.me.uid,'mail',id),{read:true}).catch(()=>{});
  const canClaim=hasRw(m)&&!m.claimed;
  const s=sheet(esc(m.title||'رسالة'),'<p class="mtx">'+esc(m.text||'')+'</p>'+(hasRw(m)?'<div class="rws" style="justify-content:center;margin:10px 0">'+rw(m)+'</div>':'')+(canClaim?'<button class="btn" id="mcl">🎁 استلام الجائزة</button>':'')+'<button class="btn ghost" id="mdl">🗑 حذف</button>');
  const c=s.o.querySelector('#mcl');
  if(c)c.onclick=async()=>{
    c.disabled=true;
    try{
      const u=X.me.uid,b=writeBatch(db);
      b.update(doc(db,'users',u),{coins:increment(m.coins||0),gems:increment(m.gems||0),lastClaim:id});
      b.update(doc(db,'users',u,'mail',id),{claimed:true,read:true});
      await b.commit();
      X.prof.coins=(X.prof.coins||0)+(m.coins||0);
      X.prof.gems=(X.prof.gems||0)+(m.gems||0);
      s.close();X.toast('تم الاستلام 🎁');
    }catch(e){c.disabled=false;X.toast('مشكلة: '+e.code)}
  };
  s.o.querySelector('#mdl').onclick=async()=>{
    if(canClaim){X.toast('استلم الجائزة أول');return}
    try{await deleteDoc(doc(db,'users',X.me.uid,'mail',id));s.close()}catch(e){X.toast('مشكلة: '+e.code)}
  };
}
function sendMail(){
  const s=sheet('إرسال بريد','<input id="sp1" inputmode="numeric" maxlength="6" placeholder="ID اللاعب (6 أرقام)"><input id="st1" maxlength="40" placeholder="العنوان"><input id="sx1" maxlength="300" placeholder="النص" style="text-align:right"><div class="two"><input id="sc1" inputmode="numeric" placeholder="عملة المحقق"><input id="sg1" inputmode="numeric" placeholder="عملة المافيا"></div><div class="err" id="se1"></div><button class="btn" id="ss1">إرسال</button>');
  const q=i=>s.o.querySelector('#'+i);
  q('ss1').onclick=async()=>{
    const pid=q('sp1').value.trim(),title=q('st1').value.trim(),text=q('sx1').value.trim();
    const coins=Math.max(0,Math.floor(+q('sc1').value||0)),gems=Math.max(0,Math.floor(+q('sg1').value||0));
    const e=t=>q('se1').textContent=t;
    if(!/^\d{6}$/.test(pid)){e('الـID 6 أرقام');return}
    if(!title){e('اكتب العنوان');return}
    try{
      const t=await getDoc(doc(db,'ids',pid));
      if(!t.exists()){e('ما لقيت لاعب بهذا الـID');return}
      await addDoc(collection(db,'users',t.data().uid,'mail'),{title,text,coins,gems,claimed:false,read:false,from:'الإدارة',at:serverTimestamp()});
      s.close();X.toast('انرسل البريد ✅');
    }catch(x){e('مشكلة: '+x.code)}
  };
}
/* ===== الشارات ===== */
let ST={};
async function loadStats(){
  try{const s=await getDoc(doc(db,'stats',X.me.uid));ST=s.exists()?s.data():{}}catch(e){ST={}}
  return ST;
}
function paintTiles(){
  const e=$('sts');if(!e)return;
  const g=ST.games||0,w=ST.wins||0,pc=g?Math.round(w/g*100):0;
  e.innerHTML=[[g,'ألعاب'],[w,'فوز'],[pc+'%','نسبة الفوز']].map(s=>'<div><b>'+s[0]+'</b><span>'+s[1]+'</span></div>').join('');
}
const LK={o:['#e4e4ea','#7d7d88'],i:['#bdbdc6','#6b6b75'],rb:['#8f8f99','#5e5e68'],ic:'#f3f3f6',st:'#6b6b75',ln:'#4a4a52'};
const BG=[
 {id:'cit',name:'مواطن صالح',k:'shield',desc:'درع المدينة وضميرها، ما ينام وفي الحارة ظالم.',task:'فز 5 مرات مع فريق المواطنين',goal:5,val:()=>ST.wCit||0,
  p:{o:['#8fd0ff','#1357c9'],i:['#4aa0ff','#0b3a9a'],rb:['#1a62d6','#0a3585'],ic:'#ffffff',st:'#0b3a8f',ln:'#082a6b'}},
 {id:'det',name:'محقق خبير',k:'lens',desc:'عينه ما تغفل، وكل خيط عنده يوصل للجاني.',task:'اكشف 10 مافيا بالتحقيق',goal:10,val:()=>ST.found||0,
  p:{o:['#fff3a6','#e0a400'],i:['#ffdc50','#c78800'],rb:['#e8b200','#966000'],ic:'#ffffff',st:'#7a4f00',ln:'#6b4500'}},
 {id:'doc',name:'طبيب الحي',k:'cross',desc:'يسهر على أهل الحارة، وما يترك أحد للمصير.',task:'أنقذ 5 لاعبين من الاغتيال',goal:5,val:()=>ST.saves||0,
  p:{o:['#9bffc4','#13a851'],i:['#3be887','#0b8a3d'],rb:['#16b85b','#087535'],ic:'#ffffff',st:'#075a2a',ln:'#054a22'}},
 {id:'maf',name:'المافيا البارع',k:'hat',desc:'يضرب بصمت، ويختفي قبل لا يحس أحد.',task:'فز 5 مرات وأنت مافيا',goal:5,val:()=>ST.wMaf||0,
  p:{o:['#ff8a8a','#a8101f'],i:['#e63a4a','#6b0612'],rb:['#c4162a','#5a0712'],ic:'#ffffff',st:'#4a0610',ln:'#3a0409'}},
 {id:'boss',name:'زعيم المافيا',boss:true,k:'crown',desc:'التاج اللي ما يلبسه إلا من حكم الظلام. يبي كل الشارات، وفوز بعد فوز.',goal:1,val:()=>0,
  p:{o:['#fff7b8','#f6c744','#9c6500'],i:['#ff4a5c','#8e0019','#3a0008'],rb:['#d4112b','#6a0013'],ic:'#ffd95a',st:'#5c3a00',ln:'#7a5200'}}
];
const n4=()=>BG.filter(b=>!b.boss&&b.val()>=b.goal).length;
const isOn=b=>b.boss?(n4()===4&&(ST.wMaf||0)>=10):b.val()>=b.goal;
const progOf=b=>b.boss?[{t:'افتح الشارات الأربع',v:n4(),g:4},{t:'فز 10 مرات كمافيا',v:ST.wMaf||0,g:10}]:[{t:b.task,v:b.val(),g:b.goal}];
let _u=0;
const grad=(id,a)=>'<linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1">'+a.map((c,i)=>'<stop offset="'+(i/(a.length-1))+'" stop-color="'+c+'"/>').join('')+'</linearGradient>';
const SPK='<path d="M0-7L1.8-1.8L7 0L1.8 1.8L0 7L-1.8 1.8L-7 0L-1.8-1.8Z" fill="#fff"/>';
function iconOld(k,f,s){
  const ln='stroke="'+s+'" stroke-width="2.5" stroke-linejoin="round"';
  if(k==='shield')return '<path d="M60 31L85 40V62C85 78 74 88 60 95C46 88 35 78 35 62V40Z" fill="'+f+'" '+ln+'/><path d="M47 62l9 9 17-19" fill="none" stroke="'+s+'" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>';
  if(k==='lens')return '<circle cx="54" cy="54" r="18" fill="rgba(255,255,255,.25)" stroke="'+f+'" stroke-width="8"/><path d="M68 68L87 87" stroke="'+f+'" stroke-width="10" stroke-linecap="round"/><path d="M45 48a11 11 0 0 1 9-7" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>';
  if(k==='cross')return '<path d="M52 33h16v19h19v16H68v19H52V68H33V52h19Z" fill="'+f+'" '+ln+'/>';
  if(k==='hat')return '<ellipse cx="60" cy="72" rx="34" ry="9" fill="'+f+'" '+ln+'/><path d="M43 70C43 48 50 38 60 38s17 10 17 32Z" fill="'+f+'" '+ln+'/><rect x="44" y="58" width="32" height="7" fill="'+s+'" opacity=".85"/>';
  return '<path d="M32 82L37 46L52 63L60 38L68 63L83 46L88 82Z" fill="'+f+'" '+ln+'/><rect x="32" y="84" width="56" height="9" rx="2" fill="'+f+'" '+ln+'/><circle cx="37" cy="44" r="4" fill="'+f+'" '+ln+'/><circle cx="60" cy="36" r="4.5" fill="'+f+'" '+ln+'/><circle cx="83" cy="44" r="4" fill="'+f+'" '+ln+'/><circle cx="60" cy="68" r="5" fill="#ff3b4f" stroke="'+s+'" stroke-width="2"/>';
}
function badgeSVGOld(b,on,w){
  const k='b'+(++_u),P=on?b.p:LK,boss=on&&b.boss;
  const H='60,6 108,32 108,88 60,114 12,88 12,32',H2='60,16 99,38 99,82 60,104 21,82 21,38';
  const edge=boss?'#ffd95a':P.ln;
  return '<svg class="bdg'+(boss?' boss':'')+'" viewBox="0 0 120 140" width="'+w+'" height="'+Math.round(w*1.1667)+'" xmlns="http://www.w3.org/2000/svg"><defs>'+
    grad('o'+k,P.o)+grad('i'+k,P.i)+grad('r'+k,P.rb)+
    '<clipPath id="c'+k+'"><polygon points="'+H+'"/></clipPath></defs>'+
    '<polygon points="36,98 24,136 44,123 58,138 62,102" fill="url(#r'+k+')" stroke="'+edge+'" stroke-width="2" stroke-linejoin="round"/>'+
    '<polygon points="84,98 96,136 76,123 62,138 58,102" fill="url(#r'+k+')" stroke="'+edge+'" stroke-width="2" stroke-linejoin="round"/>'+
    '<polygon points="'+H+'" fill="url(#o'+k+')" stroke="'+edge+'" stroke-width="3" stroke-linejoin="round"/>'+
    '<polygon points="'+H2+'" fill="url(#i'+k+')" stroke="rgba(255,255,255,.6)" stroke-width="2"/>'+
    '<polygon points="60,16 99,38 99,60 21,60 21,38" fill="#fff" opacity=".13"/>'+
    (boss?'<polygon points="60,11 104,35 104,85 60,109 16,85 16,35" fill="none" stroke="#ffe58a" stroke-width="1.5" opacity=".9"/>':'')+
    '<g transform="translate(0,-2)">'+icon(b.k,P.ic,P.st)+'</g>'+
    (on?'<g clip-path="url(#c'+k+')"><g class="shn"><rect x="0" y="-10" width="26" height="170" fill="#fff" opacity=".42" transform="skewX(-20)"/></g></g>'+
      (boss?'<g clip-path="url(#c'+k+')"><g class="shn s2"><rect x="0" y="-10" width="12" height="170" fill="#fff" opacity=".5" transform="skewX(-20)"/></g></g>':'')+
      '<g transform="translate(16,24)"><g class="spk">'+SPK+'</g></g><g transform="translate(104,30)"><g class="spk s2">'+SPK+'</g></g><g transform="translate(96,100)"><g class="spk s3">'+SPK+'</g></g>'
     :'<g transform="translate(92,94)"><circle r="13" fill="#2a2a30" stroke="#fff" stroke-opacity=".35"/><path d="M-5 0v-4a5 5 0 0 1 10 0v4" fill="none" stroke="#fff" stroke-width="2"/><rect x="-6.5" y="-1" width="13" height="10" rx="2" fill="#fff"/></g>')+
    '</svg>';
}
function bdInfo(b){
  const on=isOn(b);
  sheet(esc(b.name),'<div class="bdi">'+badgeSVG(b,on,150)+'</div><p class="c">'+(on?'✨ مفتوحة':'🔒 مقفلة')+'</p><p class="c bdd">'+esc(b.desc)+'</p>'+
    progOf(b).map(x=>'<div class="pg"><div class="pgt"><span>'+esc(x.t)+'</span><span>'+Math.min(x.v,x.g)+'/'+x.g+'</span></div><div class="pgb"><i style="width:'+Math.min(100,Math.round(x.v/x.g*100))+'%"></i></div></div>').join(''));
}
export function badges(){
  X.th(false);
  let tab='all';
  const draw=()=>{
    const g=$('bgg');if(!g)return;
    const list=tab==='all'?BG:BG.filter(isOn);
    g.innerHTML=list.length?list.map(b=>{const on=isOn(b);return '<div class="bgi'+(on?'':' lk')+'" data-b="'+b.id+'">'+badgeSVG(b,on,92)+'<span>'+esc(b.name)+'</span></div>'}).join(''):'<div class="empty" style="grid-column:1/-1;color:#d9c08a">ما فتحت شارات بعد، العب وكمّل المهام</div>';
    g.querySelectorAll('[data-b]').forEach(e=>e.onclick=()=>bdInfo(BG.find(x=>x.id===e.dataset.b)));
    const c=$('bgcn');if(c)c.textContent=BG.filter(isOn).length;
  };
  X.A.innerHTML='<div class="bgs"><div class="bgh"><button class="ib" id="bk">➜</button><h1>الشارات</h1><span style="width:44px"></span></div><div class="bgp"><img class="av big" src="'+esc(X.prof.photo)+'" alt=""><div><div class="bgn">'+esc(X.prof.name)+'</div><div class="bgc"><b id="bgcn">0</b>/'+BG.length+' شارة</div></div></div><div class="bgt"><button class="on" id="t1">كل الشارات</button><button id="t2">المفتوحة</button></div><div class="bgg" id="bgg"></div></div>';
  $('bk').onclick=()=>screen();
  const sw=t=>{tab=t;$('t1').classList.toggle('on',t==='all');$('t2').classList.toggle('on',t==='open');draw()};
  $('t1').onclick=()=>sw('all');
  $('t2').onclick=()=>sw('open');
  draw();
  loadStats().then(draw);
}
/* ===== رسومات الشارات ===== */
const bstar=(cx,cy,R,r)=>{const p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?r:R;p.push((cx+q*Math.cos(a)).toFixed(1)+','+(cy+q*Math.sin(a)).toFixed(1))}return p.join(' ')};
const BSK='#f3c9a2',BSD='#d6a070',BSL='#7d4f2b';
const bHead=`<ellipse cx="43.5" cy="54" rx="3.4" ry="5" fill="${BSK}" stroke="${BSL}" stroke-width="1.2"/><ellipse cx="76.5" cy="54" rx="3.4" ry="5" fill="${BSK}" stroke="${BSL}" stroke-width="1.2"/><ellipse cx="60" cy="53" rx="16.5" ry="19.5" fill="${BSK}" stroke="${BSL}" stroke-width="1.6"/><path d="M47 62 Q60 76 73 62 Q73 70 60 73 Q47 70 47 62Z" fill="${BSD}" opacity=".25"/>`;
const bNeck=`<path d="M52 62h16v20H52z" fill="${BSD}" stroke="${BSL}" stroke-width="1.2"/>`;
const bEyes=(y,c)=>`<ellipse cx="53" cy="${y}" rx="3.2" ry="2.6" fill="#fff"/><ellipse cx="67" cy="${y}" rx="3.2" ry="2.6" fill="#fff"/><circle cx="53.4" cy="${y+.2}" r="1.8" fill="${c||'#2b1d14'}"/><circle cx="67.4" cy="${y+.2}" r="1.8" fill="${c||'#2b1d14'}"/><circle cx="54" cy="${y-.6}" r=".6" fill="#fff"/><circle cx="68" cy="${y-.6}" r=".6" fill="#fff"/>`;
const bNose=`<path d="M60 54 Q62.5 59 60 61.5" fill="none" stroke="${BSL}" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>`;
const PORT={
cit:()=>`
<path d="M12 112C12 94 28 83 46 79L74 79C92 83 108 94 108 112Z" fill="#2e558f" stroke="#0c2550" stroke-width="2"/>
<path d="M60 80L47 112M60 80L73 112" stroke="#1d3c6e" stroke-width="2" fill="none"/>
${bNeck}
<path d="M51 79L60 97L69 79L65 76L60 84L55 76Z" fill="#f4f6fb" stroke="#9fb0cc" stroke-width="1"/>
<path d="M40 82L45 66L55 79L49 90Z" fill="#3d6aad" stroke="#0c2550" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M80 82L75 66L65 79L71 90Z" fill="#3d6aad" stroke="#0c2550" stroke-width="1.6" stroke-linejoin="round"/>
${bHead}
<path d="M44 50C43 36 51 29 61 29C71 29 78 36 76 50C73 45 69 42 61 42C53 42 47 45 44 50Z" fill="#4a3322"/>
<path d="M41 46C42 33 51 26 62 26C73 26 81 33 79 46C71 41 50 41 41 46Z" fill="#7b8db0" stroke="#27385a" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M41 46C52 43 70 43 79 46L83 49C70 46 50 46 37 49Z" fill="#4d5f85" stroke="#27385a" stroke-width="1.4" stroke-linejoin="round"/>
<circle cx="62" cy="26" r="2" fill="#4d5f85"/><polygon points="${bstar(60,36.5,5.2,2.3)}" fill="#ffd54a" stroke="#8a5a00" stroke-width="1" stroke-linejoin="round"/>
<path d="M62 27L62 40" stroke="#5d6f94" stroke-width="1" opacity=".6"/>
${bEyes(54)}
<path d="M48.5 48.5Q53 45.8 57.5 48" fill="none" stroke="#3b2a1c" stroke-width="1.9" stroke-linecap="round"/><path d="M62.5 48Q67 45.8 71.5 48.5" fill="none" stroke="#3b2a1c" stroke-width="1.9" stroke-linecap="round"/>
${bNose}
<path d="M53.5 65Q60 71 66.5 65" fill="#fff" stroke="#8a3d2d" stroke-width="1.8" stroke-linejoin="round"/>
<circle cx="49" cy="60" r="3" fill="#ff8a7a" opacity=".3"/><circle cx="71" cy="60" r="3" fill="#ff8a7a" opacity=".3"/>
`,
det:()=>`
<path d="M10 112C10 94 28 83 46 79L74 79C92 83 110 94 110 112Z" fill="#46546a" stroke="#1c2535" stroke-width="2"/>
<path d="M60 80L44 112M60 80L76 112" stroke="#2f3b4e" stroke-width="2" fill="none"/>
${bNeck}
<path d="M51 78L60 96L69 78Z" fill="#f6f1e3" stroke="#a89b78" stroke-width="1"/>
<path d="M57.5 80h5l1 10-3.5 7-3.5-7Z" fill="#7a1424" stroke="#3d0a12" stroke-width="1"/>
<path d="M38 84L44 64L55 79L48 92Z" fill="#5f6f89" stroke="#1c2535" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M82 84L76 64L65 79L72 92Z" fill="#5f6f89" stroke="#1c2535" stroke-width="1.6" stroke-linejoin="round"/>
<circle cx="47" cy="90" r="1.6" fill="#c9d3e3"/><circle cx="73" cy="90" r="1.6" fill="#c9d3e3"/>
${bHead}
<path d="M44 38 Q60 52 76 38 L77 47 Q60 59 43 47Z" fill="#000" opacity=".22"/>
${bEyes(55)}
<path d="M47.5 49.5L57.5 48" stroke="#2b1d14" stroke-width="2.2" stroke-linecap="round"/><path d="M62.5 48L72.5 49.5" stroke="#2b1d14" stroke-width="2.2" stroke-linecap="round"/>
${bNose}
<path d="M54.5 67Q60 68.5 66 65.5" fill="none" stroke="#7a3a2a" stroke-width="1.8" stroke-linecap="round"/>
<g fill="#5a3a22" opacity=".18"><circle cx="50" cy="66" r="1"/><circle cx="53" cy="70" r="1"/><circle cx="60" cy="72" r="1"/><circle cx="67" cy="70" r="1"/><circle cx="70" cy="66" r="1"/></g>
<g transform="rotate(-7 60 40)"><path d="M43 42C43 27 50 21 60 21C70 21 77 27 77 42Z" fill="#5b4631" stroke="#2a1d10" stroke-width="1.6"/><path d="M52 22Q60 30 68 22" fill="none" stroke="#2f2216" stroke-width="2"/><path d="M43 42C53 46 67 46 77 42L77 36C67 40 53 40 43 36Z" fill="#241a10"/><ellipse cx="60" cy="43" rx="28" ry="6.5" fill="#6b5640" stroke="#2a1d10" stroke-width="1.6"/></g>
<circle cx="74" cy="64" r="13" fill="#bfeaff" fill-opacity=".38" stroke="#f0bf1a" stroke-width="4.2"/><circle cx="74" cy="64" r="13" fill="none" stroke="#7a5200" stroke-width="1" opacity=".6"/>
<ellipse cx="72.5" cy="62.5" rx="6.6" ry="5" fill="#fff"/><circle cx="73.5" cy="62.5" r="3.4" fill="#2b1d14"/><circle cx="74.6" cy="61.3" r="1.1" fill="#fff"/>
<path d="M66 58A10 10 0 0 1 74 52" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>
<path d="M83.5 73.5L92 83" stroke="#5e4010" stroke-width="6.5" stroke-linecap="round"/><path d="M83.5 73.5L92 83" stroke="#a9772b" stroke-width="3" stroke-linecap="round"/>`,
doc:()=>`
<path d="M10 112C10 94 28 83 46 79L74 79C92 83 110 94 110 112Z" fill="#f7f9f8" stroke="#6f8077" stroke-width="2"/>
<path d="M60 80L46 112M60 80L74 112" stroke="#b9c6bf" stroke-width="2" fill="none"/>
${bNeck}
<path d="M50 78L60 100L70 78Z" fill="#16b765" stroke="#0a6b38" stroke-width="1.4" stroke-linejoin="round"/>
<path d="M48 79C44 94 52 101 62 98" fill="none" stroke="#2c3a35" stroke-width="2.2" stroke-linecap="round"/>
<circle cx="63.5" cy="97.5" r="3.4" fill="#cfd8d3" stroke="#2c3a35" stroke-width="1.5"/>
${bHead}
<path d="M43.5 49C42 33 51 27 60 27C69 27 78 33 76.5 49C72 43 69 41 60 41C51 41 48 43 43.5 49Z" fill="#1fbf6a" stroke="#0a6b38" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M43.5 47C52 44 68 44 76.5 47" fill="none" stroke="#0a6b38" stroke-width="1.2" opacity=".6"/>
<circle cx="60" cy="36" r="6.2" fill="#d9e2de" stroke="#33423c" stroke-width="1.6"/><circle cx="60" cy="36" r="3.2" fill="#f4fbf8" stroke="#33423c" stroke-width="1"/><path d="M57.5 34.5A3 3 0 0 1 60 33" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>
${bEyes(55)}
<circle cx="53" cy="55" r="5.4" fill="#cfeee0" fill-opacity=".28" stroke="#2c3a35" stroke-width="1.5"/><circle cx="67" cy="55" r="5.4" fill="#cfeee0" fill-opacity=".28" stroke="#2c3a35" stroke-width="1.5"/><path d="M58.4 54.5Q60 53.5 61.6 54.5" fill="none" stroke="#2c3a35" stroke-width="1.4"/>
<path d="M47.5 49Q53 46.5 57 48.5" fill="none" stroke="#3b2a1c" stroke-width="1.8" stroke-linecap="round"/><path d="M63 48.5Q67 46.5 72.5 49" fill="none" stroke="#3b2a1c" stroke-width="1.8" stroke-linecap="round"/>
${bNose}
<path d="M54 65.5Q60 70.5 66 65.5" fill="#fff" stroke="#8a3d2d" stroke-width="1.7" stroke-linejoin="round"/>
<circle cx="86" cy="62" r="15" fill="#5dff9a" opacity=".28"/><circle cx="86" cy="62" r="9" fill="#5dff9a" opacity=".25"/>
<g transform="rotate(22 86 68)">
<rect x="85.6" y="31" width="0.9" height="16" fill="#eaf3ee"/>
<rect x="83.6" y="46" width="4.8" height="4" rx="1" fill="#9fb0a8" stroke="#46564f" stroke-width=".8"/>
<rect x="81.5" y="50" width="9" height="28" rx="2" fill="#e6fff0" fill-opacity=".7" stroke="#0a5c2e" stroke-width="1.5"/>
<rect x="83" y="58" width="6" height="19" rx="1" fill="#46ff8a"/><rect x="83" y="58" width="6" height="19" rx="1" fill="#0fb050" opacity=".35"/>
<rect x="83" y="58" width="1.6" height="19" fill="#c9ffe0" opacity=".8"/>
<path d="M81.5 56h3M81.5 62h3M81.5 68h3" stroke="#0a5c2e" stroke-width=".9"/>
<rect x="78" y="77.5" width="16" height="3" rx="1" fill="#dfe9e3" stroke="#46564f" stroke-width=".8"/>
<rect x="85" y="80.5" width="2" height="7" fill="#cfd8d3" stroke="#46564f" stroke-width=".6"/>
<rect x="81" y="87" width="10" height="2.6" rx="1" fill="#dfe9e3" stroke="#46564f" stroke-width=".8"/>
<circle cx="86" cy="29" r="1.5" fill="#5dff9a"/>
</g>
<ellipse cx="80" cy="70" rx="3.6" ry="5.2" fill="${BSK}" stroke="${BSL}" stroke-width="1.1" transform="rotate(22 80 70)"/><ellipse cx="91" cy="73" rx="3" ry="4.6" fill="${BSK}" stroke="${BSL}" stroke-width="1.1" transform="rotate(22 91 73)"/>`,
maf:()=>`
<path d="M10 112C10 94 28 83 46 79L74 79C92 83 110 94 110 112Z" fill="#1d1d26" stroke="#000" stroke-width="2"/>
<path d="M30 112L40 90M90 112L80 90M22 112L33 88M98 112L87 88" stroke="#34343f" stroke-width="1.2"/>
${bNeck}
<path d="M51 78L60 96L69 78Z" fill="#f2f2f2" stroke="#999" stroke-width="1"/>
<path d="M57 80h6l-1 6h-4Z" fill="#c4162a"/><path d="M58 86h4l3 15-5 6-5-6Z" fill="#a8101f" stroke="#5a0712" stroke-width="1"/>
<path d="M44 80L52 77L58 98L44 104Z" fill="#2c2c38" stroke="#000" stroke-width="1.4" stroke-linejoin="round"/>
<path d="M76 80L68 77L62 98L76 104Z" fill="#2c2c38" stroke="#000" stroke-width="1.4" stroke-linejoin="round"/>
<path d="M78 92L86 90L85 97Z" fill="#fff" stroke="#bbb" stroke-width=".8"/>
${bHead}
<path d="M44 38 Q60 52 76 38 L77 47 Q60 59 43 47Z" fill="#000" opacity=".28"/>
<path d="M44 53.5Q52 57 60 54Q68 57 76 53.5" fill="none" stroke="#000" stroke-width="1.2"/>
<rect x="45" y="50" width="13.4" height="8.6" rx="3.8" fill="#0b0b10" stroke="#000" stroke-width="1"/><rect x="61.6" y="50" width="13.4" height="8.6" rx="3.8" fill="#0b0b10" stroke="#000" stroke-width="1"/>
<path d="M47.5 52.5L51.5 52M64 52.5L68 52" stroke="#9aa" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>
<path d="M47 47.5L57.5 49" stroke="#2b1d14" stroke-width="2.2" stroke-linecap="round"/><path d="M62.5 49L73 47.5" stroke="#2b1d14" stroke-width="2.2" stroke-linecap="round"/>
${bNose}
<path d="M54 67Q60 70 66.5 64.5" fill="none" stroke="#7a3a2a" stroke-width="1.9" stroke-linecap="round"/>
<path d="M69 55L72 63" stroke="#b86a58" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>
<g transform="rotate(-14 62 67)"><rect x="62" y="65.4" width="17" height="3.8" rx="1.6" fill="#7a4a22" stroke="#3d2410" stroke-width=".8"/><rect x="64" y="65.4" width="2.4" height="3.8" fill="#d4a53a"/><circle cx="79.4" cy="67.3" r="2" fill="#ff6a2a"/><circle cx="79.4" cy="67.3" r="1" fill="#ffd27a"/></g>
<path d="M82 62C84 58 80 55 83 51C85 48 82 46 84 43" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".55"/>
<path d="M42 42C42 26 50 21 60 21C70 21 78 26 78 42Z" fill="#17171d" stroke="#000" stroke-width="1.6"/><path d="M51 22Q60 31 69 22" fill="none" stroke="#000" stroke-width="2"/>
<path d="M42 42C52 46 68 46 78 42L78 36C68 40 52 40 42 36Z" fill="#b8101f" stroke="#5a0712" stroke-width=".8"/>
<ellipse cx="60" cy="43" rx="29" ry="7" fill="#101015" stroke="#000" stroke-width="1.6"/>
<path d="M38 43C45 49 75 49 82 43" fill="none" stroke="#2c2c38" stroke-width="1" opacity=".8"/>`,
boss:()=>`
<path d="M8 112C8 94 28 83 46 79L74 79C92 83 112 94 112 112Z" fill="#14141a" stroke="#000" stroke-width="2"/>
<path d="M28 112L40 90M92 112L80 90" stroke="#2b2b36" stroke-width="1.2"/>
${bNeck}
<path d="M50 78L60 98L70 78Z" fill="#fbfbfb" stroke="#aaa" stroke-width="1"/>
<path d="M57 80h6l-1 6h-4Z" fill="#d4112b"/><path d="M58 86h4l3 15-5 6-5-6Z" fill="#d4112b" stroke="#6a0013" stroke-width="1"/>
<path d="M43 80L52 77L58 99L43 104Z" fill="#23232d" stroke="#000" stroke-width="1.4" stroke-linejoin="round"/>
<path d="M77 80L68 77L62 99L77 104Z" fill="#23232d" stroke="#000" stroke-width="1.4" stroke-linejoin="round"/>
<path d="M46 100C50 106 70 106 74 100" fill="none" stroke="#ffd34a" stroke-width="2" stroke-dasharray="2 1.6"/>
<circle cx="51" cy="91" r="3.8" fill="#d4112b" stroke="#6a0013" stroke-width="1"/><circle cx="51" cy="91" r="1.6" fill="#ff6b78"/><path d="M51 94.5L48 99" stroke="#18a04a" stroke-width="1.6" stroke-linecap="round"/><path d="M51 94.5L54 98" stroke="#18a04a" stroke-width="1.6" stroke-linecap="round"/>
<path d="M78 90L87 88L86 96Z" fill="#fff" stroke="#bbb" stroke-width=".8"/>
${bHead}
<path d="M44 38 Q60 52 76 38 L77 47 Q60 59 43 47Z" fill="#000" opacity=".25"/>
<rect x="45" y="50" width="13.4" height="8.6" rx="3.8" fill="#0b0b10" stroke="#ffd34a" stroke-width="1.6"/><rect x="61.6" y="50" width="13.4" height="8.6" rx="3.8" fill="#0b0b10" stroke="#ffd34a" stroke-width="1.6"/><path d="M58.4 53.5Q60 52.2 61.6 53.5" fill="none" stroke="#ffd34a" stroke-width="1.6"/>
<path d="M47.5 52.5L51.5 52M64 52.5L68 52" stroke="#9aa" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>
<path d="M46.5 47L57.5 49" stroke="#2b2118" stroke-width="2.4" stroke-linecap="round"/><path d="M62.5 49L73.5 47" stroke="#2b2118" stroke-width="2.4" stroke-linecap="round"/>
${bNose}
<path d="M50 63C54 59 58 62 60 62C62 62 66 59 70 63C66 66 62 64 60 64C58 64 54 66 50 63Z" fill="#2b2118" stroke="#15100b" stroke-width=".8"/>
<path d="M55 69Q60 71 65 69" fill="none" stroke="#7a3a2a" stroke-width="1.6" stroke-linecap="round"/>
<g transform="rotate(-14 62 69)"><rect x="63" y="67.4" width="18" height="4" rx="1.7" fill="#7a4a22" stroke="#3d2410" stroke-width=".8"/><rect x="66" y="67.4" width="2.6" height="4" fill="#ffd34a"/><circle cx="81.4" cy="69.4" r="2.1" fill="#ff6a2a"/><circle cx="81.4" cy="69.4" r="1" fill="#ffd27a"/></g>
<path d="M42 42C42 26 50 21 60 21C70 21 78 26 78 42Z" fill="#111116" stroke="#000" stroke-width="1.6"/><path d="M51 22Q60 31 69 22" fill="none" stroke="#000" stroke-width="2"/>
<path d="M42 42C52 46 68 46 78 42L78 35C68 39 52 39 42 35Z" fill="#ffc933" stroke="#8a5a00" stroke-width=".9"/>
<path d="M60 36L56 41L60 39L64 41Z" fill="#d4112b" stroke="#6a0013" stroke-width=".6"/><circle cx="60" cy="38.4" r="1.4" fill="#fff3a0"/>
<ellipse cx="60" cy="43" rx="29" ry="7" fill="#0c0c10" stroke="#000" stroke-width="1.6"/>
<path d="M36 43.5C44 50 76 50 84 43.5" fill="none" stroke="#ffd34a" stroke-width="1.3" opacity=".9"/>`
};
function badgeSVG(b,on,w){
  const k='b'+(++_u),P=on?b.p:LK,boss=on&&b.boss;
  const H='60,6 108,32 108,88 60,114 12,88 12,32',H2='60,16 99,38 99,82 60,104 21,82 21,38';
  const edge=boss?'#ffd95a':P.ln;
  return '<svg class="bdg'+(boss?' boss':'')+'" viewBox="0 -14 120 154" width="'+w+'" height="'+Math.round(w*154/120)+'" xmlns="http://www.w3.org/2000/svg"><defs>'+
    grad('o'+k,P.o)+grad('i'+k,P.i)+grad('r'+k,P.rb)+
    '<radialGradient id="s'+k+'" cx=".5" cy=".42" r=".55"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>'+
    '<filter id="f'+k+'"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope=".72"/><feFuncG type="linear" slope=".72"/><feFuncB type="linear" slope=".72"/></feComponentTransfer></filter>'+
    '<clipPath id="c'+k+'"><polygon points="'+H+'"/></clipPath><clipPath id="p'+k+'"><polygon points="'+H2+'"/></clipPath></defs>'+
    '<polygon points="36,98 24,136 44,123 58,138 62,102" fill="url(#r'+k+')" stroke="'+edge+'" stroke-width="2" stroke-linejoin="round"/>'+
    '<polygon points="84,98 96,136 76,123 62,138 58,102" fill="url(#r'+k+')" stroke="'+edge+'" stroke-width="2" stroke-linejoin="round"/>'+
    '<polygon points="'+H+'" fill="url(#o'+k+')" stroke="'+edge+'" stroke-width="3" stroke-linejoin="round"/>'+
    '<polygon points="'+H2+'" fill="url(#i'+k+')" stroke="rgba(255,255,255,.6)" stroke-width="2"/>'+
    '<g clip-path="url(#p'+k+')">'+(boss?'<g stroke="#ffd95a" stroke-width="2.4" opacity=".24">'+Array.from({length:16},(_,i)=>{const a=i*Math.PI/8;return '<path d="M60 56L'+(60+70*Math.cos(a)).toFixed(1)+' '+(56+70*Math.sin(a)).toFixed(1)+'"/>'}).join('')+'</g>':'')+'<circle cx="60" cy="56" r="44" fill="url(#s'+k+')"/><g'+(on?'':' filter="url(#f'+k+')" opacity=".62"')+'>'+PORT[b.id]()+'</g></g>'+
    '<polygon points="'+H2+'" fill="none" stroke="rgba(0,0,0,.28)" stroke-width="1"/>'+
    '<polygon points="60,16 99,38 99,56 21,56 21,38" fill="#fff" opacity=".1"/>'+
    (boss?'<polygon points="60,11 104,35 104,85 60,109 16,85 16,35" fill="none" stroke="#ffe58a" stroke-width="1.5" opacity=".9"/>'+
      '<path d="M40 10L43 -5L51 2L60 -11L69 2L77 -5L80 10Z" fill="url(#o'+k+')" stroke="#7a5200" stroke-width="1.6" stroke-linejoin="round"/><rect x="40" y="6" width="40" height="6" rx="1.5" fill="#f6c744" stroke="#7a5200" stroke-width="1.4"/><circle cx="43" cy="-6" r="2.4" fill="#d4112b" stroke="#6a0013" stroke-width=".8"/><circle cx="60" cy="-12" r="2.8" fill="#d4112b" stroke="#6a0013" stroke-width=".8"/><circle cx="77" cy="-6" r="2.4" fill="#d4112b" stroke="#6a0013" stroke-width=".8"/><circle cx="50" cy="9" r="1.6" fill="#d4112b"/><circle cx="60" cy="9" r="1.6" fill="#2d7bff"/><circle cx="70" cy="9" r="1.6" fill="#d4112b"/>':'')+
    (on?'<g clip-path="url(#c'+k+')"><g class="shn"><rect x="0" y="-10" width="26" height="170" fill="#fff" opacity=".34" transform="skewX(-20)"/></g></g>'+
      (boss?'<g clip-path="url(#c'+k+')"><g class="shn s2"><rect x="0" y="-10" width="12" height="170" fill="#fff" opacity=".45" transform="skewX(-20)"/></g></g>':'')+
      '<g transform="translate(16,24)"><g class="spk">'+SPK+'</g></g><g transform="translate(104,30)"><g class="spk s2">'+SPK+'</g></g><g transform="translate(96,100)"><g class="spk s3">'+SPK+'</g></g>'
     :'<g transform="translate(92,94)"><circle r="13" fill="#2a2a30" stroke="#fff" stroke-opacity=".35"/><path d="M-5 0v-4a5 5 0 0 1 10 0v4" fill="none" stroke="#fff" stroke-width="2"/><rect x="-6.5" y="-1" width="13" height="10" rx="2" fill="#fff"/></g>')+
    '</svg>';
}
