// routes/export.js — CSV + Excel exports with token auth
const router   = require('express').Router();
const Order    = require('../models/Order');
const Cake     = require('../models/Cake');
const Customer = require('../models/Customer');

const VALID_TOKEN = 'cakepro_admin_authenticated';
function exportAuth(req, res, next) {
  if (req.session?.adminId) return next();
  const h = (req.headers['authorization']||req.headers['x-admin-token']||'').replace(/^Bearer\s+/i,'').trim();
  if (h === VALID_TOKEN) return next();
  if ((req.query.token||'').trim() === VALID_TOKEN) return next();
  return res.status(401).json({ success:false, message:'Unauthorized' });
}

function buildFilter(q) {
  const f = { status:{$ne:'cancelled'} };
  if (q.startDate||q.endDate) {
    f.createdAt = {};
    if (q.startDate) f.createdAt.$gte = new Date(q.startDate);
    if (q.endDate)   { const e=new Date(q.endDate); e.setHours(23,59,59,999); f.createdAt.$lte=e; }
  }
  if (q.status && q.status!=='all') f.status = q.status;
  return f;
}

// CSV: Orders
router.get('/csv/orders', exportAuth, async (req, res) => {
  try {
    const orders = await Order.find(buildFilter(req.query)).populate('customer','name email phone').sort({createdAt:-1});
    const rows = ['Order#,Customer,Phone,Items,Subtotal,Discount,Total,Payment,Status,Date'];
    for (const o of orders) {
      const items = o.items.map(i=>`${i.cakeName}x${i.quantity}`).join('|');
      rows.push([o.orderNumber,`"${o.customer?.name||o.customerName||''}"`,o.customer?.phone||'',`"${items}"`,o.subtotal.toFixed(2),o.totalDiscount.toFixed(2),o.total.toFixed(2),o.paymentMethod,o.status,new Date(o.createdAt).toLocaleDateString('en-IN')].join(','));
    }
    const rev = orders.reduce((s,o)=>s+o.total,0);
    rows.push(''); rows.push(`,,,,,,${rev.toFixed(2)},,,TOTAL REVENUE`);
    res.setHeader('Content-Type','text/csv');
    res.setHeader('Content-Disposition',`attachment; filename="orders_${Date.now()}.csv"`);
    res.send(rows.join('\n'));
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
});

// CSV: Customers
router.get('/csv/customers', exportAuth, async (req, res) => {
  try {
    const list = await Customer.find().sort({totalSpent:-1});
    const rows = ['Name,Email,Phone,Address,Total Orders,Total Spent,Joined'];
    for (const c of list)
      rows.push([`"${c.name}"`,c.email,c.phone,`"${c.address||''}"`,c.totalOrders,c.totalSpent.toFixed(2),new Date(c.createdAt).toLocaleDateString('en-IN')].join(','));
    res.setHeader('Content-Type','text/csv');
    res.setHeader('Content-Disposition',`attachment; filename="customers_${Date.now()}.csv"`);
    res.send(rows.join('\n'));
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
});

// CSV: Cakes
router.get('/csv/cakes', exportAuth, async (req, res) => {
  try {
    const cakes = await Cake.find().sort({totalSold:-1});
    const rows = ['Name,Category,Price,Discount%,Final Price,Available,Views,Total Sold'];
    for (const c of cakes)
      rows.push([`"${c.name}"`,c.category,c.price.toFixed(2),c.discount||0,c.finalPrice.toFixed(2),c.available?'Yes':'No',c.views,c.totalSold].join(','));
    res.setHeader('Content-Type','text/csv');
    res.setHeader('Content-Disposition',`attachment; filename="cakes_${Date.now()}.csv"`);
    res.send(rows.join('\n'));
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
});

// Excel: Orders
router.get('/excel/orders', exportAuth, async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const orders  = await Order.find(buildFilter(req.query)).populate('customer','name email phone').sort({createdAt:-1});
    const wb = new ExcelJS.Workbook(); wb.creator='CakePro';
    const ws = wb.addWorksheet('Orders');
    ws.columns = [
      {header:'Order #',      key:'num',    width:14},{header:'Customer',     key:'cust',   width:22},
      {header:'Phone',        key:'phone',  width:14},{header:'Items',        key:'items',  width:40},
      {header:'Subtotal (₹)', key:'sub',    width:14},{header:'Discount (₹)', key:'disc',   width:14},
      {header:'Total (₹)',    key:'total',  width:14},{header:'Payment',      key:'pay',    width:12},
      {header:'Status',       key:'status', width:14},{header:'Date',         key:'date',   width:16}
    ];
    ws.getRow(1).eachCell(c => { c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF8B2635'}}; c.font={color:{argb:'FFFFFFFF'},bold:true}; c.alignment={horizontal:'center',vertical:'middle'}; });
    ws.getRow(1).height = 22;
    let totalRev = 0;
    orders.forEach((o,i) => {
      const row = ws.addRow({ num:o.orderNumber, cust:o.customer?.name||o.customerName, phone:o.customer?.phone||'', items:o.items.map(x=>`${x.cakeName} ×${x.quantity}`).join(', '), sub:+o.subtotal.toFixed(2), disc:+o.totalDiscount.toFixed(2), total:+o.total.toFixed(2), pay:o.paymentMethod, status:o.status, date:new Date(o.createdAt).toLocaleDateString('en-IN') });
      totalRev += o.total;
      if (i%2===0) row.eachCell(c => { c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFF8F0'}}; });
    });
    ws.addRow({});
    const tr = ws.addRow({items:'TOTAL REVENUE', total:+totalRev.toFixed(2)});
    tr.getCell('items').font={bold:true}; tr.getCell('total').font={bold:true,color:{argb:'FF8B2635'}};
    res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition',`attachment; filename="orders_${Date.now()}.xlsx"`);
    await wb.xlsx.write(res); res.end();
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
});

// Excel: Cakes
router.get('/excel/cakes', exportAuth, async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const cakes   = await Cake.find().sort({totalSold:-1});
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Cakes');
    ws.columns = [
      {header:'Name',key:'name',width:28},{header:'Category',key:'cat',width:14},
      {header:'Price (₹)',key:'price',width:12},{header:'Discount %',key:'disc',width:12},
      {header:'Final (₹)',key:'final',width:12},{header:'Available',key:'avail',width:12},
      {header:'Views',key:'views',width:10},{header:'Total Sold',key:'sold',width:12}
    ];
    ws.getRow(1).eachCell(c => { c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFC9A84C'}}; c.font={bold:true,color:{argb:'FF1A0A0A'}}; c.alignment={horizontal:'center'}; });
    cakes.forEach(c => ws.addRow({name:c.name,cat:c.category,price:c.price,disc:c.discount||0,final:c.finalPrice,avail:c.available?'Yes':'No',views:c.views,sold:c.totalSold}));
    res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition',`attachment; filename="cakes_${Date.now()}.xlsx"`);
    await wb.xlsx.write(res); res.end();
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
});

module.exports = router;
