/* قواعد اللعبة (منطق صرف بدون واجهة): توزيع الأدوار، الفوز، حسم الليل، حساب التصويت */
export const MAF=['mafia','godfather','bomber','silencer'];
export const isMaf=r=>MAF.includes(r);
/* مجموعة الخطوة الليلية: كل المافيا فريق واحد */
export const grp=r=>isMaf(r)?'mafia':r;
export const STEPS=['mafia','killer','doctor','detective','sorcerer','sniper'];
const shuffle=(a,rnd)=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
export const pickTop=(a,rnd=Math.random)=>{const c={};a.forEach(t=>c[t]=(c[t]||0)+1);const m=Math.max(...Object.values(c)),top=Object.keys(c).filter(k=>c[k]===m);return top[Math.floor(rnd()*top.length)]};

/* اختيار عشوائي للأدوار الإضافية في الدموي السريع */
export function autoEx(n,rnd=Math.random){
  const ex={};
  if(n>=5){shuffle(['godfather','bomber','silencer'],rnd).slice(0,n>=10?2:1).forEach(k=>ex[k]=true)}
  if(n>=6)ex.soldier=true;
  if(n>=7)ex.mayor=true;
  if(n>=7){
    if(n>=9){ex.killer=true;ex.survivor=true}
    else if(rnd()<.5)ex.killer=true;else ex.survivor=true;
  }
  return ex;
}
/* يركّب قائمة الأدوار (بطول n) حسب نوع الغرفة وإعداداتها */
export function compose(n,rm,rnd=Math.random){
  const mad=rm.mode==='mad';
  const mc=rm.maf>0?Math.min(rm.maf,Math.max(1,Math.floor((n-1)/2))):(n>=5?2:1);
  const custom=mad&&!!rm.ex;                /* الدموي المخصص: كل شي باختيارك، والسريع: عشوائي */
  const ex=mad?(rm.ex?{...rm.ex}:autoEx(n,rnd)):{};
  const maxSp=mc>1?mc-1:1,capM=n>=10?2:1;
  const sp=['godfather','bomber','silencer'].filter(k=>ex[k]&&n>=5).slice(0,Math.min(capM,maxSp));
  const rs=[...sp];
  while(rs.length<mc)rs.push('mafia');
  if(n>=3&&rm.useDoc!==false)rs.push('doctor');
  if(n>=4&&rm.useDet!==false)rs.push('detective');
  /* العرّاب مع المحقق تحت 8 لاعبين ما يجتمعون */
  if(rs.includes('godfather')&&rs.includes('detective')&&n<8)rs[rs.indexOf('godfather')]='mafia';
  if(rm.sorc&&n>=6)rs.push('sorcerer');
  if((custom?rm.useSnp:(rm.useSnp||mad))&&n>=6)rs.push('sniper');
  const lone=['killer','survivor'].filter(k=>ex[k]&&(k==='killer'?n>=7:n>=6)).slice(0,n>=9?2:1);
  /* السفّاح مع الجوكر ما يجتمعون */
  if(mad&&n>=5&&!lone.includes('killer')&&(!custom||ex.joker))rs.push('joker');
  if(mad){
    if(ex.soldier&&n>=6)rs.push('soldier');
    if(ex.mayor&&n>=6)rs.push('mayor');
    lone.forEach(k=>rs.push(k));
  }
  rs.length=Math.min(rs.length,n);
  while(rs.length<n)rs.push('citizen');
  return rs;
}
/* من فاز؟ (null = اللعبة مستمرة). السفّاح يعطّل فوز المافيا بالتعادل */
export function winner(alive,roles){
  const n=alive.length,nm=alive.filter(u=>isMaf(roles[u])).length,nk=alive.filter(u=>roles[u]==='killer').length;
  if(nk>0&&n<=2)return 'killer';
  if(nm===0&&nk===0)return 'citizens';
  if(nk===0&&nm>=n-nm)return 'mafia';
  return null;
}
/* هل هذا اللاعب فاز؟ (الناجي يفوز لو حي مع أي نتيجة) */
export function didWin(role,win,alive){
  if(role==='survivor')return !!alive;
  if(win==='joker')return role==='joker';
  if(win==='killer')return role==='killer';
  if(role==='joker'||role==='killer')return false;
  return isMaf(role)===(win==='mafia');
}
/* حسم الليل: ترتيب المافيا ← السفّاح ← الطبيب ← المحقق ← الساحر ← القناص، ثم الجندي، ثم الوفيات مرة وحدة */
export function nightResolve(S,as,rnd=Math.random){
  const {alive,roles}=S,alv=u=>!!u&&alive.includes(u);
  const out={dead:[],msg:{},det:null,sv:null,sorc:null,snp:null,mute:null,pot:{...S.pot},snpLeft:S.snp,sUsed:{...(S.sUsed||{})}};
  /* المافيا */
  const t=(as.mafia||[]).map(a=>a.t).filter(x=>alv(x)&&!isMaf(roles[x]));
  const victim=t.length?pickTop(t,rnd):null;
  for(const a of (as.mafia||[])){if(roles[a.id]==='silencer'&&alv(a.m)&&!isMaf(roles[a.m])){out.mute=a.m;break}}
  /* السفّاح */
  const ka=(as.killer||[])[0],kv=ka&&alv(ka.t)&&ka.t!==ka.id?ka.t:null;
  /* الطبيب */
  const da=(as.doctor||[])[0],save=da&&alv(da.t)?da.t:null;
  /* المحقق: العرّاب يظهر مواطن */
  const de=(as.detective||[])[0];
  if(de&&alv(de.t))out.det={id:de.id,t:de.t,m:isMaf(roles[de.t])&&roles[de.t]!=='godfather'};
  /* الساحر */
  let poison=null,revived=false;
  const sa=(as.sorcerer||[])[0];
  if(sa){
    if(sa.x==='kill'&&out.pot.kill&&alv(sa.t)&&sa.t!==sa.id){poison=sa.t;out.pot.kill=false}
    if(sa.x==='revive'&&out.pot.revive&&victim){revived=true;out.pot.revive=false}
    out.sorc={id:sa.id,pot:{...out.pot}};
  }
  /* القناص */
  let sk=null,sd=null;
  const na=(as.sniper||[])[0];
  if(na&&S.snp&&alv(na.t)&&na.t!==na.id){
    out.snpLeft=false;
    const ok=isMaf(roles[na.t]);
    if(ok)sk=na.t;else sd=na.id;
    out.snp={id:na.id,ok};
  }
  /* الإنقاذ: إحياء الساحر ثم الطبيب */
  let mv=revived?null:victim,kk=kv;
  const saved=[];
  if(mv&&save===mv){saved.push(mv);mv=null}
  if(kk&&save===kk){saved.push(kk);kk=null}
  if(saved.length&&da)out.sv={id:da.id,v:saved[0]};
  /* الجندي يمتص أول ضربة ليل (مافيا أو سفّاح) */
  const sh=new Set();
  [mv,kk].forEach(u=>{if(u&&roles[u]==='soldier'&&!out.sUsed[u])sh.add(u)});
  sh.forEach(u=>{out.sUsed[u]=true});
  if(sh.has(mv))mv=null;
  if(sh.has(kk))kk=null;
  /* الوفيات تنحسب مرة وحدة */
  [mv,kk,poison,sk,sd].forEach(u=>{if(alv(u)&&!out.dead.includes(u))out.dead.push(u)});
  out.msg={ok:!!mv,v:mv,k:kk,p:poison,sn:sk,sb:sd};
  return out;
}
/* التصويت: صوت العمدة بصوتين (سري)، والمفجّر يأخذ معه واحد ممن صوّتوا ضده */
export function tallyVotes(alive,roles,votes,rnd=Math.random){
  const vs=votes.filter(v=>alive.includes(v.id)),w=u=>roles[u]==='mayor'?2:1,c={};
  let used=0;
  vs.forEach(v=>{if(v.t!=='skip'&&v.t!==v.id&&alive.includes(v.t)){c[v.t]=(c[v.t]||0)+w(v.id);used+=w(v.id)}});
  const skip=alive.reduce((s,u)=>s+w(u),0)-used;
  const m=Math.max(0,...Object.values(c)),top=Object.keys(c).filter(k=>c[k]===m);
  const out=top.length===1&&m>skip?top[0]:null;
  let bomb=null;
  if(out&&roles[out]==='bomber'){
    const pool=vs.filter(v=>v.t===out&&v.id!==out).map(v=>v.id);
    if(pool.length)bomb=pool[Math.floor(rnd()*pool.length)];
  }
  return {out,bomb,counts:c,skip};
}
