import {getApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getFirestore,doc,getDoc,setDoc,addDoc,deleteDoc,updateDoc,collection,getDocs,onSnapshot,query,orderBy,where,limit,arrayUnion,arrayRemove,increment,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const db=getFirestore(getApp());
let X,friends=[],chats=[],grps=[],fU=[],cU=[],U={},view='',curRead=null;
const $=i=>document.getElementById(i);
const uid=()=>X.me.uid;
const esc=s=>X.esc(s);
const toast=m=>X.toast(m);
const tm=t=>t&&t.toMillis?t.toMillis():Date.now();
const p2=x=>String(x).padStart(2,'0');
const fmt=t=>{if(!t)return '';const d=t.toDate?t.toDate():new Date(t),n=new Date();return d.toDateString()===n.toDateString()?p2(d.getHours())+':'+p2(d.getMinutes()):d.getDate()+'/'+(d.getMonth()+1)};
const full=t=>{const d=new Date(t);return p2(d.getDate())+'/'+p2(d.getMonth()+1)+'/'+d.getFullYear()+' '+p2(d.getHours())+':'+p2(d.getMinutes())};
const unreadOf=o=>(o.unread&&o.unread[uid()])||0;
const reqs=()=>friends.filter(f=>f.status==='received').length;
const total=()=>chats.reduce((a,c)=>a+unreadOf(c),0)+grps.reduce((a,g)=>a+unreadOf(g),0);
export const badgeN=()=>X?total()+reqs():0;
const badge=()=>{const b=document.querySelector('nav button[data-t="msg"]');if(b)b.dataset.n=badgeN()};
const redraw=()=>{
  badge();
  if(view==='conv')drawConvs();
  if(view==='friends')drawFriends();
  if(view==='chat'&&curRead)curRead();
};
export function init(ctx){X=ctx}
export function stopChat(){cU.forEach(f=>f());cU=[];curRead=null}
export function reset(){fU.forEach(f=>f());fU=[];stopChat();friends=[];chats=[];grps=[];U={};view=''}
export function start(){
  reset();
  fU.push(onSnapshot(collection(db,'users',uid(),'friends'),s=>{friends=s.docs.map(d=>({id:d.id,...d.data()}));redraw()}));
  fU.push(onSnapshot(query(collection(db,'chats'),where('members','array-contains',uid())),s=>{chats=s.docs.map(d=>({id:d.id,...d.data()}));redraw()}));
  fU.push(onSnapshot(query(collection(db,'groups'),where('members','array-contains',uid())),s=>{grps=s.docs.map(d=>({id:d.id,...d.data()}));redraw()}));
}
async function getU(u){
  if(U[u])return U[u];
  const s=await getDoc(doc(db,'profiles',u));
  U[u]=s.exists()?s.data():{name:'لاعب',photo:'',pid:'------'};
  return U[u];
}

/* تبويب الرسائل */
export function tabScreen(){
  stopChat();view='conv';X.th(true);
  X.A.innerHTML='<div class="mh"><h1>الرسائل</h1><div class="ics"><button class="ib" id="fr">👥</button><button class="ib" id="pl">➕</button></div></div><div class="list" id="cl"></div>'+X.nav();
  X.bindNav();$('pl').onclick=toggleMenu;$('fr').onclick=friendsScreen;drawConvs();
}
async function drawConvs(){
  if(!$('cl'))return;
  const other=c=>c.members.find(x=>x!==uid());
  await Promise.all(chats.map(c=>getU(other(c))));
  const el=$('cl');if(!el)return;
  const items=[
    ...chats.map(c=>({k:'f',id:other(c),name:U[other(c)].name,photo:U[other(c)].photo,last:c.last,at:c.lastAt,n:unreadOf(c)})),
    ...grps.map(g=>({k:'g',id:g.id,name:g.name,last:g.last,at:g.lastAt,n:unreadOf(g)}))
  ].sort((a,b)=>tm(b.at)-tm(a.at));
  el.innerHTML=items.length?items.map(i=>'<div class="cv" data-k="'+i.k+'" data-id="'+i.id+'">'+(i.k==='g'?'<div class="gav">👥</div>':'<img class="av" src="'+esc(i.photo)+'" alt="">')+'<div class="t"><div class="n">'+esc(i.name)+'</div><div class="m">'+esc(i.last||'')+'</div></div><div class="d"><span>'+fmt(i.at)+'</span>'+(i.n?'<span class="bd">'+(i.n>99?'99+':i.n)+'</span>':'')+'</div></div>').join(''):'<div class="empty">ما عندك محادثات بعد<br>اضغط 👥 وابدأ مع أصدقائك</div>';
  el.querySelectorAll('.cv').forEach(r=>r.onclick=()=>openChat(r.dataset.k,r.dataset.id));
}
function toggleMenu(){
  const old=$('mn');if(old){old.remove();return}
  const m=document.createElement('div');m.className='menu';m.id='mn';
  m.innerHTML='<div data-a="f">➕ إضافة صديق</div><div data-a="c">👥 إنشاء مجموعة</div><div data-a="s">🔎 البحث عن مجموعة</div>';
  document.body.appendChild(m);
  m.onclick=e=>{const a=e.target.dataset.a;m.remove();if(a==='f')friendsScreen();if(a==='c')groupCreate();if(a==='s')groupSearch()};
  setTimeout(()=>document.addEventListener('click',function h(e){if(!m.contains(e.target)){m.remove();document.removeEventListener('click',h)}}),0);
}

/* الأصدقاء */
function friendsScreen(){
  stopChat();view='friends';X.th(true);
  X.A.innerHTML=X.hdr('الأصدقاء')+'<div class="pad"><div class="card c"><p>رقمك: <b style="color:var(--tx);letter-spacing:2px">'+X.prof.pid+'</b></p><input id="fid" maxlength="6" inputmode="numeric" placeholder="رقم ID الصديق"><button class="btn alt" id="fa" style="font-size:16px;padding:14px">إضافة صديق</button><div class="err" id="fm"></div></div><input id="fs" placeholder="🔍 ابحث في أصدقائك"><div id="fl"></div></div>';
  $('bk').onclick=()=>X.home();$('fa').onclick=addFriend;$('fs').oninput=drawFriends;drawFriends();
}
async function drawFriends(){
  if(!$('fl'))return;
  await Promise.all(friends.map(f=>getU(f.id)));
  const el=$('fl');if(!el)return;
  const qs=($('fs')?$('fs').value:'').trim().toLowerCase();
  const ok=f=>!qs||U[f.id].name.toLowerCase().includes(qs)||String(U[f.id].pid).includes(qs);
  const row=(f,act)=>{const u=U[f.id];return '<div class="fr" data-f="'+f.id+'"><img class="av" src="'+esc(u.photo)+'" alt=""><div class="fi"><div class="pn">'+esc(u.name)+'</div><div class="pi">ID: '+esc(u.pid)+'</div></div>'+act+'</div>'};
  const rq=friends.filter(f=>f.status==='received'),fr=friends.filter(f=>f.status==='friends'&&ok(f)),sn=friends.filter(f=>f.status==='sent'&&ok(f));
  el.innerHTML=(rq.length?'<div class="card"><p class="c">طلبات الصداقة</p>'+rq.map(f=>row(f,'<button class="mini ok" data-a="acc" data-id="'+f.id+'">قبول</button><button class="mini" data-a="del" data-id="'+f.id+'">رفض</button>')).join('')+'</div>':'')+
  '<div class="card"><p class="c">الأصدقاء ('+fr.length+')</p>'+(fr.length?fr.map(f=>row(f,'<span>💬</span>')).join(''):'<p class="c">ما فيه أصدقاء</p>')+'</div>'+
  (sn.length?'<div class="card"><p class="c">بانتظار الرد</p>'+sn.map(f=>row(f,'<button class="mini" data-a="del" data-id="'+f.id+'">إلغاء</button>')).join('')+'</div>':'');
  el.querySelectorAll('[data-a]').forEach(b=>b.onclick=e=>{e.stopPropagation();b.dataset.a==='acc'?accept(b.dataset.id):removeF(b.dataset.id)});
  el.querySelectorAll('.fr').forEach(r=>{const f=friends.find(x=>x.id===r.dataset.f);if(f&&f.status==='friends')r.onclick=()=>openChat('f',f.id)});
}
async function accept(id){
  try{
    await setDoc(doc(db,'users',uid(),'friends',id),{status:'friends',at:serverTimestamp()});
    await setDoc(doc(db,'users',id,'friends',uid()),{status:'friends',at:serverTimestamp()});
  }catch(x){toast('مشكلة: '+x.code)}
}
async function removeF(id){
  try{await deleteDoc(doc(db,'users',uid(),'friends',id));await deleteDoc(doc(db,'users',id,'friends',uid()))}catch(x){toast('مشكلة: '+x.code)}
}
async function sendReq(o){
  await setDoc(doc(db,'users',uid(),'friends',o),{status:'sent',at:serverTimestamp()});
  await setDoc(doc(db,'users',o,'friends',uid()),{status:'received',at:serverTimestamp()});
}
async function addFriend(){
  const v=$('fid').value.trim(),m=t=>$('fm').textContent=t;
  if(!/^\d{6}$/.test(v)){m('الرقم 6 أرقام');return}
  if(v===X.prof.pid){m('هذا رقمك أنت 😄');return}
  try{
    const s=await getDoc(doc(db,'ids',v));
    if(!s.exists()){m('ما لقيت لاعب بهذا الرقم');return}
    const o=s.data().uid,ex=friends.find(f=>f.id===o);
    if(ex){
      if(ex.status==='friends'){m('هو صديقك أصلاً');return}
      if(ex.status==='sent'){m('أرسلت له طلب من قبل');return}
      await accept(o);m('تمت الإضافة ✅');return;
    }
    await sendReq(o);$('fid').value='';m('انرسل الطلب ✅');
  }catch(x){m('مشكلة: '+x.code)}
}
async function profileScreen(u,back){
  stopChat();view='profile';X.th(true);
  const p=await getU(u),f=friends.find(x=>x.id===u),isF=f&&f.status==='friends';
  let act='';
  if(u!==uid()){
    if(isF)act='<button class="btn" id="pm">💬 مراسلة</button><button class="btn ghost" id="pd">حذف الصديق</button>';
    else if(f)act='<p class="c">'+(f.status==='sent'?'أرسلت له طلب صداقة':'أرسل لك طلب صداقة')+'</p>';
    else act='<button class="btn" id="pa">➕ إضافة صديق</button>';
  }
  X.A.innerHTML=X.hdr('الملف الشخصي')+'<div class="pad"><div class="card c"><img class="av big" src="'+esc(p.photo)+'" alt=""><h2 style="margin:10px 0 2px">'+esc(p.name)+'</h2><p>ID: '+esc(p.pid)+'</p></div>'+act+'<div class="err" id="pe"></div></div>';
  $('bk').onclick=back;
  if($('pm'))$('pm').onclick=()=>openChat('f',u);
  if($('pd'))$('pd').onclick=async()=>{await removeF(u);X.home()};
  if($('pa'))$('pa').onclick=async()=>{try{await sendReq(u);$('pa').remove();$('pe').textContent='انرسل الطلب ✅'}catch(x){$('pe').textContent='مشكلة: '+x.code}};
}

/* الشات */
async function openChat(k,id){
  stopChat();view='chat';X.th(true);X.A.classList.add('fix');
  const me=uid();
  let title,photo='',path,gid=null,cid=null;
  if(k==='f'){const u=await getU(id);title=u.name;photo=u.photo;cid=[me,id].sort().join('_');path=['chats',cid,'msgs']}
  else{
    const s=await getDoc(doc(db,'groups',id));
    if(!s.exists()){toast('المجموعة غير موجودة');X.home();return}
    title=s.data().name;gid=id;path=['groups',id,'msgs'];
  }
  const back=()=>openChat(k,id);
  X.A.innerHTML='<div class="ch"><button class="ib" id="bk">➜</button><div class="nm">'+(gid?'<div class="gav">👥</div>':'<img src="'+esc(photo)+'" alt="">')+'<span class="tt">'+esc(title)+'</span></div><button class="ib" id="dt">•••</button></div>'+
    '<div class="chat"><div class="ms" id="ms"></div><div class="bar"><input id="mi" maxlength="500" placeholder="اكتب رسالة..."><button id="sd">➤</button></div></div>';
  $('bk').onclick=()=>X.home();
  $('dt').onclick=()=>k==='f'?profileScreen(id,back):groupInfo(id);
  const send=async()=>{
    const t=$('mi').value.trim();if(!t)return;
    $('mi').value='';
    try{
      await addDoc(collection(db,...path),{from:me,text:t,at:serverTimestamp()});
      if(cid)await setDoc(doc(db,'chats',cid),{members:[me,id],last:t,lastAt:serverTimestamp(),lastFrom:me,unread:{[id]:increment(1)}},{merge:true});
      else{
        const g=grps.find(x=>x.id===gid)||{members:[]};
        const up={last:t,lastAt:serverTimestamp()};
        g.members.forEach(m=>{if(m!==me)up['unread.'+m]=increment(1)});
        await updateDoc(doc(db,'groups',gid),up);
      }
    }catch(x){toast('مشكلة: '+x.code)}
  };
  $('sd').onclick=send;
  $('mi').onkeydown=e=>{if(e.key==='Enter')send()};
  curRead=()=>{
    try{
      const o=cid?chats.find(x=>x.id===cid):grps.find(x=>x.id===gid);
      if(o&&unreadOf(o))updateDoc(doc(db,cid?'chats':'groups',cid||gid),{['unread.'+me]:0});
    }catch(e){}
  };
  cU.push(onSnapshot(query(collection(db,...path),orderBy('at','desc'),limit(100)),async s=>{
    const list=s.docs.map(d=>d.data()).reverse();
    await Promise.all([...new Set(list.map(m=>m.from))].map(getU));
    const el=$('ms');if(!el)return;
    let h='',prev=0;
    list.forEach(m=>{
      const t=tm(m.at),mine=m.from===me;
      if(t-prev>600000)h+='<div class="dt">'+full(t)+'</div>';
      prev=t;
      h+='<div class="row'+(mine?'':' them')+'"><img class="av" data-u="'+m.from+'" src="'+esc(mine?X.prof.photo:U[m.from].photo)+'" alt=""><div class="bx">'+(gid&&!mine?'<div class="sdn">'+esc(U[m.from].name)+'</div>':'')+'<div class="bub">'+esc(m.text)+(m.inv&&!mine?'<div><button class="mini ok" data-inv="'+esc(m.inv.c)+'" data-ph="'+esc(m.inv.ph)+'" style="margin:6px 0 0">انضمام</button></div>':'')+'</div></div></div>';
    });
    el.innerHTML=h;el.scrollTop=el.scrollHeight;
    el.querySelectorAll('img[data-u]').forEach(i=>i.onclick=()=>profileScreen(i.dataset.u,back));
    el.querySelectorAll('[data-inv]').forEach(b=>b.onclick=()=>X.joinInvite(b.dataset.inv,b.dataset.ph));
    if(curRead)curRead();
  }));
}

/* المجموعات */
async function groupInfo(gid){
  stopChat();view='ginfo';X.th(true);
  const s=await getDoc(doc(db,'groups',gid));
  if(!s.exists()){X.home();return}
  const g=s.data();
  await Promise.all(g.members.map(getU));
  X.A.innerHTML=X.hdr('المجموعة')+'<div class="pad"><div class="card c"><div class="gav" style="margin:0 auto;width:80px;height:80px;font-size:36px">👥</div><h2 style="margin:10px 0 2px">'+esc(g.name)+'</h2><p>رقم المجموعة: <b style="color:var(--tx)">'+gid+'</b> · '+g.members.length+' عضو</p></div><div class="card"><p class="c">الأعضاء</p>'+g.members.map(m=>'<div class="fr" data-u="'+m+'"><img class="av" src="'+esc(U[m].photo)+'" alt=""><div class="fi"><div class="pn">'+esc(U[m].name)+(m===g.owner?' 👑':'')+'</div><div class="pi">ID: '+esc(U[m].pid)+'</div></div></div>').join('')+'</div><button class="btn ghost" id="lv">مغادرة المجموعة</button></div>';
  $('bk').onclick=()=>openChat('g',gid);
  document.querySelectorAll('.fr[data-u]').forEach(r=>r.onclick=()=>profileScreen(r.dataset.u,()=>groupInfo(gid)));
  $('lv').onclick=async()=>{try{await updateDoc(doc(db,'groups',gid),{members:arrayRemove(uid())});X.home()}catch(x){toast('مشكلة: '+x.code)}};
}
function groupCreate(){
  stopChat();view='gc';X.th(true);
  X.A.innerHTML=X.hdr('إنشاء مجموعة')+'<div class="pad"><div class="card c"><div class="gav" style="margin:0 auto 10px;width:80px;height:80px;font-size:36px">👥</div><input id="gn" maxlength="24" placeholder="اسم المجموعة"><div class="err" id="ge"></div><button class="btn" id="gs">إنشاء</button></div></div>';
  $('bk').onclick=()=>X.home();
  $('gs').onclick=async()=>{
    const n=$('gn').value.trim();
    if(n.length<2){$('ge').textContent='الاسم قصير';return}
    try{
      let g;do{g=String(Math.floor(10000+Math.random()*90000))}while((await getDoc(doc(db,'groups',g))).exists());
      await setDoc(doc(db,'groups',g),{name:n,owner:uid(),members:[uid()],last:'',lastAt:serverTimestamp()});
      openChat('g',g);
    }catch(x){$('ge').textContent='مشكلة: '+x.code}
  };
}
function groupSearch(){
  stopChat();view='gs';X.th(true);
  X.A.innerHTML=X.hdr('البحث عن مجموعة')+'<div class="pad"><input id="gq" placeholder="اسم المجموعة أو رقمها (5 أرقام)"><button class="btn alt" id="gb" style="font-size:16px;padding:14px">بحث</button><div id="gr"></div></div>';
  $('bk').onclick=()=>X.home();
  $('gb').onclick=async()=>{
    const q=$('gq').value.trim(),el=$('gr');
    if(!q)return;
    el.innerHTML='<p class="c">...</p>';
    try{
      let docs=[];
      if(/^\d{5}$/.test(q)){const s=await getDoc(doc(db,'groups',q));if(s.exists())docs=[s]}
      else docs=(await getDocs(query(collection(db,'groups'),where('name','>=',q),where('name','<=',q+'\uf8ff'),limit(15)))).docs;
      el.innerHTML=docs.length?docs.map(d=>{const g=d.data(),mem=g.members.includes(uid());return '<div class="cv"><div class="gav">👥</div><div class="t"><div class="n">'+esc(g.name)+'</div><div class="m">'+g.members.length+' عضو · رقم '+d.id+'</div></div><button class="mini'+(mem?'':' ok')+'" data-j="'+d.id+'" data-m="'+(mem?1:0)+'">'+(mem?'فتح':'انضمام')+'</button></div>'}).join(''):'<div class="empty">ما لقيت شي</div>';
      el.querySelectorAll('[data-j]').forEach(b=>b.onclick=async()=>{
        try{if(b.dataset.m!=='1')await updateDoc(doc(db,'groups',b.dataset.j),{members:arrayUnion(uid())});openChat('g',b.dataset.j)}catch(x){toast('مشكلة: '+x.code)}
      });
    }catch(x){el.innerHTML='<p class="err">مشكلة: '+esc(x.code)+'</p>'}
  };
}

/* دعوة الأصدقاء للغرفة */
async function sendInvite(id,code){
  const me=uid(),cid=[me,id].sort().join('_'),t='🎮 دعوة للانضمام لغرفة '+code;
  await addDoc(collection(db,'chats',cid,'msgs'),{from:me,text:t,inv:{c:code,ph:inviteRoomPh},at:serverTimestamp()});
  await setDoc(doc(db,'chats',cid),{members:[me,id],last:t,lastAt:serverTimestamp(),lastFrom:me,unread:{[id]:increment(1)}},{merge:true});
}
let inviteRoomPh='';
export async function inviteModal(code,room,inRoom){
  const fr=friends.filter(f=>f.status==='friends');
  await Promise.all(fr.map(f=>getU(f.id)));
  inviteRoomPh=room.ph||'';
  const o=document.createElement('div');o.className='ov';
  o.innerHTML='<div class="sh"><div class="shh"><b>ادعُ أصدقاءك</b><button class="mini" id="ovx">✕</button></div>'+
    (fr.length?fr.map(f=>{const u=U[f.id],ins=inRoom.includes(f.id);return '<div class="fr"><img class="av" src="'+esc(u.photo)+'" alt=""><div class="fi"><div class="pn">'+esc(u.name)+'</div><div class="pi">ID: '+esc(u.pid)+'</div></div><button class="mini'+(ins?'':' ok')+'" data-i="'+f.id+'"'+(ins?' disabled':'')+'>'+(ins?'داخل الغرفة':'دعوة')+'</button></div>'}).join(''):'<p class="c">ما عندك أصدقاء بعد. أضفهم من تبويب الرسائل.</p>')+'</div>';
  document.body.appendChild(o);
  o.onclick=e=>{if(e.target===o||e.target.id==='ovx')o.remove()};
  o.querySelectorAll('[data-i]').forEach(b=>b.onclick=async()=>{
    b.disabled=true;
    try{await sendInvite(b.dataset.i,code);b.textContent='تمت الدعوة ✅';b.classList.remove('ok')}catch(x){b.disabled=false;toast('مشكلة: '+x.code)}
  });
}
