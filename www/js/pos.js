/* ===== نقطة البيع ===== */
const V={};
const POS={br:'',ses:null,order:{lines:[],sel:-1},cat:'',q:'',lim:60,buf:'',fresh:true};
const newOrder=()=>({lines:[],sel:-1});

function go(v,arg){clearInterval(PR.t);V[v](arg)}
A.go=t=>go(t.dataset.v);
A.home=()=>go('home');

/* --- اختيار الفرع ثم نقطة البيع --- */
V.posBranch=()=>setMain(`<div class="ttl">نقطة البيع — اختر الفرع</div><div class="tiles">${BR.map(b=>`<button class="tile2" data-a="posBr" data-v="${esc(b)}">${esc(b)}</button>`).join('')}</div>`);
A.posBr=t=>{POS.br=t.dataset.v;go('posPoints')};
const openSes=(b,p)=>D.sessions.find(s=>s.status==='open'&&s.br===b&&s.pos===p);
V.posPoints=()=>{
  const b=POS.br;
  setMain(`<div class="row"><button data-a="go" data-v="posBranch">‹ الفروع</button><div class="ttl" style="flex:1;margin:0">${esc(b)} — اختر نقطة البيع</div></div><div class="tiles" style="margin-top:12px">${POSN.map(p=>{
    const s=openSes(b,p);
    return s?`<div class="tile2 open"><b>${p}</b><div class="mut">⚠️ جلسة #${s.id} مفتوحة ولم تُغلق بعد</div><div class="mut">فتحها ${esc(s.user)} — ${esc(s.odt)}</div><div class="row"><button class="f p" data-a="posResume" data-id="${s.id}">استكمال البيع</button>${can('pos_close')?`<button class="f" data-a="sesClose" data-id="${s.id}">إغلاق الجلسة</button>`:''}</div></div>`
    :`<div class="tile2"><b>${p}</b><div class="mut">لا توجد جلسة مفتوحة</div><button class="p" data-a="posOpen" data-v="${p}">فتح جلسة</button></div>`}).join('')}</div>`);
};
A.posOpen=async t=>{
  if(!can('pos_sell')){say('ليس لديك صلاحية البيع',1);return}
  const p=t.dataset.v;if(openSes(POS.br,p)){go('posPoints');return}
  const v=await dlg(`فتح جلسة ${p} — ${POS.br}\nاكتب رصيد بداية الدرج (نقدي)`,{input:true,ph:'0',yes:'فتح الجلسة'});
  if(v===null)return;
  const c=norm(v)===''?0:num(v);if(isNaN(c)||c<0){say('رقم غير صحيح',1);return}
  const s={id:++D.cnt.ses,br:POS.br,pos:p,user:ME.name,ots:Date.now(),odt:nowStr(),day:dayStr(),opening:c,status:'open'};
  D.sessions.push(s);save('sessions','cnt');await flush();
  POS.ses=s;POS.order=newOrder();POS.cat='';POS.q='';go('pos');
};
A.posResume=t=>{
  if(!can('pos_sell')){say('ليس لديك صلاحية البيع',1);return}
  const s=D.sessions.find(x=>x.id==t.dataset.id);if(!s)return;
  if(!POS.ses||POS.ses.id!==s.id)POS.order=newOrder();
  POS.ses=s;POS.q='';go('pos');
};

/* --- شاشة البيع --- */
V.pos=()=>{
  const s=POS.ses;
  setMain(`<div class="pos">
  <div class="op">
    <div class="oph">جلسة #${s.id} — ${esc(s.br)} / ${esc(s.pos)}</div>
    <div class="ol" id="ol"></div>
    <div class="ot"><span>الإجمالي</span><span id="otot">0.00</span></div>
    <div class="npd">${['1','2','3','4','5','6','7','8','9','.','0','⌫'].map(k=>`<button data-a="npk" data-k="${k}">${k}</button>`).join('')}
      <button class="d" data-a="posDel">حذف السطر</button><button class="d" data-a="posClr">مسح الطلب</button><button data-a="posRev">الفواتير</button></div>
    <button class="p paybtn" data-a="posPay">الدفع ›</button>
  </div>
  <div class="pm">
    <div class="pbar"><input id="pq" data-i="posQ" data-k="posQ" placeholder="امسح الباركود أو اكتب اسم المنتج ثم Enter" autocomplete="off">
      ${can('pos_expense')?'<button data-a="posCash" data-t="exp">💸 مصروف</button>':''}${can('pos_income')?'<button data-a="posCash" data-t="inc">💰 إيراد</button>':''}
      <button data-a="go" data-v="posPoints">خروج من الجلسة</button></div>
    <div class="cats" id="cats"></div><div class="grid" id="pg"></div>
  </div></div>`,'posm');
  renderOrder();renderCats();renderGrid();$('pq').focus();
};
const orderTotal=()=>r2(POS.order.lines.reduce((s,l)=>s+l.price*l.qty,0));
function renderOrder(){
  const o=POS.order;
  $('ol').innerHTML=o.lines.map((l,i)=>`<div class="ln${i===o.sel?' sel':''}" data-a="posSel" data-i="${i}"><div class="n">${esc(l.n)}</div><div class="dd">${fmt(l.qty)} × ${money(l.price)}</div><div class="t">${money(l.price*l.qty)}</div></div>`).join('')||'<div class="mut" style="padding:20px;text-align:center">الطلب فارغ</div>';
  $('otot').textContent=money(orderTotal());
  const e=$('ol').querySelector('.sel');if(e)e.scrollIntoView({block:'nearest'});
}
function renderCats(){
  const c=[['','الكل']].concat(PI.pcats.map(x=>[x,x]),[['__none','بدون فئة']]);
  $('cats').innerHTML=c.map(x=>`<button class="${POS.cat===x[0]&&!POS.q?'on':''}" data-a="posCat" data-v="${esc(x[0])}">${esc(x[1])}</button>`).join('');
}
function renderGrid(){
  let list;
  if(POS.q)list=search(POS.q,POS.lim+1);
  else{list=[];for(let i=0;i<D.products.length&&list.length<=POS.lim;i++){const p=D.products[i];
    if(POS.cat===''||(POS.cat==='__none'?!p.pcat:p.pcat===POS.cat))list.push(p)}}
  const more=list.length>POS.lim;if(more)list=list.slice(0,POS.lim);
  $('pg').innerHTML=list.map(p=>`<div class="tile" data-a="posProd" data-id="${esc(p.id)}"><div>${esc(p.name)}</div><div class="pr">${money(pPrice(p))}</div></div>`).join('')
    +(more?'<div class="tile" data-a="posMore"><b>عرض المزيد…</b></div>':'')||'<div class="mut" style="padding:20px">لا توجد منتجات</div>';
}
A.posCat=t=>{POS.cat=t.dataset.v;POS.q='';POS.lim=60;$('pq').value='';renderCats();renderGrid()};
A.posMore=()=>{POS.lim+=120;renderGrid()};
I.posQ=t=>{POS.q=norm(t.value);POS.lim=60;renderCats();renderGrid()};
K.posQ=(t,e)=>{
  if(e.key!=='Enter')return;
  const v=norm(t.value);if(!v)return;
  let m=find(v);if(!m.length)m=search(v,5);
  if(m.length===1){const q=scaleQty(v,m[0]);if(scale(v)&&m[0].bc!==v&&!q)say('الوزن في الباركود = 0، أُضيف الصنف بكمية 1 (عدّلها من لوحة الأرقام)',1);posAdd(m[0],q);t.value='';POS.q='';renderCats();renderGrid()}
  else if(!m.length){say('الباركود '+v+' غير موجود',1);t.select()}
};
A.posProd=t=>{const p=PI.id[t.dataset.id];if(p)posAdd(p,0)};
function posAdd(p,q){
  const price=parseFloat(p.price);
  if(isNaN(price)){say('لا يوجد سعر لهذا الصنف',1);return}
  const o=POS.order;o.lines.push({id:p.id,n:p.name,b:p.bc,price,cost:pCost(p),cat:p.cat||'',qty:q>0?q:1});
  o.sel=o.lines.length-1;POS.buf=String(o.lines[o.sel].qty);POS.fresh=true;say('');renderOrder();
  const f=$('pq');if(f)f.focus();
}
A.posSel=t=>{const o=POS.order;o.sel=+t.dataset.i;POS.buf=String(o.lines[o.sel].qty);POS.fresh=true;renderOrder()};
A.npk=t=>{
  const o=POS.order,l=o.lines[o.sel];if(!l)return;const k=t.dataset.k;
  if(k==='⌫'){
    let b=POS.buf.slice(0,-1);POS.fresh=false;
    if(b===''){o.lines.splice(o.sel,1);o.sel=o.lines.length-1;if(o.sel>=0)POS.buf=String(o.lines[o.sel].qty);POS.fresh=true;renderOrder();return}
    POS.buf=b;
  }else{
    if(POS.fresh){POS.buf=k==='.'?'0.':k;POS.fresh=false}
    else{if(k==='.'&&POS.buf.includes('.'))return;POS.buf+=k}
  }
  l.qty=parseFloat(POS.buf)||0;renderOrder();
};
A.posDel=()=>{const o=POS.order;if(o.sel<0)return;o.lines.splice(o.sel,1);o.sel=o.lines.length-1;if(o.sel>=0)POS.buf=String(o.lines[o.sel].qty);renderOrder()};
A.posClr=async()=>{if(POS.order.lines.length&&await dlg('مسح الطلب الحالي؟',{yes:'مسح'})){POS.order=newOrder();renderOrder()}};
A.posRev=()=>{if(can('pos_review'))go('review');else say('ليس لديك صلاحية مراجعة الفواتير',1)};

/* --- مصروفات وإيرادات --- */
A.posCash=async t=>{
  const exp=t.dataset.t==='exp';
  const r=await formDlg(exp?'تسجيل مصروف نقطة بيع':'تسجيل إيراد نقطة بيع',[{k:'a',l:'المبلغ',t:'number'},{k:'n',l:'البيان / السبب',t:'text'}],'تسجيل');
  if(!r)return;const a=num(r.a);if(isNaN(a)||a<=0||!norm(r.n)){say('اكتب المبلغ والبيان',1);return}
  const s=POS.ses,d=new Date();
  D.cash.push({id:++D.cnt.cash,type:exp?'exp':'inc',amount:a,note:norm(r.n),session:s.id,br:s.br,pos:s.pos,user:ME.name,dt:nowStr(d),day:dayStr(d),ts:d.getTime()});
  save('cash','cnt');saveSes(s.id);say(exp?'تم تسجيل المصروف':'تم تسجيل الإيراد');
};

/* --- الدفع --- */
A.posPay=()=>{
  const o=POS.order;
  if(!o.lines.length){say('الطلب فارغ',1);return}
  if(o.lines.some(l=>!(l.qty>0))){say('يوجد صنف كميته صفر',1);return}
  const t=orderTotal();
  openModal(`<div class="card"><div class="ttl">الدفع</div>
  <div style="font-size:24px;font-weight:700;text-align:center">المبلغ المستحق: ${money(t)}</div>
  <div class="row" style="margin:10px 0">${METHODS.map((m,i)=>`<label style="flex:1 1 30%;border:1px solid var(--bd);border-radius:8px;padding:8px;text-align:center;cursor:pointer"><input type="radio" name="pm" value="${m}" data-c="payM"${i?'':' checked'}> ${m}</label>`).join('')}</div>
  <div class="lbl">المبلغ المدفوع</div><input id="payPaid" data-i="payPaid" data-k="payPaid" inputmode="decimal" style="font-size:22px;text-align:center">
  <div style="font-size:20px;font-weight:700;text-align:center;margin:10px 0"><span id="payLbl">الباقي للعميل</span>: <span id="payChg">0.00</span></div>
  <div class="row"><button class="f p" data-a="payOk">تأكيد الدفع</button><button class="f" data-a="payNo">رجوع</button></div></div>`);
  payUpd();$('payPaid').focus();
};
function payCalc(){
  const p=num($('payPaid').value),d=isNaN(p)?NaN:r2(p-orderTotal());
  $('payLbl').textContent=(isNaN(d)||d>=0)?'الباقي للعميل':'المتبقي على العميل';$('payChg').textContent=isNaN(d)?'—':money(Math.abs(d));
}
function payUpd(){
  const m=document.querySelector('input[name=pm]:checked').value;
  $('payPaid').value=(m==='فيزا'||m==='فودافون كاش')?String(orderTotal()):(m==='أجل'?'0':'');payCalc();
}
C.payM=payUpd;I.payPaid=payCalc;K.payPaid=(t,e)=>{if(e.key==='Enter')A.payOk()};
A.payNo=()=>closeModal();
A.payOk=async()=>{
  const m=document.querySelector('input[name=pm]:checked').value,paid=num($('payPaid').value),t=orderTotal();
  if(isNaN(paid)||paid<0){say('اكتب المبلغ المدفوع',1);return}
  if(['نقدي','فيزا','فودافون كاش'].includes(m)&&paid<t){say('المبلغ المدفوع أقل من قيمة الفاتورة',1);return}
  const s=POS.ses,now=new Date();
  const doc={no:++D.cnt.sale,type:'sale',ts:now.getTime(),dt:nowStr(now),day:dayStr(now),br:s.br,pos:s.pos,session:s.id,user:ME.name,
    lines:POS.order.lines.map(l=>({id:l.id,n:l.n,b:l.b,price:l.price,cost:l.cost,cat:l.cat,qty:l.qty})),total:t,paid,method:m,ret:POS.order.lines.map(()=>0)};
  D.sales.push(doc);doc.lines.forEach(l=>addStk(doc.br,l.id,-l.qty));
  save('sales','stock','cnt');closeModal();await flush();saveSes(doc.session);
  POS.order=newOrder();go('posReceipt',doc);
};
V.posReceipt=d=>{
  setMain(`<div class="row" style="justify-content:center;margin-bottom:10px"><button class="p" style="font-size:20px;padding:14px 26px" data-a="printLast">🖨️ طباعة الفاتورة (90 مم)</button><button style="font-size:20px;padding:14px 26px" data-a="posNew">🆕 طلب جديد</button></div>${rcptDiv(d)}`);
  POS.last=d;
};
A.printLast=()=>printDoc(POS.last);
A.posNew=()=>go('pos');

/* --- الفاتورة المطبوعة --- */
function rcptHtml(r){
  const ret=r.type==='return';
  const rows=r.lines.map(l=>`<tr><td class="nm">${esc(l.n)}</td><td>${fmt(l.qty)}</td><td>${money(l.price)}</td><td>${money(l.price*l.qty)}</td></tr>`).join('');
  const diff=r2(r.paid-r.total);
  const foot=ret?`<div class="rr"><span>إجمالي المرتجع</span><span>${money(-r.total)}</span></div><div class="rr"><span>طريقة الاسترداد</span><span>${esc(r.method)}</span></div>`
   :`<div class="rr"><span>المبلغ المستحق</span><span>${money(r.total)}</span></div><div class="rr"><span>المبلغ المدفوع (${esc(r.method)})</span><span>${money(r.paid)}</span></div><div class="rr"><span>${diff>=0?'الباقي':'المتبقي على العميل'}</span><span>${money(Math.abs(diff))}</span></div>`;
  return `<img src="logo.png" alt=""><div class="t">${ret?'فاتورة مرتجع':'فاتورة'} رقم ${pno(r.no)}</div>${ret&&r.ref?`<div class="c">عن الفاتورة رقم ${pno(r.ref)}</div>`:''}<div class="c">${esc(r.dt)}</div><div class="c">${esc(r.br)} — ${esc(r.pos||'')} — ${esc(r.user)}</div><hr><table><thead><tr><th>الصنف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead><tbody>${rows}</tbody></table><hr>${foot}`;
}
const rcptDiv=d=>`<div class="rcpt">${rcptHtml(d)}</div>`;
function printDoc(d){$('pa').innerHTML=rcptHtml(d);window.print()}

/* --- ملف Excel الخاص بكل جلسة: نقطة البيع / الفرع / التاريخ / نقطة البيع / "الفرع - الموظف - التاريخ" --- */
function sesFile(s){
  const n=D.sessions.filter(x=>x.br===s.br&&x.pos===s.pos&&x.day===s.day&&x.id<s.id).length;
  return{folder:`نقطة البيع/${s.br}/${s.day}/${s.pos}`,name:`${s.br} - ${s.user} - ${s.day}${n?` (${n+1})`:''}.xlsx`};
}
function saveSes(sid){
  const s=D.sessions.find(x=>x.id===sid);if(!s)return;
  const ds=D.sales.filter(d=>d.session===sid).sort((a,b)=>a.ts-b.ts);
  const ops=[['رقم الفاتورة','النوع','التاريخ والوقت','الموظف','طريقة الدفع','الباركود','اسم المنتج','فئة المنتج','التكلفة','السعر','الكمية','الإجمالي']];
  const iv=[['رقم الفاتورة','النوع','التاريخ والوقت','الموظف','طريقة الدفع','إجمالي الفاتورة','المدفوع','الباقي / المتبقي','إجمالي التكلفة','الربح','الفاتورة الأصلية','الحالة']];
  let st=0,rt=0;
  ds.forEach(d=>{
    const sg=d.type==='return'?-1:1,tn=sg<0?'مرتجع':'بيع',no=pno(d.no);let cost=0;
    d.lines.forEach(l=>{cost+=l.cost*l.qty*sg;ops.push([no,tn,d.dt,d.user,d.method,String(l.b),l.n,l.cat||'',l.cost,l.price,r3(l.qty*sg),r2(l.price*l.qty*sg)])});
    cost=r2(cost);const rq=(d.ret||[]).reduce((a,b)=>a+b,0),tq=d.lines.reduce((a,l)=>a+l.qty,0);
    iv.push([no,tn,d.dt,d.user,d.method,d.total,d.paid,sg>0?r2(d.paid-d.total):'',cost,r2(d.total-cost),d.ref?pno(d.ref):'',sg>0&&rq>0?(rq>=tq?'مرتجع كلي':'مرتجع جزئي'):'']);
    if(sg>0)st+=d.total;else rt+=d.total;
  });
  const cs=D.cash.filter(c=>c.session===sid),cr=[['النوع','المبلغ','البيان','التاريخ والوقت','الموظف']].concat(cs.map(c=>[c.type==='exp'?'مصروف':'إيراد',c.amount,c.note,c.dt,c.user]));
  const c=sesCalc(sid);
  const sm=[['رقم الجلسة',s.id],['الفرع',s.br],['نقطة البيع',s.pos],['الموظف',s.user],['وقت الفتح',s.odt],['رصيد بداية الدرج',s.opening],['الحالة',s.status==='open'?'مفتوحة':'مغلقة'],[],
    ['إجمالي المبيعات',r2(st)],['إجمالي المرتجعات',r2(-rt)],['صافي المبيعات',r2(st+rt)],['مصروفات',c.ex],['إيرادات',c.inc],[],['طريقة الدفع','المبيعات','المرتجعات','الصافي']];
  METHODS.forEach(m=>sm.push([m,r2(c.m[m].s),r2(-c.m[m].r),r2(c.m[m].s+c.m[m].r)]));
  if(s.status==='closed'){sm.push([],['أغلقها',s.cby],['وقت الإغلاق',s.cdt],[],['طريقة الدفع','المتوقع','الفعلي','الفرق']);
    METHODS.forEach(m=>sm.push([m,m==='أجل'?'':s.exp[m],s.act[m]===undefined?'':s.act[m],s.df[m]===undefined?'':s.df[m]]));sm.push(['إجمالي الفرق (زيادة + / عجز -)',s.diff])}
  const f=sesFile(s);
  return saveX(f.folder,f.name,wbOf([['المعاملات',ops],['الفواتير',iv],['مصروفات وإيرادات',cr],['الملخص',sm]]));
}

/* --- إغلاق الجلسة --- */
function sesCalc(id){
  const r={};METHODS.forEach(m=>r[m]={s:0,r:0});
  D.sales.filter(d=>d.session===id).forEach(d=>{if(d.type==='sale')r[d.method].s+=d.total;else r[d.method].r+=d.total});
  let ex=0,inc=0;D.cash.filter(c=>c.session===id).forEach(c=>{if(c.type==='exp')ex+=c.amount;else inc+=c.amount});
  return{m:r,ex:r2(ex),inc:r2(inc)};
}
const sesExp=(c,m,op)=>r2(c.m[m].s+c.m[m].r+(m==='نقدي'?op+c.inc-c.ex:0));
A.sesClose=t=>{if(can('pos_close'))go('sesClose',+t.dataset.id);else say('إغلاق الجلسة للمدير فقط',1)};
V.sesClose=id=>{
  const s=D.sessions.find(x=>x.id===id);if(!s||s.status!=='open'){go('posPoints');return}
  const c=sesCalc(id);let net=0;
  const rows=METHODS.map(m=>{const x=c.m[m],exp=sesExp(c,m,s.opening);net+=x.s+x.r;
    return `<tr><td>${m}</td><td>${money(x.s)}</td><td>${money(-x.r)}</td><td>${m==='أجل'?'—':money(exp)}</td><td>${m==='أجل'?'—':`<input inputmode="decimal" data-i="sesAct" data-m="${m}" data-e="${exp}">`}</td><td class="df">—</td></tr>`}).join('');
  setMain(`<div class="row"><button data-a="go" data-v="posPoints">‹ رجوع</button><div class="ttl" style="margin:0;flex:1">إغلاق الجلسة #${s.id} — ${esc(s.br)} / ${esc(s.pos)}</div></div>
  <div class="card mut">فتحها ${esc(s.user)} في ${esc(s.odt)} — رصيد البداية: ${money(s.opening)} — مصروفات: ${money(c.ex)} — إيرادات: ${money(c.inc)}</div>
  <div class="card">${tbl(['الطريقة','المبيعات','المرتجعات','المتوقع','الفعلي','الفرق'],rows)}<div class="ttl" style="text-align:center;margin-top:10px">صافي المبيعات: ${money(net)}</div>
  <button class="p" style="width:100%" data-a="sesDo" data-id="${s.id}">🔒 إغلاق الجلسة</button></div>`);
};
I.sesAct=t=>{const a=num(t.value);t.closest('tr').querySelector('.df').textContent=isNaN(a)?'—':diffTxt(r2(a-(+t.dataset.e)))};
A.sesDo=async t=>{
  const s=D.sessions.find(x=>x.id==t.dataset.id);if(!s)return;
  const c=sesCalc(s.id),act={},exp={},df={};let bad=false;
  document.querySelectorAll('#main input[data-m]').forEach(i=>{const a=num(i.value);if(isNaN(a)||a<0)bad=true;else act[i.dataset.m]=a});
  if(bad){say('اكتب المبلغ الفعلي الموجود لكل طريقة دفع',1);return}
  METHODS.forEach(m=>{exp[m]=sesExp(c,m,s.opening);if(act[m]!==undefined)df[m]=r2(act[m]-exp[m])});
  const tot=r2(Object.values(df).reduce((a,b)=>a+b,0));
  if(!(await dlg('نتيجة الجرد: '+diffTxt(tot)+'\nهل تريد إغلاق الجلسة؟',{yes:'إغلاق الجلسة',no:'رجوع'})))return;
  Object.assign(s,{status:'closed',cdt:nowStr(),cby:ME.name,exp,act,df,diff:tot,sum:c});
  save('sessions');await flush();
  await saveSes(s.id);
  if(POS.ses&&POS.ses.id===s.id){POS.ses=null;POS.order=newOrder()}
  say(`تم إغلاق الجلسة #${s.id} — النتيجة: ${diffTxt(tot)}`,tot<0);go('posPoints');
};

/* ===== مراجعة الفواتير والمرتجعات ===== */
const RV={doc:null};
V.review=()=>{
  setMain(`<div class="ttl">مراجعة الفواتير والمرتجعات</div><div class="card"><div class="row"><input type="date" id="vDay" value="${dayStr()}" data-c="rvList" style="max-width:180px"><input id="vNo" placeholder="رقم الفاتورة" data-i="rvList" style="max-width:160px"><select id="vBr" data-c="rvList" style="max-width:200px"><option value="">كل الفروع</option>${BR.map(b=>`<option>${b}</option>`).join('')}</select></div><div class="ttl" id="vSum" style="font-size:15px;margin-top:8px"></div><div id="vList"></div></div><div id="vDet"></div>`);
  rvList();
};
C.rvList=rvList;I.rvList=rvList;
function rvList(){
  const day=$('vDay').value,q=norm(dg($('vNo').value)),br=$('vBr').value;
  let l=q?D.sales.filter(d=>String(d.no)===String(parseInt(q,10))):D.sales.filter(d=>d.day===day&&(!br||d.br===br));
  l=l.slice().sort((a,b)=>b.ts-a.ts);
  const sl=l.filter(d=>d.type==='sale'),rt=l.filter(d=>d.type==='return');
  const st=r2(sl.reduce((s,d)=>s+d.total,0)),rv=r2(rt.reduce((s,d)=>s+d.total,0));
  $('vSum').textContent=`مبيعات: ${money(st)} — مرتجعات: ${money(-rv)} — الصافي: ${money(st+rv)} — عدد الفواتير: ${sl.length}`;
  $('vList').innerHTML=l.length?tbl(['#','الوقت','الفرع','نقطة البيع','المستخدم','الدفع','الإجمالي','الحالة'],l.slice(0,200).map(d=>{
    const rq=(d.ret||[]).reduce((a,b)=>a+b,0),tq=d.lines.reduce((a,x)=>a+x.qty,0);
    const tag=d.type==='return'?'<span class="badge b-cancel">مرتجع</span>':(rq>0?`<span class="badge b-draft">${rq>=tq?'مرتجع كلي':'مرتجع جزئي'}</span>`:'');
    return `<tr class="clk" data-a="rvOpen" data-no="${d.no}"><td>${pno(d.no)}</td><td>${esc(d.dt.slice(-8))}</td><td>${esc(d.br)}</td><td>${esc(d.pos||'')}</td><td>${esc(d.user)}</td><td>${esc(d.method)}</td><td><b>${money(d.total)}</b></td><td>${tag}</td></tr>`}).join('')):'<div class="mut">لا توجد فواتير</div>';
}
A.rvOpen=t=>{
  const d=D.sales.find(x=>String(x.no)===t.dataset.no);if(!d)return;RV.doc=d;
  const left=d.type==='sale'&&can('pos_return')&&d.lines.some((l,i)=>r2(l.qty-(d.ret[i]||0))>0);
  $('vDet').innerHTML=`<div class="card">${rcptDiv(d)}<div id="vRet"></div><div class="row"><button class="f p" data-a="rvPrint">🖨️ طباعة</button>${left?'<button class="f" data-a="rvRetForm">↩️ مرتجع</button>':''}</div></div>`;
  $('vDet').scrollIntoView({behavior:'smooth'});
};
A.rvPrint=()=>printDoc(RV.doc);
A.rvRetForm=()=>{
  const d=RV.doc;
  $('vRet').innerHTML=`<div class="mut">اكتب الكمية المرتجعة لكل صنف</div>${tbl(['الصنف','المتاح للإرجاع','الكمية المرتجعة'],d.lines.map((l,i)=>{const av=r2(l.qty-(d.ret[i]||0));return av<=0?'':`<tr><td class="l">${esc(l.n)}</td><td>${fmt(av)}</td><td><input inputmode="decimal" value="0" data-q="${i}" data-av="${av}"></td></tr>`}).join(''))}<div class="row" style="margin:8px 0"><button class="f p" data-a="rvRetOk">تأكيد المرتجع</button></div>`;
};
A.rvRetOk=async()=>{
  const d=RV.doc;if(!d)return;const q={};let any=false,bad=false;
  document.querySelectorAll('#vRet input[data-q]').forEach(i=>{const v=num(i.value);if(isNaN(v)||v<0||v>+i.dataset.av)bad=true;else if(v>0){q[+i.dataset.q]=v;any=true}});
  if(bad){say('كمية مرتجعة غير صحيحة',1);return}if(!any){say('اكتب كمية للإرجاع',1);return}
  const s=(d.session&&D.sessions.find(x=>x.id===d.session&&x.status==='open'))||D.sessions.find(x=>x.status==='open'&&x.br===d.br);
  if(!s){say('لا توجد جلسة مفتوحة في هذا الفرع لتسجيل المرتجع عليها',1);return}
  const lines=[];Object.keys(q).forEach(i=>{const l=d.lines[i];lines.push({id:l.id,n:l.n,b:l.b,price:l.price,cost:l.cost,cat:l.cat,qty:q[i]});d.ret[i]=r3((d.ret[i]||0)+q[i]);addStk(d.br,l.id,q[i])});
  const tot=-r2(lines.reduce((x,l)=>x+l.price*l.qty,0)),now=new Date();
  const doc={no:++D.cnt.sale,type:'return',ts:now.getTime(),dt:nowStr(now),day:dayStr(now),br:d.br,pos:s.pos,session:s.id,user:ME.name,lines,total:tot,paid:tot,method:d.method,ref:d.no};
  D.sales.push(doc);save('sales','stock','cnt');await flush();saveSes(doc.session);if(d.session!==doc.session)saveSes(d.session);
  say('تم تسجيل المرتجع رقم '+pno(doc.no));rvList();A.rvOpen({dataset:{no:String(doc.no)}});
};
