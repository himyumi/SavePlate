/* ================================================================
   SavePlate – data.js  (localStorage-backed data layer)
   ================================================================ */

const SavePlate = (() => {
  /* ── helpers ────────────────────────────────────────────────── */
  function load(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  }
  function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

  /* ── seed data (only written on first visit) ─────────────────── */
  const SEED_INVENTORY = [
    { id: 1, name: "Fresh Milk", emoji: "🥛", cat: "Dairy",  qty: "1 Liter",   loc: "Fridge",  exp: futureDate(1),  status: "danger", usedUp: false, donated: false },
    { id: 2, name: "Greek Yogurt", emoji: "🥛", cat: "Dairy",  qty: "500g",      loc: "Fridge",  exp: futureDate(3),  status: "warn",   usedUp: false, donated: false },
    { id: 3, name: "Apple",      emoji: "🍎", cat: "Fruits", qty: "500g",      loc: "Fridge",  exp: futureDate(10), status: "ok",     usedUp: false, donated: false },
    { id: 4, name: "Chicken Thigh", emoji: "🍗", cat: "Meat",   qty: "800g",      loc: "Freezer", exp: futureDate(7),  status: "ok",     usedUp: false, donated: false },
    { id: 5, name: "Broccoli",   emoji: "🥦", cat: "Vegetables", qty: "300g",   loc: "Fridge",  exp: futureDate(4),  status: "warn",   usedUp: false, donated: false },
    { id: 6, name: "Basmati Rice", emoji: "🌾", cat: "Grains", qty: "2kg",      loc: "Pantry",  exp: futureDate(180),status: "ok",     usedUp: false, donated: false },
    { id: 7, name: "Eggs",       emoji: "🥚", cat: "Dairy",  qty: "12 pcs",    loc: "Fridge",  exp: futureDate(14), status: "ok",     usedUp: false, donated: false },
  ];

  const SEED_DONATIONS = [
    { id: 101, emoji: "🌾", name: "Basmati Rice",    qty: "1kg",  loc: "Petaling Jaya", exp: "Jan 2027", donor: "Ahmad",  claimed: false },
    { id: 102, emoji: "🥕", name: "Carrots",         qty: "500g", loc: "Kuala Lumpur",  exp: "Apr 27",   donor: "Siti",   claimed: false },
    { id: 103, emoji: "🥫", name: "Sardines (canned)",qty: "3 tins",loc:"Subang Jaya",  exp: "Mar 2027", donor: "Chen",   claimed: false },
    { id: 104, emoji: "🧅", name: "Onions",          qty: "1kg",  loc: "Cheras",        exp: "Apr 20",   donor: "Ravi",   claimed: false },
    { id: 105, emoji: "🍚", name: "White Rice",      qty: "3kg",  loc: "Kepong",        exp: "Dec 2026", donor: "Aishah", claimed: false },
    { id: 106, emoji: "🥜", name: "Peanut Butter",   qty: "1 jar",loc: "Ampang",        exp: "Sep 2026", donor: "Lee",    claimed: false },
  ];

  const SEED_MEALS = {
    Mon: [{ t: "Breakfast", n: "Egg Toast", ingredients: "Eggs, Bread", notes: "" },
          { t: "Lunch",     n: "Fried Rice", ingredients: "Rice, Eggs, Vegetables", notes: "" },
          { t: "Dinner",    n: "Chicken Stir-fry", ingredients: "Chicken Thigh, Broccoli", notes: "" }],
    Tue: [{ t: "Breakfast", n: "Greek Yogurt Parfait", ingredients: "Greek Yogurt, Apple", notes: "" },
          { t: "Lunch",     n: "Nasi Lemak", ingredients: "Rice, Eggs", notes: "" }],
    Wed: [{ t: "Lunch",     n: "Pasta",       ingredients: "Pasta, Tomatoes", notes: "" },
          { t: "Dinner",    n: "Tomato Soup", ingredients: "Tomatoes, Onions", notes: "" }],
    Thu: [{ t: "Breakfast", n: "Toast & Eggs", ingredients: "Eggs, Bread", notes: "" }],
    Fri: [{ t: "Lunch",     n: "Chicken Rice", ingredients: "Chicken Thigh, Rice", notes: "" },
          { t: "Dinner",    n: "Salad Bowl",   ingredients: "Vegetables, Broccoli", notes: "" }],
    Sat: [{ t: "Breakfast", n: "Strawberry Smoothie", ingredients: "Milk, Strawberries", notes: "" },
          { t: "Dinner",    n: "BBQ Night", ingredients: "Chicken Thigh", notes: "" }],
    Sun: [{ t: "Lunch",     n: "Family Nasi", ingredients: "Rice, Chicken", notes: "" }],
  };

  const SEED_NOTIFICATIONS = [
    { id: 1, type: "danger", icon: "⚠️", title: "Expiry Alert: Fresh Milk", body: "Your Fresh Milk (1L) expires tomorrow. Use it or consider donating.", time: "2 hours ago", read: false },
    { id: 2, type: "success",icon: "✅", title: "Donation Claimed",          body: "Your donated Basmati Rice has been claimed. Arrange pickup by tomorrow.", time: "5 hours ago", read: false },
    { id: 3, type: "",       icon: "🍽️",title: "Meal Plan Reminder",         body: "You haven't planned meals for the weekend. Use your Broccoli and Eggs soon.", time: "Yesterday", read: false },
    { id: 4, type: "",       icon: "🔒", title: "Security: New Login Detected",body: "A new login was detected. Change your password if it wasn't you.", time: "2 days ago", read: true  },
    { id: 5, type: "success",icon: "🌿", title: "Monthly Achievement Unlocked!", body: "You saved 7.2kg of food this month. You're in the top 20% of SavePlate users!", time: "3 days ago", read: true },
  ];

  const SEED_ANALYTICS = [
    { m: "Jan", saved: 5.2, wasted: 2.1, donated: 1.0 },
    { m: "Feb", saved: 6.8, wasted: 1.4, donated: 2.2 },
    { m: "Mar", saved: 4.5, wasted: 3.2, donated: 0.8 },
    { m: "Apr", saved: 7.2, wasted: 0.8, donated: 3.1 },
  ];

  /* initialise DB on first run */
  if (!localStorage.getItem("sp_inventory"))  save("sp_inventory",  SEED_INVENTORY);
  if (!localStorage.getItem("sp_donations"))  save("sp_donations",  SEED_DONATIONS);
  if (!localStorage.getItem("sp_meals"))      save("sp_meals",      SEED_MEALS);
  if (!localStorage.getItem("sp_notifs"))     save("sp_notifs",     SEED_NOTIFICATIONS);
  if (!localStorage.getItem("sp_analytics"))  save("sp_analytics",  SEED_ANALYTICS);
  if (!localStorage.getItem("sp_nextId"))     save("sp_nextId",     200);
  if (!localStorage.getItem("sp_settings"))   save("sp_settings",   { twofa:true, emailAlerts:true, notifs:true, darkMode:false });

  /* ── utility ──────────────────────────────────────────────────── */
  function futureDate(days) {
    const d = new Date(); d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  }
  function nextId() { const n = load("sp_nextId", 200) + 1; save("sp_nextId", n); return n; }

  /* ── public API ────────────────────────────────────────────────── */
  return {
    /* live getters (always fresh from localStorage) */
    get inventory()     { return load("sp_inventory",  []); },
    set inventory(v)    { save("sp_inventory", v); },
    get donations()     { return load("sp_donations",  []); },
    set donations(v)    { save("sp_donations", v); },
    get meals()         { return load("sp_meals",      {}); },
    set meals(v)        { save("sp_meals", v); },
    get notifications() { return load("sp_notifs",     []); },
    set notifications(v){ save("sp_notifs", v); },
    get analytics()     { return load("sp_analytics",  []); },
    set analytics(v)    { save("sp_analytics", v); },
    get settings()      { return load("sp_settings",   {}); },
    set settings(v)     { save("sp_settings", v); },

    /* user session (sessionStorage — logs out on tab close) */
    get user() { try { return JSON.parse(sessionStorage.getItem("sp_user")); } catch { return null; } },
    setUser(u) { sessionStorage.setItem("sp_user", JSON.stringify(u)); },
    clearUser(){ sessionStorage.removeItem("sp_user"); },

    guardAuth() { if (!this.user) window.location.href = "index.html"; },

    /* ── Inventory CRUD ──────────────────────────────────────── */
    addInventoryItem(item) {
      const inv = this.inventory;
      const diff = (new Date(item.exp) - new Date()) / 86400000;
      item.status = diff <= 2 ? "danger" : diff <= 5 ? "warn" : "ok";
      item.id = nextId();
      item.usedUp  = false;
      item.donated = false;
      inv.unshift(item);
      this.inventory = inv;
      this._addNotif("📦", "Item Added", `${item.name} added to your inventory.`, "");
      this._updateAnalytics("saved", 0.1);
    },
    removeInventoryItem(id) {
      this.inventory = this.inventory.filter(i => i.id !== id);
    },
    markItemUsed(id) {
      const inv = this.inventory;
      const item = inv.find(i => i.id === id);
      if (item) {
        item.usedUp = true;
        this.inventory = inv;
        this._addNotif("✅", "Item Marked Used", `${item.name} marked as used. Great job reducing waste!`, "success");
        this._updateAnalytics("saved", 0.3);
      }
    },
    convertToDonation(id) {
      const inv = this.inventory;
      const item = inv.find(i => i.id === id);
      if (!item) return;
      item.donated = true;
      this.inventory = inv;
      const donations = this.donations;
      const u = this.user || {};
      donations.unshift({
        id: nextId(), emoji: item.emoji, name: item.name, qty: item.qty,
        loc: "My Location", exp: new Date(item.exp).toLocaleDateString("en-US",{month:"short", day:"numeric"}),
        donor: u.name || "You", claimed: false, fromInventory: true
      });
      this.donations = donations;
      this._addNotif("🤝", "Item Listed for Donation", `${item.name} is now listed as a donation.`, "success");
    },
    updateInventoryStatus() {
      const inv = this.inventory.map(i => {
        const diff = (new Date(i.exp) - new Date()) / 86400000;
        i.status = diff <= 0 ? "danger" : diff <= 2 ? "danger" : diff <= 5 ? "warn" : "ok";
        return i;
      });
      this.inventory = inv;
    },

    /* ── Donations ──────────────────────────────────────────────── */
    claimDonation(id) {
      const donations = this.donations;
      const d = donations.find(x => x.id === id);
      if (d && !d.claimed) {
        d.claimed = true;
        this.donations = donations;
        this._addNotif("✅", "Donation Claimed", `You claimed "${d.name}". Contact ${d.donor} to arrange pickup.`, "success");
        return true;
      }
      return false;
    },

    /* ── Meals ──────────────────────────────────────────────────── */
    addMeal(dateKey, mealObj) {
      const meals = this.meals;
      if (!meals[dateKey]) meals[dateKey] = [];
      meals[dateKey].push(mealObj);
      this.meals = meals;
    },
    removeMeal(dateKey, idx) {
      const meals = this.meals;
      if (meals[dateKey]) { meals[dateKey].splice(idx, 1); this.meals = meals; }
    },

    /* ── Notifications ──────────────────────────────────────────── */
    _addNotif(icon, title, body, type) {
      const notifs = this.notifications;
      notifs.unshift({ id: nextId(), icon, title, body, type, time: "Just now", read: false });
      this.notifications = notifs;
    },
    markNotifRead(id) {
      const n = this.notifications.map(x => x.id === id ? {...x, read:true} : x);
      this.notifications = n;
    },
    markAllRead() {
      this.notifications = this.notifications.map(x => ({...x, read:true}));
    },
    get unreadCount() { return this.notifications.filter(n => !n.read).length; },

    /* ── Analytics ──────────────────────────────────────────────── */
    _updateAnalytics(field, amount) {
      const a = this.analytics;
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const cur = months[new Date().getMonth()];
      const row = a.find(r => r.m === cur);
      if (row) row[field] = +((row[field]||0) + amount).toFixed(2);
      this.analytics = a;
    },

    /* ── Render helpers ─────────────────────────────────────────── */
    renderSidebar(active) {
      const u = this.user || {};
      const unread = this.unreadCount;
      const links = [
        { id: "dashboard",  label: "Dashboard",        href: "dashboard.html" },
        { id: "meals",      label: "Meal Planning",     href: "meals.html" },
        { id: "inventory",  label: "Inventory",         href: "inventory.html" },
        { id: "browse",     label: "Browse Donations",  href: "browse.html" },
        { id: "analytics",  label: "Analytics",         href: "analytics.html" },
        { id: "settings",   label: "Settings",          href: "settings.html" },
      ];
      return `<div class="sidebar">
        <div class="sidebar-profile">
          <div class="sidebar-avatar"><img src="images/SmallLogo.png" alt="SavePlate Logo" /></div>
          <div>
            <div class="sidebar-name">
            SAVEPLATE
            </div>
          </div>
        </div>
        <nav class="sidebar-nav">
          ${links.map(l => `<a href="${l.href}" class="nav-link ${active===l.id?"active":""}">${l.label}</a>`).join("")}
        </nav>
      </div>`;
    },

    renderTopbar(title) {
      const unread = this.unreadCount;
      return `<div class="topbar">
        <span class="topbar-title">${title}</span>
        <div class="topbar-right">
          <a href="notifications.html" class="notif-btn" style="text-decoration:none;font-size:20px;position:relative;color:#aaa;">
            🔔${unread > 0 ? `<span class="notif-badge">${unread}</span>` : ""}
          </a>
          <a href="settings.html" class="topbar-avatar" style="text-decoration:none;display:flex;align-items:center;justify-content:center;">👤</a>
        </div>
      </div>`;
    },

    statusLabel(s) { return s==="danger"?"Expiring Soon":s==="warn"?"Watch":"Fresh"; },
    daysLeft(exp) {
      const d = Math.ceil((new Date(exp) - new Date()) / 86400000);
      return d <= 0 ? "Expired" : d === 1 ? "1 day" : `${d} days`;
    },

    catEmoji: { Dairy:"🥛", Fruits:"🍎", Meat:"🍗", Vegetables:"🥦", Grains:"🌾", Canned:"🥫", Frozen:"❄️", Bakery:"🍞", Other:"🍽" },
  };
})();
