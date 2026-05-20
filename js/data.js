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
  const db = firebase.firestore();

  let _uid = null;
  let _profile = { name: "", twofa: false };

  const _cache = {
    inventory: [],
    donations: [],
    meals: {},
    notifications: [],
    analytics: [],
    settings: { twofa: true, emailAlerts: true, notifs: true, darkMode: false },
  };

  /* ── utility ──────────────────────────────────────────────────── */
  function futureDate(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
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

    const [invSnap, notifSnap, analySnap, mealsSnap, settingsSnap, donSnap] =
      await Promise.all([
        userRef.collection("inventory").get(),
        userRef.collection("notifications").get(),
        userRef.collection("analytics").get(),
        userRef.collection("data").doc("meals").get(),
        userRef.collection("data").doc("settings").get(),
        db.collection("donations").get(),
      ]);

    // Inventory — start empty, no seed data
    _cache.inventory = invSnap.docs.map((d) => d.data());

    // Notifications — start empty
    _cache.notifications = notifSnap.docs.map((d) => d.data());

    // Analytics — start empty
    _cache.analytics = analySnap.docs.map((d) => d.data());

    // Meals — start empty
    _cache.meals = mealsSnap.exists ? mealsSnap.data().data || {} : {};
    if (!mealsSnap.exists) {
      await userRef.collection("data").doc("meals").set({ data: {} });
    }

    // Settings
    if (!settingsSnap.exists) {
      await userRef.collection("data").doc("settings").set(_cache.settings);
    } else {
      _cache.settings = settingsSnap.data();
    }

    // Donations — global collection, load all
    _cache.donations = donSnap.docs.map((d) => d.data());
  }

  function clearCache() {
    _uid = null;
    _profile = { name: "", twofa: false };
    _cache.inventory = [];
    _cache.donations = [];
    _cache.meals = {};
    _cache.notifications = [];
    _cache.analytics = [];
    _cache.settings = {
      twofa: true,
      emailAlerts: true,
      notifs: true,
      darkMode: false,
    };
  }

  /* ── ready promise — resolves after auth state + initial load ── */
  const ready = new Promise((resolve) => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          await loadUserData(user);
        } catch (e) {
          console.error("Failed to load user data:", e);
        }
      } else {
        clearCache();
      }
      resolve();
    });
  });

  /* ── public API ────────────────────────────────────────────────── */
  return {
    ready,

    get inventory() {
      return _cache.inventory;
    },
    set inventory(v) {
      _cache.inventory = v;
    },
    get donations() {
      return _cache.donations;
    },
    set donations(v) {
      _cache.donations = v;
    },
    get meals() {
      return _cache.meals;
    },
    set meals(v) {
      _cache.meals = v;
      if (_uid)
        db.collection("users")
          .doc(_uid)
          .collection("data")
          .doc("meals")
          .set({ data: v });
    },
    get notifications() {
      return _cache.notifications;
    },
    set notifications(v) {
      _cache.notifications = v;
    },
    get analytics() {
      return _cache.analytics;
    },
    set analytics(v) {
      _cache.analytics = v;
    },
    get settings() {
      return _cache.settings;
    },
    set settings(v) {
      _cache.settings = v;
      if (_uid)
        db.collection("users")
          .doc(_uid)
          .collection("data")
          .doc("settings")
          .set(v);
    },

    get user() {
      const u = auth.currentUser;
      if (!u) return null;
      return {
        name: _profile.name || u.email.split("@")[0],
        email: u.email,
        uid: u.uid,
        twofa: !!_profile.twofa,
      };
    },

    setUser(_u) {
      /* no-op — Firebase manages session */
    },
    clearUser() {
      return auth.signOut();
    },

    guardAuth() {
      if (!auth.currentUser) window.location.href = "index.html";
    },

    async saveProfile(name, twofa) {
      _profile = { name, twofa: !!twofa };
      if (_uid) await db.collection("users").doc(_uid).set(_profile);
    },

    /* ── FIX: clearUserData also deletes own donations ──────────── */
    async clearUserData() {
      if (!_uid) return;
      const userRef = db.collection("users").doc(_uid);

      // Delete user subcollections
      const subs = ["inventory", "notifications", "analytics"];
      for (const sub of subs) {
        const snap = await userRef.collection(sub).get();
        await Promise.all(snap.docs.map((d) => d.ref.delete()));
      }
      await userRef
        .collection("data")
        .doc("meals")
        .delete()
        .catch(() => {});
      await userRef
        .collection("data")
        .doc("settings")
        .delete()
        .catch(() => {});

      // Delete this user's donations from global donations collection
      const donSnap = await db
        .collection("donations")
        .where("donorUid", "==", _uid)
        .get();
      await Promise.all(donSnap.docs.map((d) => d.ref.delete()));

      clearCache();
    },

    /* ── Inventory CRUD ──────────────────────────────────────── */
    addInventoryItem(item) {
      const diff = (new Date(item.exp) - new Date()) / 86400000;
      item.status = diff <= 2 ? "danger" : diff <= 5 ? "warn" : "ok";
      item.id = nextId();
      item.usedUp = false;
      item.donated = false;
      _cache.inventory.unshift(item);
      if (_uid)
        db.collection("users")
          .doc(_uid)
          .collection("inventory")
          .doc(String(item.id))
          .set(item);
      this._addNotif(
        "📦",
        "Item Added",
        `${item.name} added to your inventory.`,
        "",
      );
      this._updateAnalytics("saved", 0.1);
    },
    updateInventoryItem(id, updates) {
      const item = _cache.inventory.find((i) => i.id === id);
      if (item) {
        Object.assign(item, updates);
        if (updates.exp) {
          const diff = (new Date(item.exp) - new Date()) / 86400000;
          item.status = diff <= 2 ? "danger" : diff <= 5 ? "warn" : "ok";
        }
        if (_uid) {
          db.collection("users")
            .doc(_uid)
            .collection("inventory")
            .doc(String(id))
            .set(item);
        }
        return true;
      }
      return false;
    },
    removeInventoryItem(id) {
      _cache.inventory = _cache.inventory.filter((i) => i.id !== id);
      if (_uid)
        db.collection("users")
          .doc(_uid)
          .collection("inventory")
          .doc(String(id))
          .delete();
    },
    markItemUsed(id) {
      const item = _cache.inventory.find((i) => i.id === id);
      if (item) {
        item.usedUp = true;
        if (_uid)
          db.collection("users")
            .doc(_uid)
            .collection("inventory")
            .doc(String(id))
            .set(item);
        this._addNotif(
          "✅",
          "Item Marked Used",
          `${item.name} marked as used. Great job reducing waste!`,
          "success",
        );
        this._updateAnalytics("saved", 0.3);
      }
    },

    /* ── FIX: store donorUid so ownership check is uid-based ──── */
    convertToDonation(id) {
      const item = _cache.inventory.find((i) => i.id === id);
      if (!item) return;
      item.donated = true;
      if (_uid)
        db.collection("users")
          .doc(_uid)
          .collection("inventory")
          .doc(String(id))
          .set(item);
      const u = this.user || {};
      const donation = {
        id: nextId(),
        emoji: item.emoji,
        name: item.name,
        qty: item.qty,
        loc: "My Location",
        exp: new Date(item.exp).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        donor: u.name || "You",
        donorUid: _uid, // ← store uid for accurate ownership check
        claimed: false,
        claimedByUid: null,
      };
      _cache.donations.unshift(donation);
      db.collection("donations").doc(String(donation.id)).set(donation);
      this._addNotif(
        "🤝",
        "Item Listed for Donation",
        `${item.name} is now listed as a donation.`,
        "success",
      );
    },
    updateInventoryStatus() {
      const changed = [];
      _cache.inventory.forEach((i) => {
        const diff = (new Date(i.exp) - new Date()) / 86400000;
        const newStatus =
          diff <= 0
            ? "danger"
            : diff <= 2
              ? "danger"
              : diff <= 5
                ? "warn"
                : "ok";
        if (i.status !== newStatus) {
          i.status = newStatus;
          changed.push(i);
        }
      });
      if (_uid && changed.length) {
        changed.forEach((i) =>
          db
            .collection("users")
            .doc(_uid)
            .collection("inventory")
            .doc(String(i.id))
            .set(i),
        );
      }
    },

    /* ── Donations ──────────────────────────────────────────────── */
    claimDonation(id) {
      const d = _cache.donations.find((x) => x.id === id);
      if (d && !d.claimed) {
        d.claimed = true;
        d.claimedByUid = _uid;
        db.collection("donations").doc(String(id)).set(d);
        this._addNotif(
          "✅",
          "Donation Claimed",
          `You claimed "${d.name}". Contact ${d.donor} to arrange pickup.`,
          "success",
        );
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
      const notif = {
        id: nextId(),
        icon,
        title,
        body,
        type,
        time: "Just now",
        read: false,
      };
      _cache.notifications.unshift(notif);
      if (_uid)
        db.collection("users")
          .doc(_uid)
          .collection("notifications")
          .doc(String(notif.id))
          .set(notif);
    },
    markNotifRead(id) {
      const n = _cache.notifications.find((x) => x.id === id);
      if (n) {
        n.read = true;
        if (_uid)
          db.collection("users")
            .doc(_uid)
            .collection("notifications")
            .doc(String(id))
            .set(n);
      }
    },
    markAllRead() {
      _cache.notifications.forEach((n) => {
        n.read = true;
        if (_uid)
          db.collection("users")
            .doc(_uid)
            .collection("notifications")
            .doc(String(n.id))
            .set(n);
      });
    },
    get unreadCount() {
      return _cache.notifications.filter((n) => !n.read).length;
    },

    /* ── Analytics ──────────────────────────────────────────────── */
    _updateAnalytics(field, amount) {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const cur = months[new Date().getMonth()];
      let row = _cache.analytics.find((r) => r.m === cur);
      if (!row) {
        row = { m: cur, saved: 0, wasted: 0, donated: 0 };
        _cache.analytics.push(row);
      }
      row[field] = +((row[field] || 0) + amount).toFixed(2);
      if (_uid)
        db.collection("users")
          .doc(_uid)
          .collection("analytics")
          .doc(cur)
          .set(row);
    },

    /* ── Render helpers ─────────────────────────────────────────── */
    renderSidebar(active) {
      const links = [
        { id: "dashboard", label: "Dashboard", href: "dashboard.html" },
        { id: "meals", label: "Meal Planning", href: "meals.html" },
        { id: "inventory", label: "Inventory", href: "inventory.html" },
        { id: "browse", label: "Browse Donations", href: "browse.html" },
        { id: "analytics", label: "Analytics", href: "analytics.html" },
        { id: "settings", label: "Settings", href: "settings.html" },
      ];
      return `<div class="sidebar">
        <div class="sidebar-profile">
          <div class="sidebar-avatar"><img src="images/SmallLogo.png" alt="SavePlate Logo" /></div>
        </div>
        <nav class="sidebar-nav">
          ${links.map((l) => `<a href="${l.href}" class="nav-link ${active === l.id ? "active" : ""}">${l.label}</a>`).join("")}
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

    statusLabel(s) {
      return s === "danger"
        ? "Expiring Soon"
        : s === "warn"
          ? "Watch"
          : "Fresh";
    },
    daysLeft(exp) {
      const d = Math.ceil((new Date(exp) - new Date()) / 86400000);
      return d <= 0 ? "Expired" : d === 1 ? "1 day" : `${d} days`;
    },

    catEmoji: {
      Dairy: "🥛",
      Fruits: "🍎",
      Meat: "🍗",
      Vegetables: "🥦",
      Grains: "🌾",
      Canned: "🥫",
      Frozen: "❄️",
      Bakery: "🍞",
      Other: "🍽",
    },
  };
})();
