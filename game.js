import {getApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getFirestore,doc,setDoc,addDoc,updateDoc,collection,onSnapshot,query,orderBy,limit,increment,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import * as V from "./voice.js";

const db=getFirestore(getApp());
const R={mafia:['مافيا','🔪'],doctor:['الطبيب','💉'],detective:['المحقق','🕵️'],sorcerer:['الساحر','🧙'],sniper:['القناص','🎯'],joker:['الجوكر','🃏'],citizen:['مواطن','🙂']};
const CARDS=['mafia','doctor','detective','citizen'];
const T={reveal:5,night:15,dawn:5,talk:40,disc:30,vote:15,vres:6,end:10};
const PH={reveal:'كشف الأدوار',night:'الليل',dawn:'الفجر',talk:'وقت الكلام',disc:'النقاش المفتوح',vote:'التصويت',vres:'نتيجة التصويت',end:'النهاية'};
const PR={mafia:'🔪 اضغط على اللاعب اللي تبون تقتلونه',doctor:'💉 اضغط على اللاعب اللي تبي تحميه',detective:'🕵️ اضغط على اللاعب اللي تشك فيه',sniper:'🎯 رصاصة وحدة بس. اضغط على اللاعب اللي تبي تطلق عليه، أو لا تضغط وتحتفظ بها'};
let X,C=null,room=null,players=[],me='',un=[],timer=null,iv=null,endAt=0,lastPt=-1,leaveFn=null,ren=null,dis=null;
let myRole=null,acts=[],votes=[],sx='',sdone='',picked=null,H=null;
let rec=null;const fnd=new Set(),svd=new Set(),hit=new Set();
const $=i=>document.getElementById(i);
const esc=s=>X.esc(s);
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const pickTop=a=>{const c={};a.forEach(t=>c[t]=(c[t]||0)+1);const m=Math.max(...Object.values(c)),top=Object.keys(c).filter(k=>c[k]===m);return top[Math.floor(Math.random()*top.length)]};
export function init(c){X=c;CARDS.forEach(r=>{new Image().src='card-'+r+'.jpg'})}
export const closed=rm=>!!rm&&rm.ph==='end'&&dis===rm.g;
export function stop(){un.forEach(f=>f());un=[];clearTimeout(timer);clearInterval(iv);timer=iv=null;C=null;room=null;H=null;myRole=null;acts=[];votes=[];sx='';sdone='';picked=null;lastPt=-1;const f=document.getElementById('fl');if(f)f.remove()}

/* ===== شات المشاهدين (الميتين): رسائل تطير فوق 7 ثواني ===== */
function fly(m){
  if(!$('flcss')){
    const s=document.createElement('style');s.id='flcss';
    s.textContent='#fl{position:fixed;inset:0;pointer-events:none;z-index:50;overflow:hidden}.fm{position:absolute;bottom:130px;background:#000;color:#fff;padding:6px 12px;border-radius:14px;font-size:14px;max-width:70%;animation:fup 7s linear forwards}@keyframes fup{0%{transform:translateY(0);opacity:1}85%{opacity:1}100%{transform:translateY(-60vh);opacity:0}}';
    document.head.appendChild(s);
  }
  let b=$('fl');if(!b){b=document.createElement('div');b.id='fl';document.body.appendChild(b)}
  const d=document.createElement('div');d.className='fm';d.style.left=(5+Math.random()*40)+'%';
  d.innerHTML='<b>'+esc(m.name)+'</b> '+esc(m.text);
  b.appendChild(d);setTimeout(()=>d.remove(),7000);
}
async function gsend(){
  const el=$('gi'),t=el?el.value.trim():'';
  if(!t||!room||al(me))return;
  el.value='';
  try{await addDoc(collection(db,'rooms',C,'chat'),{from:me,name:X.prof.name,text:t,at:serverTimestamp(),dead:true,g:room.g})}catch(e){X.toast('مشكلة: '+e.code)}
}

/* ===== المضيف: يدير اللعبة ===== */
export async function start(code,pl,rm){
  try{
    const sorted=pl.slice().sort((a,b)=>a.seat-b.seat),ids=sorted.map(p=>p.id),n=ids.length,G=Date.now();
    const mad=rm.mode==='mad';
    const mc=rm.maf>0?Math.min(rm.maf,Math.max(1,Math.floor((n-1)/2))):(n>=5?2:1);
    let rs=Array(mc).fill('mafia');
    if(n>=3&&rm.useDoc!==false)rs.push('doctor');
    if(n>=4&&rm.useDet!==false)rs.push('detective');
    if(rm.sorc&&n>=6)rs.push('sorcerer');
    if((rm.useSnp||mad)&&n>=6)rs.push('sniper');
    if(mad&&n>=5)rs.push('joker');
    rs.length=Math.min(rs.length,n);
    while(rs.length<n)rs.push('citizen');
    shuffle(rs);
    const roles={};ids.forEach((u,i)=>roles[u]=rs[i]);
    const mafia=ids.filter(u=>roles[u]==='mafia'),steps=['mafia','doctor','detective','sorcerer','sniper'].filter(r=>rs.includes(r));
    const sm={},nm={};sorted.forEach(p=>{sm[p.id]=p.seat;nm[p.id]=p.name});
    H={C:code,G,roles,mafia,steps,sm,alive:ids.slice(),rd:1,st:0,pot:{kill:true,revive:true},snp:true,sk:null,sd:null,victim:null,save:null,poison:null,revived:false,order:[],spi:0,pt:0,ph:'reveal',skipPt:-1};
    await Promise.all(ids.map(u=>setDoc(doc(db,'rooms',code,'roles',u),{role:roles[u],team:roles[u]==='mafia'?mafia:[],pot:roles[u]==='sorcerer'?{kill:true,revive:true}:null,g:G})));
    await go({status:'playing',ph:'reveal',g:G,sm,nm,steps,alive:ids,rd:1,st:0,msg:null,vout:null,win:null,fin:null,spk:null},T.reveal);
  }catch(e){X.toast('مشكلة: '+(e.code||e.message))}
}
async function go(p,secs){
  H.pt++;H.ph=p.ph;clearTimeout(timer);
  await updateDoc(doc(db,'rooms',H.C),{...p,pt:H.pt,dur:secs});
  timer=setTimeout(()=>next().catch(e=>X.toast('مشكلة: '+(e.code||e.message))),secs*1000+600);
}
async function next(){
  const p=H.ph;
  if(p==='reveal')return newNight();
  if(p==='night')return endStep();
  if(p==='dawn')return startTalk();
  if(p==='talk')return nextSpeaker();
  if(p==='disc')return go({ph:'vote',spk:null},T.vote);
  if(p==='vote')return tally();
  if(p==='vres'){H.rd++;return newNight()}
  if(p==='end')return updateDoc(doc(db,'rooms',H.C),{status:'lobby',ph:null,dur:0});
}
const win=()=>{const m=H.alive.filter(u=>H.roles[u]==='mafia').length;return m===0?'citizens':(m>=H.alive.length-m?'mafia':null)};
const finish=(w,x)=>go({ph:'end',win:w,fin:H.roles,alive:H.alive,spk:null,...x},T.end);
const nightStep=st=>{H.st=st;return go({ph:'night',st,rd:H.rd,spk:null},T.night)};
const newNight=()=>{H.victim=H.save=H.poison=H.sk=H.sd=null;H.revived=false;return nightStep(0)};
async function endStep(){
  const role=H.steps[H.st],rd=H.rd,rr=u=>doc(db,'rooms',H.C,'roles',u);
  const as=acts.filter(a=>a.g===H.G&&a.k==='n'&&a.r===rd&&a.ro===role&&H.alive.includes(a.id)&&H.roles[a.id]===role);
  if(role==='mafia'){
    const t=as.map(a=>a.t).filter(x=>H.alive.includes(x)&&H.roles[x]!=='mafia');
    H.victim=t.length?pickTop(t):null;
    const s=H.alive.find(u=>H.roles[u]==='sorcerer');
    if(s)await updateDoc(rr(s),{info:{r:rd,v:H.victim}});
  }
  if(role==='doctor'){const a=as[0];H.save=a&&H.alive.includes(a.t)?a.t:null}
  if(role==='detective'){const a=as[0];if(a&&H.alive.includes(a.t))await updateDoc(rr(a.id),{res:{r:rd,t:a.t,m:H.roles[a.t]==='mafia'}})}
  if(role==='sorcerer'){
    const a=as[0];
    if(a){
      if(a.x==='kill'&&H.pot.kill&&H.alive.includes(a.t)&&a.t!==a.id){H.poison=a.t;H.pot.kill=false}
      if(a.x==='revive'&&H.pot.revive&&H.victim){H.revived=true;H.pot.revive=false}
      await updateDoc(rr(a.id),{pot:{...H.pot}});
    }
  }
  if(role==='sniper'){
    const a=as[0];
    if(a&&H.snp&&H.alive.includes(a.t)&&a.t!==a.id){
      H.snp=false;
      const ok=H.roles[a.t]==='mafia';
      if(ok)H.sk=a.t;else H.sd=a.id;
      await updateDoc(rr(a.id),ok?{bul:false,hit:{r:rd}}:{bul:false});
    }
  }
  if(H.st+1<H.steps.length)return nightStep(H.st+1);
  const v=H.victim,saved=!!v&&(H.save===v||H.revived),dead=[];
  if(v&&H.save===v){const dd=H.alive.find(u=>H.roles[u]==='doctor');if(dd)await updateDoc(rr(dd),{sv:{r:rd,v}})}
  if(v&&!saved)dead.push(v);
  if(H.poison&&!dead.includes(H.poison))dead.push(H.poison);
  if(H.sk&&!dead.includes(H.sk))dead.push(H.sk);
  if(H.sd&&!dead.includes(H.sd))dead.push(H.sd);
  H.alive=H.alive.filter(u=>!dead.includes(u));
  const msg={ok:!!v&&!saved,v:v&&!saved?v:null,p:H.poison,sn:H.sk,sb:H.sd};
  const w=win();
  if(w)return finish(w,{msg});
  return go({ph:'dawn',alive:H.alive,msg,spk:null},T.dawn);
}
function startTalk(){H.order=H.alive.slice().sort((a,b)=>H.sm[a]-H.sm[b]);H.spi=-1;return nextSpeaker()}
function nextSpeaker(){
  H.spi++;
  if(H.spi<H.order.length)return go({ph:'talk',spk:H.order[H.spi]},T.talk);
  return go({ph:'disc',spk:null},T.disc);
}
function hostSkip(){
  if(!H||H.ph!=='talk'||H.skipPt===H.pt)return;
  const u=H.order[H.spi];
  if(acts.some(a=>a.id===u&&a.k==='s'&&a.g===H.G&&a.r===H.rd)){H.skipPt=H.pt;clearTimeout(timer);nextSpeaker().catch(()=>{})}
}
async function tally(){
  const vs=votes.filter(v=>v.g===H.G&&v.r===H.rd&&H.alive.includes(v.id));
  const c={};let skip=H.alive.length;
  vs.forEach(v=>{
    if(v.t!=='skip'&&v.t!==v.id&&H.alive.includes(v.t)){c[v.t]=(c[v.t]||0)+1;skip--}
  });
  const m=Math.max(0,...Object.values(c)),top=Object.keys(c).filter(k=>c[k]===m);
  const out=top.length===1&&m>skip?top[0]:null;
  if(out)H.alive=H.alive.filter(u=>u!==out);
  const vout=out?{u:out,role:H.roles[out]}:null,w=win();
  if(out&&H.roles[out]==='joker')return finish('joker',{vout});
  if(w)return finish(w,{vout});
  return go({ph:'vres',alive:H.alive,vout,spk:null},T.vres);
}

/* ===== كل اللاعبين: العرض والأفعال ===== */
export function show(code,rm,pl,leave,rerender){
  room=rm;players=pl;leaveFn=leave;ren=rerender;
  if(C!==code){
    C=code;me=X.me.uid;
    const r=(...p)=>doc(db,'rooms',code,...p),c=n=>collection(db,'rooms',code,n);
    un.push(onSnapshot(r('roles',me),s=>{
      myRole=s.exists()?s.data():null;
      if(myRole&&myRole.g&&myRole.res&&myRole.res.m)fnd.add(myRole.g+'_'+myRole.res.r);
      if(myRole&&myRole.g&&myRole.sv)svd.add(myRole.g+'_'+myRole.sv.r);
      if(myRole&&myRole.g&&myRole.hit)hit.add(myRole.g+'_'+myRole.hit.r);
      draw();
    }));
    un.push(onSnapshot(c('votes'),s=>{votes=s.docs.map(d=>({id:d.id,...d.data()}));draw()}));
    un.push(onSnapshot(query(c('chat'),orderBy('at','desc'),limit(10)),s=>{
      s.docChanges().forEach(ch=>{
        if(ch.type!=='added'||!room)return;
        const m=ch.doc.data();
        if(!m.dead||m.g!==room.g||al(me))return;
        if(m.at&&Date.now()-m.at.toMillis()>8000)return;
        fly(m);
      });
    }));
    if(room.host===me)un.push(onSnapshot(c('acts'),s=>{acts=s.docs.map(d=>({id:d.id,...d.data()}));hostSkip()}));
  }
  if(room.pt!==lastPt){lastPt=room.pt;endAt=Date.now()+(room.dur||0)*1000;sx='';sdone='';picked=null}
  draw();
  if(!iv)iv=setInterval(()=>{const e=$('cd');if(e)e.textContent=left()},250);
}
const left=()=>Math.max(0,Math.ceil((endAt-Date.now())/1000));
const no=u=>room.sm[u]+1;
const al=u=>!!room&&!!room.alive&&room.alive.includes(u);
const nm=u=>esc(room.nm[u]||'لاعب');
function canPick(u){
  if(!myRole||!al(u)||!al(me))return false;
  const r=myRole.role;
  if(room.ph==='night'&&room.steps[room.st]===r){
    if(r==='mafia')return !myRole.team.includes(u);
    if(r==='doctor')return true;
    if(r==='detective')return u!==me;
    if(r==='sorcerer')return sx==='kill'&&u!==me;
    if(r==='sniper')return u!==me&&myRole.bul!==false;
  }
  return room.ph==='vote'&&u!==me;
}
async function put(col,d){
  try{await setDoc(doc(db,'rooms',C,col,me),{g:room.g,r:room.rd,...d,at:serverTimestamp()});draw()}catch(e){X.toast('مشكلة: '+e.code)}
}
function pick(u){
  if(!canPick(u))return;
  picked=u;
  if(room.ph==='vote')put('votes',{t:u});
  else put('acts',{k:'n',ro:myRole.role,t:u,x:myRole.role==='sorcerer'?'kill':''});
}
function seatG(i,by,vs){
  const u=by[i];
  if(!u)return '<div class="seatw"><div class="seat" style="visibility:hidden"></div><div class="sn"></div></div>';
  const p=players.find(x=>x.id===u),mine=vs.find(v=>v.id===me);
  const cls='seat full'+(u===me?' me':'')+(al(u)?'':' dead')+(room.spk===u&&room.ph==='talk'?' spk':'')+(canPick(u)?' tgt':'')+(picked===u||(mine&&mine.t===u&&room.ph==='vote')?' sel':'');
  const chips=vs.filter(v=>v.t===u).map(v=>'<i>'+no(v.id)+'</i>').join('');
  return '<div class="seatw"><div class="'+cls+'" data-u="'+u+'"><span class="no">'+(i+1)+'</span>'+(p?'<img src="'+esc(p.photo)+'" alt="">':'<b>'+nm(u)[0]+'</b>')+'</div><div class="sn">'+nm(u)+'</div>'+(chips?'<div class="vc">'+chips+'</div>':'')+'</div>';
}
function middle(){
  const ph=room.ph,r=myRole&&myRole.role,rl=R[r]||['...','⏳'],iAlive=al(me);
  const ghost='<div class="gcard"><div class="em">👻</div><p>أنت مشاهد، تابع بصمت</p></div>';
  if(ph==='reveal'){
    const mates=r==='mafia'?myRole.team.filter(u=>u!==me).map(u=>'رقم '+no(u)+' '+nm(u)).join('، '):'';
    const mt=mates?'<p>شريكك: '+mates+'</p>':'';
    if(CARDS.includes(r))return '<div class="gcard" style="padding:0;background:none;border:0"><img src="card-'+r+'.jpg" alt="'+rl[0]+'" style="display:block;width:100%;max-width:190px;height:auto;margin:0 auto;border-radius:12px;box-shadow:0 0 18px rgba(0,0,0,.7)">'+mt+'</div>';
    const HN={sniper:'عندك رصاصة وحدة بالليل. تصيب مافيا تموته، وتخطئ تموت أنت',joker:'هدفك تنطرد بالتصويت. إذا انطردت تفوز لحالك'};
    return '<div class="gcard"><p>دورك</p><div class="em">'+rl[1]+'</div><h2>'+rl[0]+'</h2>'+(HN[r]?'<p>'+HN[r]+'</p>':'')+mt+'</div>';
  }
  if(ph==='night'){
    if(!iAlive)return ghost;
    if(room.steps[room.st]!==r)return '<div class="gcard"><div class="em">🌙</div><p>الليل... الكل يغمض عينه</p></div>';
    if(r==='sniper'&&myRole.bul===false)return '<div class="gcard"><p>🎯 استخدمت رصاصتك</p></div>';
    if(r!=='sorcerer')return '<div class="gcard"><p>'+PR[r]+'</p>'+(picked?'<p>اخترت: رقم '+no(picked)+'</p>':'')+'</div>';
    const info=myRole.info&&myRole.info.r===room.rd?myRole.info:null,pot=myRole.pot||{};
    return '<div class="gcard"><p>🧙 جرعاتك</p><p>'+(info&&info.v?'الضحية الليلة: <b>رقم '+no(info.v)+'</b>':'ما فيه ضحية الليلة')+'</p>'+
      '<button class="btn alt" id="sk"'+(pot.kill?'':' disabled')+'>💀 جرعة القتل</button><button class="btn alt" id="sr"'+(pot.revive&&info&&info.v?'':' disabled')+'>💚 جرعة الإحياء</button><button class="btn ghost" id="ss">إبقاء الجرعتين</button>'+
      (sx==='kill'?'<p>اضغط على اللاعب اللي تبي تسممه</p>':'')+(sdone?'<p>'+sdone+'</p>':'')+'</div>';
  }
  if(ph==='dawn'){
    const m=room.msg||{};
    return '<div class="gcard"><div class="em">'+(m.ok?'💀':'🛡️')+'</div><h2>'+(m.ok?'عملية اغتيال ناجحة':'مهمة اغتيال فاشلة')+'</h2><p>'+(m.ok?'اللاعب رقم '+no(m.v):'ما مات أحد بالاغتيال')+'</p>'+(m.p?'<p>☠️ ووُجد اللاعب رقم '+no(m.p)+' ميتًا</p>':'')+(m.sn?'<p>🎯 رصاصة صامتة أصابت اللاعب رقم '+no(m.sn)+'</p>':'')+(m.sb?'<p>💥 رصاصة طائشة، مات اللاعب رقم '+no(m.sb)+'</p>':'')+'</div>'+res();
  }
  if(ph==='talk')return '<div class="gcard"><p>🎙️ دور</p><h2>رقم '+no(room.spk)+' '+nm(room.spk)+'</h2>'+(room.spk===me?'<button class="btn alt" id="sp">انتهى دوري</button>':'')+'</div>'+res();
  if(ph==='disc')return '<div class="gcard"><div class="em">💬</div><p>نقاش مفتوح للجميع</p></div>'+res();
  if(ph==='vote'){
    const vk=votes.filter(v=>v.g===room.g&&v.r===room.rd),mine=vk.find(v=>v.id===me),sk=vk.filter(v=>v.t==='skip').length;
    return '<div class="gcard"><p>🗳️ صوّتوا على اللي تشكون فيه</p>'+(iAlive?'<p>اضغط على اللاعب أو تخطي. اللي ما يصوّت يُحسب تخطي</p><button class="btn'+(mine&&mine.t==='skip'?'':' alt')+'" id="vk">⏭️ تخطي ('+sk+')</button>':'<p>👻 المشاهد ما يصوّت</p>')+'</div>'+res();
  }
  if(ph==='vres'){
    const o=room.vout;
    return '<div class="gcard"><div class="em">'+(o?R[o.role][1]:'⚖️')+'</div><h2>'+(o?'تم إقصاء رقم '+no(o.u):'ما انطرد أحد')+'</h2><p>'+(o?nm(o.u)+' · كان '+R[o.role][0]:'')+'</p></div>';
  }
  const f=room.fin||{},mw=room.win==='mafia',jw=room.win==='joker';
  return '<div class="gcard"><div class="em">'+(jw?'🃏':mw?'🔪':'🎉')+'</div><h2>'+(jw?'فاز الجوكر!':mw?'فازت المافيا':'فاز المواطنون')+'</h2></div><div class="gcard">'+Object.keys(f).map(u=>'<p style="color:#fff;margin:2px 0">'+R[f[u]][1]+' رقم '+no(u)+' '+nm(u)+' · '+R[f[u]][0]+(al(u)?'':' 💀')+'</p>').join('')+'</div>';
}
const res=()=>{const x=myRole&&myRole.res;return x&&x.r===room.rd?'<div class="gcard"><p>🕵️ نتيجة التحقيق: رقم '+no(x.t)+(x.m?' مافيا 🔪':' بريء 🙂')+'</p></div>':''};
async function record(){
  if(!room||!myRole||room.ph!=='end'||rec===room.g)return;
  rec=room.g;
  const r=myRole.role,g=room.g,jw=room.win==='joker';
  const won=jw?r==='joker':(r!=='joker'&&(r==='mafia')===(room.win==='mafia'));
  const cnt=S=>[...S].filter(k=>k.startsWith(g+'_')).length;
  const up={games:increment(1)};
  if(won){up.wins=increment(1);if(r==='mafia')up.wMaf=increment(1);else if(r==='joker')up.jok=increment(1);else up.wCit=increment(1)}
  if(r==='detective'&&cnt(fnd))up.found=increment(Math.min(6,cnt(fnd)));
  if(r==='doctor'&&cnt(svd))up.saves=increment(Math.min(6,cnt(svd)));
  if(r==='sniper'&&cnt(hit))up.snipes=increment(1);
  try{await setDoc(doc(db,'stats',me),up,{merge:true})}catch(e){console.error(e)}
}
function policy(){
  const ph=room.ph;
  const f=ph==='end'?null:!al(me)?'off':(ph==='reveal'||ph==='night')?'off':ph==='talk'?(room.spk===me?'on':'off'):null;
  V.force(f,X.toast);
}
function draw(){
  if(!room||!C||!room.sm)return;
  record();
  if(dis&&dis===room.g&&room.ph==='end')return;
  policy();
  const oi=$('gi'),keep=oi?oi.value:'',foc=!!oi&&document.activeElement===oi;
  const ph=room.ph,mx=room.max||10,half=Math.ceil(mx/2),by={};
  Object.keys(room.sm).forEach(u=>by[room.sm[u]]=u);
  const vs=(ph==='vote'||ph==='vres')?votes.filter(v=>v.g===room.g&&v.r===room.rd):[];
  const R0=n=>[...Array(n)].map((_,i)=>i),col=a=>'<div class="col">'+a.map(i=>seatG(i,by,vs)).join('')+'</div>';
  const rl=R[myRole&&myRole.role]||['...','⏳'];
  X.A.innerHTML=X.topbar('<button class="lv" id="gl">خروج ✕</button>')+'<div class="gh"><span>الجولة '+room.rd+'</span><span>'+PH[ph]+'</span>'+(room.dur?'<span>⏱ <b id="cd">'+left()+'</b></span>':'')+(ph==='end'?'<button class="lv" id="xe">✕</button>':'')+'</div>'+
    '<main style="justify-content:flex-start;padding-top:4px"><div class="rolechip">دورك: '+rl[1]+' '+rl[0]+(al(me)?'':' · 👻 مشاهد')+'</div><div class="seats" style="min-height:'+(half*68)+'px">'+col(R0(half))+'<div class="mid">'+middle()+'</div>'+col(R0(mx-half).map(i=>i+half))+'</div></main>'+
    '<div class="rc dock"><div class="rb" style="justify-content:center">'+V.html()+(al(me)?'':'<input id="gi" maxlength="100" placeholder="دردشة المشاهدين..."><button id="gs">➤</button>')+'</div></div>';
  document.querySelectorAll('.seat[data-u]').forEach(s=>s.onclick=()=>pick(s.dataset.u));
  const b=(id,f)=>{const e=$(id);if(e)e.onclick=f};
  b('sk',()=>{sx='kill';sdone='';draw()});
  b('sr',()=>{sx='';sdone='💚 استخدمت جرعة الإحياء';put('acts',{k:'n',ro:'sorcerer',t:'',x:'revive'})});
  b('ss',()=>{sx='';sdone='✅ أبقيت الجرعتين';put('acts',{k:'n',ro:'sorcerer',t:'',x:'skip'})});
  b('sp',()=>put('acts',{k:'s'}));
  b('vk',()=>{picked=null;put('votes',{t:'skip'})});
  b('xe',()=>{dis=room.g;V.force(null);if(ren)ren()});
  b('gl',()=>leaveFn&&leaveFn());
  b('gs',gsend);
  const gi=$('gi');if(gi){gi.value=keep;if(foc)gi.focus();gi.onkeydown=e=>{if(e.key==='Enter')gsend()}}
  V.bind(X.toast);
}
