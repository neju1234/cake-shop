// seed.js — Run: node seed.js
require('dotenv').config();
const mongoose  = require('mongoose');

// Use 127.0.0.1 explicitly (not localhost - avoids IPv6 issues)
const MONGO_URI = 'mongodb://127.0.0.1:27017/cakepro';

async function seed() {
  console.log('🔄 Connecting to MongoDB at', MONGO_URI);
  
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
    });
    console.log('✅ MongoDB connected!');
  } catch(e) {
    console.error('❌ Cannot connect to MongoDB!');
    console.error('   Error:', e.message);
    console.error('');
    console.error('══════════════════════════════════════════');
    console.error('  SOLUTION:');
    console.error('  1. Open CMD as Administrator');
    console.error('  2. Run: mkdir C:\\data\\db');
    console.error('  3. Run: mongod --dbpath "C:\\data\\db"');
    console.error('  4. Keep that window open');
    console.error('  5. Run node seed.js again');
    console.error('══════════════════════════════════════════');
    process.exit(1);
  }

  const Admin     = require('./models/Admin');
  const Cake      = require('./models/Cake');
  const Customer  = require('./models/Customer');
  const Order     = require('./models/Order');
  const Promotion = require('./models/Promotion');

  // Clear all collections
  await Promise.all([
    Admin.deleteMany({}),
    Cake.deleteMany({}),
    Customer.deleteMany({}),
    Order.deleteMany({}),
    Promotion.deleteMany({})
  ]);
  console.log('🗑  Cleared old data');

  // Admin
  await Admin.create({
    username: 'admin', password: 'admin123',
    name: 'Shop Manager', email: 'admin@cakepro.com',
    shopName: 'CakePro Bakery',
    shopAddress: '42, MG Road, Kochi, Kerala - 682016',
    shopPhone: '9876543210',
    shopGST: 'GST: 32ABCDE1234F1Z5',
    upiId: 'cakepro@upi'
  });
  console.log('✅ Admin created → username: admin | password: admin123');

  // Cakes
  const cakes = await Cake.insertMany([
    { name:'Classic Chocolate Fudge',    description:'Rich dark chocolate layers with silky ganache and fudge frosting.',       price:850,  category:'birthday',     allergyInfo:['dairy','gluten','eggs'],        discount:0,  available:true, views:312, totalSold:124 },
    { name:'Red Velvet Royale',          description:'Southern red velvet with cream-cheese frosting and crimson crumb coat.',   price:920,  category:'birthday',     allergyInfo:['dairy','gluten','eggs'],        discount:10, available:true, views:389, totalSold:151 },
    { name:'White Forest Dream',         description:'Vanilla sponge with white chocolate cream, Maraschino cherries and whipped cream rosettes.', price:950, category:'birthday', allergyInfo:['dairy','gluten','eggs'], discount:0, available:true, views:198, totalSold:76 },
    { name:'Vanilla Bean Celebration',   description:'Classic vanilla sponge with Italian buttercream and gold leaf accents.',   price:680,  category:'birthday',     allergyInfo:['dairy','gluten','eggs'],        discount:0,  available:true, views:221, totalSold:167 },
    { name:'Nutella Hazelnut Bomb',      description:'Hazelnut chocolate cream with crunchy praline and Nutella drizzle.',       price:1020, category:'birthday',     allergyInfo:['nuts','dairy','gluten'],        discount:12, available:true, views:334, totalSold:119 },
    { name:'Black Forest Classic',       description:'Kirsch-soaked chocolate sponge, Morello cherries and whipped cream.',      price:860,  category:'birthday',     allergyInfo:['dairy','gluten','eggs'],        discount:0,  available:true, views:303, totalSold:137 },
    { name:'Rainbow Unicorn Cake',       description:'Six-layer rainbow sponge with white chocolate buttercream and glitter.',   price:1400, category:'birthday',     allergyInfo:['dairy','gluten','eggs'],        discount:0,  available:true, views:521, totalSold:94  },
    { name:'Choco Lava Bomb',            description:'Molten dark chocolate centre inside a dense fudge exterior.',              price:780,  category:'birthday',     allergyInfo:['dairy','gluten','eggs'],        discount:12, available:true, views:267, totalSold:88  },
    { name:'Oreo Cookies & Cream',       description:'Dark chocolate Oreo sponge with cream cheese frosting and Oreo topping.',  price:920,  category:'birthday',     allergyInfo:['dairy','gluten'],               discount:5,  available:true, views:198, totalSold:76  },
    { name:'Butterscotch Crunch',        description:'Classic butterscotch with caramel buttercream and toffee shards.',         price:850,  category:'birthday',     allergyInfo:['dairy','gluten','nuts'],        discount:0,  available:true, views:178, totalSold:62  },
    { name:'Royal Wedding Masterpiece',  description:'Three-tier fondant cake with hand-crafted sugar flowers.',                 price:4800, category:'wedding',      allergyInfo:['dairy','gluten','eggs','nuts'], discount:0,  available:true, views:445, totalSold:42  },
    { name:'Dark Chocolate Truffle',     description:'70% Belgian chocolate mousse with espresso sponge and mirror glaze.',      price:1100, category:'wedding',      allergyInfo:['dairy','gluten','eggs'],        discount:8,  available:true, views:189, totalSold:38  },
    { name:'Saffron Kesar Delight',      description:'Royal saffron and cardamom cake with pistachios, rose petals and varq.',   price:1400, category:'wedding',      allergyInfo:['dairy','nuts'],                 discount:0,  available:true, views:156, totalSold:29  },
    { name:'Choco Hazelnut Wedding',     description:'Three-tier dark chocolate hazelnut with gold leaf and fresh berries.',     price:5500, category:'wedding',      allergyInfo:['nuts','dairy','gluten'],        discount:15, available:true, views:387, totalSold:21  },
    { name:'Strawberry Dream Delight',   description:'Vanilla sponge with fresh strawberries, whipped cream and berry glaze.',   price:780,  category:'anniversary',  allergyInfo:['dairy','gluten','eggs'],        discount:5,  available:true, views:267, totalSold:98  },
    { name:'Lemon Drizzle Sunshine',     description:'Meyer lemon sponge with crackly sugar glaze and candied lemon zest.',      price:740,  category:'anniversary',  allergyInfo:['gluten','eggs'],                discount:0,  available:true, views:143, totalSold:62  },
    { name:'Raspberry White Chocolate',  description:'Raspberry jam through white chocolate mousse on almond financier.',        price:1150, category:'anniversary',  allergyInfo:['dairy','gluten','eggs'],        discount:0,  available:true, views:167, totalSold:44  },
    { name:'Mango Passion Mousse',       description:'Alphonso mango mousse on almond-crunch base. Summer in every bite.',       price:950,  category:'custom',       allergyInfo:['dairy','nuts'],                 discount:0,  available:true, views:198, totalSold:76  },
    { name:'Pistachio Rose Garden',      description:'Pistachio cream with rosewater syrup and crushed pistachio crown.',        price:1250, category:'custom',       allergyInfo:['nuts','dairy'],                 discount:8,  available:true, views:164, totalSold:54  },
    { name:'Gulab Jamun Fusion',         description:'Rose-water sponge with saffron cream and warm gulab jamun pieces.',        price:980,  category:'custom',       allergyInfo:['dairy','gluten','eggs'],        discount:10, available:true, views:145, totalSold:47  },
    { name:'Caramel Biscoff Crunch',     description:'Biscoff spread layered with caramel mousse and Biscoff-crumb crust.',      price:980,  category:'custom',       allergyInfo:['gluten','dairy'],               discount:5,  available:true, views:211, totalSold:89  },
    { name:'NY Blueberry Cheesecake',    description:'Authentic baked cheesecake with thick blueberry compote topping.',         price:1100, category:'cheesecake',   allergyInfo:['dairy','gluten','eggs'],        discount:0,  available:true, views:276, totalSold:88  },
    { name:'Lotus Biscoff Cheesecake',   description:'No-bake Biscoff cheesecake with caramelised Biscoff drizzle.',            price:1250, category:'cheesecake',   allergyInfo:['dairy','gluten'],               discount:0,  available:true, views:198, totalSold:67  },
    { name:'White Forest Cheesecake',    description:'No-bake white chocolate cheesecake with cherry compote and cream peaks.',  price:1200, category:'cheesecake',   allergyInfo:['dairy','gluten','eggs'],        discount:0,  available:true, views:154, totalSold:43  },
    { name:'Tiramisu Tower',             description:'Espresso-soaked savoiardi with mascarpone cream and cocoa dusting.',       price:1150, category:'pastry',       allergyInfo:['dairy','eggs','gluten'],        discount:0,  available:true, views:187, totalSold:71  },
    { name:'Earl Grey Tea Cake',         description:'Earl Grey infused sponge with lavender-honey buttercream.',                price:950,  category:'pastry',       allergyInfo:['dairy','gluten','eggs'],        discount:0,  available:true, views:112, totalSold:34  },
    { name:'White Forest Swiss Roll',    description:'Vanilla sponge rolled with white chocolate cream and cherry filling.',     price:680,  category:'pastry',       allergyInfo:['dairy','gluten','eggs'],        discount:8,  available:true, views:134, totalSold:48  },
    { name:'Assorted Cupcake Box (12)',  description:'A dozen premium cupcakes in vanilla, chocolate, red-velvet and lemon.',    price:520,  category:'cupcakes',     allergyInfo:['dairy','gluten','eggs'],        discount:0,  available:true, views:289, totalSold:203 },
    { name:'Mini Donut Tower (24pcs)',   description:'Tower of 24 glazed mini donuts in 4 flavours for parties.',               price:650,  category:'cupcakes',     allergyInfo:['dairy','gluten','eggs'],        discount:0,  available:true, views:167, totalSold:88  },
    { name:'Pineapple Sunshine',         description:'Fresh pineapple syrup sponge with whipped cream and pineapple rings.',     price:720,  category:'other',        allergyInfo:['dairy','gluten','eggs'],        discount:0,  available:true, views:134, totalSold:56  },
  ]);
  console.log(`✅ ${cakes.length} cakes created`);

  // Customers
  const customers = await Customer.insertMany([
    { name:'Priya Sharma',   email:'priya@example.com',   phone:'9876543210', address:'Ernakulam, Kochi, Kerala',      totalSpent:6200,  totalOrders:8  },
    { name:'Arjun Mehta',    email:'arjun@example.com',   phone:'9845123456', address:'Indiranagar, Bangalore, KA',    totalSpent:12400, totalOrders:14 },
    { name:'Kavya Nair',     email:'kavya@example.com',   phone:'9912345678', address:'Thrissur, Kerala',              totalSpent:3100,  totalOrders:4  },
    { name:'Rohan Gupta',    email:'rohan@example.com',   phone:'9778901234', address:'Andheri West, Mumbai, MH',      totalSpent:8750,  totalOrders:10 },
    { name:'Sneha Iyer',     email:'sneha@example.com',   phone:'9934567890', address:'Anna Nagar, Chennai, TN',       totalSpent:2200,  totalOrders:3  },
    { name:'Vikram Pillai',  email:'vikram@example.com',  phone:'9856789012', address:'Jubilee Hills, Hyderabad, TS',  totalSpent:15600, totalOrders:18 },
    { name:'Meera Krishnan', email:'meera@example.com',   phone:'9723456789', address:'RS Puram, Coimbatore, TN',      totalSpent:4800,  totalOrders:6  },
    { name:'Aarav Patel',    email:'aarav@example.com',   phone:'9654321098', address:'Satellite, Ahmedabad, GJ',      totalSpent:7300,  totalOrders:9  },
    { name:'Divya Menon',    email:'divya@example.com',   phone:'9512345678', address:'Palarivattom, Kochi, Kerala',   totalSpent:1800,  totalOrders:2  },
    { name:'Rahul Verma',    email:'rahul@example.com',   phone:'9400123456', address:'Civil Lines, Jaipur, RJ',       totalSpent:5600,  totalOrders:7  }
  ]);
  console.log(`✅ ${customers.length} customers created`);

  // Promotions
  await Promotion.insertMany([
    { code:'WELCOME10', description:'10% off for new customers',            type:'percentage', value:10, expiresAt:new Date(Date.now()+90*86400000), active:true },
    { code:'FLAT200',   description:'₹200 flat off on orders above ₹1000', type:'fixed',      value:200, minOrderAmount:1000, expiresAt:new Date(Date.now()+30*86400000), active:true },
    { code:'WEDDING20', description:'20% off wedding cakes (max ₹600)',    type:'percentage', value:20, maxDiscount:600, expiresAt:new Date(Date.now()+60*86400000), active:true },
    { code:'BDAY15',    description:'15% off birthday cakes',              type:'percentage', value:15, expiresAt:new Date(Date.now()+45*86400000), active:true },
    { code:'SUMMER50',  description:'₹50 off summer special',             type:'fixed',      value:50, expiresAt:new Date(Date.now()+15*86400000), active:true }
  ]);
  console.log('✅ 5 promotions created');

  // Orders
  const statuses = ['delivered','delivered','delivered','confirmed','preparing','pending'];
  const payments = ['cash','card','upi','online'];
  for (let i = 0; i < 50; i++) {
    const cust  = customers[Math.floor(Math.random()*customers.length)];
    const cake  = cakes[Math.floor(Math.random()*cakes.length)];
    const qty   = Math.floor(Math.random()*3)+1;
    const unit  = cake.finalPrice;
    const sub   = +(unit*qty).toFixed(2);
    const order = new Order({
      customer: cust._id, customerName: cust.name,
      items: [{ cake:cake._id, cakeName:cake.name, category:cake.category, quantity:qty, unitPrice:unit, discount:cake.discount||0, subtotal:sub }],
      subtotal: sub, promoDiscount:0, totalDiscount:0, total:sub,
      status:  statuses[Math.floor(Math.random()*statuses.length)],
      paymentMethod: payments[Math.floor(Math.random()*payments.length)],
      createdAt: new Date(Date.now()-Math.random()*60*86400000)
    });
    await order.save();
  }
  console.log('✅ 50 sample orders created');

  // Verify
  const counts = {
    admins:     await Admin.countDocuments(),
    cakes:      await Cake.countDocuments(),
    customers:  await Customer.countDocuments(),
    orders:     await Order.countDocuments(),
    promotions: await Promotion.countDocuments()
  };
  console.log('');
  console.log('📊 Database verification:');
  Object.entries(counts).forEach(([k,v]) => console.log(`   ${k}: ${v} documents`));
  console.log('');
  console.log('🎂  Seed complete! Now run: npm run dev');
  
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(e => {
  console.error('❌ Seed failed:', e.message);
  process.exit(1);
});
