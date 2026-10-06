// js/customers.js
let editCustId=null;

async function loadCustomers() {
  const q={search:document.getElementById('cust-q')?.value||''};
  if(!q.search) delete q.search;
  document.getElementById('cust-body').innerHTML=`<tr><td colspan="8">${spinnerEl()}</td></tr>`;
  try {
    const r=await api.customers.list(q);
    document.getElementById('cust-cnt').textContent=`${r.count} customers`;
    const tb=document.getElementById('cust-body');
    if(!r.data.length){ tb.innerHTML=`<tr><td colspan="8">${emptyEl('👥','No customers','Add your first customer')}</td></tr>`; return; }
    tb.innerHTML=r.data.map(c=>`
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:.65rem">
            <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--crimson),var(--gold));display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:.8rem;flex-shrink:0">${c.name.charAt(0).toUpperCase()}</div>
            <span style="font-weight:500;color:var(--cream)">${c.name}</span>
          </div>
        </td>
        <td style="color:var(--text2)">${c.email}</td>
        <td style="color:var(--text2)">${c.phone}</td>
        <td style="color:var(--text2);font-size:.82rem">${c.address||'—'}</td>
        <td style="color:var(--gold);font-weight:600">${curr(c.totalSpent)}</td>
        <td><span class="badge b-info">${c.totalOrders} orders</span></td>
        <td style="font-size:.82rem;color:var(--text2)">${fdate(c.createdAt)}</td>
        <td>
          <div style="display:flex;gap:.35rem">
            <button class="btn btn-info btn-xs btn-ico"    title="View history" onclick="viewCust('${c._id}')">👁</button>
            <button class="btn btn-sec btn-xs btn-ico"     title="Edit"         onclick="openEditCust('${c._id}')">✏️</button>
            <button class="btn btn-danger btn-xs btn-ico"  title="Delete"       onclick="delCust('${c._id}','${c.name.replace(/'/g,'')}')">🗑</button>
          </div>
        </td>
      </tr>`).join('');
  } catch(e){ toast(e.message,'error'); }
}

function openAddCust() {
  editCustId=null;
  document.getElementById('cust-modal-title').textContent='Add Customer';
  ['custf-name','custf-email','custf-phone','custf-addr','custf-notes'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  openM('cust-overlay');
}

async function openEditCust(id) {
  editCustId=id;
  document.getElementById('cust-modal-title').textContent='Edit Customer';
  try {
    const r=await api.customers.get(id); const c=r.data.customer;
    document.getElementById('custf-name').value =c.name;
    document.getElementById('custf-email').value=c.email;
    document.getElementById('custf-phone').value=c.phone;
    document.getElementById('custf-addr').value =c.address||'';
    document.getElementById('custf-notes').value=c.notes||'';
    openM('cust-overlay');
  } catch(e){ toast(e.message,'error'); }
}

function validateCustForm() {
  let ok=true;
  ok=!setErr('custf-name','custf-name-err',!document.getElementById('custf-name').value.trim())&&ok;
  ok=!setErr('custf-email','custf-email-err',!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(document.getElementById('custf-email').value.trim()))&&ok;
  ok=!setErr('custf-phone','custf-phone-err',!/^\d{10}$/.test(document.getElementById('custf-phone').value.trim()))&&ok;
  return ok;
}

async function saveCust() {
  if(!validateCustForm()) return;
  const data={name:document.getElementById('custf-name').value.trim(),email:document.getElementById('custf-email').value.trim(),phone:document.getElementById('custf-phone').value.trim(),address:document.getElementById('custf-addr').value.trim(),notes:document.getElementById('custf-notes').value.trim()};
  const btn=document.getElementById('cust-save-btn'); btn.disabled=true; btn.textContent='Saving…';
  try {
    if(editCustId){await api.customers.update(editCustId,data);toast('Customer updated!','success');}
    else          {await api.customers.create(data);            toast('Customer added!','success');}
    closeM('cust-overlay'); loadCustomers();
  } catch(e){ toast(e.message,'error'); }
  finally{ btn.disabled=false; btn.textContent='Save Customer'; }
}

async function delCust(id,name) {
  if(!await confirm$(`Delete customer "${name}"?`)) return;
  try{ await api.customers.del(id); toast('Customer deleted','success'); loadCustomers(); }
  catch(e){ toast(e.message,'error'); }
}

async function viewCust(id) {
  try {
    const r=await api.customers.get(id); const{customer:c,orders}=r.data;
    document.getElementById('view-cust-body').innerHTML=`
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem">
        <div class="rpt-box"><div class="rv" style="font-size:1rem;word-break:break-word">${c.name}</div><div class="rl">Name</div></div>
        <div class="rpt-box"><div class="rv">${curr(c.totalSpent)}</div><div class="rl">Total Spent</div></div>
        <div class="rpt-box"><div class="rv">${c.totalOrders}</div><div class="rl">Total Orders</div></div>
      </div>
      <p style="color:var(--text2);font-size:.875rem;margin-bottom:1.25rem">
        ✉️ ${c.email} &nbsp;|&nbsp; 📱 ${c.phone} ${c.address?`&nbsp;|&nbsp; 📍 ${c.address}`:''}
      </p>
      <h4 style="margin-bottom:.75rem;font-size:1rem">Order History</h4>
      ${orders.length?`
        <div class="tbl-wrap">
          <table class="tbl">
            <thead><tr><th>Order#</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>${orders.map(o=>`
              <tr>
                <td style="color:var(--gold);font-weight:700">${o.orderNumber}</td>
                <td style="font-size:.8rem">${o.items.map(i=>`${i.cakeName} ×${i.quantity}`).join(', ')}</td>
                <td>${curr(o.total)}</td>
                <td><span class="badge b-muted">${o.paymentMethod}</span></td>
                <td>${statusBadge(o.status)}</td>
                <td style="font-size:.8rem">${fdate(o.createdAt)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`:emptyEl('📦','No orders yet','')}`;
    openM('view-cust-overlay');
  } catch(e){ toast(e.message,'error'); }
}
