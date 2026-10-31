/* أنيميشن العملات: يشتغل لأي زيادة في عملة المحقق أو عملة المافيا (مهام، تسجيل يومي، بريد...) */
let X=null,last=null,busy=Promise.resolve(),ac=null;
const fmt=n=>Number(n||0).toLocaleString('en');
const numNode=c=>c&&[...c.childNodes].find(n=>n.nodeType===3);
export function init(c){X=c;setInterval(tick,250)}
function tick(){
  const p=X&&X.prof;if(!p||!X.me)return;
  const u=X.me.uid,c=p.coins||0,g=p.gems||0;
  if(!last||last.u!==u){last={u,c,g};return}
  if(c>last.c){const a=[c-last.c,last.c,c];busy=busy.then(()=>play('coin',...a))}
  if(g>last.g){const a=[g-last.g,last.g,g];busy=busy.then(()=>play('gem',...a))}
  last.c=c;last.g=g;
}
const audio=()=>{
  try{if(!ac){const C=window.AudioContext||window.webkitAudioContext;if(C)ac=new C()}if(ac&&ac.state==='suspended')ac.resume()}catch(e){}
  return ac;
};
function ding(f,when,v){
  const a=audio();if(!a)return;
  try{
    const t=a.currentTime+when,o=a.createOscillator(),g=a.createGain();
    o.type='triangle';o.frequency.setValueAtTime(f,t);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v||.07,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+.2);
    o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+.22);
  }catch(e){}
}
function target(type){
  const chip=document.querySelector('.coin[data-w="'+(type==='gem'?'gem':'coin')+'"]');
  if(chip){
    const r=chip.getBoundingClientRect();
    if(r.width>0){
      const x=r.left+r.width/2,y=r.top+r.height/2,el=document.elementFromPoint(x,y);
      if(el&&chip.contains(el))return {x,y,chip};
    }
  }
  return {x:window.innerWidth-70,y:70,chip:null};
}
function play(type,amount,from,to){
  return new Promise(res=>{
    try{
      if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches){res();return}
      run(type,amount,from,to,res);
    }catch(e){res()}
  });
}
function run(type,amount,from,to,done){
  const W=window.innerWidth,H=window.innerHeight,cx=W/2,cy=H*.42;
  const tg=target(type),ic=type==='gem'?'ic-mafia':'ic-det',gold=type==='gem'?'#ff5b6e':'#ffd24c';
  const ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;z-index:10050;pointer-events:none;overflow:hidden';
  document.body.appendChild(ov);
  const el=(css,html)=>{const d=document.createElement('div');d.style.cssText=css;if(html)d.innerHTML=html;ov.appendChild(d);return d};
  const at='position:absolute;left:'+cx+'px;top:'+cy+'px;';
  /* ظلال + توهج + حلقات */
  el('position:absolute;inset:0;background:radial-gradient(circle at 50% 42%,rgba(0,0,0,0),rgba(0,0,0,.6))').animate([{opacity:0},{opacity:1,offset:.15},{opacity:1,offset:.72},{opacity:0}],{duration:2800,fill:'both'});
  el(at+'width:280px;height:280px;margin:-140px 0 0 -140px;border-radius:50%;background:radial-gradient(circle,'+gold+'dd 0%,'+gold+'44 42%,transparent 70%)').animate([{transform:'scale(.1)',opacity:0},{transform:'scale(1.6)',opacity:1,offset:.35},{transform:'scale(2.8)',opacity:0}],{duration:1400,easing:'ease-out',fill:'both'});
  [0,200,400].forEach(dl=>el(at+'width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:50%;border:4px solid '+gold).animate([{transform:'scale(.2)',opacity:.95},{transform:'scale(4.2)',opacity:0}],{duration:1000,delay:dl,easing:'ease-out',fill:'both'}));
  /* الرقم */
  const tx=el('position:absolute;left:0;right:0;top:'+(cy-46)+'px;display:flex;align-items:center;justify-content:center;gap:10px;direction:ltr;font-weight:900;font-size:68px;color:'+gold+';text-shadow:0 0 18px '+gold+',0 4px 12px #000');
  tx.innerHTML='<span>+0</span><i class="ic '+ic+'" style="width:58px;height:58px"></i>';
  tx.animate([{transform:'scale(.2)',opacity:0},{transform:'scale(1.35)',opacity:1,offset:.22},{transform:'scale(1)',opacity:1,offset:.36},{transform:'scale(1)',opacity:1,offset:.72},{transform:'translateY(-70px) scale(.9)',opacity:0}],{duration:2300,delay:100,easing:'ease-out',fill:'both'});
  const t0=performance.now(),sp=tx.firstChild;
  (function up(){const k=Math.min(1,(performance.now()-t0-150)/750);if(k>=0)sp.textContent='+'+fmt(Math.round(amount*(1-Math.pow(1-k,3))));if(k<1&&ov.isConnected)requestAnimationFrame(up)})();
  /* نجوم */
  for(let i=0;i<26;i++){
    const a=Math.random()*6.283,r=110+Math.random()*170,d=el(at+'font-size:'+(12+Math.random()*16)+'px;color:'+['#fff',gold,'#ffb35c'][i%3]+';text-shadow:0 0 8px '+gold,'✦');
    d.animate([{transform:'translate(-50%,-50%) scale(.2) rotate(0deg)',opacity:0},{transform:'translate(calc(-50% + '+Math.cos(a)*r*.6+'px),calc(-50% + '+Math.sin(a)*r*.6+'px)) scale(1.2) rotate(180deg)',opacity:1,offset:.4},{transform:'translate(calc(-50% + '+Math.cos(a)*r+'px),calc(-50% + '+Math.sin(a)*r+'px)) scale(.2) rotate(360deg)',opacity:0}],{duration:1200+Math.random()*500,delay:Math.random()*300,easing:'ease-out',fill:'both'});
  }
  /* العملات الطايرة للعداد */
  const n=Math.min(26,Math.max(10,Math.round(Math.sqrt(amount)*3))),nn=numNode(tg.chip);
  if(nn)nn.nodeValue=fmt(from);
  const tx0=tg.x-cx,ty0=tg.y-cy;let got=0;
  [523,659,784,1047].forEach((f,i)=>ding(f,i*.08,.06));
  for(let i=0;i<n;i++){
    const a=Math.random()*6.283,r=80+Math.random()*100,bx=Math.cos(a)*r,by=Math.sin(a)*r,dl=300+i*45,dur=1400;
    const c=el(at+'width:32px;height:32px;margin:-16px 0 0 -16px;background-size:contain;background-repeat:no-repeat;background-position:center;background-image:var(--'+(type==='gem'?'ic-coin':'ic-gem')+');filter:drop-shadow(0 2px 6px rgba(0,0,0,.55))');
    /* ملاحظة: متغيرات الأيقونات مقلوبة في style.css (ic-mafia = ic-coin، ic-det = ic-gem) */
    const an=c.animate([
      {transform:'translate(0,0) scale(.2) rotateY(0deg)',opacity:0},
      {transform:'translate('+bx+'px,'+by+'px) scale(1.1) rotateY(360deg)',opacity:1,offset:.32},
      {transform:'translate('+(bx*.55+tx0*.45)+'px,'+(by*.35+ty0*.5-50)+'px) scale(.95) rotateY(720deg)',opacity:1,offset:.66},
      {transform:'translate('+tx0+'px,'+ty0+'px) scale(.45) rotateY(1080deg)',opacity:.95}
    ],{duration:dur,delay:dl,easing:'cubic-bezier(.25,.8,.3,1)',fill:'both'});
    ding(880+(i%6)*90,(dl+dur-60)/1000,.045);
    an.onfinish=()=>{
      got++;
      if(nn&&nn.isConnected)nn.nodeValue=fmt(Math.round(from+(to-from)*got/n));
      if(tg.chip&&got%2===0)tg.chip.animate([{transform:'scale(1)',boxShadow:'0 0 0 0 '+gold+'00'},{transform:'scale(1.18)',boxShadow:'0 0 18px 4px '+gold+'aa'},{transform:'scale(1)',boxShadow:'0 0 0 0 '+gold+'00'}],{duration:260});
      for(let k=0;k<4;k++){
        const s=el('position:absolute;left:'+tg.x+'px;top:'+tg.y+'px;width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%;background:'+gold),b=Math.random()*6.283;
        s.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:'translate('+Math.cos(b)*26+'px,'+Math.sin(b)*26+'px) scale(0)',opacity:0}],{duration:420,fill:'both'});
      }
    };
  }
  setTimeout(()=>{
    if(nn&&nn.isConnected)nn.nodeValue=fmt(to);
    ov.remove();done();
  },300+n*45+1400+250);
}
