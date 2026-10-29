import {getApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getFirestore,doc,getDoc,setDoc,addDoc,deleteDoc,updateDoc,collection,getDocs,onSnapshot,query,orderBy,where,limit,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import * as V from "./voice.js";
import {info} from "./roles.js";

const db=getFirestore(getApp());
let X,code=null,room=null,players=[],rchat=[],un=[],Game=null;
const GM=import('./game.js?'+Date.now()).catch(e=>{console.error(e);return null});
let cm={mode:'classic',max:10,lock:false,sorc:false,maf:2,doc:true,det:true,snp:false};
const MINSTART=2; // للتجربة، لاحقًا 6
const MAD_OPEN=true; // false = يقفل وضع الدموي (قريبًا)
const $=i=>document.getElementById(i);
const esc=s=>X.esc(s);
const toast=m=>X.toast(m);
const tagName=m=>m==='mad'?'دموي':'كلاسيكي';
const hash=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
const isBan=r=>{const b=r.bans&&r.bans[X.me.uid];return !!b&&b>Date.now()};
const DUR=[['30 ثانية',30e3],['5 دقايق',3e5],['30 دقيقة',18e5],['ساعة',36e5],['24 ساعة',864e5],['نهائيًا',0]];
const bn=new Map();
export function init(c){X=c;GM.then(g=>{Game=g;if(g)g.init(c)})}
export function stopRoom(){un.forEach(f=>f());un=[];if(Game)Game.stop();V.release();code=null;room=null;players=[];rchat=[]}

/* صفوف الأدوار (تنعاد في الإنشاء وفي إعدادات الغرفة) */
const RR=[['doc','doctor','الطبيب','card-doctor.jpg'],['det','detective','المحقق','card-detective.jpg'],['sorc','sorcerer','الساحر','🧙'],['snp','sniper','القناص','🎯']];
const bang=r=>' <button class="mini" data-i="'+r+'" style="padding:0 7px;border-radius:50%">!</button>';
function rolesHTML(s,p){
  return '<div class="rr"><img class="rimg" src="card-mafia.jpg" alt=""><div class="rin"><div class="t">المافيا'+bang('mafia')+'</div><div class="step"><button id="'+p+'mmin">−</button><b id="'+p+'mval">'+s.maf+'</b><button id="'+p+'mpl">+</button></div></div></div>'+
  RR.map(([k,r,t,im])=>'<div class="rr">'+(im.endsWith('.jpg')?'<img class="rimg" src="'+im+'" alt="">':'<div class="remo">'+im+'</div>')+'<div class="rin"><div class="t">'+t+bang(r)+'</div></div><div class="chk'+(s[k]?' on':'')+'" id="'+p+k+'">✓</div></div>').join('');
}
function bindRoles(root,s,p,fix){
  const q=i=>root.querySelector('#'+i);
  RR.forEach(([k])=>{const e=q(p+k);e.onclick=()=>{s[k]=!s[k];e.classList.toggle('on',s[k])}});
  q(p+'mmin').onclick=()=>{s.maf--;fix()};
  q(p+'mpl').onclick=()=>{s.maf++;fix()};
  root.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>info(b.dataset.i));
}

/* شاشة المخصص */
export function custom(msg,needPw,cv){
  X.th(false);
  const M=m=>'<button class="mode '+m+(cm.mode===m?' on':'')+'" data-m="'+m+'">'+tagName(m)+'</button>';
  X.A.innerHTML=X.topbar('<button class="lv" id="bk">→</button>')+'<main style="justify-content:flex-start">'+
  '<div class="card c"><p>نوع الغرفة</p><div class="two">'+M('classic')+M('mad')+'</div>'+
  '<p>عدد اللاعبين</p><div class="step"><button id="smin">−</button><b id="sval">'+cm.max+'</b><button id="spl">+</button></div>'+
  '<div id="sw" style="display:'+(cm.mode==='classic'?'block':'none')+'"><p>الأدوار</p>'+rolesHTML(cm,'c_')+'</div>'+
  '<div class="lk"><label><input type="checkbox" id="lk"'+(cm.lock?' checked':'')+'> 🔒 كلمة سر للغرفة</label></div>'+
  '<input id="pw" maxlength="12" placeholder="اكتب كلمة السر" style="display:'+(cm.lock?'block':'none')+'">'+
  '<div class="err" id="ce"></div><button class="btn" id="c">إنشاء الغرفة</button></div>'+
  '<div class="err">'+esc(msg||'')+'</div></main>';
  document.querySelectorAll('.mode[data-m]').forEach(b=>b.onclick=()=>{cm.mode=b.dataset.m;$('sw').style.display=cm.mode==='classic'?'block':'none';document.querySelectorAll('.mode[data-m]').forEach(x=>x.classList.toggle('on',x===b))});
  const fixM=()=>{cm.maf=Math.max(1,Math.min(cm.max>10?3:2,cm.maf));$('c_mval').textContent=cm.maf};
  bindRoles(document,cm,'c_',fixM);
  $('smin').onclick=()=>{cm.max=Math.max(6,cm.max-1);$('sval').textContent=cm.max;fixM()};
  $('spl').onclick=()=>{cm.max=Math.min(16,cm.max+1);$('sval').textContent=cm.max;fixM()};
  $('lk').onchange=e=>{cm.lock=e.target.checked;$('pw').style.display=cm.lock?'block':'none'};
  $('c').onclick=async()=>{
    const pw=cm.lock?$('pw').value.trim():'';
    if(cm.lock&&pw.length<3){$('ce').textContent='كلمة السر 3 أحرف على الأقل';return}
    try{await newRoom({pub:false,mode:cm.mode,max:cm.max,pass:pw,sorc:cm.mode==='classic'&&cm.sorc,snp:cm.mode==='classic'&&cm.snp,maf:cm.maf,doc:cm.doc,det:cm.det})}catch(x){$('ce').textContent='مشكلة: '+x.code}
  };
  $('bk').onclick=()=>ask('تبي ترجع للرئيسية؟',()=>X.home());
}

/* تأكيد */
function ask(msg,yes){
  const o=document.createElement('div');o.className='ov dlg';
  o.innerHTML='<div class="dg"><p>'+esc(msg)+'</p><div class="two"><button class="btn alt" id="dn">إلغاء</button><button class="btn" id="dy">تأكيد</button></div></div>';
  document.body.appendChild(o);
  $('dn').onclick=()=>o.remove();
  $('dy').onclick=()=>{o.remove();yes()};
  o.onclick=e=>{if(e.target===o)o.remove()};
}
const askLeave=()=>ask(room&&room.host===X.me.uid&&!room.public?'أنت المضيف، لو طلعت بتنقفل الغرفة للجميع. تبي تطلع؟':'تبي تطلع من الغرفة؟',leave);

/* الغرف والمقاعد */
const addMe=(c,seat)=>setDoc(doc(db,'rooms',c,'players',X.me.uid),{name:X.prof.name,photo:X.prof.photo,seat,joinedAt:serverTimestamp()});
async function seatInfo(c,mx){
  const s=await getDocs(collection(db,'rooms',c,'players'));
  const t=new Set(s.docs.map(d=>d.data().seat));
  let seat=-1;for(let i=0;i<mx;i++)if(!t.has(i)){seat=i;break}
  return {seat,n:s.size};
}
async function newRoom(o){
  let c;do{c=String(Math.floor(1000+Math.random()*9000))}while((await getDoc(doc(db,'rooms',c))).exists());
  const ph=o.pass?await hash(c+':'+o.pass):null;
  await setDoc(doc(db,'rooms',c),{host:X.me.uid,status:'lobby',public:o.pub,open:!!o.pub||!ph,mode:o.mode,max:o.max,sorc:!!o.sorc,useSnp:!!o.snp,maf:o.maf||0,useDoc:o.doc!==false,useDet:o.det!==false,pwh:ph,createdAt:serverTimestamp()});
  await addMe(c,0);enter(c);
}
async function joinRoom(c,pw){
  if(c.length!==4){custom('الكود 4 أرقام');return}
  try{
    const s=await getDoc(doc(db,'rooms',c));
    if(!s.exists()){custom('ما لقيت الغرفة',false,c);return}
    const r=s.data();
    if(r.status!=='lobby'){custom('اللعبة بدأت',false,c);return}
    if(isBan(r)){custom('أنت محظور من هذي الغرفة',false,c);return}
    if(r.pwh){
      if(!pw){custom('الغرفة محمية بكلمة سر',true,c);return}
      if(await hash(c+':'+pw)!==r.pwh){custom('كلمة السر غلط',true,c);return}
    }
    const si=await seatInfo(c,r.max||10);
    if(si.seat<0){custom('الغرفة ممتلئة',false,c);return}
    await addMe(c,si.seat);enter(c);
  }catch(x){custom('مشكلة: '+x.code)}
}
/* بحث عن غرفة بالكود (بدون ما تدخل المخصص) */
export function search(){
  const s=sheet('🔍 بحث عن غرفة','<input id="sc" maxlength="4" inputmode="numeric" placeholder="كود الغرفة"><input id="sp" maxlength="12" placeholder="كلمة سر الغرفة" style="display:none"><div class="err" id="se"></div><button class="btn" id="sj">انضم</button>');
  const q=i=>s.o.querySelector('#'+i),err=t=>{q('se').textContent=t};
  q('sj').onclick=async()=>{
    const c=q('sc').value.trim(),pw=q('sp').value.trim();
    if(c.length!==4){err('الكود 4 أرقام');return}
    try{
      const g=await getDoc(doc(db,'rooms',c));
      if(!g.exists()){err('ما لقيت الغرفة');return}
      const r=g.data();
      if(r.status!=='lobby'){err('اللعبة بدأت');return}
      if(isBan(r)){err('أنت محظور من هذي الغرفة');return}
      if(r.pwh){
        q('sp').style.display='block';
        if(!pw){err('الغرفة محمية، اكتب كلمة السر');return}
        if(await hash(c+':'+pw)!==r.pwh){err('كلمة السر غلط');return}
      }
      const si=await seatInfo(c,r.max||10);
      if(si.seat<0){err('الغرفة ممتلئة');return}
      await addMe(c,si.seat);s.close();enter(c);
    }catch(x){err('مشكلة: '+x.code)}
  };
}
export async function joinByInvite(c,ph){
  try{
    const s=await getDoc(doc(db,'rooms',c));
    if(!s.exists()){toast('الغرفة ما عادت موجودة');return}
    const rm=s.data();
    const mine=await getDoc(doc(db,'rooms',c,'players',X.me.uid));
    if(mine.exists()&&rm.status==='lobby'){enter(c);return}
    if(rm.status!=='lobby'){toast('اللعبة بدأت');return}
    if(isBan(rm)){toast('أنت محظور من هذي الغرفة');return}
    if(rm.pwh&&rm.pwh!==ph){toast('الغرفة محمية بكلمة سر');return}
    const si=await seatInfo(c,rm.max||10);
    if(si.seat<0){toast('الغرفة ممتلئة');return}
    await addMe(c,si.seat);enter(c);
  }catch(x){toast('مشكلة: '+x.code)}
}
export async function quick(mode){
  const e=$('e2');if(e)e.textContent='ندوّر لك على غرفة...';
  try{
    const q=await getDocs(query(collection(db,'rooms'),where('open','==',true),where('status','==','lobby'),where('mode','==',mode),limit(10)));
    for(const d of q.docs){
      const r=d.data(),t=r.createdAt;
      if(t&&Date.now()-t.toMillis()>20*60000)continue;
      if(isBan(r))continue;
      const si=await seatInfo(d.id,r.max||10);
      if(si.n>0&&si.seat>=0){await addMe(d.id,si.seat);enter(d.id);return}
    }
    await newRoom({pub:true,mode,max:10,pass:''});
  }catch(x){if(e)e.textContent='مشكلة: '+x.code}
}
function enter(c){
  stopRoom();code=c;X.th(false);
  un.push(onSnapshot(doc(db,'rooms',c),s=>{
    if(!s.exists()){X.home('المضيف سكّر الغرفة');return}
    room=s.data();
    if(isBan(room)){
      stopRoom();
      deleteDoc(doc(db,'rooms',c,'players',X.me.uid)).catch(()=>{});
      X.home('انطردت من الغرفة');return;
    }
    render();
  }));
  un.push(onSnapshot(query(collection(db,'rooms',c,'players'),orderBy('joinedAt')),s=>{
    players=s.docs.map(d=>({id:d.id,...d.data()}));render();
  }));
  un.push(onSnapshot(query(collection(db,'rooms',c,'chat'),orderBy('at','desc'),limit(50)),s=>{
    rchat=s.docs.map(d=>d.data()).reverse();renderChat();
  }));
}
function seatHTML(i){
  const p=players.find(x=>x.id!==undefined&&x.seat===i);
  if(!p)return '<div class="seatw"><div class="seat" data-seat="'+i+'">+</div><div class="sn"></div></div>';
  return '<div class="seatw"><div class="seat full'+(p.id===X.me.uid?' me':'')+'" data-p="'+p.id+'">'+(p.id===room.host?'<span class="crown">👑</span>':'')+'<img src="'+esc(p.photo)+'" alt=""></div><div class="sn">'+esc(p.name)+'</div></div>';
}
const col=a=>'<div class="col">'+a.map(seatHTML).join('')+'</div>';
async function moveSeat(i){
  if(players.some(p=>p.seat===i))return;
  try{await updateDoc(doc(db,'rooms',code,'players',X.me.uid),{seat:i})}catch(e){toast('مشكلة: '+e.code)}
}
const rmsgs=()=>{const l=rchat.filter(m=>!m.dead);return l.length?l.map(m=>'<div class="rmsg'+(m.from===X.me.uid?' mine':'')+'"><b>'+esc(m.name)+'</b> '+esc(m.text)+'</div>').join(''):'<div class="rmsg" style="opacity:.6">ابدأ الدردشة مع اللاعبين...</div>'};
function renderChat(){const el=$('rm');if(!el)return;el.innerHTML=rmsgs();el.scrollTop=el.scrollHeight}
async function rsend(){
  const el=$('ri'),t=el.value.trim();
  if(!t)return;
  el.value='';
  try{await addDoc(collection(db,'rooms',code,'chat'),{from:X.me.uid,name:X.prof.name,text:t,at:serverTimestamp()})}catch(x){toast('مشكلة: '+x.code)}
}
function rolesRow(){
  const mad=(room.mode||'classic')==='mad';
  const mc=room.maf>0?room.maf:(players.length>=5?2:1);
  const it=[['🔪','مافيا ×'+mc,true],['💉','الطبيب',room.useDoc!==false],['🕵️','المحقق',room.useDet!==false],['🧙','الساحر',!!room.sorc],['🎯','القناص',mad||!!room.useSnp]];
  if(mad)it.push(['🃏','الجوكر',true]);
  return '<div class="rol">'+it.map(x=>'<span class="rch'+(x[2]?'':' off')+'">'+x[0]+' '+x[1]+'</span>').join('')+'</div>';
}
function sheet(title,html){
  const o=document.createElement('div');o.className='ov';
  o.innerHTML='<div class="sh"><div class="shh"><b>'+title+'</b><button class="mini" id="shx">✕</button></div><div style="max-height:75vh;overflow:auto">'+html+'</div></div>';
  document.body.appendChild(o);
  const close=()=>o.remove();
  o.onclick=e=>{if(e.target===o||e.target.id==='shx')close()};
  return {o,close};
}

/* قائمة الثلاث نقاط: نفس خيارات الإنشاء */
function roomEdit(){
  const lo=Math.max(6,...players.map(p=>p.seat+1));
  const cls=(room.mode||'classic')==='classic',pub=!!room.public;
  let mx=room.max||10;
  const st={maf:room.maf>0?room.maf:2,doc:room.useDoc!==false,det:room.useDet!==false,sorc:!!room.sorc,snp:!!room.useSnp,lock:!!room.pwh};
  const s=sheet('إعدادات الغرفة','<p>عدد اللاعبين</p><div class="step"><button id="em1">−</button><b id="emv">'+mx+'</b><button id="em2">+</button></div>'+
    (cls?'<p>الأدوار</p>'+rolesHTML(st,'e_'):'')+
    (pub?'':'<div class="lk"><label><input type="checkbox" id="elk"'+(st.lock?' checked':'')+'> 🔒 كلمة سر للغرفة</label></div><input id="epw" maxlength="12" placeholder="'+(room.pwh?'كلمة سر جديدة (فاضية = نفس القديمة)':'اكتب كلمة السر')+'" style="display:'+(st.lock?'block':'none')+'">')+
    '<div class="err" id="ee"></div><button class="btn" id="es">حفظ</button>');
  const q=i=>s.o.querySelector('#'+i);
  const fix=()=>{mx=Math.max(lo,Math.min(16,mx));st.maf=Math.max(1,Math.min(mx>10?3:2,st.maf));q('emv').textContent=mx;if(cls)q('e_mval').textContent=st.maf};
  q('em1').onclick=()=>{mx--;fix()};
  q('em2').onclick=()=>{mx++;fix()};
  if(cls)bindRoles(s.o,st,'e_',fix);
  if(!pub)q('elk').onchange=e=>{st.lock=e.target.checked;q('epw').style.display=st.lock?'block':'none'};
  fix();
  q('es').onclick=async()=>{
    try{
      const up=cls?{max:mx,maf:st.maf,useDoc:st.doc,useDet:st.det,sorc:st.sorc,useSnp:st.snp}:{max:mx};
      if(!pub){
        let ph=room.pwh||null;
        if(!st.lock)ph=null;
        else{
          const pw=q('epw').value.trim();
          if(pw){if(pw.length<3){q('ee').textContent='كلمة السر 3 أحرف على الأقل';return}ph=await hash(code+':'+pw)}
          else if(!ph){q('ee').textContent='اكتب كلمة السر';return}
        }
        up.pwh=ph;up.open=!ph;
      }
      await updateDoc(doc(db,'rooms',code),up);s.close();toast('انحفظت الإعدادات ✅');
    }catch(e){q('ee').textContent='مشكلة: '+(e.code||e.message)}
  };
}

/* الطرد والبلاغ والبروفيل */
async function kick(u,ms){
  const until=ms?Date.now()+ms:1e15;
  try{await updateDoc(doc(db,'rooms',code),{['bans.'+u]:until})}catch(e){toast('مشكلة: '+e.code);return}
  try{await deleteDoc(doc(db,'rooms',code,'players',u))}catch(e){}
  toast('تم الطرد');
}
const shrink=file=>new Promise((ok,no)=>{
  const r=new FileReader();r.onerror=no;
  r.onload=()=>{const im=new Image();im.onerror=no;im.onload=()=>{
    const W=800,H=300,c=document.createElement('canvas');c.width=W;c.height=H;
    const x=c.getContext('2d'),k=Math.max(W/im.width,H/im.height),w=im.width*k,h=im.height*k;
    x.drawImage(im,(W-w)/2,(H-h)/2,w,h);ok(c.toDataURL('image/jpeg',.7));
  };im.src=r.result};
  r.readAsDataURL(file);
});
async function profile(u){
  const p=players.find(x=>x.id===u);if(!p)return;
  const mine=u===X.me.uid,host=room.host===X.me.uid;
  const ib='position:absolute;top:8px;width:34px;height:34px;border-radius:50%;border:0;background:rgba(0,0,0,.45);color:#fff;font-size:16px;cursor:pointer;';
  const o=document.createElement('div');
  o.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:9998;padding:16px';
  o.innerHTML='<div style="width:100%;max-width:340px;background:#fff;color:#222;border-radius:18px;overflow:hidden;direction:rtl">'+
    '<div id="pb" style="height:150px;background:linear-gradient(135deg,#c7d2fe,#a5b4fc);background-size:cover;background-position:center;position:relative">'+
    (mine?'<button id="pe" style="'+ib+'right:8px">✏️</button>':'<button id="prp" style="'+ib+'left:8px">⚠️</button>')+
    (host&&!mine?'<button id="pk" style="'+ib+'left:48px">🚫</button>':'')+'</div>'+
    '<div style="padding:0 18px 18px"><div style="display:flex;align-items:flex-end;gap:12px;margin-top:-34px"><img src="'+esc(p.photo)+'" alt="" style="width:72px;height:72px;border-radius:50%;border:3px solid #fff;object-fit:cover;background:#ddd"><div style="font-weight:700;font-size:18px;padding-bottom:6px">'+esc(p.name)+(room.host===u?' 👑':'')+'</div></div>'+
    '<div style="display:flex;margin-top:16px;text-align:center"><div style="flex:1"><div style="font-size:24px;font-weight:700" id="pg">…</div><div style="color:#888;font-size:13px">إجمالي الألعاب</div></div><div style="width:1px;background:#ddd"></div><div style="flex:1"><div style="font-size:24px;font-weight:700" id="pw2">…</div><div style="color:#888;font-size:13px">معدل الفوز</div></div></div></div></div>';
  document.body.appendChild(o);
  o.onclick=e=>{if(e.target===o)o.remove()};
  const q=i=>o.querySelector('#'+i);
  const setB=img=>{const e=q('pb');if(e&&typeof img==='string'&&img.startsWith('data:image/')&&!img.includes('"'))e.style.backgroundImage='url("'+img+'")'};
  getDoc(doc(db,'stats',u)).then(s=>{
    const d=s.exists()?s.data():{},g=d.games||0,w=d.wins||0;
    if(q('pg'))q('pg').textContent=g;
    if(q('pw2'))q('pw2').textContent=(g?(w/g*100).toFixed(1):'0')+'%';
  }).catch(()=>{if(q('pg')){q('pg').textContent='-';q('pw2').textContent='-'}});
  if(bn.has(u))setB(bn.get(u));
  else getDoc(doc(db,'banners',u)).then(s=>{const i=s.exists()?s.data().img:null;bn.set(u,i);setB(i)}).catch(()=>{});
  if(mine)q('pe').onclick=()=>{
    const f=document.createElement('input');f.type='file';f.accept='image/*';
    f.onchange=async()=>{
      const file=f.files[0];if(!file)return;
      try{
        const img=await shrink(file);
        await setDoc(doc(db,'banners',X.me.uid),{img,at:serverTimestamp()});
        bn.set(X.me.uid,img);setB(img);toast('تم تحديث البانر ✅');
      }catch(e){toast('مشكلة: '+(e.code||e.message))}
    };
    f.click();
  };
  else{
    q('prp').onclick=()=>{o.remove();ask('تبلّغ عن '+p.name+'؟',async()=>{
      try{await addDoc(collection(db,'reports'),{from:X.me.uid,target:u,room:code,at:serverTimestamp()});toast('وصل البلاغ ✅')}catch(e){toast('مشكلة: '+e.code)}
    })};
    if(host)q('pk').onclick=()=>{
      o.remove();
      const s=sheet('مدة الطرد',DUR.map((d,i)=>'<button class="btn alt" data-d="'+i+'" style="margin:4px 0">'+d[0]+'</button>').join(''));
      s.o.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{const d=DUR[+b.dataset.d];s.close();ask('تطرد '+p.name+' ('+d[0]+')؟',()=>kick(u,d[1]))});
    };
  }
}

function render(){
  if(!room||!code)return;
  const host=room.host===X.me.uid,mx=room.max||10,half=Math.ceil(mx/2),mode=room.mode||'classic';
  if(room.status==='playing'&&!(Game&&Game.closed(room))){X.A.classList.remove('fix');if(Game)Game.show(code,room,players,askLeave,render);return}
  if(Game&&room.status!=='playing')Game.stop();
  const old=$('ri'),keep=old?old.value:'',foc=!!old&&document.activeElement===old;
  const R=n=>[...Array(n)].map((_,i)=>i),can=(mode==='classic'||MAD_OPEN)&&players.length>=MINSTART&&room.status!=='playing';
  X.A.classList.add('fix');
  X.A.innerHTML=X.topbar('<button class="lv" id="l">✕</button>'+(host?'<button class="dots" id="rdt">•••</button>':''))+'<div class="ri"><span>غرفة '+code+'</span><span class="tag '+mode+'">'+tagName(mode)+'</span>'+(room.pwh?'<span>🔒</span>':'')+(room.sorc?'<span>🧙</span>':'')+'<span>👥 '+players.length+'/'+mx+'</span></div>'+
  rolesRow()+'<div class="scr"><div class="seats" style="min-height:'+(half*68)+'px">'+col(R(half))+
  '<div class="mid"><p class="c" style="font-size:12px">اضغط + لتغيير مكانك</p>'+
  (host?'<button class="btn" id="s" '+(can?'':'disabled')+'>'+(mode!=='classic'&&!MAD_OPEN?'الدموي قريبًا':'ابدأ اللعبة'+(players.length<MINSTART?' (يحتاج '+MINSTART+')':''))+'</button>':'<p class="c">ننتظر المضيف يبدأ...</p>')+
  '<button class="btn alt" id="iv" style="font-size:15px;padding:12px">📨 دعوة</button></div>'+col(R(mx-half).map(i=>i+half))+'</div></div>'+
  '<div class="rc dock"><div class="rm" id="rm">'+rmsgs()+'</div><div class="rb">'+V.html()+'<input id="ri" maxlength="200" placeholder="رسالة للجميع..."><button id="rs">➤</button></div></div>';
  document.querySelectorAll('[data-seat]').forEach(x=>x.onclick=()=>moveSeat(+x.dataset.seat));
  document.querySelectorAll('[data-p]').forEach(x=>x.onclick=()=>profile(x.dataset.p));
  if(host&&can)$('s').onclick=()=>Game?Game.start(code,players,room):toast('تعذر تحميل اللعبة');
  $('l').onclick=askLeave;
  const rd=$('rdt');if(rd)rd.onclick=roomEdit;
  $('iv').onclick=()=>X.invite(code,room,players.map(p=>p.id));
  $('rs').onclick=rsend;
  $('ri').onkeydown=e=>{if(e.key==='Enter')rsend()};
  $('ri').value=keep;if(foc)$('ri').focus();
  const m=$('rm');m.scrollTop=m.scrollHeight;
  V.force(null);V.bind(toast);
}
async function leave(){
  const c=code,me=X.me.uid,host=room&&room.host===me,pub=room&&room.public,st=room&&room.status;
  const next=players.find(p=>p.id!==me);
  stopRoom();
  try{
    if(host&&pub&&next){
      const up={host:next.id};
      if(st==='playing'){up.status='lobby';up.ph=null}
      await updateDoc(doc(db,'rooms',c),up);
      await deleteDoc(doc(db,'rooms',c,'players',me));
    }else{
      await deleteDoc(doc(db,'rooms',c,'players',me));
      if(host)await deleteDoc(doc(db,'rooms',c));
    }
  }catch(e){}
  X.home();
}
