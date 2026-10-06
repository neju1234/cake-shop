// ============================================================
// js/utils.js  — MUST be the FIRST script loaded
// Defines BACKEND_URL used by ALL other JS files
// ============================================================

// ══════════════════════════════════════════════════════════════
//  BACKEND URL — change only this one line if port changes
// ══════════════════════════════════════════════════════════════
const BACKEND_URL = 'http://localhost:5000';

// ── Toast ─────────────────────────────────────────────────────
function toast(msg, type='info') {
  const icons = { success:'✅', error:'❌', info:'ℹ️', warning:'⚠️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ── Modal ─────────────────────────────────────────────────────
function openM(id)  { document.getElementById(id)?.classList.add('open');    document.body.style.overflow = 'hidden'; }
function closeM(id) { document.getElementById(id)?.classList.remove('open'); document.body.style.overflow = ''; }

document.addEventListener('click', e => {
  if (e.target.classList.contains('overlay')) {
    e.target.classList.remove('open');
    document.body.style.overflow = '';
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.overlay.open').forEach(o => {
      o.classList.remove('open');
      document.body.style.overflow = '';
    });
  }
});

// ── Confirm dialog ─────────────────────────────────────────────
function confirm$(msg) {
  return new Promise(res => {
    document.getElementById('confirm-msg').textContent = msg;
    openM('confirm-overlay');
    const yes = document.getElementById('conf-yes');
    const no  = document.getElementById('conf-no');
    const done = v => {
      closeM('confirm-overlay');
      yes.removeEventListener('click', onY);
      no.removeEventListener('click',  onN);
      res(v);
    };
    const onY = () => done(true);
    const onN = () => done(false);
    yes.addEventListener('click', onY);
    no.addEventListener('click',  onN);
  });
}

// ── Formatters ────────────────────────────────────────────────
const curr  = n => '₹' + (+n||0).toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 });
const fdate = d => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const fdtm  = d => d ? new Date(d).toLocaleString('en-IN',     { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
const abbr  = n => n >= 1e6 ? (n/1e6).toFixed(1)+'M' : n >= 1e3 ? (n/1e3).toFixed(1)+'K' : String(Math.round(n));

function statusBadge(s) {
  const m = { pending:'b-warning', confirmed:'b-info', preparing:'b-info', ready:'b-gold', delivered:'b-success', cancelled:'b-danger' };
  return `<span class="badge ${m[s]||'b-muted'}">${s}</span>`;
}
function aTags(arr=[]) { return arr.map(a => `<span class="a-tag">⚠ ${a}</span>`).join(' '); }
function spinnerEl()   { return `<div class="loading"><div class="spin"></div><span>Loading…</span></div>`; }
function skeletonStats(n=4) { return `<div class="stats">${'<div class="skeleton skel-stat"></div>'.repeat(n)}</div>`; }
function emptyEl(icon, title, desc='') { return `<div class="empty"><div class="ei">${icon}</div><h3>${title}</h3><p>${desc}</p></div>`; }
function dbounce(fn, ms) { let t; return function(...a) { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
function showErr(id, show=true) { document.getElementById(id)?.classList.toggle('show', show); }
function setErr(fId, eId, cond) { document.getElementById(fId)?.classList.toggle('err', cond); showErr(eId, cond); return cond; }

// ══════════════════════════════════════════════════════════════
// IMAGE TAG — builds correct URL from stored path
// cake.image is stored in MongoDB as: "/uploads/cake-123.jpg"
// Full URL = BACKEND_URL + cake.image
//          = "http://localhost:5000/uploads/cake-123.jpg"
// This works after EVERY restart as long as backend is running
// ══════════════════════════════════════════════════════════════
function imgTag(cake, cls='') {
  if (cake && cake.image) {
    const url = BACKEND_URL + cake.image;
    return `<img
      src="${url}"
      alt="${cake.name || 'cake'}"
      style="width:100%;height:100%;object-fit:cover;display:block"
      onerror="this.outerHTML='<div style=\'display:flex;align-items:center;justify-content:center;height:100%;font-size:3rem;background:var(--surface)\'>🎂</div>'"
    >`;
  }
  return '🎂';
}

// ── Drag & Drop image ──────────────────────────────────────────
function doDragOver(e) { e.preventDefault(); document.getElementById('drop-zone')?.classList.add('drag'); }
function doDrop(e) {
  e.preventDefault();
  document.getElementById('drop-zone')?.classList.remove('drag');
  const f = e.dataTransfer?.files[0];
  if (f) setImagePreview(f);
}
function setImagePreview(file) {
  if (file.size > 5 * 1024 * 1024) { showErr('cf-img-err', true); toast('Image too large (max 5MB)', 'error'); return; }
  showErr('cf-img-err', false);
  const r = new FileReader();
  r.onload = ev => { const p = document.getElementById('img-preview'); if (p) { p.src = ev.target.result; p.style.display = 'block'; } };
  r.readAsDataURL(file);
  try { const dt = new DataTransfer(); dt.items.add(file); document.getElementById('cf-img').files = dt.files; } catch(e) {}
}
