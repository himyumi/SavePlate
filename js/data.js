/* ================================================================
   SavePlate – data.js  (Firebase Auth + Firestore backend)
   ================================================================
   Loads user data from Firestore into an in-memory cache on page load.
   All synchronous SavePlate.* getters read from cache.
   Writes go to both the cache and Firestore.
   Pages must wait for SavePlate.ready before accessing data.
   ================================================================ */

const SavePlate = (() => {
  const auth = firebase.auth();
  const db   = firebase.firestore();

  let _uid     = null;
  let _profile = { name: "", twofa: false };

  const _cache = {
    inventory: [],
    donations: [],
    meals: {},
    notifications: [],
    analytics: [],
    settings: { twofa: true, emailAlerts: true, notifs: true, darkMode: false },
  };

  /* ── seed data (only written on first-ever login for a user) ──── */
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

  /* ── utility ──────────────────────────────────────────────────── */
  function futureDate(days) {
    const d = new Date(); d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  }
  function nextId() {
    return Date.now() * 1000 + Math.floor(Math.random() * 1000);
  }

  /* ── load user data from Firestore into _cache ──────────────── */
  async function loadUserData(user) {
    _uid = user.uid;
    const userRef = db.collection("users").doc(_uid);

    const profileSnap = await userRef.get();
    if (!profileSnap.exists) {
      _profile = { name: user.email.split("@")[0], twofa: false };
      await userRef.set(_profile);
    } else {
      _profile = profileSnap.data();
    }

    const [invSnap, notifSnap, analySnap, mealsSnap, settingsSnap, donSnap] = await Promise.all([
      userRef.collection("inventory").get(),
      userRef.collection("notifications").get(),
      userRef.collection("analytics").get(),
      userRef.collection("data").doc("meals").get(),
      userRef.collection("data").doc("settings").get(),
      db.collection("donations").get(),
    ]);

    if (invSnap.empty) {
      await seedSubcollection(userRef.collection("inventory"), SEED_INVENTORY);
      _cache.inventory = [...SEED_INVENTORY];
    } else {
      _cache.inventory = invSnap.docs.map(d => d.data());
    }

    if (notifSnap.empty) {
      await seedSubcollection(userRef.collection("notifications"), SEED_NOTIFICATIONS);
      _cache.notifications = [...SEED_NOTIFICATIONS];
    } else {
      _cache.notifications = notifSnap.docs.map(d => d.data());
    }

    if (analySnap.empty) {
      await Promise.all(SEED_ANALYTICS.map(a => userRef.collection("analytics").doc(a.m).set(a)));
      _cache.analytics = [...SEED_ANALYTICS];
    } else {
      _cache.analytics = analySnap.docs.map(d => d.data());
    }

    if (!mealsSnap.exists) {
      await userRef.collection("data").doc("meals").set({ data: SEED_MEALS });
      _cache.meals = { ...SEED_MEALS };
    } else {
      _cache.meals = mealsSnap.data().data || {};
    }

    if (!settingsSnap.exists) {
      await userRef.collection("data").doc("settings").set(_cache.settings);
    } else {
      _cache.settings = settingsSnap.data();
    }

    if (donSnap.empty) {
      await seedDonations();
    } else {
      _cache.donations = donSnap.docs.map(d => d.data());
    }
  }

  async function seedSubcollection(ref, seedArr) {
    await Promise.all(seedArr.map(item => ref.doc(String(item.id)).set(item)));
  }

  async function seedDonations() {
    await Promise.all(SEED_DONATIONS.map(d => db.collection("donations").doc(String(d.id)).set(d)));
    _cache.donations = [...SEED_DONATIONS];
  }

  function clearCache() {
    _uid = null;
    _profile = { name: "", twofa: false };
    _cache.inventory = [];
    _cache.donations = [];
    _cache.meals = {};
    _cache.notifications = [];
    _cache.analytics = [];
    _cache.settings = { twofa: true, emailAlerts: true, notifs: true, darkMode: false };
  }

  /* ── ready promise — resolves after auth state + initial load ── */
  const ready = new Promise((resolve) => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        try { await loadUserData(user); }
        catch (e) { console.error("Failed to load user data:", e); }
      } else {
        clearCache();
      }
      resolve();
    });
  });

  /* ── public API ────────────────────────────────────────────────── */
  return {
    ready,

    get inventory()      { return _cache.inventory; },
    set inventory(v)     { _cache.inventory = v; },
    get donations()      { return _cache.donations; },
    set donations(v)     { _cache.donations = v; },
    get meals()          { return _cache.meals; },
    set meals(v)         {
      _cache.meals = v;
      if (_uid) db.collection("users").doc(_uid).collection("data").doc("meals").set({ data: v });
    },
    get notifications()  { return _cache.notifications; },
    set notifications(v) { _cache.notifications = v; },
    get analytics()      { return _cache.analytics; },
    set analytics(v)     { _cache.analytics = v; },
    get settings()       { return _cache.settings; },
    set settings(v)      {
      _cache.settings = v;
      if (_uid) db.collection("users").doc(_uid).collection("data").doc("settings").set(v);
    },

    get user() {
      const u = auth.currentUser;
      if (!u) return null;
      return { name: _profile.name || u.email.split("@")[0], email: u.email, twofa: !!_profile.twofa };
    },

    setUser(_u) { /* no-op — Firebase manages session */ },
    clearUser() { return auth.signOut(); },

    guardAuth() { if (!auth.currentUser) window.location.href = "index.html"; },

    async saveProfile(name, twofa) {
      _profile = { name, twofa: !!twofa };
      if (_uid) await db.collection("users").doc(_uid).set(_profile);
    },

    async clearUserData() {
      if (!_uid) return;
      const userRef = db.collection("users").doc(_uid);
      const subs = ["inventory", "notifications", "analytics"];
      for (const sub of subs) {
        const snap = await userRef.collection(sub).get();
        await Promise.all(snap.docs.map(d => d.ref.delete()));
      }
      await userRef.collection("data").doc("meals").delete().catch(() => {});
      await userRef.collection("data").doc("settings").delete().catch(() => {});
      clearCache();
    },

    /* ── Inventory CRUD ──────────────────────────────────────── */
    addInventoryItem(item) {
      const diff = (new Date(item.exp) - new Date()) / 86400000;
      item.status = diff <= 2 ? "danger" : diff <= 5 ? "warn" : "ok";
      item.id = nextId();
      item.usedUp  = false;
      item.donated = false;
      _cache.inventory.unshift(item);
      if (_uid) db.collection("users").doc(_uid).collection("inventory").doc(String(item.id)).set(item);
      this._addNotif("📦", "Item Added", `${item.name} added to your inventory.`, "");
      this._updateAnalytics("saved", 0.1);
    },
    removeInventoryItem(id) {
      _cache.inventory = _cache.inventory.filter(i => i.id !== id);
      if (_uid) db.collection("users").doc(_uid).collection("inventory").doc(String(id)).delete();
    },
    markItemUsed(id) {
      const item = _cache.inventory.find(i => i.id === id);
      if (item) {
        item.usedUp = true;
        if (_uid) db.collection("users").doc(_uid).collection("inventory").doc(String(id)).set(item);
        this._addNotif("✅", "Item Marked Used", `${item.name} marked as used. Great job reducing waste!`, "success");
        this._updateAnalytics("saved", 0.3);
      }
    },
    convertToDonation(id) {
      const item = _cache.inventory.find(i => i.id === id);
      if (!item) return;
      item.donated = true;
      if (_uid) db.collection("users").doc(_uid).collection("inventory").doc(String(id)).set(item);
      const u = this.user || {};
      const donation = {
        id: nextId(), emoji: item.emoji, name: item.name, qty: item.qty,
        loc: "My Location", exp: new Date(item.exp).toLocaleDateString("en-US",{month:"short", day:"numeric"}),
        donor: u.name || "You", claimed: false, fromInventory: true
      };
      _cache.donations.unshift(donation);
      db.collection("donations").doc(String(donation.id)).set(donation);
      this._addNotif("🤝", "Item Listed for Donation", `${item.name} is now listed as a donation.`, "success");
    },
    updateInventoryStatus() {
      const changed = [];
      _cache.inventory.forEach(i => {
        const diff = (new Date(i.exp) - new Date()) / 86400000;
        const newStatus = diff <= 0 ? "danger" : diff <= 2 ? "danger" : diff <= 5 ? "warn" : "ok";
        if (i.status !== newStatus) {
          i.status = newStatus;
          changed.push(i);
        }
      });
      if (_uid && changed.length) {
        changed.forEach(i => db.collection("users").doc(_uid).collection("inventory").doc(String(i.id)).set(i));
      }
    },

    /* ── Donations ──────────────────────────────────────────────── */
    claimDonation(id) {
      const d = _cache.donations.find(x => x.id === id);
      if (d && !d.claimed) {
        d.claimed = true;
        db.collection("donations").doc(String(id)).set(d);
        this._addNotif("✅", "Donation Claimed", `You claimed "${d.name}". Contact ${d.donor} to arrange pickup.`, "success");
        return true;
      }
      return false;
    },

    /* ── Meals ──────────────────────────────────────────────────── */
    addMeal(dateKey, mealObj) {
      if (!_cache.meals[dateKey]) _cache.meals[dateKey] = [];
      _cache.meals[dateKey].push(mealObj);
      this.meals = _cache.meals;
    },
    removeMeal(dateKey, idx) {
      if (_cache.meals[dateKey]) {
        _cache.meals[dateKey].splice(idx, 1);
        this.meals = _cache.meals;
      }
    },

    /* ── Notifications ──────────────────────────────────────────── */
    _addNotif(icon, title, body, type) {
      const notif = { id: nextId(), icon, title, body, type, time: "Just now", read: false };
      _cache.notifications.unshift(notif);
      if (_uid) db.collection("users").doc(_uid).collection("notifications").doc(String(notif.id)).set(notif);
    },
    markNotifRead(id) {
      const n = _cache.notifications.find(x => x.id === id);
      if (n) {
        n.read = true;
        if (_uid) db.collection("users").doc(_uid).collection("notifications").doc(String(id)).set(n);
      }
    },
    markAllRead() {
      _cache.notifications.forEach(n => {
        n.read = true;
        if (_uid) db.collection("users").doc(_uid).collection("notifications").doc(String(n.id)).set(n);
      });
    },
    get unreadCount() { return _cache.notifications.filter(n => !n.read).length; },

    /* ── Analytics ──────────────────────────────────────────────── */
    _updateAnalytics(field, amount) {
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const cur = months[new Date().getMonth()];
      let row = _cache.analytics.find(r => r.m === cur);
      if (!row) {
        row = { m: cur, saved: 0, wasted: 0, donated: 0 };
        _cache.analytics.push(row);
      }
      row[field] = +((row[field] || 0) + amount).toFixed(2);
      if (_uid) db.collection("users").doc(_uid).collection("analytics").doc(cur).set(row);
    },

    /* ── Render helpers ─────────────────────────────────────────── */
    renderSidebar(active) {
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
