const express = require("express");
require("dotenv").config();
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const nodemailer = require("nodemailer");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

const port = 8000;
const connectDB = require("./db.js");
const cloudinary = require("./cloudinary.js");
const upload = require("./multer.js");
const streamifier = require("streamifier");
const { v4: uuidv4 } = require("uuid");
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_PORT == 465,
  auth: {
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
  },
});

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder",
});

connectDB();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// ─── Schemas ────────────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const itemsSchema = new mongoose.Schema({
  user: { type: String, required: true },
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price_per_day: { type: String, required: true },
  category: { type: String, required: true },
  mobile_number: { type: String, required: true },
  Image_url: { type: String, required: true, unique: true },
  Image_id: { type: String, required: true, unique: true },
  status: { type: String, enum: ["available", "rented", "returned"], default: "available" },
});

const rentalSchema = new mongoose.Schema({
  buyer: { type: String, required: true },
  seller: { type: String, required: true },
  item_id: { type: String, required: true },
  item_name: { type: String, required: true },
  item_image: { type: String },
  price_per_day: { type: String, required: true },
  days: { type: Number, required: true },
  total_price: { type: String, required: true },
  payment_id: { type: String },
  status: {
    type: String,
    enum: ["active", "returned", "completed"],
    default: "active",
  },
  createdAt: { type: Date, default: Date.now },
  returnedAt: { type: Date },
});

const reviewSchema = new mongoose.Schema({
  item_id: { type: String, required: true },
  reviewer: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const messageSchema = new mongoose.Schema({
  rental_id: { type: String, required: true },
  sender: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

const notificationSchema = new mongoose.Schema({
  recipient: { type: String, required: true },
  sender: { type: String, required: true },
  item_name: { type: String, required: true },
  price: { type: String, required: true },
  days: { type: Number, default: 1 },
  total_price: { type: String, required: true },
  rental_id: { type: String },
  type: { type: String, default: "rental" },
  createdAt: { type: Date, default: Date.now },
});

const Items = mongoose.models.Items || mongoose.model("Items", itemsSchema);
const User = mongoose.models.User || mongoose.model("User", userSchema);
const Otp = mongoose.models.Otp || mongoose.model("Otp", otpSchema);
const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
const Rental = mongoose.models.Rental || mongoose.model("Rental", rentalSchema);
const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);
const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);

// ─── Middleware ──────────────────────────────────────────────────────────────

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ success: false, message: "Invalid token" });
  }
};

// ─── Auth Routes ─────────────────────────────────────────────────────────────

app.get("/", (req, res) => res.send("CampusTrade API running"));

app.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: "Email is required" });
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: "User already exists" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30000);
    await Otp.findOneAndUpdate({ email }, { otp, expiresAt }, { upsert: true, new: true });
    console.log(`[OTP] ${email}: ${otp}`);

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const mailOptions = {
        from: `"CampusTrade" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your CampusTrade Verification Code",
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e2e8f0;border-radius:8px"><h2 style="color:#4f46e5;text-align:center">CampusTrade Verification</h2><p>Your OTP (valid 30s):</p><div style="text-align:center;margin:30px 0"><span style="font-size:32px;font-weight:bold;letter-spacing:5px;background:#f3f4f6;padding:10px 20px;border-radius:6px;border:1px solid #d1d5db;color:#1f2937">${otp}</span></div></div>`,
      };
      await transporter.sendMail(mailOptions);
    }
    return res.status(200).json({ success: true, message: "OTP sent successfully!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error sending OTP" });
  }
});

app.post("/signup", async (req, res) => {
  const { email, password, otp } = req.body;
  if (!email || !password || !otp) return res.status(400).json({ success: false, message: "Email, password, and OTP are required" });
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: "User already exists" });
    const otpDoc = await Otp.findOne({ email, otp });
    if (!otpDoc) return res.status(400).json({ success: false, message: "Invalid OTP" });
    if (otpDoc.expiresAt < new Date()) return res.status(400).json({ success: false, message: "OTP expired" });
    const hashedPassword = await bcrypt.hash(password, 10);
    await new User({ email, password: hashedPassword }).save();
    await Otp.deleteMany({ email });
    return res.status(201).json({ success: true, message: "Signup successful" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.json({ success: false, message: "Invalid credentials" });
    const accessToken = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ id: user._id, email: user.email }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
    const isSecure = req.headers["x-forwarded-proto"] === "https";
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? "None" : "Lax"
    });
    res.json({ success: true, message: "Login successful", accessToken });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/refresh", (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: "Unauthorized" });
  jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Forbidden" });
    const accessToken = jwt.sign({ email: decoded.email, id: decoded.id }, JWT_SECRET, { expiresIn: "15m" });
    res.json({ accessToken });
  });
});

app.post("/check-refresh-token", (req, res) => {
  res.json({ exists: !!req.cookies.refreshToken });
});

app.post("/logout", (req, res) => {
  const isSecure = req.headers["x-forwarded-proto"] === "https";
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? "None" : "Lax"
  });
  return res.status(200).json({ message: "Logout successful" });
});

app.post("/update-email", authenticate, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: "Email required" });
  try {
    await User.findByIdAndUpdate(req.user.id, { email });
    res.json({ success: true, message: "Email updated successfully", email });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/update-password", authenticate, async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ success: false, message: "Password required" });
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(req.user.id, { password: hashedPassword });
    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── Items Routes ─────────────────────────────────────────────────────────────

app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const uploadStream = cloudinary.uploader.upload_stream({ folder: "uploads" }, async (error, result) => {
      if (error) return res.status(500).json({ error: error.message });
      const unique_id = uuidv4();
      const newItems = new Items({
        user: req.body.user,
        id: unique_id,
        name: req.body.name,
        category: req.body.category,
        description: req.body.description,
        price_per_day: req.body.price_per_day,
        mobile_number: req.body.mobile_number,
        Image_url: result.secure_url,
        Image_id: result.public_id,
        status: "available",
      });
      await newItems.save();
      res.json({ message: "Uploaded successfully!", item: newItems });
    });
    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/get_items_secure", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  jwt.verify(token, JWT_SECRET, async (err, user) => {
    if (err) return res.status(403).json({ message: "Forbidden" });
    try {
      const data = await Items.find().lean();
      res.json({ message: "Welcome to Dashboard", data, user });
    } catch (error) {
      res.status(500).json({ message: "Error fetching items", error });
    }
  });
});

app.post("/item/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const response = await Items.findOne({ _id: id }).lean();
    if (response) res.json({ response, message: true });
    else res.json({ message: false });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.delete("/delete", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).send("ID is required");
    const result = await Items.deleteOne({ _id: id });
    if (result.deletedCount === 1) res.status(200).send("Document deleted successfully");
    else res.status(404).send("Document not found");
  } catch (err) {
    res.status(500).send("Error deleting document");
  }
});

// ─── Payment Routes ───────────────────────────────────────────────────────────

app.post("/create-order", authenticate, async (req, res) => {
  const { itemId, days } = req.body;
  if (!itemId) return res.status(400).json({ success: false, message: "Item ID is required" });
  const rentalDays = parseInt(days) || 1;
  if (rentalDays < 1 || rentalDays > 365) return res.status(400).json({ success: false, message: "Days must be between 1 and 365" });
  try {
    const item = await Items.findOne({ _id: itemId });
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });
    if (item.status !== "available") return res.status(400).json({ success: false, message: "Item is not available for rent" });
    const pricePerDay = parseFloat(item.price_per_day);
    if (isNaN(pricePerDay)) return res.status(400).json({ success: false, message: "Invalid item price" });
    const totalPrice = pricePerDay * rentalDays;
    const options = {
      amount: Math.round(totalPrice * 100),
      currency: "INR",
      receipt: `receipt_order_${item.id.substring(0, 10)}`,
      notes: { days: rentalDays, price_per_day: pricePerDay, total_price: totalPrice },
    };
    const order = await razorpay.orders.create(options);
    return res.status(200).json({ success: true, order, key_id: process.env.RAZORPAY_KEY_ID, days: rentalDays, totalPrice });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create order" });
  }
});

app.post("/verify-payment", authenticate, async (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, itemId, days } = req.body;
  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !itemId)
    return res.status(400).json({ success: false, message: "Missing payment verification parameters" });
  const rentalDays = parseInt(days) || 1;
  try {
    const key_secret = process.env.RAZORPAY_KEY_SECRET || "placeholder";
    const hmac = crypto.createHmac("sha256", key_secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest("hex");
    const isSignatureValid = generated_signature === razorpay_signature;
    const isPlaceholderKey = process.env.RAZORPAY_KEY_ID === "rzp_test_placeholder";
    if (!isSignatureValid && !isPlaceholderKey)
      return res.status(400).json({ success: false, message: "Payment verification failed" });

    const item = await Items.findOne({ _id: itemId });
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    const totalPrice = parseFloat(item.price_per_day) * rentalDays;

    // Mark item as rented (no deletion)
    await Items.updateOne({ _id: itemId }, { status: "rented" });

    // Create rental record
    const rental = new Rental({
      buyer: req.user.email,
      seller: item.user,
      item_id: itemId,
      item_name: item.name,
      item_image: item.Image_url,
      price_per_day: item.price_per_day,
      days: rentalDays,
      total_price: totalPrice.toString(),
      payment_id: razorpay_payment_id,
      status: "active",
    });
    await rental.save();

    // Notify seller
    const newNotification = new Notification({
      recipient: item.user,
      sender: req.user.email,
      item_name: item.name,
      price: item.price_per_day,
      days: rentalDays,
      total_price: totalPrice.toString(),
      rental_id: rental._id.toString(),
      type: "rental",
    });
    await newNotification.save();

    return res.status(200).json({ success: true, message: "Payment verified! Item is now rented.", rental_id: rental._id });
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({ success: false, message: "Server error during payment verification" });
  }
});

// ─── Rental History Routes ────────────────────────────────────────────────────

// Buyer: see their rentals
app.get("/my-rentals", authenticate, async (req, res) => {
  try {
    const rentals = await Rental.find({ buyer: req.user.email }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, rentals });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Seller: see who rented their items
app.get("/my-listings-rentals", authenticate, async (req, res) => {
  try {
    const rentals = await Rental.find({ seller: req.user.email }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, rentals });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Seller marks item as returned
app.post("/return-item/:rentalId", authenticate, async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.rentalId);
    if (!rental) return res.status(404).json({ success: false, message: "Rental not found" });
    if (rental.seller !== req.user.email)
      return res.status(403).json({ success: false, message: "Only the seller can mark as returned" });
    await Rental.findByIdAndUpdate(req.params.rentalId, { status: "returned", returnedAt: new Date() });
    await Items.findByIdAndUpdate(rental.item_id, { status: "returned" });

    // Notify buyer
    await new Notification({
      recipient: rental.buyer,
      sender: req.user.email,
      item_name: rental.item_name,
      price: rental.price_per_day,
      days: rental.days,
      total_price: rental.total_price,
      rental_id: rental._id.toString(),
      type: "returned",
    }).save();

    return res.status(200).json({ success: true, message: "Item marked as returned" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── Reviews Routes ───────────────────────────────────────────────────────────

app.post("/reviews", authenticate, async (req, res) => {
  const { item_id, rating, comment } = req.body;
  if (!item_id || !rating) return res.status(400).json({ success: false, message: "item_id and rating required" });
  try {
    const existing = await Review.findOne({ item_id, reviewer: req.user.email });
    if (existing) return res.status(400).json({ success: false, message: "You already reviewed this item" });
    const review = new Review({ item_id, reviewer: req.user.email, rating: Number(rating), comment: comment || "" });
    await review.save();
    return res.status(201).json({ success: true, review });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/reviews/:itemId", async (req, res) => {
  try {
    const reviews = await Review.find({ item_id: req.params.itemId }).sort({ createdAt: -1 });
    const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    return res.status(200).json({ success: true, reviews, average: avg.toFixed(1) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── Chat / Messages Routes ───────────────────────────────────────────────────

app.get("/messages/:rentalId", authenticate, async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.rentalId);
    if (!rental) return res.status(404).json({ success: false, message: "Rental not found" });
    if (rental.buyer !== req.user.email && rental.seller !== req.user.email)
      return res.status(403).json({ success: false, message: "Access denied" });
    const messages = await Message.find({ rental_id: req.params.rentalId }).sort({ createdAt: 1 });
    return res.status(200).json({ success: true, messages, rental });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/messages/:rentalId", authenticate, async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ success: false, message: "Message text required" });
  try {
    const rental = await Rental.findById(req.params.rentalId);
    if (!rental) return res.status(404).json({ success: false, message: "Rental not found" });
    if (rental.buyer !== req.user.email && rental.seller !== req.user.email)
      return res.status(403).json({ success: false, message: "Access denied" });
    const msg = new Message({ rental_id: req.params.rentalId, sender: req.user.email, text: text.trim() });
    await msg.save();
    io.to(req.params.rentalId).emit("new_message", msg);
    return res.status(201).json({ success: true, message: msg });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── Notifications Route ──────────────────────────────────────────────────────

app.get("/notifications", authenticate, async (req, res) => {
  try {
    const list = await Notification.find({ recipient: req.user.email }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, notifications: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── Socket.IO ────────────────────────────────────────────────────────────────

io.on("connection", (socket) => {
  socket.on("join_rental", (rentalId) => {
    socket.join(rentalId);
  });
  socket.on("leave_rental", (rentalId) => {
    socket.leave(rentalId);
  });
  socket.on("disconnect", () => {});
});

server.listen(port, () => {
  console.log(`CampusTrade server running on port ${port}`);
});
