// js/api.js — All API calls
// BACKEND_URL is defined in utils.js which loads before this file
const TOKEN_KEY = 'cp_auth_token';

function getToken()   { return localStorage.getItem(TOKEN_KEY) || ''; }
function saveToken(t) { localStorage.setItem(TOKEN_KEY, t); }
function clearToken() { localStorage.removeItem(TOKEN_KEY); }

async function apiFetch(method, path, body, isForm) {
  // BACKEND_URL defined in utils.js
  const base    = (typeof BACKEND_URL !== 'undefined' ? BACKEND_URL : 'http://localhost:5000');
  const token   = getToken();
  const headers = {};

  // Always send token on every request
  if (token) {
    headers['Authorization'] = token;
    headers['X-Admin-Token'] = token;
  }

  // JSON header only for non-form requests
  if (!isForm && body) headers['Content-Type'] = 'application/json';

  const opts = { method, credentials:'include', headers };
  if (body) opts.body = isForm ? body : JSON.stringify(body);

  let res, data;
  try {
    res  = await fetch(base + '/api' + path, opts);
    data = await res.json();
  } catch(e) {
    throw new Error('Cannot reach backend. Is the server running on port 5000?');
  }

  if (!res.ok) throw new Error(data?.message || `Server error ${res.status}`);
  return data;
}

const api = {
  get:    p      => apiFetch('GET',    p),
  post:   (p,b)  => apiFetch('POST',   p, b),
  put:    (p,b)  => apiFetch('PUT',    p, b),
  del:    p      => apiFetch('DELETE', p),
  upload: (p,f)  => apiFetch('POST',   p, f, true),
  upPut:  (p,f)  => apiFetch('PUT',    p, f, true),

  auth: {
    login: async (u, p) => {
      const r = await apiFetch('POST', '/auth/login', { username:u, password:p });
      if (r.token) saveToken(r.token);
      return r;
    },
    logout: async () => {
      try { await apiFetch('POST', '/auth/logout'); } catch(e) {}
      clearToken();
    },
    me: async () => {
      if (getToken()) return { success:true, loggedIn:true, name:'Admin' };
      try {
        const r = await apiFetch('GET', '/auth/me');
        if (r.loggedIn && r.token) saveToken(r.token);
        return r;
      } catch(e) { return { success:true, loggedIn:false }; }
    }
  },

  dashboard:  { summary:()=>api.get('/dashboard/summary') },
  cakes:      {
    list:   (q={}) => api.get('/cakes?'+new URLSearchParams(q)),
    get:    id     => api.get(`/cakes/${id}`),
    create: f      => api.upload('/cakes', f),
    update: (id,f) => api.upPut(`/cakes/${id}`, f),
    del:    id     => api.del(`/cakes/${id}`)
  },
  customers: {
    list:   (q={}) => api.get('/customers?'+new URLSearchParams(q)),
    get:    id     => api.get(`/customers/${id}`),
    create: d      => api.post('/customers', d),
    update: (id,d) => api.put(`/customers/${id}`, d),
    del:    id     => api.del(`/customers/${id}`)
  },
  orders: {
    list:   (q={}) => api.get('/orders?'+new URLSearchParams(q)),
    get:    id     => api.get(`/orders/${id}`),
    create: d      => api.post('/orders', d),
    status: (id,s) => api.put(`/orders/${id}`, {status:s}),
    del:    id     => api.del(`/orders/${id}`),
    report: (q={}) => api.get('/orders/report/sales?'+new URLSearchParams(q))
  },
  promotions: {
    list:     ()         => api.get('/promotions'),
    create:   d          => api.post('/promotions', d),
    update:   (id,d)     => api.put(`/promotions/${id}`, d),
    del:      id         => api.del(`/promotions/${id}`),
    validate: (code,amt) => api.post('/promotions/validate',{code,orderAmount:amt})
  },
  analytics: {
    monthly:      () => api.get('/analytics/monthly'),
    daily:        () => api.get('/analytics/daily'),
    category:     () => api.get('/analytics/category'),
    bestsellers:  () => api.get('/analytics/bestsellers'),
    topCustomers: () => api.get('/analytics/top-customers')
  }
};
