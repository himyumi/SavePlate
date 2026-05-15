/* ================================================================
   SavePlate – data.js  (Firebase-backed data layer)
   ================================================================ */

const SavePlate = (() => {
  /* ── in-memory cache ─────────────────────────────────────────── */
  let _cache = {
    inventory:     [],
    donations:     [],
    meals:         {},
    notifications: [],
    analytics:     [],
    settings:      { twofa: true, emailAlerts: true, notifs: true, darkMode: false },
  };
  let _uid     = null;
  let _profile = null;

  /* ── ready promise (resolves when auth + data are loaded) ─────── */
  let _resolveReady;
  const ready = new Promise(r => { _resolveReady = r; });

  /* ── Firebase shortcuts ──────────────────────────────────────── */
  const db   = () => firebase.firestore();
  const auth = () => firebase.auth();

  /* ── unique numeric ID ───────────────────────────────────────── */
  function nextId() {
    return Date.now() * 1000 + Math.floor(Math.random() * 1000);
  }

  /* ── expiry helpers ──────────────────────────────────────────── */
  function futureDate(days) {
    const d = new Date(); d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  /* ── seed data (written once for new users) ──────────────────── */
  const SEED_INVENTORY = [
    { id: 1001, name: 'Fresh Milk',    emoji: '🥛', cat: 'Dairy',      qty: '1 Liter',  loc: 'Fridge',  exp: futureDate(1),   status: 'danger', usedUp: false, donated: false },
    { id: 1002, name: 'Greek Yogurt',  emoji: '🥛', cat: 'Dairy',      qty: '500g',     loc: 'Fridge',  exp: futureDate(3),   status: 'warn',   usedUp: false, donated: false },
    { id: 1003, name: 'Apple',         emoji: '🍎', cat: 'Fruits',     qty: '500g',     loc: 'Fridge',  exp: futureDate(10),  status: 'ok',     usedUp: false, donated: false },
    { id: 1004, name: 'Chicken Thigh', emoji: '🍗', cat: 'Meat',       qty: '800g',     loc: 'Freezer', exp: futureDate(7),   status: 'ok',     usedUp: false, donated: false },
    { id: 1005, name: 'Broccoli',      emoji: '🥦', cat: 'Vegetables', qty: '300g',     loc: 'Fridge',  exp: futureDate(4),   status: 'warn',   usedUp: false, donated: false },
    { id: 1006, name: 'Basmati Rice',  emoji: '🌾', cat: 'Grains',     qty: '2kg',      loc: 'Pantry',  exp: futureDate(180), status: 'ok',     usedUp: false, donated: false },
    { id: 1007, name: 'Eggs',          emoji: '🥚', cat: 'Dairy',      qty: '12 pcs',   loc: 'Fridge',  exp: futureDate(14),  status: 'ok',     usedUp: false, donated: false },
  ];

  const SEED_DONATIONS = [
    { id: 2001, emoji: '🌾', name: 'Basmati Rice',       qty: '1kg',    loc: 'Petaling Jaya', exp: 'Jan 2027', donor: 'Ahmad',  claimed: false },
    { id: 2002, emoji: '🥕', name: 'Carrots',            qty: '500g',   loc: 'Kuala Lumpur',  exp: 'Apr 27',   donor: 'Siti',   claimed: false },
    { id: 2003, emoji: '🥫', name: 'Sardines (canned)',  qty: '3 tins', loc: 'Subang Jaya',   exp: 'Mar 2027', donor: 'Chen',   claimed: false },
    { id: 2004, emoji: '🧅', name: 'Onions',             qty: '1kg',    loc: 'Cheras',        exp: 'Apr 20',   donor: 'Ravi',   claimed: false },
    { id: 2005, emoji: '🍚', name: 'White Rice',         qty: '3kg',    loc: 'Kepong',        exp: 'Dec 2026', donor: 'Aishah', claimed: false },
    { id: 2006, emoji: '🥜', name: 'Peanut Butter',      qty: '1 jar',  loc: 'Ampang',        exp: 'Sep 2026', donor: 'Lee',    claimed: false },
  ];

  const SEED_MEALS = {
    Mon: [{ t: 'Breakfast', n: 'Egg Toast',           ingredients: 'Eggs, Bread',           notes: '' },
          { t: 'Lunch',     n: 'Fried Rice',           ingredients: 'Rice, Eggs, Vegetables', notes: '' },
          { t: 'Dinner',    n: 'Chicken Stir-fry',     ingredients: 'Chicken Thigh, Broccoli', notes: '' }],
    Tue: [{ t: 'Breakfast', n: 'Greek Yogurt Parfait', ingredients: 'Greek Yogurt, Apple',   notes: '' },
          { t: 'Lunch',     n: 'Nasi Lemak',           ingredients: 'Rice, Eggs',            notes: '' }],
    Wed: [{ t: 'Lunch',     n: 'Pasta',                ingredients: 'Pasta, Tomatoes',       notes: '' },
          { t: 'Dinner',    n: 'Tomato Soup',          ingredients: 'Tomatoes, Onions',      notes: '' }],
    Thu: [{ t: 'Breakfast', n: 'Toast & Eggs',         ingredients: 'Eggs, Bread',           notes: '' }],
    Fri: [{ t: 'Lunch',     n: 'Chicken Rice',         ingredients: 'Chicken Thigh, Rice',   notes: '' },
          { t: 'Dinner',    n: 'Salad Bowl',           ingredients: 'Vegetables, Broccoli',  notes: '' }],
    Sat: [{ t: 'Breakfast', n: 'Strawberry Smoothie',  ingredients: 'Milk, Strawberries',    notes: '' },
          { t: 'Dinner',    n: 'BBQ Night',            ingredients: 'Chicken Thigh',         notes: '' }],
    Sun: [{ t: 'Lunch',     n: 'Family Nasi',          ingredients: 'Rice, Chicken',         notes: '' }],
  };

  const SEED_NOTIFICATIONS = [
    { id: 3001, type: 'danger',  icon: '⚠️', title: 'Expiry Alert: Fresh Milk',       body: 'Your Fresh Milk (1L) expires tomorrow. Use it or consider donating.', time: '2 hours ago', read: false },
    { id: 3002, type: 'success', icon: '✅', title: 'Donation Claimed',                body: 'Your donated Basmati Rice has been claimed. Arrange pickup by tomorrow.', time: '5 hours ago', read: false },
    { id: 3003, type: '',        icon: '🍽️', title: 'Meal Plan Reminder',              body: "You haven't planned meals for the weekend. Use your Broccoli and Eggs soon.", time: 'Yesterday', read: false },
    { id: 3004, type: '',        icon: '🔒', title: 'Security: New Login Detected',    body: "A new login was detected. Change your password if it wasn't you.", time: '2 days ago', read: true },
    { id: 3005, type: 'success', icon: '🌿', title: 'Monthly Achievement Unlocked!',  body: "You saved 7.2kg of food this month. You're in the top 20% of SavePlate users!", time: '3 days ago', read: true },
  ];

  const SEED_ANALYTICS = [
    { m: 'Jan', saved: 5.2, wasted: 2.1, donated: 1.0 },
    { m: 'Feb', saved: 6.8, wasted: 1.4, donated: 2.2 },
    { m: 'Mar', saved: 4.5, wasted: 3.2, donated: 0.8 },
    { m: 'Apr', saved: 7.2, wasted: 0.8, donated: 3.1 },
  ];

  /* ── seed per-user data (new user first login) ───────────────── */
  async function seedUserData() {
    const batch = db().batch();
    SEED_INVENTORY.forEach(item => {
      batch.set(db().collection(`users/${_uid}/inventory`).doc(String(item.id)), item);
    });
    SEED_NOTIFICATIONS.forEach(n => {
      batch.set(db().collection(`users/${_uid}/notifications`).doc(String(n.id)), n);
    });
    SEED_ANALYTICS.forEach(a => {
      batch.set(db().collection(`users/${_uid}/analytics`).doc(a.m), a);
    });
    batch.set(db().doc(`users/${_uid}/data/meals`),    SEED_MEALS);
    batch.set(db().doc(`users/${_uid}/data/settings`), { twofa: true, emailAlerts: true, notifs: true, darkMode: false });
    await batch.commit();
    _cache.inventory     = [...SEED_INVENTORY];
    _cache.notifications = [...SEED_NOTIFICATIONS];
    _cache.analytics     = [...SEED_ANALYTICS];
    _cache.meals         = JSON.parse(JSON.stringify(SEED_MEALS));
    _cache.settings      = { twofa: true, emailAlerts: true, notifs: true, darkMode: false };
  }

  /* ── seed shared donations (once per Firestore instance) ─────── */
  async function seedDonationsIfNeeded() {
    const snap = await db().collection('donations').limit(1).get();
    if (!snap.empty) {
      _cache.donations = (await db().collection('donations').get()).docs.map(d => d.data());
      return;
    }
    const batch = db().batch();
    SEED_DONATIONS.forEach(d => {
      batch.set(db().collection('donations').doc(String(d.id)), d);
    });
    await batch.commit();
    _cache.donations = [...SEED_DONATIONS];
  }

  /* ── load all user data from Firestore ───────────────────────── */
  async function loadUserData(user) {
    _uid = user.uid;

    const profileSnap = await db().collection('users').doc(_uid).get();
    _profile = profileSnap.exists
      ? profileSnap.data()
      : { name: user.email.split('@')[0], twofa: true };

    const [invSnap, notifSnap, analyticsSnap, mealsSnap, settingsSnap] = await Promise.all([
      db().collection(`users/${_uid}/inventory`).get(),
      db().collection(`users/${_uid}/notifications`).get(),
      db().collection(`users/${_uid}/analytics`).get(),
      db().doc(`users/${_uid}/data/meals`).get(),
      db().doc(`users/${_uid}/data/settings`).get(),
    ]);

    _cache.inventory     = invSnap.docs.map(d => d.data()).sort((a, b) => b.id - a.id);
    _cache.notifications = notifSnap.docs.map(d => d.data()).sort((a, b) => b.id - a.id);
    _cache.analytics     = analyticsSnap.docs.map(d => d.data());
    _cache.meals         = mealsSnap.exists     ? mealsSnap.data()    : {};
    _cache.settings      = settingsSnap.exists  ? settingsSnap.data() : { twofa: true, emailAlerts: true, notifs: true, darkMode: false };

    if (_cache.inventory.length === 0) await seedUserData();
    await seedDonationsIfNeeded();
  }

  /* ── auth state listener ─────────────────────────────────────── */
  auth().onAuthStateChanged(async user => {
    if (user) {
      try { await loadUserData(user); } catch (e) { console.error('SavePlate data load error:', e); }
    }
    _resolveReady();
  });

  /* ── public API ──────────────────────────────────────────────── */
  return {
    ready,

    /* user session — Firebase manages persistence automatically */
    get user() {
      const u = auth().currentUser;
      if (!u) return null;
      return { uid: u.uid, email: u.email, name: (_profile && _profile.name) || u.email.split('@')[0] };
    },
    setUser() { /* no-op: Firebase manages session */ },
    clearUser() { auth().signOut(); },
    guardAuth() { if (!auth().currentUser) window.location.href = 'index.html'; },

    /* save/update profile in Firestore */
    async saveProfile(name, twofa) {
      _profile = { name, twofa };
      await db().collection('users').doc(_uid).set({ name, twofa });
    },

    /* ── Inventory ───────────────────────────────────────────── */
    get inventory() { return _cache.inventory; },
    set inventory(v) { _cache.inventory = v; },

    addInventoryItem(item) {
      if (!_uid) return;
      const diff = (new Date(item.exp) - new Date()) / 86400000;
      item.status  = diff <= 2 ? 'danger' : diff <= 5 ? 'warn' : 'ok';
      item.id      = nextId();
      item.usedUp  = false;
      item.donated = false;
      _cache.inventory.unshift(item);
      db().collection(`users/${_uid}/inventory`).doc(String(item.id)).set(item);
      this._addNotif('📦', 'Item Added', `${item.name} added to your inventory.`, '');
      this._updateAnalytics('saved', 0.1);
    },

    removeInventoryItem(id) {
      if (!_uid) return;
      _cache.inventory = _cache.inventory.filter(i => i.id !== id);
      db().collection(`users/${_uid}/inventory`).doc(String(id)).delete();
    },

    markItemUsed(id) {
      if (!_uid) return;
      const item = _cache.inventory.find(i => i.id === id);
      if (item) {
        item.usedUp = true;
        db().collection(`users/${_uid}/inventory`).doc(String(id)).update({ usedUp: true });
        this._addNotif('✅', 'Item Marked Used', `${item.name} marked as used. Great job reducing waste!`, 'success');
        this._updateAnalytics('saved', 0.3);
      }
    },

    convertToDonation(id) {
      if (!_uid) return;
      const item = _cache.inventory.find(i => i.id === id);
      if (!item) return;
      item.donated = true;
      db().collection(`users/${_uid}/inventory`).doc(String(id)).update({ donated: true });

      const u = this.user || {};
      const donation = {
        id: nextId(), emoji: item.emoji, name: item.name, qty: item.qty,
        loc: 'My Location',
        exp: new Date(item.exp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        donor: u.name || 'You', claimed: false, fromInventory: true, donorUid: _uid,
      };
      _cache.donations.unshift(donation);
      db().collection('donations').doc(String(donation.id)).set(donation);
      this._addNotif('🤝', 'Item Listed for Donation', `${item.name} is now listed as a donation.`, 'success');
    },

    updateInventoryStatus() {
      if (!_uid) return;
      const batch = db().batch();
      _cache.inventory = _cache.inventory.map(i => {
        const diff   = (new Date(i.exp) - new Date()) / 86400000;
        const status = diff <= 2 ? 'danger' : diff <= 5 ? 'warn' : 'ok';
        if (i.status !== status) {
          i.status = status;
          batch.update(db().collection(`users/${_uid}/inventory`).doc(String(i.id)), { status });
        }
        return i;
      });
      batch.commit().catch(() => {});
    },

    /* ── Donations ───────────────────────────────────────────── */
    get donations() { return _cache.donations; },
    set donations(v) { _cache.donations = v; },

    claimDonation(id) {
      const d = _cache.donations.find(x => x.id === id);
      if (d && !d.claimed) {
        d.claimed = true;
        db().collection('donations').doc(String(id)).update({ claimed: true });
        this._addNotif('✅', 'Donation Claimed', `You claimed "${d.name}". Contact ${d.donor} to arrange pickup.`, 'success');
        return true;
      }
      return false;
    },

    /* ── Meals ───────────────────────────────────────────────── */
    get meals() { return _cache.meals; },
    set meals(v) {
      _cache.meals = v;
      if (_uid) db().doc(`users/${_uid}/data/meals`).set(v);
    },

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

    /* ── Notifications ───────────────────────────────────────── */
    get notifications() { return _cache.notifications; },
    set notifications(v) { _cache.notifications = v; },

    _addNotif(icon, title, body, type) {
      if (!_uid) return;
      const n = { id: nextId(), icon, title, body, type, time: 'Just now', read: false };
      _cache.notifications.unshift(n);
      db().collection(`users/${_uid}/notifications`).doc(String(n.id)).set(n);
    },

    markNotifRead(id) {
      if (!_uid) return;
      const n = _cache.notifications.find(x => x.id === id);
      if (n) {
        n.read = true;
        db().collection(`users/${_uid}/notifications`).doc(String(id)).update({ read: true });
      }
    },

    markAllRead() {
      if (!_uid) return;
      const batch = db().batch();
      _cache.notifications.forEach(n => {
        if (!n.read) {
          n.read = true;
          batch.update(db().collection(`users/${_uid}/notifications`).doc(String(n.id)), { read: true });
        }
      });
      batch.commit().catch(() => {});
    },

    get unreadCount() { return _cache.notifications.filter(n => !n.read).length; },

    /* ── Settings ────────────────────────────────────────────── */
    get settings() { return _cache.settings; },
    set settings(v) {
      _cache.settings = v;
      if (_uid) db().doc(`users/${_uid}/data/settings`).set(v);
    },

    /* ── Analytics ───────────────────────────────────────────── */
    get analytics() { return _cache.analytics; },
    set analytics(v) { _cache.analytics = v; },

    _updateAnalytics(field, amount) {
      if (!_uid) return;
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const cur    = months[new Date().getMonth()];
      let row      = _cache.analytics.find(r => r.m === cur);
      if (row) {
        row[field] = +((row[field] || 0) + amount).toFixed(2);
        db().collection(`users/${_uid}/analytics`).doc(cur).update({ [field]: row[field] });
      } else {
        row = { m: cur, saved: 0, wasted: 0, donated: 0 };
        row[field] = +amount.toFixed(2);
        _cache.analytics.push(row);
        db().collection(`users/${_uid}/analytics`).doc(cur).set(row);
      }
    },

    /* ── Clear all user data from Firestore ──────────────────── */
    async clearUserData() {
      if (!_uid) return;
      for (const col of ['inventory', 'notifications', 'analytics']) {
        const snap  = await db().collection(`users/${_uid}/${col}`).get();
        const batch = db().batch();
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
      await db().doc(`users/${_uid}/data/meals`).delete().catch(() => {});
      await db().doc(`users/${_uid}/data/settings`).delete().catch(() => {});
      _cache.inventory     = [];
      _cache.notifications = [];
      _cache.analytics     = [];
      _cache.meals         = {};
      _cache.settings      = { twofa: true, emailAlerts: true, notifs: true, darkMode: false };
    },

    /* ── Render helpers ──────────────────────────────────────── */
    renderSidebar(active) {
      const u      = this.user || {};
      const unread = this.unreadCount;
      const links  = [
        { id: 'dashboard', label: 'Dashboard',       href: 'dashboard.html' },
        { id: 'meals',     label: 'Meal Planning',    href: 'meals.html' },
        { id: 'inventory', label: 'Inventory',        href: 'inventory.html' },
        { id: 'browse',    label: 'Browse Donations', href: 'browse.html' },
        { id: 'analytics', label: 'Analytics',        href: 'analytics.html' },
        { id: 'settings',  label: 'Settings',         href: 'settings.html' },
      ];
      return `<div class="sidebar">
        <div class="sidebar-profile">
          <div class="sidebar-avatar">👤</div>
          <div>
            <div class="sidebar-name">${u.name || 'User'}</div>
            <div class="sidebar-email">${u.email || ''}</div>
          </div>
        </div>
        <nav class="sidebar-nav">
          ${links.map(l => `<a href="${l.href}" class="nav-link ${active === l.id ? 'active' : ''}">${l.label}</a>`).join('')}
        </nav>
      </div>`;
    },

    renderTopbar(title) {
      const unread = this.unreadCount;
      return `<div class="topbar">
        <span class="topbar-title">${title}</span>
        <div class="topbar-right">
          <a href="notifications.html" class="notif-btn" style="text-decoration:none;font-size:20px;position:relative;color:#aaa;">
            🔔${unread > 0 ? `<span class="notif-badge">${unread}</span>` : ''}
          </a>
          <a href="settings.html" class="topbar-avatar" style="text-decoration:none;display:flex;align-items:center;justify-content:center;">👤</a>
        </div>
      </div>`;
    },

    statusLabel(s) { return s === 'danger' ? 'Expiring Soon' : s === 'warn' ? 'Watch' : 'Fresh'; },
    daysLeft(exp) {
      const d = Math.ceil((new Date(exp) - new Date()) / 86400000);
      return d <= 0 ? 'Expired' : d === 1 ? '1 day' : `${d} days`;
    },
    catEmoji: { Dairy: '🥛', Fruits: '🍎', Meat: '🍗', Vegetables: '🥦', Grains: '🌾', Canned: '🥫', Frozen: '❄️', Bakery: '🍞', Other: '🍽' },
  };
})();
