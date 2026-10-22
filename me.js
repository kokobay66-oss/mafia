import {getApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getFirestore,collection,setDoc,getDoc,updateDoc,addDoc,deleteDoc,doc,query,where,orderBy,limit,getDocs,arrayUnion,arrayRemove,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
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
