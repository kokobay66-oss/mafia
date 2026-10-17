
import {getApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getFirestore,doc,getDoc,setDoc,addDoc,deleteDoc,updateDoc,collection,getDocs,onSnapshot,query,orderBy,where,limit,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const db=getFirestore(getApp());
let X,code=null,room=null,players=[],rchat=[],un=[];
let cm={mode:'classic',max:10,lock:false};
const MINSTART=2; // للتجربة، لاحقًا 6
const $=i=>document.getElementById(i);
const esc=s=>X.esc(s);
const toast=m=>X.toast(m);
const tagName=m=>m==='mad'?'دموي':'كلاسيكي';
const hash=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
export function init(c){X=c}
export function stopRoom(){un.forEach(f=>f());un=[];code=null;room=null;players=[];rchat=[]}

/* شاشة المخصص */
export function custom(msg,needPw,cv){
  X.th(false);
  const M=m=>'<button class="mode '+m+(cm.mode===m?' on':'')+'" data-m="'+m+'">'+tagName(m)+'</button>';
  X.A.innerHTML=X.topbar()+'<main style="justify-content:flex-start">'+
  '<div class="card c"><p>نوع الغرفة</p><div class="two">'+M('classic')+M('mad')+'</div>'+
  '<p>عدد اللاعبين</p><div class="step"><button id="smin">−</button><b id="sval">'+cm.max+'</b><button id="spl">+</button></div>'+
  '<div class="lk"><label><input type="checkbox" id="lk"'+(cm.lock?' checked':'')+'> 🔒 كلمة سر للغرفة</label></div>'+
  '<input id="pw" maxlength="12" placeholder="اكتب كلمة السر" style="display:'+(cm.lock?'block':'none')+'">'+
  '<div class="err" id="ce"></div><button class="btn" id="c">إنشاء الغرفة</button></div>'+
  '<div class="card c"><p>أو ادخل بكود الغرفة</p><input id="cd" maxlength="4" inputmode="numeric" placeholder="كود الغرفة" value="'+esc(cv||'')+'">'+(needPw?'<input id="jp" maxlength="12" placeholder="كلمة سر الغرفة">':'')+'<button class="btn alt" id="j" style="font-size:16px;padding:14px">انضم</button></div>'+
  '<div class="err">'+esc(msg||'')+'</div><button class="btn ghost" id="bk">رجوع</button></main>';
  document.querySelectorAll('.mode[data-m]').forEach(b=>b.onclick=()=>{cm.mode=b.dataset.m;document.querySelectorAll('.mode[data-m]').forEach(x=>x.classList.toggle('on',x===b))});
  $('smin').onclick=()=>{cm.max=Math.max(6,cm.max-1);$('sval').textContent=cm.max};
  $('spl').onclick=()=>{cm.max=Math.min(16,cm.max+1);$('sval').textContent=cm.max};
  $('lk').onchange=e=>{cm.lock=e.target.checked;$('pw').style.display=cm.lock?'block':'none'};
  $('c').onclick=async()=>{
    const pw=cm.lock?$('pw').value.trim():'';
    if(cm.lock&&pw.length<3){$('ce').textContent='كلمة السر 3 أحرف على الأقل';return}
    try{await newRoom({pub:false,mode:cm.mode,max:cm.max,pass:pw})}catch(x){$('ce').textContent='مشكلة: '+x.code}
  };
  $('j').onclick=()=>joinRoom($('cd').value.trim(),$('jp')?$('jp').value.trim():'');
  $('bk').onclick=()=>X.home();
}

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
  await setDoc(doc(db,'rooms',c),{host:X.me.uid,status:'lobby',public:o.pub,mode:o.mode,max:o.max,ph,createdAt:serverTimestamp()});
  await addMe(c,0);enter(c);
}
async function joinRoom(c,pw){
  if(c.length!==4){custom('الكود 4 أرقام');return}
  try{
    const s=await getDoc(doc(db,'rooms',c));
    if(!s.exists()){custom('ما لقيت الغرفة',false,c);return}
    const r=s.data();
    if(r.status!=='lobby'){custom('اللعبة بدأت',false,c);return}
    if(r.ph){
      if(!pw){custom('الغرفة محمية بكلمة سر',true,c);return}
      if(await hash(c+':'+pw)!==r.ph){custom('كلمة السر غلط',true,c);return}
    }
    const si=await seatInfo(c,r.max||10);
    if(si.seat<0){custom('الغرفة ممتلئة',false,c);return}
    await addMe(c,si.seat);enter(c);
  }catch(x){custom('مشكلة: '+x.code)}
}
export async function quick(mode){
  const e=$('e2');if(e)e.textContent='ندوّر لك على غرفة...';
  try{
    const q=await getDocs(query(collection(db,'rooms'),where('public','==',true),where('status','==','lobby'),where('mode','==',mode),limit(10)));
    for(const d of q.docs){
      const r=d.data(),t=r.createdAt;
      if(t&&Date.now()-t.toMillis()>20*60000)continue;
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
    room=s.data();render();
  }));
  un.push(onSnapshot(query(collection(db,'rooms',c,'players'),orderBy('joinedAt')),s=>{
    players=s.docs.map(d=>({id:d.id,...d.data()}));render();
  }));
  un.push(onSnapshot(query(collection(db,'rooms',c,'chat'),orderBy('at','desc'),limit(50)),s=>{
    rchat=s.docs.map(d=>d.data()).reverse();renderChat();
  }));
}
function seatHTML(i){
  const p=players.find(x=>x.seat===i);
  if(!p)return '<div class="seatw"><div class="seat" data-seat="'+i+'">+</div><div class="sn"></div></div>';
  return '<div class="seatw"><div class="seat full'+(p.id===X.me.uid?' me':'')+'">'+(p.id===room.host?'<span class="crown">👑</span>':'')+'<img src="'+esc(p.photo)+'" alt=""></div><div class="sn">'+esc(p.name)+'</div></div>';
}
const col=a=>'<div class="col">'+a.map(seatHTML).join('')+'</div>';
async function moveSeat(i){
  if(players.some(p=>p.seat===i))return;
  try{await updateDoc(doc(db,'rooms',code,'players',X.me.uid),{seat:i})}catch(e){toast('مشكلة: '+e.code)}
}
const rmsgs=()=>rchat.length?rchat.map(m=>'<div class="rmsg'+(m.from===X.me.uid?' mine':'')+'"><b>'+esc(m.name)+'</b> '+esc(m.text)+'</div>').join(''):'<div class="rmsg" style="opacity:.6">ابدأ الدردشة مع اللاعبين...</div>';
function renderChat(){const el=$('rm');if(!el)return;el.innerHTML=rmsgs();el.scrollTop=el.scrollHeight}
async function rsend(){
  const el=$('ri'),t=el.value.trim();
  if(!t)return;
  el.value='';
  try{await addDoc(collection(db,'rooms',code,'chat'),{from:X.me.uid,name:X.prof.name,text:t,at:serverTimestamp()})}catch(x){toast('مشكلة: '+x.code)}
}
function render(){
  if(!room||!code)return;
  const host=room.host===X.me.uid,mx=room.max||10,half=Math.ceil(mx/2),mode=room.mode||'classic';
  if(room.status==='playing'){X.A.innerHTML='<main><h1 class="h">🎬</h1><div class="card c"><p>اللعبة بدأت! (توزيع الأدوار في المرحلة الجاية)</p></div></main>';return}
  const old=$('ri'),keep=old?old.value:'',foc=!!old&&document.activeElement===old;
  const R=n=>[...Array(n)].map((_,i)=>i);
  X.A.innerHTML=X.topbar()+'<div class="ri"><span>غرفة '+code+'</span><span class="tag '+mode+'">'+tagName(mode)+'</span>'+(room.ph?'<span>🔒</span>':'')+'<span>👥 '+players.length+'/'+mx+'</span></div>'+
  '<main style="justify-content:flex-start;padding-top:8px"><div class="seats" style="min-height:'+(half*68)+'px">'+col(R(half))+
  '<div class="mid"><p class="c" style="font-size:12px">اضغط + لتغيير مكانك</p>'+
  (host?'<button class="btn" id="s" '+(players.length<MINSTART?'disabled':'')+'>ابدأ اللعبة'+(players.length<MINSTART?' (يحتاج '+MINSTART+')':'')+'</button>':'<p class="c">ننتظر المضيف يبدأ...</p>')+
  '<button class="btn ghost" id="l">خروج من الغرفة</button></div>'+col(R(mx-half).map(i=>i+half))+'</div>'+
  '<div class="rc"><div class="rm" id="rm">'+rmsgs()+'</div><div class="rb"><input id="ri" maxlength="200" placeholder="رسالة للجميع..."><button id="rs">➤</button></div></div></main>';
  document.querySelectorAll('[data-seat]').forEach(x=>x.onclick=()=>moveSeat(+x.dataset.seat));
  if(host)$('s').onclick=()=>updateDoc(doc(db,'rooms',code),{status:'playing'});
  $('l').onclick=leave;
  $('rs').onclick=rsend;
  $('ri').onkeydown=e=>{if(e.key==='Enter')rsend()};
  $('ri').value=keep;if(foc)$('ri').focus();
  const m=$('rm');m.scrollTop=m.scrollHeight;
}
async function leave(){
  const c=code,host=room&&room.host===X.me.uid;
  stopRoom();
  try{await deleteDoc(doc(db,'rooms',c,'players',X.me.uid));if(host)await deleteDoc(doc(db,'rooms',c))}catch(e){}
  X.home();
}
