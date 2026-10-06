// js/promotions.js
let editPromoId=null;

async function loadPromotions() {
  document.getElementById('promo-body').innerHTML=`<tr><td colspan="9">${spinnerEl()}</td></tr>`;
  try {
    const r=await api.promotions.list();
    const tb=document.getElementById('promo-body');
    if(!r.data.length){ tb.innerHTML=`<tr><td colspan="9">${emptyEl('🏷️','No promotions','Create your first offer')}</td></tr>`; return; }
    tb.innerHTML=r.data.map(p=>{
      const exp=new Date(p.expiresAt)<new Date(), active=p.active&&!exp;
      return `<tr>
        <td><span style="font-family:monospace;background:var(--gold-bg);color:var(--gold);padding:.18rem .6rem;border-radius:4px;font-weight:700">${p.code}</span></td>
        <td style="color:var(--text2);font-size:.83rem">${p.description||'—'}</td>
        <td><span class="badge ${p.type==='percentage'?'b-info':'b-gold'}">${p.type}</span></td>
        <td style="font-weight:600">${p.type==='percentage'?p.value+'%':curr(p.value)}</td>
        <td>${p.minOrderAmount>0?curr(p.minOrderAmount):'None'}</td>
        <td style="font-size:.82rem">${fdate(p.expiresAt)}</td>
        <td>${p.usedCount}${p.usageLimit?` / ${p.usageLimit}`:''}</td>
        <td><span class="badge ${active?'b-success':'b-danger'}">${active?'Active':exp?'Expired':'Inactive'}</span></td>
        <td><div style="display:flex;gap:.35rem">
          <button class="btn btn-sec btn-xs btn-ico" onclick="openEditPromo('${p._id}')">✏️</button>
          <button class="btn btn-danger btn-xs btn-ico" onclick="delPromo('${p._id}','${p.code}')">🗑</button>
        </div></td>
      </tr>`;
    }).join('');
  } catch(e){ toast(e.message,'error'); }
}

function openAddPromo() {
  editPromoId=null;
  document.getElementById('promo-modal-title').textContent='Create Promotion';
  ['pf-code','pf-desc','pf-val','pf-min','pf-max','pf-limit','pf-exp'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('pf-type').value='percentage';
  document.getElementById('pf-active').value='true';
  document.getElementById('pf-min').value='0';
  openM('promo-overlay');
}

async function openEditPromo(id) {
  editPromoId=id;
  document.getElementById('promo-modal-title').textContent='Edit Promotion';
  try {
    const r=await api.promotions.list();
    const p=r.data.find(x=>x._id===id);
    if(!p) return toast('Not found','error');
    document.getElementById('pf-code').value  =p.code;
    document.getElementById('pf-desc').value  =p.description||'';
    document.getElementById('pf-type').value  =p.type;
    document.getElementById('pf-val').value   =p.value;
    document.getElementById('pf-min').value   =p.minOrderAmount||0;
    document.getElementById('pf-max').value   =p.maxDiscount||'';
    document.getElementById('pf-limit').value =p.usageLimit||'';
    document.getElementById('pf-exp').value   =p.expiresAt?p.expiresAt.slice(0,10):'';
    document.getElementById('pf-active').value=String(p.active);
    openM('promo-overlay');
  } catch(e){ toast(e.message,'error'); }
}

function validatePromoForm() {
  let ok=true;
  ok=!setErr('pf-code','pf-code-err',!document.getElementById('pf-code').value.trim())&&ok;
  ok=!setErr('pf-val','pf-val-err',!(+document.getElementById('pf-val').value>0))&&ok;
  const exp=document.getElementById('pf-exp').value;
  ok=!setErr('pf-exp','pf-exp-err',!exp||new Date(exp)<=new Date())&&ok;
  return ok;
}

async function savePromo() {
  if(!validatePromoForm()) return;
  const data={code:document.getElementById('pf-code').value.trim().toUpperCase(),description:document.getElementById('pf-desc').value.trim(),type:document.getElementById('pf-type').value,value:parseFloat(document.getElementById('pf-val').value),minOrderAmount:parseFloat(document.getElementById('pf-min').value)||0,maxDiscount:parseFloat(document.getElementById('pf-max').value)||null,usageLimit:parseInt(document.getElementById('pf-limit').value)||null,expiresAt:document.getElementById('pf-exp').value,active:document.getElementById('pf-active').value==='true'};
  const btn=document.getElementById('promo-save-btn'); btn.disabled=true; btn.textContent='Saving…';
  try {
    if(editPromoId){await api.promotions.update(editPromoId,data);toast('Promo updated!','success');}
    else           {await api.promotions.create(data);             toast('Promo created!','success');}
    closeM('promo-overlay'); loadPromotions();
  } catch(e){ toast(e.message,'error'); }
  finally{ btn.disabled=false; btn.textContent='Save Promo'; }
}

async function delPromo(id,code) {
  if(!await confirm$(`Delete promotion "${code}"?`)) return;
  try{ await api.promotions.del(id); toast('Deleted','success'); loadPromotions(); }
  catch(e){ toast(e.message,'error'); }
}


// ============================================================
// ANALYTICS
// ============================================================
let aCharts={};

async function loadAnalytics() {
  document.getElementById('analytics-body').innerHTML=spinnerEl();
  try {
    const [bs,cat,tc,monthly]=await Promise.all([api.analytics.bestsellers(),api.analytics.category(),api.analytics.topCustomers(),api.analytics.monthly()]);
    document.getElementById('analytics-body').innerHTML=`
      <div class="chart-grid2" style="margin-bottom:1.1rem">
        <div class="chart-card"><h3>🏆 Best Selling Cakes</h3><div style="height:270px"><canvas id="ac-best"></canvas></div></div>
        <div class="chart-card"><h3>🍰 Revenue by Category</h3><div style="height:270px"><canvas id="ac-cat"></canvas></div></div>
      </div>
      <div class="chart-grid2">
        <div class="chart-card"><h3>📈 Monthly Revenue Trend</h3><div style="height:235px"><canvas id="ac-monthly"></canvas></div></div>
        <div class="chart-card"><h3>🌟 Top Customers</h3><div id="ac-top"></div></div>
      </div>`;

    if(aCharts.best) aCharts.best.destroy();
    aCharts.best=new Chart(document.getElementById('ac-best').getContext('2d'),{
      type:'bar',
      data:{labels:bs.data.map(c=>c.name),datasets:[{label:'Sold',data:bs.data.map(c=>c.totalSold),backgroundColor:['rgba(201,168,76,.7)','rgba(139,38,53,.7)','rgba(96,176,224,.7)','rgba(82,201,125,.7)','rgba(240,168,74,.7)','rgba(167,139,250,.7)','rgba(240,98,146,.7)'],borderRadius:5}]},
      options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#a0907a'}},y:{grid:{display:false},ticks:{color:'#f0e6d3',font:{size:11}}}}}
    });

    if(aCharts.cat) aCharts.cat.destroy();
    aCharts.cat=new Chart(document.getElementById('ac-cat').getContext('2d'),{
      type:'doughnut',
      data:{labels:cat.data.map(d=>d._id||'Other'),datasets:[{data:cat.data.map(d=>d.rev),backgroundColor:['#c9a84c','#8b2635','#5ba3d4','#4caf7d','#e8a045','#a78bfa','#f06292'],borderWidth:0,hoverOffset:8}]},
      options:{responsive:true,maintainAspectRatio:false,cutout:'62%',plugins:{legend:{position:'bottom',labels:{color:'#a0907a',padding:10,font:{size:11}}},tooltip:{callbacks:{label:ctx=>` ${ctx.label}: ₹${(+ctx.raw).toFixed(0)}`}}}}
    });

    const mn=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if(aCharts.monthly) aCharts.monthly.destroy();
    aCharts.monthly=new Chart(document.getElementById('ac-monthly').getContext('2d'),{
      type:'line',
      data:{labels:monthly.data.map(d=>mn[d._id.m-1]),datasets:[{label:'Revenue',data:monthly.data.map(d=>d.rev),borderColor:'#c9a84c',backgroundColor:'rgba(201,168,76,.1)',borderWidth:2,fill:true,tension:.4,pointRadius:4,pointBackgroundColor:'#c9a84c'}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#a0907a'}},y:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#a0907a',callback:v=>'₹'+abbr(v)}}}}
    });

    document.getElementById('ac-top').innerHTML=tc.data.map((c,i)=>`
      <div style="display:flex;align-items:center;gap:.75rem;padding:.55rem 0;border-bottom:1px solid var(--border)">
        <span style="width:22px;height:22px;border-radius:50%;background:var(--gold-bg);color:var(--gold);display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:700;flex-shrink:0">${i+1}</span>
        <div style="flex:1"><div style="font-size:.875rem;color:var(--text)">${c.name}</div><div style="font-size:.72rem;color:var(--text2)">${c.totalOrders} orders</div></div>
        <div style="color:var(--gold);font-weight:600;font-size:.875rem">${curr(c.totalSpent)}</div>
      </div>`).join('')||emptyEl('👥','No data yet');

  } catch(e){ document.getElementById('analytics-body').innerHTML=`<p style="color:var(--danger);padding:1rem">❌ ${e.message}</p>`; }
}
