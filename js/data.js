/**
 * SavePlate — Shared Data Store
 * All data persists via localStorage.
 */
const SavePlate = {

  // ── DEFAULT SEED DATA ────────────────────────────────────────────────────────
  _defaultInventory: [
    { id:'i1', name:'Milk',          emoji:'🥛', cat:'Dairy',      qty:'1 Liter',   loc:'Fridge',  exp:'2026-05-10', notes:'' },
    { id:'i2', name:'Yogurt',        emoji:'🥛', cat:'Dairy',      qty:'12 Pieces', loc:'Fridge',  exp:'2026-04-27', notes:'' },
    { id:'i3', name:'Apple',         emoji:'🍎', cat:'Fruits',     qty:'500g',      loc:'Fridge',  exp:'2026-05-15', notes:'' },
    { id:'i4', name:'Chicken thigh', emoji:'🍗', cat:'Meat',       qty:'800g',      loc:'Freezer', exp:'2026-04-29', notes:'' },
    { id:'i5', name:'Brown Rice',    emoji:'🌾', cat:'Grains',     qty:'2kg',       loc:'Pantry',  exp:'2027-01-01', notes:'' },
    { id:'i6', name:'Broccoli',      emoji:'🥦', cat:'Vegetables', qty:'300g',      loc:'Fridge',  exp:'2026-04-26', notes:'Use soon' },
  ],

  _defaultDonations: [
    { id:'d1', emoji:'🌾', name:'Basmati Rice',     qty:'1kg',    loc:'Petaling Jaya', exp:'2027-01-15', donor:'Ahmad',  claimed:false },
    { id:'d2', emoji:'🥕', name:'Carrots',           qty:'500g',   loc:'Kuala Lumpur',  exp:'2026-05-02', donor:'Siti',   claimed:false },
    { id:'d3', emoji:'🥫', name:'Sardines (canned)', qty:'3 tins', loc:'Subang Jaya',   exp:'2027-03-01', donor:'Chen',   claimed:false },
    { id:'d4', emoji:'🧅', name:'Onions',            qty:'1kg',    loc:'Cheras',        exp:'2026-05-05', donor:'Ravi',   claimed:false },
    { id:'d5', emoji:'🍚', name:'White Rice',        qty:'3kg',    loc:'Kepong',        exp:'2026-12-01', donor:'Aishah', claimed:false },
    { id:'d6', emoji:'🥜', name:'Peanut Butter',     qty:'1 jar',  loc:'Ampang',        exp:'2026-09-01', donor:'Lee',    claimed:false },
  ],

  _defaultMeals: [
    { id:'m1', date:'2026-04-25', type:'Dinner',    name:'Chicken Stir-fry with Spinach', ingredients:'Chicken Breast, Spinach, Brown Rice, Soy Sauce', notes:'Use chicken and spinach before they expire' },
    { id:'m2', date:'2026-04-26', type:'Breakfast', name:'Greek Yogurt Parfait',          ingredients:'Yogurt, Granola, Honey, Berries',                notes:'' },
    { id:'m3', date:'2026-04-26', type:'Lunch',     name:'Fried Rice',                    ingredients:'Brown Rice, Eggs, Soy Sauce, Spring Onion',      notes:'Use leftover rice' },
    { id:'m4', date:'2026-04-27', type:'Breakfast', name:'Strawberry Smoothie',           ingredients:'Milk, Strawberries, Banana, Honey',              notes:'' },
    { id:'m5', date:'2026-04-28', type:'Lunch',     name:'Broccoli Stir-fry',             ingredients:'Broccoli, Garlic, Soy Sauce, Sesame Oil',        notes:'Use broccoli before it expires' },
  ],

  _defaultNotifications: [
    { id:'n1', type:'danger',  icon:'⚠️', title:'Expiry Alert: Broccoli',        desc:'Your Broccoli expires tomorrow. Use it or donate.',             time:'Just now',  read:false },
    { id:'n2', type:'danger',  icon:'⚠️', title:'Expiry Alert: Yogurt',          desc:'Your Yogurt expires in 3 days. Plan a meal using it.',          time:'2 hrs ago', read:false },
    { id:'n3', type:'success', icon:'✅', title:'Donation Claimed',              desc:'Your donated Basmati Rice has been claimed. Arrange pickup.',   time:'5 hrs ago', read:false },
    { id:'n4', type:'unread',  icon:'🍽️', title:'Meal Plan Reminder',            desc:'Weekend meals not planned. Use Broccoli and Eggs soon.',        time:'Yesterday', read:true  },
    { id:'n5', type:'',        icon:'🔒', title:'Security: New Login Detected',  desc:'A new login was detected. Change your password if not you.',    time:'2 days ago',read:true  },
    { id:'n6', type:'success', icon:'🌿', title:'Achievement Unlocked!',         desc:'You saved 7.2kg of food this month. Top 20% of users!',         time:'3 days ago',read:true  },
  ],

  // ── STORAGE ──────────────────────────────────────────────────────────────────
  _load(key, def) {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : JSON.parse(JSON.stringify(def)); }
    catch { return JSON.parse(JSON.stringify(def)); }
  },
  _save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch(e){} },
  _uid() { return '_' + Math.random().toString(36).slice(2,9); },

  get inventory()     { return this._load('sp_inventory',      this._defaultInventory);     },
  set inventory(v)    { this._save('sp_inventory', v); },
  get donations()     { return this._load('sp_donations',      this._defaultDonations);     },
  set donations(v)    { this._save('sp_donations', v); },
  get meals()         { return this._load('sp_meals',          this._defaultMeals);         },
  set meals(v)        { this._save('sp_meals', v); },
  get notifications() { return this._load('sp_notifications',  this._defaultNotifications); },
  set notifications(v){ this._save('sp_notifications', v); },

  // ── SESSION ──────────────────────────────────────────────────────────────────
  get user()  { try { return JSON.parse(sessionStorage.getItem('sp_user')); } catch { return null; } },
  setUser(u)  { sessionStorage.setItem('sp_user', JSON.stringify(u)); },
  clearUser() { sessionStorage.removeItem('sp_user'); },
  guardAuth() { if (!this.user) window.location.href = 'index.html'; },

  // ── INVENTORY CRUD ────────────────────────────────────────────────────────────
  addInventoryItem(item) {
    const list = this.inventory;
    item.id = this._uid();
    item.status = this._calcStatus(item.exp);
    list.unshift(item);
    this.inventory = list;
    this._addNotif('success','✅','Item Added',`"${item.name}" was added to your inventory.`);
  },
  updateInventoryItem(id, updates) {
    this.inventory = this.inventory.map(i => {
      if (i.id !== id) return i;
      const u = {...i, ...updates};
      u.status = this._calcStatus(u.exp);
      return u;
    });
  },
  deleteInventoryItem(id) {
    const item = this.inventory.find(i => i.id === id);
    this.inventory = this.inventory.filter(i => i.id !== id);
    if (item) this._addNotif('','🗑️','Item Removed',`"${item.name}" was removed from inventory.`);
  },
  _calcStatus(exp) {
    const d = (new Date(exp) - new Date()) / (1000*60*60*24);
    return d <= 2 ? 'danger' : d <= 7 ? 'warn' : 'ok';
  },

  // ── MEAL CRUD ─────────────────────────────────────────────────────────────────
  addMeal(meal) {
    const list = this.meals; meal.id = this._uid(); list.push(meal); this.meals = list;
    this._addNotif('success','📅','Meal Planned',`"${meal.name}" added to your plan.`);
  },
  updateMeal(id, updates) { this.meals = this.meals.map(m => m.id===id ? {...m,...updates} : m); },
  deleteMeal(id) {
    const m = this.meals.find(x => x.id===id);
    this.meals = this.meals.filter(x => x.id!==id);
    if (m) this._addNotif('','🗑️','Meal Removed',`"${m.name}" removed from plan.`);
  },
  getMealsForDate(dateStr) { return this.meals.filter(m => m.date===dateStr); },

  // ── DONATION CRUD ─────────────────────────────────────────────────────────────
  addDonation(item) {
    const list = this.donations; item.id = this._uid(); item.claimed = false; list.unshift(item); this.donations = list;
    this._addNotif('success','🤝','Donation Posted',`"${item.name}" is now listed for donation.`);
  },
  claimDonation(id) {
    const d = this.donations.find(x => x.id===id);
    if (!d || d.claimed) return;
    this.donations = this.donations.map(x => x.id===id ? {...x, claimed:true} : x);
    this._addNotif('success','🤝','Donation Claimed!',`You claimed "${d.name}" from ${d.donor}. Arrange pickup soon.`);
  },

  // ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
  _addNotif(type, icon, title, desc) {
    const list = this.notifications;
    list.unshift({ id:this._uid(), type, icon, title, desc, time:'Just now', read:false });
    this.notifications = list;
  },
  markAllRead()    { this.notifications = this.notifications.map(n => ({...n, read:true})); },
  deleteNotif(id)  { this.notifications = this.notifications.filter(n => n.id!==id); },
  get unreadCount(){ return this.notifications.filter(n => !n.read).length; },

  // ── STATS ─────────────────────────────────────────────────────────────────────
  get stats() {
    const inv = this.inventory;
    return {
      totalItems:   inv.length,
      expiringSoon: inv.filter(i => i.status==='danger'||i.status==='warn').length,
      mealPlans:    this.meals.length,
      wasteSaved:   (inv.filter(i => i.status==='ok').length * 0.3).toFixed(1) + 'kg',
    };
  },

  // ── HELPERS ───────────────────────────────────────────────────────────────────
  daysLeft(exp) {
    const d = Math.ceil((new Date(exp) - new Date()) / (1000*60*60*24));
    return d < 0 ? 'Expired' : d===0 ? 'Today' : d===1 ? '1 day' : `${d} days`;
  },
  formatDate(s) {
    if (!s) return '';
    return new Date(s).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
  },
  catEmoji: { Dairy:'🥛',Fruits:'🍎',Meat:'🍗',Vegetables:'🥦',Grains:'🌾',Canned:'🥫',Frozen:'❄️',Bakery:'🍞',Other:'🍽️' },

  // ── UI HELPERS ────────────────────────────────────────────────────────────────
  renderSidebar(active) {
    const u = this.user || {};
    const avatarSrc = u.photo || null;
    const avatarHtml = avatarSrc
      ? `<img src="${avatarSrc}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`
      : '👤';
    const links = [
      { id:'dashboard', label:'Dashboard',    href:'dashboard.html' },
      { id:'meals',     label:'Meal Planning', href:'meals.html' },
      { id:'inventory', label:'Inventory',     href:'inventory.html' },
      { id:'settings',  label:'Settings',      href:'settings.html' },
    ];
    return `
      <div class="sidebar">
        <div class="sidebar-profile">
          <div class="sidebar-avatar">${avatarHtml}</div>
          <div>
            <div class="sidebar-name">${u.name||'User'}</div>
            <div class="sidebar-email">${u.email||''}</div>
          </div>
        </div>
        <nav class="sidebar-nav">
          ${links.map(l=>`<a href="${l.href}" class="nav-link ${active===l.id?'active':''}">${l.label}</a>`).join('')}
        </nav>
      </div>`;
  },

  renderTopbar(title) {
    const count = this.unreadCount;
    return `
      <div class="topbar">
        <span class="topbar-title">${title}</span>
        <div class="topbar-right">
          <a href="notifications.html" class="notif-btn">🔔
            ${count>0?`<span class="notif-badge">${count}</span>`:''}
          </a>
          <a href="settings.html" class="topbar-avatar">👤</a>
        </div>
      </div>`;
  },

  // ── TOAST ─────────────────────────────────────────────────────────────────────
  toast(msg, type='success') {
    let el = document.getElementById('sp-toast');
    if (!el) {
      el = document.createElement('div'); el.id = 'sp-toast';
      el.style.cssText = 'position:fixed;bottom:28px;right:28px;z-index:9999;color:#fff;padding:12px 20px;border-radius:10px;font-family:"DM Sans",sans-serif;font-size:14px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,.2);opacity:0;transition:opacity .25s;pointer-events:none;max-width:300px;';
      document.body.appendChild(el);
    }
    el.style.background = type==='success'?'#27ae60':type==='error'?'#e53935':'#2c3e50';
    el.textContent = msg; el.style.opacity = '1';
    clearTimeout(el._t); el._t = setTimeout(()=>{ el.style.opacity='0'; }, 3000);
  },

  // ── EMAIL VALIDATION ──────────────────────────────────────────────────────────
  validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); },

  resetData() {
    ['sp_inventory','sp_donations','sp_meals','sp_notifications'].forEach(k=>localStorage.removeItem(k));
    location.reload();
  },
};
