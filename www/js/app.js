/* ===== الدخول ===== */
const PR={t:null};
function enter(){
  $('login').hidden=true;$('app').hidden=false;
  $('who').textContent='👤 '+ME.name;go('home');
}
function doLogin(){
  const u=nm($('lu').value),p=norm(dg($('lp').value));let f=null;
  if(u===nm('Mahmoud')){if(H('owner|'+p)===OWNER_H)f={name:'Mahmoud',owner:true,admin:true,perms:{}}}
  else if(u===nm('أسواق بدر')){if(!D.set.adminDeleted&&H('admin|'+p)===(D.set.adminH||ADMIN_H0))f={name:'أسواق بدر',admin:true,isAdmin:true,perms:{}}}
  else{const e=D.employees.find(x=>x.active!==false&&x.pin&&nm(x.name)===u&&x.pin===p);if(e)f={name:e.name,perms:e.perms||{}}}
  if(f){ME=f;$('le').textContent='';$('lp').value='';enter()}
  else $('le').textContent='اسم المستخدم أو الرقم السري غير صحيح';
}
$('lb').onclick=doLogin;
$('lp').onkeydown=e=>{if(e.key==='Enter')doLogin()};
$('lu').onkeydown=e=>{if(e.key==='Enter')$('lp').focus()};
A.logout=()=>{
  clearInterval(PR.t);ME=null;POS.ses=null;POS.order=newOrder();
  $('app').hidden=true;$('login').hidden=false;$('lu').value='';$('lu').focus();
};

/* ===== الرئيسية ===== */
V.home=()=>{
  const T=[
   ['🛒 نقطة البيع','posBranch',()=>can('pos_sell')||can('pos_close')],
   ['🧾 مراجعة الفواتير','review',()=>can('pos_review')],
   ['📥 المشتريات','purchases',()=>can('pur_view')],
   ['📦 المخزون','inventory',()=>can('inv_view')],
   ['📊 الحسابات والتقارير','accounts',()=>can('acc_reports')],
   ['🚚 الموردين','suppliers',()=>can('acc_suppliers')],
   ['👥 الموظفون والصلاحيات','employees',()=>can('hr_view')],
   ['🏷️ الاستعلام عن السعر','price',()=>true],
   ['📂 استيراد وتحديث البيانات','imports',()=>can('sys_import')],
   ['⚙️ الإعدادات','settings',()=>!!ME.admin],
   ['🗂️ فتح مجلد البرنامج','folder',()=>api&&(can('acc_reports')||can('sys_import'))]
  ].filter(t=>t[2]());
  setMain(`<div class="ttl">مرحبًا ${esc(ME.name)}</div><div class="mut" style="margin-bottom:10px">المنتجات المحمّلة: ${D.products.length} — الموردين: ${D.suppliers.length} — الموظفين: ${D.employees.length}${D.products.length?'':' — <b class="err">استورد ملف المنتجات أولًا من «استيراد وتحديث البيانات»</b>'}</div>
  <div class="tiles">${T.map(t=>`<button class="tile2" data-a="${t[1]==='folder'?'openFolder':'go'}" data-v="${t[1]}">${t[0]}</button>`).join('')}</div>`);
};
A.openFolder=()=>{if(api)api.openFolder()};

/* ===== الاستعلام عن السعر ===== */
V.price=()=>{
  setMain(`<div class="card"><input id="prQ" data-i="prQ" data-k="prQ" placeholder="امسح الباركود أو اكتب اسم المنتج" style="font-size:20px;text-align:center" autocomplete="off"><div id="prL"></div></div><div id="prR"></div>`);
  $('prQ').focus();
};
I.prQ=t=>{const q=norm(t.value);$('prL').innerHTML=q.length<2?'':search(q,12).map(p=>`<div class="row" style="padding:10px;border-bottom:1px solid var(--bd);cursor:pointer;font-size:17px" data-a="prPick" data-id="${esc(p.id)}"><span style="flex:1">${esc(p.name)}</span><b>${money(pPrice(p))}</b></div>`).join('')};
K.prQ=(t,e)=>{
  if(e.key!=='Enter')return;const v=norm(t.value);if(!v)return;
  let m=find(v);if(!m.length)m=search(v,2);
  if(m.length===1)prShow(m[0],scaleQty(v,m[0]));else if(!m.length)say('غير موجود',1);
};
A.prPick=t=>prShow(PI.id[t.dataset.id],0);
function prShow(p,w){
  const price=parseFloat(p.price),has=!isNaN(price);let n=5;
  $('main').innerHTML=`<div class="pq"><div class="nm">${esc(p.name)}</div><div class="pc">${has?money(price):'غير متوفر'}</div>${w>0&&has?`<div style="font-size:26px;color:var(--ok)">السعر للكجم — الوزن ${fmt(w)} كجم = ${money(price*w)}</div>`:''}<div class="mut" id="prC">العودة تلقائيًا بعد ${n} ثوانٍ</div><button class="p" style="font-size:20px;padding:12px 30px" data-a="prBack">↩️ عودة للاستعلام</button></div>`;
  clearInterval(PR.t);
  PR.t=setInterval(()=>{n--;if(n<=0){clearInterval(PR.t);V.price()}else if($('prC'))$('prC').textContent=`العودة تلقائيًا بعد ${n} ثوانٍ`},1000);
}
A.prBack=()=>{clearInterval(PR.t);V.price()};

/* ===== استيراد وتحديث البيانات ===== */
V.imports=()=>{
  if(!can('sys_import')){say('ليس لديك صلاحية',1);return go('home')}
  const card=(k,t,d)=>`<div class="card"><div class="ttl">${t}</div><div class="mut">${d}</div><input type="file" accept=".xlsx,.xls,.csv" data-c="impFile" data-k2="${k}" style="margin-top:8px"><div id="imp_${k}" style="margin-top:6px"></div></div>`;
  setMain(`<div class="ttl">استيراد وتحديث البيانات</div><div class="g2">
   ${card('products','المنتجات','أول مرة تُضاف كل المنتجات. وفي كل تحديث لاحق تتم المقارنة بالمنتجات الموجودة (بالمعرف أو الباركود) وتُعدَّل الأسعار والتكلفة والباركود والفئات تلقائيًا. الأعمدة: معرف خارجي، باركود، مرجع داخلي، الاسم، التكلفة، سعر البيع، فئة المنتج، فئة نقطة البيع، نوع المنتج، وحدة القياس.')}
   ${card('suppliers','الموردين','عمود واحد بأسماء الموردين، ولا تتكرر الأسماء الموجودة.')}
   ${card('employees','الموظفين','أعمدة: اسم الموظف، هاتف العمل، البريد، القسم، المنصب الوظيفي، المدير. لا يتأثر الرقم السري ولا الصلاحيات للموظفين الموجودين.')}</div>`);
};
C.impFile=async t=>{
  const f=t.files[0];if(!f)return;const k=t.dataset.k2,out=$('imp_'+k);
  out.innerHTML='<span class="mut">جاري القراءة…</span>';
  try{
    const rows=await readRows(f);await new Promise(r=>setTimeout(r,30));
    const r=({products:importProducts,suppliers:importSuppliers,employees:importEmployees})[k](rows);
    if(!r||r.err){out.innerHTML=`<span class="err">${esc(r?r.err:'الملف فارغ')}</span>`;return}
    out.innerHTML=k==='products'?`<b style="color:var(--ok)">تم: ${r.add} منتج جديد — ${r.upd} منتج اتعدّل — ${r.same} بدون تغيير</b>`
      :`<b style="color:var(--ok)">تم: ${r.add} جديد — ${r.upd!==undefined?r.upd+' اتعدّل':r.skip+' موجود مسبقًا'}</b>`;
    await flush();
  }catch(e){out.innerHTML='<span class="err">تعذر قراءة الملف</span>'}
  t.value='';
};

/* ===== الإعدادات ===== */
const fdate=t=>t?new Date(t).toLocaleString('ar-EG'):'—';
V.settings=async()=>{
  if(!ME.admin){say('للإدارة فقط',1);return go('home')}
  const info=api?await api.info():null,bks=(ME.owner&&api)?await api.listBackups():[];
  setMain(`<div class="ttl">الإعدادات</div>
  <div class="card"><div class="ttl" style="font-size:17px">النسخ الاحتياطي</div>
   <div class="mut">مسار الحفظ: ${esc(info?info.root:'—')}</div><div class="mut">نسخة تلقائية كل ساعتين — آخر نسخة: ${esc(info?fdate(info.last):'—')}</div>
   <div class="row" style="margin-top:8px"><button class="p" data-a="bkNow">💾 نسخة احتياطية الآن</button><button data-a="openFolder">📂 فتح مجلد البرنامج</button></div></div>
  <div class="card"><div class="ttl" style="font-size:17px">حساب الإدارة</div><button data-a="admPw">🔑 تغيير كلمة المرور</button></div>
  ${ME.owner?`<div class="card"><div class="ttl" style="font-size:17px">استرجاع نسخة احتياطية</div>${bks.length?tbl(['النسخة','الحجم','التاريخ',''],bks.slice(0,40).map(b=>`<tr><td class="l">${esc(b.name)}</td><td>${Math.round(b.size/1024)} ك.ب</td><td>${esc(fdate(b.mtime))}</td><td><button data-a="bkRestore" data-n="${esc(b.name)}">استرجاع</button></td></tr>`).join('')):'<div class="mut">لا توجد نسخ</div>'}</div>
  <div class="card"><div class="ttl" style="font-size:17px">حساب الإدارة (للمالك فقط)</div><button class="${D.set.adminDeleted?'p':'d'}" data-a="admToggle">${D.set.adminDeleted?'إعادة إنشاء حساب الإدارة':'حذف حساب الإدارة'}</button></div>
  <div class="card"><div class="ttl" style="font-size:17px">حذف بيانات البرنامج</div><div class="mut">يحذف كل المنتجات والمبيعات والأرصدة والموردين والموظفين من داخل البرنامج.</div><button class="d" style="margin-top:8px" data-a="wipeAll">🗑 حذف بيانات البرنامج</button></div>`:''}`);
};
A.bkNow=async()=>{
  if(!api){say('متاح في نسخة ويندوز فقط',1);return}
  await flush();const n=await api.backupNow();say(n?'تم إنشاء النسخة الاحتياطية':'لا توجد بيانات لنسخها',!n);V.settings();
};
A.admPw=async()=>{
  const f=(ME.owner?[]:[{k:'c',l:'كلمة المرور الحالية',t:'password'}]).concat([{k:'n',l:'كلمة المرور الجديدة',t:'password'},{k:'n2',l:'تأكيد كلمة المرور الجديدة',t:'password'}]);
  const r=await formDlg('تغيير كلمة مرور حساب الإدارة',f,'تغيير');if(!r)return;
  if(!ME.owner&&H('admin|'+norm(dg(r.c)))!==(D.set.adminH||ADMIN_H0)){say('كلمة المرور الحالية غير صحيحة',1);return}
  const n=norm(dg(r.n));
  if(n.length<4||n!==norm(dg(r.n2))){say('كلمة المرور الجديدة غير صالحة أو غير متطابقة (4 خانات على الأقل)',1);return}
  D.set.adminH=H('admin|'+n);save('set');await flush();say('تم تغيير كلمة المرور');
};
A.admToggle=async()=>{
  if(!ME.owner)return;
  if(D.set.adminDeleted){
    const r=await formDlg('إعادة إنشاء حساب الإدارة',[{k:'n',l:'كلمة المرور الجديدة',t:'password'}],'إنشاء');if(!r)return;
    const n=norm(dg(r.n));if(n.length<4){say('كلمة المرور قصيرة',1);return}
    D.set.adminH=H('admin|'+n);D.set.adminDeleted=false;save('set');await flush();say('تم إنشاء حساب الإدارة');
  }else{
    if(!(await dlg('حذف حساب الإدارة؟ لن يستطيع الدخول به حتى تعيد إنشاءه.',{yes:'حذف الحساب'})))return;
    D.set.adminDeleted=true;save('set');await flush();say('تم حذف حساب الإدارة');
  }
  V.settings();
};
A.bkRestore=async t=>{
  if(!ME.owner||!api)return;
  if(!(await dlg('استرجاع النسخة «'+t.dataset.n+'»؟\nسيتم استبدال كل بيانات البرنامج الحالية (مع أخذ نسخة من الوضع الحالي أولًا).',{yes:'متابعة'})))return;
  if(!(await askCode()))return;
  await flush();
  try{await api.restore(t.dataset.n)}catch(e){say('تعذر استرجاع النسخة',1);return}
  say('تم الاسترجاع — جاري إعادة التشغيل…');setTimeout(()=>location.reload(),900);
};
A.wipeAll=async()=>{
  if(!ME.owner||!api)return;
  if(!(await dlg('حذف كل بيانات البرنامج؟\nلا يمكن التراجع (تُحفظ نسخة احتياطية تلقائيًا قبل الحذف).',{yes:'متابعة'})))return;
  if(!(await askCode()))return;
  await flush();
  try{await api.wipe();await dbSet('set',{seeded:true})}catch(e){say('تعذر حذف البيانات',1);return}
  say('تم حذف بيانات البرنامج — جاري إعادة التشغيل…');setTimeout(()=>location.reload(),900);
};

/* ===== تحميل البيانات المدمجة (المنتجات / الموردين / الموظفين) أول تشغيل ===== */
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s)})}
async function seedIfNeeded(){
  if(D.set.seeded||D.products.length||D.suppliers.length||D.employees.length)return;
  try{
    await loadScript('seed/products.js');await loadScript('seed/suppliers.js');await loadScript('seed/employees.js');
    importProducts(SEED.p.slice());importSuppliers(SEED.s.slice());importEmployees(SEED.e.slice());
    D.set.seeded=true;save('set');await flush();
    delete window.SEED;
  }catch(e){}
}

/* ===== تشغيل ===== */
(async()=>{
  await dbLoad();reindex();await seedIfNeeded();
  $('lu').focus();
})();
