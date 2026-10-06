// js/orders.js — Orders, Bill, Print A4, Thermal Receipt
'use strict';

let orderItems = [], promoDisc = 0, promoCode = '';
let _currentBillOrder = null;

// Shop info — update these to match your shop
const SHOP = {
  name:    'CakePro Bakery',
  tagline: 'Premium Bakery & Confectionery',
  address: '42, MG Road, Kochi, Kerala - 682016',
  phone:   '9876543210',
  email:   'admin@cakepro.com',
  gst:     'GST: 32ABCDE1234F1Z5',
  upi:     'cakepro@upi'          // ← UPI ID shown on thermal receipt
};

const statusEmoji = s => ({ pending:'⏳', confirmed:'✅', preparing:'👨‍🍳', ready:'📦', delivered:'🚚', cancelled:'❌' }[s] || '');

function payBadge(m) {
  const map = { cash:{icon:'💵',cls:'b-success',label:'Cash'}, card:{icon:'💳',cls:'b-info',label:'Card'}, upi:{icon:'📱',cls:'b-gold',label:'UPI'}, online:{icon:'🌐',cls:'b-warning',label:'Online'} };
  const c = map[m] || { icon:'💰', cls:'b-muted', label: m };
  return `<span class="badge ${c.cls}">${c.icon} ${c.label}</span>`;
}

// ══════════════════════════════════════════════════════════════
// LOAD & RENDER ORDERS
// ══════════════════════════════════════════════════════════════
async function loadOrders() {
  const q = {};
  const s = document.getElementById('ord-status')?.value; if (s) q.status    = s;
  const f = document.getElementById('ord-from')?.value;   if (f) q.startDate = f;
  const t = document.getElementById('ord-to')?.value;     if (t) q.endDate   = t;
  document.getElementById('ord-body').innerHTML = `<tr><td colspan="10">${spinnerEl()}</td></tr>`;
  try {
    const r = await api.orders.list(q);
    document.getElementById('ord-cnt').textContent = `${r.count} orders`;
    renderOrders(r.data);
  } catch(e) { toast(e.message, 'error'); }
}

function renderOrders(orders) {
  const tb = document.getElementById('ord-body');
  if (!orders.length) { tb.innerHTML = `<tr><td colspan="10">${emptyEl('📦','No orders','Create your first order')}</td></tr>`; return; }
  tb.innerHTML = orders.map(o => `
    <tr>
      <td style="color:var(--gold);font-weight:700">${o.orderNumber}</td>
      <td>
        <div style="font-weight:500">${o.customer?.name || o.customerName || '—'}</div>
        <div style="font-size:.75rem;color:var(--text2)">${o.customer?.phone || ''}</div>
      </td>
      <td style="font-size:.8rem;color:var(--text2);max-width:160px">${o.items.map(i=>`${i.cakeName} <b>×${i.quantity}</b>`).join('<br>')}</td>
      <td>${curr(o.subtotal)}</td>
      <td>${o.totalDiscount > 0 ? `<span style="color:var(--success);font-weight:600">-${curr(o.totalDiscount)}</span>` : '<span style="color:var(--text3)">—</span>'}</td>
      <td style="font-weight:700;color:var(--cream)">${curr(o.total)}</td>
      <td>${payBadge(o.paymentMethod)}</td>
      <td>
        <select class="fc" style="padding:.3rem .5rem;font-size:.78rem;width:auto;min-width:110px"
          onchange="changeStatus('${o._id}',this.value)">
          ${['pending','confirmed','preparing','ready','delivered','cancelled']
            .map(s => `<option value="${s}" ${o.status===s?'selected':''}>${statusEmoji(s)} ${s}</option>`).join('')}
        </select>
      </td>
      <td style="font-size:.78rem;color:var(--text2)">${fdate(o.createdAt)}</td>
      <td>
        <div style="display:flex;gap:.3rem">
          <button class="btn btn-primary btn-xs" onclick="showBill('${o._id}')">🧾 Bill</button>
          <button class="btn btn-danger btn-xs btn-ico" onclick="delOrder('${o._id}','${o.orderNumber}')">🗑</button>
        </div>
      </td>
    </tr>`).join('');
}

async function changeStatus(id, status) {
  try { await api.orders.status(id, status); toast(`Status → ${status}`, 'success'); }
  catch(e) { toast(e.message, 'error'); loadOrders(); }
}
async function delOrder(id, num) {
  if (!await confirm$(`Delete order ${num}?`)) return;
  try { await api.orders.del(id); toast('Order deleted','success'); loadOrders(); }
  catch(e) { toast(e.message, 'error'); }
}
function resetOrdFilters() {
  ['ord-status','ord-from','ord-to'].forEach(id => { const e=document.getElementById(id); if(e) e.value=''; });
  loadOrders();
}

// ══════════════════════════════════════════════════════════════
// BILL / INVOICE — A4 Print
// ══════════════════════════════════════════════════════════════
async function showBill(id) {
  document.getElementById('invoice-body').innerHTML = spinnerEl();
  openM('invoice-overlay');
  try {
    const r = await api.orders.get(id);
    _currentBillOrder = r.data;
    document.getElementById('invoice-body').innerHTML = buildBillHTML(r.data);
  } catch(e) { toast(e.message, 'error'); closeM('invoice-overlay'); }
}

function buildBillHTML(o) {
  const cust  = o.customer || {};
  const items = o.items   || [];

  const payMap = {
    cash:   { icon:'💵', label:'Cash Payment',   color:'#2e7d52' },
    card:   { icon:'💳', label:'Card Payment',   color:'#1565c0' },
    upi:    { icon:'📱', label:'UPI Payment',    color:'#6a1b9a' },
    online: { icon:'🌐', label:'Online Payment', color:'#e65100' }
  };
  const payInfo = payMap[o.paymentMethod] || { icon:'💰', label:'Payment', color:'#555' };

  const statusColors = { delivered:'#2e7d52', cancelled:'#c62828', pending:'#e65100', confirmed:'#1565c0', preparing:'#6a1b9a', ready:'#f57f17' };
  const statusColor  = statusColors[o.status] || '#555';

  const itemRows = items.map((it, i) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f0e8dc;color:#666">${i+1}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0e8dc">
        <div style="font-weight:600;color:#1a0a0a">${it.cakeName}</div>
        <div style="font-size:.78rem;color:#888">${it.category || ''}</div>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0e8dc;text-align:center">${it.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0e8dc;text-align:right">₹${(+it.unitPrice).toFixed(2)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0e8dc;text-align:center;color:#e67e22">${it.discount ? it.discount+'%' : '—'}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0e8dc;text-align:right;font-weight:600;color:#8b2635">₹${(+it.subtotal).toFixed(2)}</td>
    </tr>`).join('');

  // UPI section — only shows when payment method is UPI
  const upiHTML = o.paymentMethod === 'upi' ? `
    <div style="margin-top:16px;padding:14px;background:#f9f0ff;border-radius:10px;border:1px dashed #9c27b0;text-align:center">
      <div style="font-size:.72rem;color:#6a1b9a;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">📱 UPI Payment</div>
      <div style="background:#fff;border:2px solid #9c27b0;border-radius:8px;padding:12px;margin:0 auto 10px;max-width:140px">
        <div style="font-size:1.5rem;margin-bottom:4px">📱</div>
        <div style="font-size:.65rem;color:#6a1b9a;font-weight:700;word-break:break-all">${SHOP.upi}</div>
      </div>
      <div style="font-size:.82rem;color:#6a1b9a;font-weight:600">UPI ID: <strong>${SHOP.upi}</strong></div>
      <div style="font-size:.72rem;color:#999;margin-top:4px">Scan with PhonePe, GPay, Paytm or any UPI app</div>
    </div>` : '';

  return `
  <div id="bill-print-area" style="font-family:'Segoe UI',sans-serif;background:#fff;color:#1a1a1a;max-width:720px;margin:0 auto">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#8b2635,#c9541e);padding:26px 30px;border-radius:12px 12px 0 0;color:#fff">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
        <div>
          <div style="font-family:Georgia,serif;font-size:1.7rem;font-weight:700">🎂 ${SHOP.name}</div>
          <div style="font-size:.8rem;opacity:.85;margin-top:3px">${SHOP.tagline}</div>
          <div style="font-size:.75rem;opacity:.75;margin-top:8px;line-height:1.7">
            📍 ${SHOP.address}<br>
            📱 ${SHOP.phone} &nbsp;·&nbsp; ✉️ ${SHOP.email}<br>
            <span style="font-size:.7rem">${SHOP.gst}</span>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:.7rem;opacity:.8;text-transform:uppercase;letter-spacing:.1em">Tax Invoice</div>
          <div style="font-family:Georgia,serif;font-size:1.9rem;font-weight:700;color:#ffd54f;line-height:1.1">${o.orderNumber}</div>
          <div style="font-size:.78rem;opacity:.85;margin-top:5px">${fdtm(o.createdAt)}</div>
          <div style="margin-top:10px">
            <span style="background:${statusColor};padding:4px 14px;border-radius:20px;font-size:.72rem;font-weight:700">
              ${statusEmoji(o.status)} ${(o.status||'').toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Bill To / Payment -->
    <div style="display:grid;grid-template-columns:1fr 1fr;border:1px solid #e8d9c8;border-top:none">
      <div style="padding:16px 22px;border-right:1px solid #e8d9c8">
        <div style="font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#8b2635;margin-bottom:7px">Bill To</div>
        <div style="font-size:.95rem;font-weight:700;color:#1a0a0a;margin-bottom:3px">${cust.name || o.customerName || '—'}</div>
        ${cust.email  ? `<div style="font-size:.8rem;color:#555">✉️ ${cust.email}</div>` : ''}
        ${cust.phone  ? `<div style="font-size:.8rem;color:#555">📱 ${cust.phone}</div>` : ''}
        ${cust.address? `<div style="font-size:.8rem;color:#555;margin-top:3px">📍 ${cust.address}</div>` : ''}
      </div>
      <div style="padding:16px 22px">
        <div style="font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#8b2635;margin-bottom:7px">Payment Details</div>
        <div style="font-size:.95rem;font-weight:700;color:${payInfo.color};margin-bottom:3px">${payInfo.icon} ${payInfo.label}</div>
        ${o.deliveryDate ? `<div style="font-size:.8rem;color:#555;margin-top:5px">🚚 Delivery: <strong>${fdate(o.deliveryDate)}</strong></div>` : ''}
        ${o.notes       ? `<div style="font-size:.78rem;color:#777;margin-top:5px;font-style:italic">📝 ${o.notes}</div>` : ''}
      </div>
    </div>

    <!-- Items -->
    <div style="border:1px solid #e8d9c8;border-top:none">
      <table style="width:100%;border-collapse:collapse;font-size:.875rem">
        <thead>
          <tr style="background:#faf0e8">
            <th style="padding:9px 12px;text-align:left;color:#8b2635;font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;border-bottom:2px solid #8b2635">#</th>
            <th style="padding:9px 12px;text-align:left;color:#8b2635;font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;border-bottom:2px solid #8b2635">Item</th>
            <th style="padding:9px 12px;text-align:center;color:#8b2635;font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;border-bottom:2px solid #8b2635">Qty</th>
            <th style="padding:9px 12px;text-align:right;color:#8b2635;font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;border-bottom:2px solid #8b2635">Unit Price</th>
            <th style="padding:9px 12px;text-align:center;color:#8b2635;font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;border-bottom:2px solid #8b2635">Disc%</th>
            <th style="padding:9px 12px;text-align:right;color:#8b2635;font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;border-bottom:2px solid #8b2635">Amount</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
    </div>

    <!-- Totals + UPI -->
    <div style="display:grid;grid-template-columns:1fr 250px;border:1px solid #e8d9c8;border-top:none;border-radius:0 0 12px 12px;overflow:hidden">
      <div style="padding:18px 22px;background:#faf6f1;border-right:1px solid #e8d9c8">
        ${upiHTML}
        <div style="margin-top:${o.paymentMethod==='upi'?'14px':'0'}">
          <div style="font-size:.72rem;color:#999;text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px">Terms</div>
          <div style="font-size:.75rem;color:#777;line-height:1.8">
            • All sales are final<br>
            • Custom orders need 50% advance<br>
            • For queries: ${SHOP.phone}
          </div>
        </div>
      </div>
      <div style="padding:18px 22px;background:#fff">
        <table style="width:100%;border-collapse:collapse;font-size:.875rem">
          <tr><td style="padding:5px 0;color:#555">Subtotal</td><td style="padding:5px 0;text-align:right">₹${(+o.subtotal).toFixed(2)}</td></tr>
          ${o.promoDiscount > 0 ? `
          <tr>
            <td style="padding:5px 0;color:#2e7d52">Promo (${o.promoCode||''})</td>
            <td style="padding:5px 0;text-align:right;color:#2e7d52;font-weight:600">-₹${(+o.promoDiscount).toFixed(2)}</td>
          </tr>` : ''}
          <tr><td style="padding:5px 0;color:#555">GST (5%)</td><td style="padding:5px 0;text-align:right;color:#555">Inclusive</td></tr>
          <tr><td colspan="2" style="padding:3px 0"><div style="height:2px;background:linear-gradient(90deg,#8b2635,#c9a84c);border-radius:2px;margin:5px 0"></div></td></tr>
          <tr>
            <td style="padding:5px 0;font-size:1.05rem;font-weight:800;color:#8b2635;font-family:Georgia,serif">TOTAL</td>
            <td style="padding:5px 0;text-align:right;font-size:1.25rem;font-weight:800;color:#8b2635;font-family:Georgia,serif">₹${(+o.total).toFixed(2)}</td>
          </tr>
          <tr><td colspan="2" style="padding-top:7px">
            <div style="background:#faf0e8;border-radius:6px;padding:7px 10px;text-align:center;font-size:.75rem;color:#8b2635;font-weight:600">
              ${payInfo.icon} Paid via ${payInfo.label}
            </div>
          </td></tr>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:18px;padding:14px;background:#faf6f1;border-radius:10px;border:1px dashed #e8d9c8">
      <div style="font-size:.95rem;color:#8b2635;font-weight:700;font-family:Georgia,serif">🎂 Thank you for choosing ${SHOP.name}!</div>
      <div style="font-size:.75rem;color:#999;margin-top:5px">Computer-generated bill · No signature required<br>${SHOP.phone} · ${SHOP.email}</div>
      <div style="font-size:.68rem;color:#bbb;margin-top:6px">Bill # ${o.orderNumber} · ${new Date().toLocaleString('en-IN')}</div>
    </div>
  </div>`;
}

// ── Print A4 Bill ─────────────────────────────────────────────
function printBill() {
  const content = document.getElementById('bill-print-area');
  if (!content) { toast('No bill to print', 'warning'); return; }
  const orderNum = _currentBillOrder?.orderNumber || '';
  const html = content.outerHTML;
  const w = window.open('', '_blank', 'width=860,height=960,scrollbars=yes');
  w.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Bill - ${orderNum}</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:#f5ede0; padding:28px; font-family:'Segoe UI',sans-serif; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  @page { size:A4; margin:1cm; }
  @media print { body { background:#fff; padding:0; } .no-print { display:none !important; } }
  .bar { display:flex; gap:10px; justify-content:center; margin-bottom:20px; padding:14px; background:#fff; border-radius:10px; }
  .pb { padding:9px 22px; border:none; border-radius:7px; font-size:.9rem; font-weight:600; cursor:pointer; }
  .pp { background:#8b2635; color:#fff; }
  .pc { background:#f5f5f5; color:#555; }
</style>
</head>
<body>
<div class="bar no-print">
  <button class="pb pp" onclick="window.print()">🖨️ Print Bill</button>
  <button class="pb pc" onclick="window.close()">✕ Close</button>
</div>
${html}
</body>
</html>`);
  w.document.close();
}

// ── Thermal Receipt (80mm POS printer) ───────────────────────
function printThermal() {
  if (!_currentBillOrder) { toast('No bill loaded', 'warning'); return; }
  const o    = _currentBillOrder;
  const cust = o.customer || {};

  // Build items HTML as plain string (no template nesting issues)
  let itemsHTML = '';
  (o.items || []).forEach(it => {
    const discNote = it.discount ? ' (-' + it.discount + '%)' : '';
    itemsHTML += '<div style="margin-bottom:5px">';
    itemsHTML += '<div style="font-weight:bold">' + it.cakeName + '</div>';
    itemsHTML += '<div style="display:flex;justify-content:space-between;font-size:11px">';
    itemsHTML += '<span>' + it.quantity + ' x Rs.' + (+it.unitPrice).toFixed(2) + discNote + '</span>';
    itemsHTML += '<span style="font-weight:bold">Rs.' + (+it.subtotal).toFixed(2) + '</span>';
    itemsHTML += '</div></div>';
  });

  // Build promo line
  let promoHTML = '';
  if (o.promoDiscount > 0) {
    promoHTML = '<div style="display:flex;justify-content:space-between;margin:2px 0">'
      + '<span>Discount (' + (o.promoCode || '') + '):</span>'
      + '<span>-Rs.' + (+o.promoDiscount).toFixed(2) + '</span></div>';
  }

  // Build UPI line
  let upiHTML = '';
  if (o.paymentMethod === 'upi') {
    upiHTML = '<div style="margin:6px 0;text-align:center;color:#6a1b9a;font-size:12px">'
      + 'UPI ID: ' + SHOP.upi + '</div>'
      + '<div style="text-align:center;font-size:10px;color:#888">Pay via PhonePe, GPay or Paytm</div>';
  }

  const receiptHTML = `
    <div style="text-align:center;font-weight:bold;font-size:18px;margin-bottom:2px">CakePro Bakery</div>
    <div style="text-align:center;font-size:11px">${SHOP.address}</div>
    <div style="text-align:center;font-size:11px">Ph: ${SHOP.phone}</div>
    <div style="border-top:1px dashed #000;margin:6px 0"></div>

    <div style="text-align:center;font-weight:bold;font-size:15px">RECEIPT</div>
    <div style="display:flex;justify-content:space-between;margin:2px 0"><span>Bill No:</span><span style="font-weight:bold">${o.orderNumber}</span></div>
    <div style="display:flex;justify-content:space-between;margin:2px 0"><span>Date:</span><span>${fdate(o.createdAt)}</span></div>
    <div style="display:flex;justify-content:space-between;margin:2px 0"><span>Customer:</span><span style="font-weight:bold">${cust.name || o.customerName || ''}</span></div>
    ${cust.phone ? '<div style="display:flex;justify-content:space-between;margin:2px 0"><span>Phone:</span><span>' + cust.phone + '</span></div>' : ''}
    <div style="display:flex;justify-content:space-between;margin:2px 0"><span>Payment:</span><span style="font-weight:bold">${(o.paymentMethod||'').toUpperCase()}</span></div>
    ${upiHTML}

    <div style="border-top:1px dashed #000;margin:6px 0"></div>
    <div style="font-weight:bold;margin-bottom:5px">ITEMS</div>
    ${itemsHTML}
    <div style="border-top:1px dashed #000;margin:6px 0"></div>

    <div style="display:flex;justify-content:space-between;margin:2px 0"><span>Subtotal:</span><span>Rs.${(+o.subtotal).toFixed(2)}</span></div>
    ${promoHTML}
    <div style="display:flex;justify-content:space-between;border-top:2px solid #000;padding-top:4px;margin-top:4px;font-weight:bold;font-size:16px">
      <span>TOTAL:</span><span>Rs.${(+o.total).toFixed(2)}</span>
    </div>

    <div style="border-top:1px dashed #000;margin:6px 0"></div>
    <div style="text-align:center;font-size:11px;margin-top:8px">Thank you for your order!</div>
    <div style="text-align:center;font-size:11px">Visit again 🎂</div>
    <div style="text-align:center;font-size:10px;margin-top:5px">${SHOP.gst}</div>
    <div style="height:20px"></div>`;

  const w = window.open('', '_blank', 'width=380,height=720');
  w.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Receipt - ${o.orderNumber}</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Courier New',Courier,monospace; font-size:13px; width:300px; margin:0 auto; padding:10px; background:#fff; color:#000; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  @page { size:80mm auto; margin:3mm; }
  @media print { .no-print { display:none !important; } }
  .pbtn { display:block; margin:10px auto; padding:8px 20px; background:#000; color:#fff; border:none; cursor:pointer; font-size:13px; font-family:monospace; }
</style>
</head>
<body>
<button class="pbtn no-print" onclick="window.print()">Print Receipt</button>
${receiptHTML}
</body>
</html>`);
  w.document.close();
}

// ══════════════════════════════════════════════════════════════
// NEW ORDER FORM
// ══════════════════════════════════════════════════════════════
async function openNewOrder() {
  orderItems = []; promoDisc = 0; promoCode = '';
  document.getElementById('ord-promo').value     = '';
  document.getElementById('promo-msg').innerHTML = '';
  document.getElementById('ord-notes').value     = '';
  document.getElementById('ord-delivery').value  = '';
  renderItems();

  try {
    const cr = await api.customers.list();
    document.getElementById('ord-cust').innerHTML =
      '<option value="">— Select customer —</option>' +
      cr.data.map(c => `<option value="${c._id}">${c.name} (${c.phone})</option>`).join('');
  } catch(e) {}

  try {
    const cr = await api.cakes.list({ available: 'true' });
    document.getElementById('ord-cake-sel').innerHTML =
      '<option value="">— Select cake —</option>' +
      cr.data.map(c => `<option value="${c._id}" data-price="${c.finalPrice}">${c.name} — ₹${c.finalPrice}</option>`).join('');
  } catch(e) {}

  openM('order-overlay');
}

function addItem() {
  const sel = document.getElementById('ord-cake-sel');
  const qty = parseInt(document.getElementById('ord-qty').value) || 1;
  if (!sel.value) { toast('Select a cake', 'warning'); return; }
  const opt      = sel.options[sel.selectedIndex];
  const price    = parseFloat(opt.dataset.price);
  const existing = orderItems.find(i => i.cakeId === sel.value);
  if (existing) { existing.quantity += qty; existing.subtotal = +(existing.quantity * price).toFixed(2); }
  else orderItems.push({ cakeId: sel.value, cakeName: opt.text.split(' — ')[0], quantity: qty, unitPrice: price, subtotal: +(qty * price).toFixed(2) });
  renderItems();
}

function removeItem(idx) { orderItems.splice(idx, 1); renderItems(); }

function renderItems() {
  const sub   = orderItems.reduce((s, i) => s + i.subtotal, 0);
  const total = Math.max(0, sub - promoDisc);
  const el    = document.getElementById('ord-items-list');
  if (!orderItems.length) {
    el.innerHTML = '<p style="color:var(--text3);text-align:center;padding:.75rem;font-size:.85rem">No items yet</p>';
  } else {
    el.innerHTML = orderItems.map((it, i) => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:.55rem 0;border-bottom:1px solid var(--border)">
        <div>
          <span style="color:var(--text);font-weight:500">${it.cakeName}</span>
          <span style="color:var(--text2);font-size:.8rem"> ×${it.quantity}</span>
          <span style="color:var(--text3);font-size:.75rem"> @ ₹${it.unitPrice}</span>
        </div>
        <div style="display:flex;align-items:center;gap:.65rem">
          <span style="color:var(--gold);font-weight:600">${curr(it.subtotal)}</span>
          <button class="btn btn-danger btn-xs" onclick="removeItem(${i})">×</button>
        </div>
      </div>`).join('');
  }
  document.getElementById('ord-sub').textContent   = curr(sub);
  document.getElementById('ord-disc').textContent  = promoDisc > 0 ? `-${curr(promoDisc)}` : '—';
  document.getElementById('ord-total').textContent = curr(total);
}

async function applyPromo() {
  const code = document.getElementById('ord-promo').value.trim().toUpperCase();
  const sub  = orderItems.reduce((s, i) => s + i.subtotal, 0);
  if (!code) { toast('Enter a promo code', 'warning'); return; }
  if (!sub)  { toast('Add items first',   'warning'); return; }
  try {
    const r = await api.promotions.validate(code, sub);
    promoDisc = r.discount; promoCode = code;
    document.getElementById('promo-msg').innerHTML =
      `<div style="padding:.6rem;background:rgba(82,201,125,.1);border:1px solid rgba(82,201,125,.3);border-radius:6px;color:var(--success);font-size:.85rem">✅ Applied! You save ${curr(r.discount)}</div>`;
    renderItems();
  } catch(e) {
    promoDisc = 0; promoCode = '';
    document.getElementById('promo-msg').innerHTML =
      `<div style="padding:.6rem;background:rgba(224,85,101,.1);border:1px solid rgba(224,85,101,.3);border-radius:6px;color:var(--danger);font-size:.85rem">❌ ${e.message}</div>`;
    renderItems();
  }
}

function clearPromo() {
  promoDisc = 0; promoCode = '';
  document.getElementById('ord-promo').value     = '';
  document.getElementById('promo-msg').innerHTML = '';
  renderItems();
}

async function saveOrder() {
  const custId = document.getElementById('ord-cust').value;
  if (setErr('ord-cust', 'ord-cust-err', !custId)) return;
  if (!orderItems.length) { toast('Add at least one item', 'warning'); return; }

  const payload = {
    customerId:    custId,
    items:         orderItems.map(i => ({ cakeId: i.cakeId, quantity: i.quantity })),
    promoCode:     promoCode || undefined,
    paymentMethod: document.getElementById('ord-pay').value,
    notes:         document.getElementById('ord-notes').value.trim(),
    deliveryDate:  document.getElementById('ord-delivery').value || undefined
  };

  const btn = document.getElementById('ord-save-btn');
  btn.disabled = true; btn.textContent = 'Placing…';
  try {
    const r = await api.orders.create(payload);
    toast('Order placed!', 'success');
    closeM('order-overlay');
    loadOrders();
    if (r.data?._id) setTimeout(() => showBill(r.data._id), 500);
  } catch(e) { toast(e.message, 'error'); }
  finally { btn.disabled = false; btn.textContent = 'Place Order'; }
}

// ══════════════════════════════════════════════════════════════
// SALES REPORT
// ══════════════════════════════════════════════════════════════
async function loadReport(type) {
  const params = {};
  if      (type === 'daily')   params.type = 'daily';
  else if (type === 'monthly') params.type = 'monthly';
  else {
    params.startDate = document.getElementById('rpt-from').value;
    params.endDate   = document.getElementById('rpt-to').value;
    if (!params.startDate || !params.endDate) { toast('Select date range', 'warning'); return; }
  }

  document.getElementById('rpt-body').innerHTML = spinnerEl();
  try {
    const r = await api.orders.report(params);
    const { orders, totalRevenue, totalOrders, from, to } = r.data;
    const avg = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    window._rptOrders = orders;

    document.getElementById('rpt-body').innerHTML = `
      <div class="rpt-grid">
        <div class="rpt-box"><div class="rv">${curr(totalRevenue)}</div><div class="rl">Total Revenue</div></div>
        <div class="rpt-box"><div class="rv">${totalOrders}</div><div class="rl">Total Orders</div></div>
        <div class="rpt-box"><div class="rv">${curr(avg)}</div><div class="rl">Avg Order Value</div></div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:.5rem">
        <p style="color:var(--text2);font-size:.8rem">📅 ${fdate(from)} → ${fdate(to)}</p>
        <div style="display:flex;gap:.5rem">
          <button class="btn btn-sec btn-sm" onclick="printReport()">🖨 Print</button>
          <button class="btn btn-sec btn-sm" onclick="exportRptCSV()">⬇ CSV</button>
        </div>
      </div>
      ${orders.length ? `
      <div class="tbl-wrap" id="rpt-table-wrap">
        <table class="tbl">
          <thead><tr>
            <th>Order#</th><th>Customer</th><th>Items</th>
            <th>Subtotal</th><th>Discount</th><th>Total</th>
            <th>Payment</th><th>Status</th><th>Date</th>
          </tr></thead>
          <tbody>${orders.map(o => `
            <tr>
              <td style="color:var(--gold);font-weight:700">${o.orderNumber}</td>
              <td>${o.customer?.name || o.customerName || '—'}</td>
              <td style="font-size:.8rem">${o.items.map(i=>`${i.cakeName} ×${i.quantity}`).join(', ')}</td>
              <td>${curr(o.subtotal)}</td>
              <td>${o.totalDiscount > 0 ? `<span style="color:var(--success)">${curr(o.totalDiscount)}</span>` : '—'}</td>
              <td style="font-weight:600">${curr(o.total)}</td>
              <td>${payBadge(o.paymentMethod)}</td>
              <td>${statusBadge(o.status)}</td>
              <td>${fdate(o.createdAt)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>` : emptyEl('📊','No orders in this period','')}`;
  } catch(e) {
    document.getElementById('rpt-body').innerHTML = `<p style="color:var(--danger);padding:1rem">❌ ${e.message}</p>`;
  }
}

function resetRptFilters() {
  document.getElementById('rpt-from').value = '';
  document.getElementById('rpt-to').value   = '';
  document.getElementById('rpt-body').innerHTML =
    '<div class="empty"><div class="ei">📋</div><h3>Generate a Report</h3><p>Select a period above</p></div>';
}

function exportRptCSV() {
  const orders = window._rptOrders || [];
  if (!orders.length) { toast('No data to export', 'warning'); return; }
  const rows = ['Order#,Customer,Items,Subtotal,Discount,Total,Payment,Status,Date'];
  orders.forEach(o => rows.push([
    o.orderNumber,
    '"' + (o.customer?.name || o.customerName) + '"',
    '"' + o.items.map(i => i.cakeName+'x'+i.quantity).join('|') + '"',
    o.subtotal.toFixed(2), o.totalDiscount.toFixed(2), o.total.toFixed(2),
    o.paymentMethod, o.status, fdate(o.createdAt)
  ].join(',')));
  const a  = document.createElement('a');
  a.href   = 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows.join('\n'));
  a.download = 'sales_report_' + Date.now() + '.csv';
  a.click();
  toast('CSV exported!', 'success');
}

function printReport() {
  const area = document.getElementById('rpt-table-wrap');
  if (!area) { toast('No report to print', 'warning'); return; }
  const w = window.open('', '_blank', 'width=1000,height=700');
  w.document.write(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Sales Report</title>
<style>
  body { font-family:'Segoe UI',sans-serif; background:#fff; color:#000; padding:24px; }
  h2   { color:#8b2635; font-family:Georgia,serif; margin-bottom:12px; }
  p    { color:#666; font-size:13px; margin-bottom:16px; }
  table{ width:100%; border-collapse:collapse; font-size:13px; }
  th   { background:#8b2635; color:#fff; padding:8px 12px; text-align:left; }
  td   { padding:7px 12px; border-bottom:1px solid #f0e8dc; }
  tr:nth-child(even) td { background:#faf6f1; }
  @media print { @page { margin:1cm; } }
</style>
</head><body>
<h2>🎂 ${SHOP.name} — Sales Report</h2>
<p>Generated: ${new Date().toLocaleString('en-IN')}</p>
${area.outerHTML}
<script>window.onload = () => { window.print(); };<\/script>
</body></html>`);
  w.document.close();
}
