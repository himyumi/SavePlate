const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.error("MongoDB connection error:", err));

// Schemas
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String, // In production, hash passwords!
  createdAt: { type: Date, default: Date.now }
});

const itemSchema = new mongoose.Schema({
  name: String,
  emoji: String,
  cat: String,
  qty: String,
  loc: String,
  exp: String,
  status: String,
  notes: String,
  userId: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now }
});

const donationSchema = new mongoose.Schema({
  emoji: String,
  name: String,
  qty: String,
  loc: String,
  exp: String,
  donor: String,
  userId: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now }
});

const mealSchema = new mongoose.Schema({
  day: String,
  meals: [{ type: String, name: String }],
  userId: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now }
});

// Models
const User = mongoose.model("User", userSchema);
const Item = mongoose.model("Item", itemSchema);
const Donation = mongoose.model("Donation", donationSchema);
const Meal = mongoose.model("Meal", mealSchema);

// Middleware to get user from session (simplified)
const getUser = (req, res, next) => {
  // In a real app, use JWT or sessions
  // For now, assume userId is sent in headers or body
  req.userId = req.headers.userid || req.body.userId;
  next();
};

// Routes

// User routes
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });
  if (user) {
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email } });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

app.post("/api/auth/signup", async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ success: false, message: "User already exists" });
  }
  const user = new User({ name, email, password });
  await user.save();
  res.json({ success: true, user: { id: user._id, name, email } });
});

// Inventory routes
app.get("/api/inventory", getUser, async (req, res) => {
  const items = await Item.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json(items);
});

app.post("/api/inventory", getUser, async (req, res) => {
  const item = new Item({ ...req.body, userId: req.userId });
  await item.save();
  res.status(201).json(item);
});

app.put("/api/inventory/:id", getUser, async (req, res) => {
  const item = await Item.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    req.body,
    { new: true }
  );
  res.json(item);
});

app.delete("/api/inventory/:id", getUser, async (req, res) => {
  await Item.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  res.sendStatus(204);
});

// Donations routes
app.get("/api/donations", async (req, res) => {
  const donations = await Donation.find().sort({ createdAt: -1 });
  res.json(donations);
});

// Meals routes
app.get("/api/meals", getUser, async (req, res) => {
  const meals = await Meal.find({ userId: req.userId });
  const mealData = {};
  meals.forEach(m => {
    mealData[m.day] = m.meals;
  });
  res.json(mealData);
});

app.post("/api/meals", getUser, async (req, res) => {
  const { day, meals } = req.body;
  await Meal.findOneAndUpdate(
    { day, userId: req.userId },
    { meals },
    { upsert: true, new: true }
  );
  res.json({ success: true });
});

// Chart data (simplified)
app.get("/api/chart", getUser, async (req, res) => {
  // In a real app, calculate from actual data
  res.json([
    { m: "Jan", saved: 5.2, wasted: 2.1 },
    { m: "Feb", saved: 6.8, wasted: 1.4 },
    { m: "Mar", saved: 4.5, wasted: 3.2 },
    { m: "Apr", saved: 7.2, wasted: 0.8 },
  ]);
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));