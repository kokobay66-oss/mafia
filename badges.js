import {getApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getFirestore,doc,getDoc} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const db=getFirestore(getApp());
let X=null;
/* الشارات تنحسب من إحصائيات اللاعب (stats) */
export const BG=[
  {id:'g1',e:'🎮',n:'أول لعبة',c:'#4f9bff',t:d=>d.games>=1},
  {id:'w1',e:'🏆',n:'أول فوز',c:'#f5a623',t:d=>d.wins>=1},
  {id:'maf',e:'🔪',n:'فوز كمافيا',c:'#e0334c',t:d=>d.wMaf>=1},
  {id:'cit',e:'🛡️',n:'فوز كمواطن',c:'#2a8cf0',t:d=>d.wCit>=1},
  {id:'jok',e:'🃏',n:'فوز كجوكر',c:'#c08a00',t:d=>d.jok>=1},
  {id:'det',e:'🔍',n:'محقق بارع',c:'#e08a1e',t:d=>d.found>=1},
  {id:'doc',e:'💉',n:'منقذ',c:'#2fbf71',t:d=>d.saves>=1},
  {id:'snp',e:'🎯',n:'قناص',c:'#8e5cf0',t:d=>d.snipes>=1}
];
export const earned=d=>BG.filter(b=>b.t(d||{}));
export const chip=(b,sz)=>'<span title="'+b.n+'" style="display:inline-flex;align-items:center;justify-content:center;width:'+sz+'px;height:'+sz+'px;border-radius:50%;background:'+b.c+';font-size:'+Math.round(sz*.58)+'px;box-shadow:0 1px 4px rgba(0,0,0,.25);flex:none">'+b.e+'</span>';
async function statsDoc(u){
  try{const s=await getDoc(doc(db,'stats',u));return s.exists()?s.data():{}}catch(e){return {}}
}
/* يعبّي خانة "الشارات" في صفحة تعديل المعلومات بدل "لا يوجد" */
async function run(){
  const v=document.querySelector('#r-bg .v');
  if(!v||v.dataset.bg||!X||!X.me)return;
  v.dataset.bg='1';
  const l=earned(await statsDoc(X.me.uid));
  v.innerHTML=l.length?'<span style="display:inline-flex;gap:4px">'+l.slice(0,6).map(b=>chip(b,26)).join('')+'</span>':'لا يوجد';
}
export function init(c){
  X=c;
  new MutationObserver(run).observe(document.body,{childList:true,subtree:true});
}
