/* تعليمات الكروت: info(role) كرت واحد، book() كل الكروت */
export const INFO={
  mafia:{n:'المافيا',e:'🔪',img:'card-mafia.jpg',t:'تعرفون بعض. كل ليلة تتفقون على لاعب تقتلونه (اللي يجيب أصوات أكثر يموت). بالنهار تمثلون إنكم أبرياء. تفوزون إذا صار عددكم يساوي عدد الباقين أو أكثر.'},
  doctor:{n:'الطبيب',e:'💉',img:'card-doctor.jpg',t:'كل ليلة تختار لاعب تحميه، وتقدر تحمي نفسك. إذا كان هو ضحية المافيا ينجو.'},
  detective:{n:'المحقق',e:'🕵️',img:'card-detective.jpg',t:'كل ليلة تفحص لاعب وتعرف هل هو مافيا أو بريء. النتيجة تطلع لك أنت بس.'},
  citizen:{n:'المواطن',e:'🙂',img:'card-citizen.jpg',t:'ما عندك قدرة بالليل. ناقش وصوّت وطلّع المافيا قبل ما يخلصون عليكم. يفوز المواطنون إذا ماتت كل المافيا.'},
  sorcerer:{n:'الساحر',e:'🧙',t:'عندك جرعتين، كل وحدة مرة وحدة بس: جرعة قتل تسمم فيها أي لاعب، وجرعة إحياء تنقذ فيها ضحية المافيا. تشوف ضحية المافيا الليلة قبل ما تقرر.'},
  sniper:{n:'القناص',e:'🎯',t:'عندك رصاصة وحدة بالليل. إذا أصبت مافيا يموت، وإذا أصبت بريء تموت أنت. وتقدر تحتفظ فيها.'},
  joker:{n:'الجوكر',e:'🃏',t:'دور الوضع الدموي. هدفك تنطرد بالتصويت، وإذا انطردت تفوز لحالك.'}
};
function sheet(title,html){
  const o=document.createElement('div');o.className='ov';
  o.innerHTML='<div class="sh"><div class="shh"><b>'+title+'</b><button class="mini" id="shx">✕</button></div><div style="max-height:75vh;overflow:auto">'+html+'</div></div>';
  document.body.appendChild(o);
  o.onclick=e=>{if(e.target===o||e.target.id==='shx')o.remove()};
}
const pic=c=>c.img?'<img src="'+c.img+'" alt="" style="width:64px;height:auto;border-radius:8px">':'<div style="font-size:44px;width:64px;text-align:center">'+c.e+'</div>';
const blk=c=>'<div style="display:flex;gap:12px;align-items:center;margin:12px 0">'+pic(c)+'<div><b>'+c.n+'</b><p style="margin:4px 0">'+c.t+'</p></div></div>';
export function info(r){const c=INFO[r];if(c)sheet(c.e+' '+c.n,blk(c))}
export function book(){sheet('📖 تعليمات الكروت',Object.keys(INFO).map(k=>blk(INFO[k])).join(''))}
