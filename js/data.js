const SavePlate = {
  inventory: [
    { name:'Milk',         emoji:'🥛', cat:'Dairy',      qty:'1 Liter',  loc:'Fridge',  exp:'2026-03-22', status:'warn'   },
    { name:'Yogurt',       emoji:'🥛', cat:'Dairy',      qty:'12 Pieces',loc:'Fridge',  exp:'2026-03-21', status:'danger' },
    { name:'Apple',        emoji:'🍎', cat:'Fruits',     qty:'500 GRAMS',loc:'Fridge',  exp:'2026-03-28', status:'ok'     },
    { name:'Chicken thigh',emoji:'🍗', cat:'Meat',       qty:'800 grams',loc:'Freezer', exp:'2026-03-25', status:'warn'   },
  ],
  donations: [
    { emoji:'🌾', name:'Basmati Rice',      qty:'1kg',    loc:'Petaling Jaya', exp:'Jan 2027', donor:'Ahmad'  },
    { emoji:'🥕', name:'Carrots',           qty:'500g',   loc:'Kuala Lumpur',  exp:'Apr 17',   donor:'Siti'   },
    { emoji:'🥫', name:'Sardines (canned)', qty:'3 tins', loc:'Subang Jaya',   exp:'Mar 2027', donor:'Chen'   },
    { emoji:'🧅', name:'Onions',            qty:'1kg',    loc:'Cheras',        exp:'Apr 20',   donor:'Ravi'   },
    { emoji:'🍚', name:'White Rice',        qty:'3kg',    loc:'Kepong',        exp:'Dec 2026', donor:'Aishah' },
    { emoji:'🥜', name:'Peanut Butter',     qty:'1 jar',  loc:'Ampang',        exp:'Sep 2026', donor:'Lee'    },
  ],
  meals: {
    Mon:[{t:'Breakfast',n:'Egg Toast'},{t:'Lunch',n:'Fried Rice'},{t:'Dinner',n:'Chicken Stir-fry'}],
    Tue:[{t:'Breakfast',n:'Greek Yogurt Parfait'},{t:'Lunch',n:'Nasi Lemak'}],
    Wed:[{t:'Lunch',n:'Pasta'},{t:'Dinner',n:'Tomato Soup'}],
    Thu:[{t:'Breakfast',n:'Toast & Eggs'}],
    Fri:[{t:'Lunch',n:'Chicken Rice'},{t:'Dinner',n:'Salad Bowl'}],
    Sat:[{t:'Breakfast',n:'Strawberry Smoothie'},{t:'Dinner',n:'BBQ Night'}],
    Sun:[{t:'Lunch',n:'Family Nasi'}],
  },
  chartData:[
    {m:'Jan',saved:5.2,wasted:2.1},{m:'Feb',saved:6.8,wasted:1.4},
    {m:'Mar',saved:4.5,wasted:3.2},{m:'Apr',saved:7.2,wasted:0.8},
  ],

  // Function to fetch inventory from a backend (for Postman testing)
  async fetchInventory() {
    try {
      // When you build your Node.js/Express server, you will change this URL
      const response = await fetch('http://localhost:3000/api/inventory');
      this.inventory = await response.json();
      return this.inventory;
    } catch (err) {
      console.warn("Backend not found, using local mock data.");
      return this.inventory;
    }
  },

  user: JSON.parse(sessionStorage.getItem('sp_user') || 'null'),
  setUser(u)   { this.user=u; sessionStorage.setItem('sp_user',JSON.stringify(u)); },
  clearUser()  { this.user=null; sessionStorage.removeItem('sp_user'); },

  guardAuth()  { if(!this.user) window.location.href='index.html'; },

  renderSidebar(active) {
    const u = this.user || {};
    const links = [
      { id:'dashboard',  label:'Dashboard',     href:'dashboard.html'  },
      { id:'meals',      label:'Meal Planning',  href:'meals.html'      },
      { id:'inventory',  label:'Inventory',      href:'inventory.html'  },
      { id:'settings',   label:'Settings',       href:'settings.html'   },
    ];
    return `
      <div class="sidebar">
        <div class="sidebar-profile">
          <div class="sidebar-avatar">👤</div>
          <div>
            <div class="sidebar-name">${u.name||'User'}</div>
            <div class="sidebar-email">${u.email||''}</div>
          </div>
        </div>
        <nav class="sidebar-nav">
          ${links.map(l=>`
            <a href="${l.href}" class="nav-link ${active===l.id?'active':''}">${l.label}</a>
          `).join('')}
        </nav>
      </div>`;
  },

  renderTopbar(title) {
    return `
      <div class="topbar">
        <span class="topbar-title">${title}</span>
        <div class="topbar-right">
          <a href="notifications.html" class="notif-btn">🔔<span class="notif-badge">3</span></a>
          <a href="settings.html" class="topbar-avatar">👤</a>
        </div>
      </div>`;
  },

  statusLabel(s){ return s==='danger'?'Expiring Soon':s==='warn'?'Watch':'Fresh'; },
  daysLeft(exp){
    const d = Math.ceil((new Date(exp)-new Date())/(1000*60*60*24));
    return d<=0?'Expired':d===1?'1 day':`${d} days`;
  },
};
