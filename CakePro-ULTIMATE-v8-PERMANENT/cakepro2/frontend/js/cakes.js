// js/cakes.js
let editCakeId = null;

async function loadCakes() {
  const q = {
    search:   document.getElementById('cake-q')?.value   || '',
    category: document.getElementById('cake-cat')?.value || '',
    sort:     document.getElementById('cake-sort')?.value|| ''
  };
  Object.keys(q).forEach(k => !q[k] && delete q[k]);
  document.getElementById('cake-grid').innerHTML = spinnerEl();
  try {
    const r = await api.cakes.list(q);
    document.getElementById('cake-cnt').textContent = `${r.count} cakes`;
    renderCakes(r.data);
  } catch(e) { toast(e.message, 'error'); }
}

function renderCakes(cakes) {
  const g = document.getElementById('cake-grid');
  if (!cakes.length) {
    g.innerHTML = emptyEl('🎂','No cakes found','Add a cake or adjust filters');
    return;
  }
  g.innerHTML = cakes.map(c => {
    // Build image HTML — full URL from backend
    let imageHTML;
    if (c.image) {
      // c.image = "/uploads/cake-xxx.jpg"
      // Full URL = BACKEND_URL + c.image = "http://localhost:5000/uploads/cake-xxx.jpg"
      const imgUrl = BACKEND_URL + c.image;
      imageHTML = `
        <div class="cake-img" style="padding:0;overflow:hidden">
          <img
            src="${imgUrl}"
            alt="${c.name}"
            style="width:100%;height:175px;object-fit:cover;display:block"
            onerror="this.parentElement.innerHTML='<div style=\'width:100%;height:175px;display:flex;align-items:center;justify-content:center;font-size:3rem;background:var(--surface)\'>🎂</div>'"
          >
        </div>`;
    } else {
      imageHTML = `<div class="cake-img">🎂</div>`;
    }

    return `
    <div class="cake-card">
      ${imageHTML}
      <div class="cake-body">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.4rem">
          <div class="cake-name">${c.name}</div>
          <span class="dot ${c.available?'dot-on':'dot-off'}" title="${c.available?'Available':'Unavailable'}"></span>
        </div>
        <div class="cake-price">
          ${c.discount > 0
            ? `<span style="text-decoration:line-through;color:var(--text2);font-size:.85rem">₹${c.price}</span>
               <span style="color:var(--gold)"> ₹${c.finalPrice}</span>
               <span class="badge b-danger" style="font-size:.65rem">-${c.discount}%</span>`
            : `<span>${curr(c.price)}</span>`}
        </div>
        <div class="cake-meta">
          <span class="badge b-gold">${c.category}</span>
          <span style="font-size:.72rem;color:var(--text2)">👁 ${c.views} · 🛒 ${c.totalSold}</span>
        </div>
        ${c.allergyInfo?.length ? `<div style="margin-top:.45rem">${aTags(c.allergyInfo)}</div>` : ''}
        <p style="font-size:.78rem;color:var(--text2);margin-top:.45rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${c.description}</p>
      </div>
      <div class="cake-acts">
        <button class="btn btn-sec btn-sm" style="flex:1" onclick="openEditCake('${c._id}')">✏️ Edit</button>
        <button class="btn btn-danger btn-sm btn-ico" onclick="delCake('${c._id}','${c.name.replace(/'/g,"\\'").replace(/"/g,'')}')">🗑</button>
      </div>
    </div>`;
  }).join('');
}

// ── Add Cake ──────────────────────────────────────────────────
function openAddCake() {
  editCakeId = null;
  document.getElementById('cake-modal-title').textContent = 'Add New Cake';
  document.getElementById('cf-name').value    = '';
  document.getElementById('cf-desc').value    = '';
  document.getElementById('cf-price').value   = '';
  document.getElementById('cf-cat').value     = '';
  document.getElementById('cf-disc').value    = '0';
  document.getElementById('cf-avail').value   = 'true';
  document.getElementById('cf-allergy').value = '';
  document.getElementById('img-preview').style.display = 'none';
  document.getElementById('cf-img').value = '';
  ['cf-name','cf-cat','cf-desc','cf-price'].forEach(id =>
    document.getElementById(id)?.classList.remove('err')
  );
  openM('cake-overlay');
}

// ── Edit Cake ─────────────────────────────────────────────────
async function openEditCake(id) {
  editCakeId = id;
  document.getElementById('cake-modal-title').textContent = 'Edit Cake';
  try {
    const r    = await api.cakes.get(id);
    const c    = r.data;
    document.getElementById('cf-name').value    = c.name;
    document.getElementById('cf-desc').value    = c.description;
    document.getElementById('cf-price').value   = c.price;
    document.getElementById('cf-cat').value     = c.category;
    document.getElementById('cf-disc').value    = c.discount || 0;
    document.getElementById('cf-avail').value   = String(c.available);
    document.getElementById('cf-allergy').value = (c.allergyInfo || []).join(', ');

    // Show existing image preview
    const prev = document.getElementById('img-preview');
    if (c.image) {
      prev.src          = BACKEND_URL + c.image;
      prev.style.display = 'block';
      prev.onerror      = () => { prev.style.display = 'none'; };
    } else {
      prev.style.display = 'none';
    }

    openM('cake-overlay');
  } catch(e) { toast(e.message, 'error'); }
}

// ── Validate ──────────────────────────────────────────────────
function validateCakeForm() {
  let ok = true;
  ok = !setErr('cf-name',  'cf-name-err',  document.getElementById('cf-name').value.trim().length < 3) && ok;
  ok = !setErr('cf-cat',   'cf-cat-err',   !document.getElementById('cf-cat').value) && ok;
  ok = !setErr('cf-desc',  'cf-desc-err',  !document.getElementById('cf-desc').value.trim()) && ok;
  ok = !setErr('cf-price', 'cf-price-err', !(+document.getElementById('cf-price').value > 0)) && ok;
  return ok;
}

// ── Save Cake ─────────────────────────────────────────────────
async function saveCake() {
  if (!validateCakeForm()) return;

  const file = document.getElementById('cf-img').files[0];
  if (file && file.size > 5 * 1024 * 1024) {
    showErr('cf-img-err', true);
    toast('Image too large! Max 5MB', 'error');
    return;
  }

  const form = new FormData();
  form.append('name',        document.getElementById('cf-name').value.trim());
  form.append('description', document.getElementById('cf-desc').value.trim());
  form.append('price',       document.getElementById('cf-price').value);
  form.append('category',    document.getElementById('cf-cat').value);
  form.append('discount',    document.getElementById('cf-disc').value || 0);
  form.append('available',   document.getElementById('cf-avail').value);
  form.append('allergyInfo', document.getElementById('cf-allergy').value);
  if (file) form.append('image', file);

  const btn = document.getElementById('cake-save-btn');
  btn.disabled = true; btn.textContent = 'Saving…';

  try {
    if (editCakeId) {
      await api.cakes.update(editCakeId, form);
      toast('Cake updated successfully!', 'success');
    } else {
      await api.cakes.create(form);
      toast('Cake added successfully!', 'success');
    }
    closeM('cake-overlay');
    loadCakes();
  } catch(e) {
    toast(e.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Save Cake';
  }
}

// ── Delete Cake ───────────────────────────────────────────────
async function delCake(id, name) {
  if (!await confirm$(`Delete "${name}"? This cannot be undone.`)) return;
  try {
    await api.cakes.del(id);
    toast('Cake deleted', 'success');
    loadCakes();
  } catch(e) { toast(e.message, 'error'); }
}
