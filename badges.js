import {getApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getFirestore,doc,getDoc} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const db=getFirestore(getApp());
let X=null;
/* نفس شارات me.js: صورة + عدد الفوز المطلوب. الزعيمين يحتاجون فتح الست الأولى */
export const BG=[
  {id:'cit',n:'مواطن صالح',img:'bd-cit.webp',stat:'wCit',goal:5},
  {id:'doc',n:'المنقذ السري',img:'bd-doc.webp',stat:'saves',goal:5},
  {id:'det',n:'المحقق الذهبي',img:'bd-det.webp',stat:'found',goal:10},
  {id:'maf',n:'مافيا الظلال',img:'bd-maf.webp',stat:'wMaf',goal:5},
  {id:'snp',n:'الرصاصة الصامتة',img:'bd-snp.webp',stat:'snipes',goal:3},
  {id:'jok',n:'المراوغ',img:'bd-jok.webp',stat:'jok',goal:3},
  {id:'ldr',n:'زعيم المواطنين',img:'bd-ldr.webp',stat:'wCit',goal:200,lead:1},
  {id:'boss',n:'زعيم المافيا',img:'bd-boss.webp',stat:'wMaf',goal:200,lead:1}
];
const val=(b,d)=>(d&&d[b.stat])||0;
const isOn=(b,d)=>b.lead?(BG.slice(0,6).every(x=>val(x,d)>=x.goal)&&val(b,d)>=b.goal):val(b,d)>=b.goal;
export const earned=d=>BG.filter(b=>isOn(b,d));
export const chip=(b,sz)=>'<img src="'+b.img+'" alt="" title="'+b.n+'" style="width:'+sz+'px;height:'+Math.round(sz*1.12)+'px;object-fit:contain;flex:none">';
async function statsDoc(u){
  try{const s=await getDoc(doc(db,'stats',u));return s.exists()?s.data():{}}catch(e){return {}}
}
/* يعبّي خانة "الشارات" في صفحة تعديل المعلومات بدل "لا يوجد" */
async function run(){
  const v=document.querySelector('#r-bg .v');
  if(!v||v.dataset.bg||!X||!X.me)return;
  v.dataset.bg='1';
  const l=earned(await statsDoc(X.me.uid));
  v.innerHTML=l.length?'<span style="display:inline-flex;gap:4px">'+l.slice(0,6).map(b=>chip(b,28)).join('')+'</span>':'لا يوجد';
}
export function init(c){
  X=c;
  new MutationObserver(run).observe(document.body,{childList:true,subtree:true});
}
