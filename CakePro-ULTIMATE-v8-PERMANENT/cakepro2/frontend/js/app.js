// js/app.js — Router, auth, theme, exports
const PAGES={
  dashboard: {title:'Dashboard',     sub:'Overview of your bakery',         load:loadDashboard},
  cakes:     {title:'Cake Catalogue', sub:'Manage your cake menu',           load:loadCakes},
  orders:    {title:'Orders',         sub:'Track and manage all orders',     load:loadOrders},
  customers: {title:'Customers',      sub:'Customer directory',              load:loadCustomers},
  analytics: {title:'Analytics',      sub:'Sales trends & revenue insights', load:loadAnalytics},
  reports:   {title:'Sales Reports',  sub:'Generate detailed reports',       load:()=>{}},
  promotions:{title:'Promotions',     sub:'Discount codes & offers',         load:loadPromotions}
};

function go(page) {
  if(!PAGES[page]) return;
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById(`page-${page}`)?.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.page===page));
  document.getElementById('page-title').textContent=PAGES[page].title;
  document.getElementById('page-sub').textContent  =PAGES[page].sub;
  PAGES[page].load();
  if(window.innerWidth<=768) closeSidebar();
}

async function doLogin() {
  const u=document.getElementById('lu').value.trim(), p=document.getElementById('lp').value;
  let ok=true;
  if(!u){document.getElementById('lu').classList.add('err');showErr('lu-err',true);ok=false;}
  else  {document.getElementById('lu').classList.remove('err');showErr('lu-err',false);}
  if(!p){document.getElementById('lp').classList.add('err');showErr('lp-err',true);ok=false;}
  else  {document.getElementById('lp').classList.remove('err');showErr('lp-err',false);}
  if(!ok) return;

  const btn=document.getElementById('login-btn'); btn.disabled=true; btn.textContent='Signing in…';
  document.getElementById('login-alert').innerHTML='';
  try {
    const r=await api.auth.login(u,p);
    showApp(r.admin?.name||'Admin');
  } catch(e){
    document.getElementById('login-alert').innerHTML=`<div style="padding:.75rem;background:rgba(224,85,101,.12);border:1px solid rgba(224,85,101,.35);border-radius:8px;color:var(--danger);font-size:.875rem;margin-bottom:1rem">❌ ${e.message}</div>`;
  } finally{ btn.disabled=false; btn.textContent='Sign In →'; }
}

async function doLogout() {
  await api.auth.logout();
  document.getElementById('app').style.display='none';
  document.getElementById('login-page').style.display='flex';
  document.getElementById('lu').value=''; document.getElementById('lp').value='';
}

function showApp(name) {
  document.getElementById('login-page').style.display='none';
  document.getElementById('app').style.display='flex';
  document.getElementById('top-avatar').textContent=(name||'A').charAt(0).toUpperCase();
  go('dashboard'); refreshBadge();
}

async function refreshBadge() {
  try {
    const r=await api.orders.list({status:'pending'});
    const b=document.getElementById('nb-pending');
    b.textContent=r.count; b.style.display=r.count>0?'inline-flex':'none';
  } catch(e){}
  setTimeout(refreshBadge,60000);
}

function toggleSidebar() {
  const sb=document.getElementById('sidebar');
  if(sb.classList.contains('open')) closeSidebar();
  else{ sb.classList.add('open'); document.getElementById('sb-overlay').style.display='block'; document.body.style.overflow='hidden'; }
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sb-overlay').style.display='none';
  document.body.style.overflow='';
}

function toggleTheme() {
  document.body.classList.toggle('light');
  const isLight=document.body.classList.contains('light');
  localStorage.setItem('cakepro-theme',isLight?'light':'dark');
  document.getElementById('theme-btn').textContent=isLight?'🌙':'☀️';
}
function applyTheme() {
  if(localStorage.getItem('cakepro-theme')==='light'){
    document.body.classList.add('light');
    const btn=document.getElementById('theme-btn'); if(btn) btn.textContent='🌙';
  }
}
function showDate() {
  const el=document.getElementById('top-date');
  if(el) el.textContent=new Date().toLocaleDateString('en-IN',{weekday:'short',day:'2-digit',month:'short',year:'numeric'});
}

// Export helpers — token passed in URL for window.open
function exportOrders(fmt) {
  const p=new URLSearchParams({token:getToken()});
  const st=document.getElementById('ord-status')?.value;
  const f=document.getElementById('ord-from')?.value;
  const t=document.getElementById('ord-to')?.value;
  if(st) p.set('status',st); if(f) p.set('startDate',f); if(t) p.set('endDate',t);
  window.open(`${BACKEND_URL}/api/export/${fmt}/orders?${p}`,'_blank');
}
function exportCakes(fmt)     { window.open(`${BACKEND_URL}/api/export/${fmt}/cakes?token=${getToken()}`,'_blank'); }
function exportCustomersCSV() { window.open(`${BACKEND_URL}/api/export/csv/customers?token=${getToken()}`,'_blank'); }

async function init() {
  applyTheme(); showDate();
  document.getElementById('cf-img')?.addEventListener('change',function(){
    const f=this.files[0]; if(!f) return;
    if(f.size>2*1024*1024){showErr('cf-img-err',true);return;}
    setImagePreview(f); showErr('cf-img-err',false);
  });
  ['lu','lp'].forEach(id=>document.getElementById(id)?.addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();}));
  const r=await api.auth.me();
  if(r.loggedIn){ showApp(r.name); return; }
  document.getElementById('login-page').style.display='flex';
  document.getElementById('app').style.display='none';
}

init();
