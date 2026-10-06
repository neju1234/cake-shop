# 🎂 CakePro Ultimate — Complete Setup Guide

## ✅ What's Included

| Feature | Status |
|---------|--------|
| Admin Login (token-based, works cross-port) | ✅ |
| Dashboard with stats + charts | ✅ |
| Cake CRUD + image upload + drag/drop | ✅ |
| Customer CRUD + order history | ✅ |
| Orders with multi-item, promo codes | ✅ |
| **🧾 A4 Bill / Invoice (print-ready)** | ✅ |
| **🧾 Thermal Receipt (80mm POS)** | ✅ |
| **💵 Cash / 💳 Card / 📱 UPI / 🌐 Online payment** | ✅ |
| **📱 UPI QR section on bill** | ✅ |
| CSV + Excel exports (orders, cakes, customers) | ✅ |
| Sales reports (daily/monthly/custom) + print | ✅ |
| Promotions (%, fixed, expiry, usage limit) | ✅ |
| Analytics (charts, best sellers, top customers) | ✅ |
| Dark/Light mode toggle | ✅ |
| Glassmorphism UI | ✅ |
| Skeleton loaders + inline validation | ✅ |
| Responsive (mobile/tablet/desktop) | ✅ |
| 30 sample cakes, 10 customers, 50 orders seeded | ✅ |

---

## 🚀 Setup — Windows (Use CMD, NOT PowerShell)

### Step 1 — Fix PowerShell (run ONCE as Administrator)
Search **PowerShell** → Right-click → **Run as Administrator** → paste:
```
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Type `Y` → Enter. Close that window.

---

### Step 2 — Start MongoDB
Open Services: `Win+R` → type `services.msc` → find **MongoDB Server** → Start
OR open a CMD window and run: `mongod`

---

### Step 3 — Navigate to Backend
Open **Command Prompt (CMD)**:
```cmd
cd C:\Users\YourName\Downloads\cakepro-ultimate\backend
dir
```
You should see: `server.js`, `package.json`, `seed.js`

---

### Step 4 — Install & Seed
```cmd
npm install
node seed.js
```
Expected output:
```
✅ Admin  →  username: admin  |  password: admin123
✅ 30 cakes created
✅ 10 customers created
✅ 5 promotions created
✅ 50 sample orders created
```

---

### Step 5 — Start Backend
```cmd
npm run dev
```
You should see:
```
✅  MongoDB connected
🎂  CakePro Ultimate running → http://localhost:5000
```
**Keep this CMD window open.**

---

### Step 6 — Open Frontend
**VS Code Live Server (recommended):**
1. Install VS Code: https://code.visualstudio.com
2. Install **Live Server** extension
3. Open the `frontend` folder in VS Code
4. Right-click `index.html` → **Open with Live Server**
5. Browser opens at `http://127.0.0.1:5500`

**OR** double-click `frontend/index.html` directly.

---

### Step 7 — Login
```
Username: admin
Password: admin123
```

---

## 🧾 Bill / Receipt Features

### A4 Bill (Full Invoice)
- Click **🧾 Bill** on any order in the Orders page
- Click **🖨️ Print A4 Bill** → opens print-ready window
- Includes: shop header, customer details, itemized table, GST, totals
- UPI section appears automatically when payment = UPI

### Thermal Receipt (80mm POS)
- Click **🧾 Thermal (80mm)** in the bill modal
- Opens a Courier New monospace receipt
- Perfect for thermal POS printers
- Auto-print dialog on open

### Auto Bill After Order
- After placing a new order, the bill opens automatically

---

## 📦 Promo Codes (Ready to Use)
| Code | Type | Value |
|------|------|-------|
| WELCOME10 | 10% off | All orders |
| FLAT200 | ₹200 off | Orders above ₹1000 |
| WEDDING20 | 20% off (max ₹600) | All orders |
| BDAY15 | 15% off | All orders |
| SUMMER50 | ₹50 off | All orders |

---

## 🔌 API Quick Reference
| Endpoint | Auth | Description |
|----------|------|-------------|
| POST /api/auth/login | No | Login |
| GET /api/dashboard/summary | Yes | Dashboard stats |
| GET /api/cakes | No | List cakes |
| POST /api/cakes | Yes | Add cake (multipart) |
| GET /api/customers | Yes | List customers |
| POST /api/orders | Yes | Place order |
| GET /api/orders/:id | Yes | Get order (for bill) |
| GET /api/orders/report/sales | Yes | Sales report |
| POST /api/promotions/validate | No | Validate promo code |
| GET /api/export/csv/orders | Yes | Download orders CSV |
| GET /api/export/excel/orders | Yes | Download orders Excel |

---

## 🐛 Troubleshooting

**Port 5000 in use:**
```cmd
netstat -ano | findstr :5000
taskkill /PID [number] /F
```

**npm blocked in PowerShell:**
→ Run Set-ExecutionPolicy (Step 1) as Administrator

**MongoDB not connecting:**
→ Open `services.msc` → Start MongoDB Server
→ Or run `mongod` in a separate CMD window

**Charts not showing (Edge blocks CDN):**
→ Go to `edge://settings/privacy` → set Tracking Prevention to Basic
→ OR download `https://unpkg.com/chart.js@4.4.0/dist/chart.umd.min.js`
   save as `frontend/js/chart.min.js`

**Data not loading after login:**
→ Check browser DevTools → Application → Local Storage
→ Should see: `cp_auth_token = cakepro_admin_authenticated`
→ If missing: logout and login again
