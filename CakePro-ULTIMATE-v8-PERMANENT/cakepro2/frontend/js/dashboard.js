// js/dashboard.js
let mChart=null, dChart=null;

async function loadDashboard() {
  const el=document.getElementById('dash-body');
  el.innerHTML=skeletonStats(6)+`<div class="chart-grid"><div class="skeleton skel-chart"></div><div class="skeleton skel-chart"></div></div>`;
  try {
    const [sum,monthly,daily]=await Promise.all([api.dashboard.summary(),api.analytics.monthly(),api.analytics.daily()]);
    const d=sum.data;
    el.innerHTML=`
      <div class="stats" id="stat-cards"></div>
      <div class="chart-grid">
        <div class="chart-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.1rem">
            <h3>📈 Monthly Revenue</h3><span style="font-size:.73rem;color:var(--text2)">Last 12 months</span>
          </div>
          <div style="height:255px"><canvas id="mchart"></canvas></div>
        </div>
        <div class="chart-card"><h3>🏆 Top Cakes by Sales</h3><div id="top-cakes-list"></div></div>
      </div>
      <div class="chart-grid2">
        <div class="chart-card"><h3>📊 Daily Sales (30 days)</h3><div style="height:220px"><canvas id="dchart"></canvas></div></div>
        <div class="chart-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.1rem">
            <h3>🕐 Recent Orders</h3><button class="btn btn-ghost btn-sm" onclick="go('orders')">View all →</button>
          </div>
          <div id="recent-orders-list"></div>
        </div>
      </div>`;

    const stats=[
      {icon:'💰',label:'Total Revenue',   val:curr(d.totalRevenue), cls:'gold',  sub:`${curr(d.monthRevenue)} this month`},
      {icon:'📦',label:'Total Orders',    val:d.totalOrders,        cls:'red',   sub:`${d.monthOrders} this month`},
      {icon:'👥',label:'Customers',       val:d.totalCustomers,     cls:'blue',  sub:'Registered'},
      {icon:'🎂',label:'Total Cakes',     val:d.totalCakes,         cls:'green', sub:'In catalogue'},
      {icon:'📅',label:"Today's Revenue", val:curr(d.todayRevenue), cls:'gold',  sub:`${d.todayOrders} orders today`},
      {icon:'⏳',label:'Pending Orders',  val:d.pendingCount,       cls:'red',   sub:'Awaiting action'},
    ];
    document.getElementById('stat-cards').innerHTML=stats.map(s=>`
      <div class="stat ${s.cls}">
        <div class="stat-ico">${s.icon}</div>
        <div class="stat-val">${s.val}</div>
        <div class="stat-lbl">${s.label}</div>
        <div class="stat-sub">${s.sub}</div>
      </div>`).join('');

    buildMChart(monthly.data); buildDChart(daily.data);

    const tc=document.getElementById('top-cakes-list');
    const max=d.topCakes?.[0]?.totalSold||1;
    tc.innerHTML=(d.topCakes||[]).map(c=>`
      <div style="margin-bottom:.85rem">
        <div style="display:flex;justify-content:space-between;margin-bottom:.28rem">
          <span style="font-size:.83rem;color:var(--text)">${c.name}</span>
          <span style="font-size:.78rem;color:var(--text2)">${c.totalSold} sold</span>
        </div>
        <div class="prog-wrap"><div class="prog" style="width:${(c.totalSold/max*100).toFixed(0)}%"></div></div>
      </div>`).join('')||emptyEl('🎂','No data yet');

    const ro=document.getElementById('recent-orders-list');
    ro.innerHTML=(d.recentOrders||[]).length?`
      <table class="tbl" style="font-size:.8rem">
        <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>${(d.recentOrders).map(o=>`
          <tr>
            <td style="color:var(--gold);font-weight:700">${o.orderNumber}</td>
            <td>${o.customerName||'—'}</td>
            <td>${curr(o.total)}</td>
            <td>${statusBadge(o.status)}</td>
          </tr>`).join('')}
        </tbody>
      </table>`:emptyEl('📦','No orders yet');

  } catch(e){ document.getElementById('dash-body').innerHTML=`<div style="padding:1rem;color:var(--danger)">❌ ${e.message}</div>`; }
}

function buildMChart(data) {
  const mn=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  if(mChart) mChart.destroy();
  mChart=new Chart(document.getElementById('mchart').getContext('2d'),{
    type:'bar',
    data:{labels:data.map(d=>`${mn[d._id.m-1]} ${d._id.y}`),datasets:[{label:'Revenue',data:data.map(d=>d.rev),backgroundColor:'rgba(201,168,76,.3)',borderColor:'#c9a84c',borderWidth:2,borderRadius:6,borderSkipped:false}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#a0907a',font:{size:11}}},y:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#a0907a',callback:v=>'₹'+abbr(v)}}}}
  });
}
function buildDChart(data) {
  if(dChart) dChart.destroy();
  dChart=new Chart(document.getElementById('dchart').getContext('2d'),{
    type:'line',
    data:{labels:data.map(d=>`${d._id.d}/${d._id.m}`),datasets:[{label:'Revenue',data:data.map(d=>d.rev),borderColor:'#8b2635',backgroundColor:'rgba(139,38,53,.12)',borderWidth:2,pointRadius:3,fill:true,tension:.4}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#a0907a',maxTicksLimit:10,font:{size:10}}},y:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#a0907a',callback:v=>'₹'+abbr(v)}}}}
  });
}
