/* تعليمات الكروت: info(role) كرت واحد، book() كل الكروت (كلاسيكي ودموي) */
export const INFO={
  mafia:{n:'المافيا',e:'🔪',img:'card-mafia.jpg',t:'تعرفون بعض. كل ليلة تتفقون على لاعب تقتلونه (اللي يجيب أصوات أكثر يموت). بالنهار تمثلون إنكم أبرياء. تفوزون إذا صار عددكم يساوي عدد الباقين أو أكثر.'},
  doctor:{n:'الطبيب',e:'💉',img:'card-doctor.jpg',t:'كل ليلة تختار لاعب تحميه، وتقدر تحمي نفسك. إذا كان هو ضحية المافيا (أو السفّاح) ينجو.'},
  detective:{n:'المحقق',e:'🕵️',img:'card-detective.jpg',t:'كل ليلة تفحص لاعب وتعرف هل هو مافيا أو بريء. النتيجة تطلع لك أنت بس. (العرّاب يظهر لك مواطن).'},
  citizen:{n:'المواطن',e:'🙂',img:'card-citizen.jpg',t:'ما عندك قدرة بالليل. ناقش وصوّت وطلّع المافيا قبل ما يخلصون عليكم. يفوز المواطنون إذا ماتت كل المافيا.'},
  sorcerer:{n:'الساحر',e:'🧙',t:'عندك جرعتين، كل وحدة مرة وحدة بس: جرعة قتل تسمم فيها أي لاعب، وجرعة إحياء تنقذ فيها ضحية المافيا الليلة.'},
  sniper:{n:'القناص',e:'🎯',t:'عندك رصاصة وحدة بالليل. إذا أصبت مافيا يموت، وإذا أصبت بريء تموت أنت. وتقدر تحتفظ فيها.'},
  joker:{n:'الجوكر',e:'🃏',t:'هدفك تنطرد بالتصويت، وإذا انطردت تفوز لحالك. ما يجتمع مع السفّاح.'},
  godfather:{n:'العرّاب',e:'🎩',t:'من المافيا. يشارك فريقه في اختيار الضحية كل ليلة. لو المحقق فحصه يشوفه «مواطن» مو مافيا. ما يجتمع مع المحقق في غرفة أقل من 8 لاعبين.'},
  bomber:{n:'المفجّر',e:'💣',t:'من المافيا. لو انطرد بالتصويت يأخذ معه لاعب واحد عشوائي من اللي صوّتوا ضده.'},
  silencer:{n:'الكاتم',e:'🤐',t:'من المافيا. كل ليلة، بجانب اختيار الضحية، يقدر يكتم لاعب. والمكتوم ما يتكلم بمايكه وقت الكلام والنقاش في اليوم التالي.'},
  soldier:{n:'الجندي',e:'🪖',t:'من المواطنين. ينجو من أول ضربة ليل (من المافيا أو السفّاح). ما ينفعه الدرع ضد السم والقناص والتصويت.'},
  mayor:{n:'العمدة',e:'🎖️',t:'من المواطنين. صوته يحسب بصوتين في التصويت، وما أحد يعرف.'},
  killer:{n:'السفّاح',e:'🪓',t:'يلعب ضد الكل. يقتل ضحية كل ليلة. يفوز لو بقي وحده أو معه لاعب واحد. وما تفوز المافيا بالتعادل إلا بعد موته.'},
  survivor:{n:'الناجي',e:'🍀',t:'يلعب وحيد. يفوز لو كان حيًا لما تنتهي اللعبة مع أي فريق. هو بنفسه ما ينهي اللعبة.'}
};
const SEC={
  classic:[[null,['mafia','doctor','detective','citizen','sorcerer','sniper']]],
  mad:[['🕶️ جنون المافيا',['godfather','bomber','silencer']],['🛡️ جنون المواطنين',['soldier','mayor']],['🐺 يلعب وحيد',['killer','survivor','joker']]]
};
function sheet(title,html){
  const o=document.createElement('div');o.className='ov';
  o.innerHTML='<div class="sh"><div class="shh"><b>'+title+'</b><button class="mini" id="shx">✕</button></div><div style="max-height:75vh;overflow:auto">'+html+'</div></div>';
  document.body.appendChild(o);
  o.onclick=e=>{if(e.target===o||e.target.id==='shx')o.remove()};
  return o;
}
const pic=c=>c.img?'<img src="'+c.img+'" alt="" style="width:64px;height:auto;border-radius:8px">':'<div style="font-size:44px;width:64px;text-align:center">'+c.e+'</div>';
const blk=c=>'<div style="display:flex;gap:12px;align-items:center;margin:12px 0">'+pic(c)+'<div><b>'+c.n+'</b><p style="margin:4px 0">'+c.t+'</p></div></div>';
export function info(r){const c=INFO[r];if(c)sheet(c.e+' '+c.n,blk(c))}
/* بطاقة: الشكل والاسم بس، و❗ تفتح المعلومات */
const card=k=>{
  const c=INFO[k];
  return '<div style="position:relative;background:rgba(255,255,255,.06);border:1px solid var(--bd);border-radius:12px;padding:12px 4px 8px;text-align:center"><button class="mini" data-i="'+k+'" style="position:absolute;top:4px;right:4px;width:20px!important;height:20px;padding:0!important;margin:0!important;border-radius:50%!important;font-size:12px!important;line-height:20px">!</button>'+
    (c.img?'<img src="'+c.img+'" alt="" style="width:100%;max-width:66px;height:auto;border-radius:8px">':'<div style="font-size:42px;height:66px;line-height:66px">'+c.e+'</div>')+
    '<div style="font-size:12px;font-weight:700;margin-top:4px;white-space:nowrap">'+c.n+'</div></div>';
};
const grid=l=>'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:8px 0">'+l.map(card).join('')+'</div>';
export function book(){
  let tab='classic';
  const o=sheet('📖 التعليمات','<div id="bkb"></div>'),el=o.querySelector('#bkb');
  const paint=()=>{
    const tb=(k,t)=>'<button data-t="'+k+'" class="btn'+(tab===k?'':' alt')+'" style="flex:1;margin:0;font-size:15px;padding:10px">'+t+'</button>';
    el.innerHTML='<div style="display:flex;gap:8px;margin-bottom:6px">'+tb('classic','كلاسيكي')+tb('mad','دموي')+'</div>'+
      SEC[tab].map(([t,l])=>(t?'<p style="margin:14px 0 0;font-weight:800">'+t+'</p>':'')+grid(l)).join('');
    el.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{tab=b.dataset.t;paint()});
    el.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>info(b.dataset.i));
  };
  paint();
}
