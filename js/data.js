const API_BASE = "http://localhost:4000/api";

const SavePlate = {
  inventory: [],
  donations: [],
  meals: {},
  chartData: [],

  user: JSON.parse(sessionStorage.getItem("sp_user") || "null"),
  setUser(u) {
    this.user = u;
    sessionStorage.setItem("sp_user", JSON.stringify(u));
  },
  clearUser() {
    this.user = null;
    sessionStorage.removeItem("sp_user");
  },

  async loadData() {
    if (!this.user) return;
    try {
      const [invRes, donRes, mealRes, chartRes] = await Promise.all([
        fetch(`${API_BASE}/inventory`, {
          headers: { userid: this.user.id }
        }),
        fetch(`${API_BASE}/donations`),
        fetch(`${API_BASE}/meals`, {
          headers: { userid: this.user.id }
        }),
        fetch(`${API_BASE}/chart`, {
          headers: { userid: this.user.id }
        })
      ]);
      this.inventory = await invRes.json();
      this.donations = await donRes.json();
      this.meals = await mealRes.json();
      this.chartData = await chartRes.json();
    } catch (err) {
      console.error("Failed to load data:", err);
    }
  },

  async addInventoryItem(item) {
    const res = await fetch(`${API_BASE}/inventory`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        userid: this.user.id
      },
      body: JSON.stringify(item)
    });
    const newItem = await res.json();
    this.inventory.unshift(newItem);
    return newItem;
  },

  async removeInventoryItem(id) {
    await fetch(`${API_BASE}/inventory/${id}`, {
      method: "DELETE",
      headers: { userid: this.user.id }
    });
    this.inventory = this.inventory.filter(item => item._id !== id);
  },

  guardAuth() {
    if (!this.user) window.location.href = "index.html";
  },

  renderSidebar(active) {
    const u = this.user || {};
    const links = [
      { id: "dashboard", label: "Dashboard", href: "dashboard.html" },
      { id: "meals", label: "Meal Planning", href: "meals.html" },
      { id: "inventory", label: "Inventory", href: "inventory.html" },
      { id: "browse", label: "Browse Donations", href: "browse.html" }, // Add this
      { id: "settings", label: "Settings", href: "settings.html" },
    ];
    return `
      <div class="sidebar">
        <div class="sidebar-profile">
          <div class="sidebar-avatar">👤</div>
          <div>
            <div class="sidebar-name">${u.name || "User"}</div>
            <div class="sidebar-email">${u.email || ""}</div>
          </div>
        </div>
        <nav class="sidebar-nav">
          ${links
            .map(
              (l) => `
            <a href="${l.href}" class="nav-link ${active === l.id ? "active" : ""}">${l.label}</a>
          `,
            )
            .join("")}
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

  statusLabel(s) {
    return s === "danger" ? "Expiring Soon" : s === "warn" ? "Watch" : "Fresh";
  },
  daysLeft(exp) {
    const d = Math.ceil((new Date(exp) - new Date()) / (1000 * 60 * 60 * 24));
    return d <= 0 ? "Expired" : d === 1 ? "1 day" : `${d} days`;
  },
};
