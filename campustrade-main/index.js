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

const collegeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  college_code: { type: String, required: true, unique: true },
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  college_code: { type: String, required: true },
  status: { type: String, enum: ["active", "flagged"], default: "active" },
});

const itemsSchema = new mongoose.Schema({
  user: { type: String, required: true },
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price_per_day: { type: String, required: true },
  security_deposit: { type: String, required: true },
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
    enum: ["pending_handover", "active", "returned", "disputed"],
    default: "pending_handover",
  },
  handover_otp: { type: String },
  handoverAt: { type: Date },
  security_deposit: { type: String, required: true },
  late_fee: { type: Number, default: 0 },
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
  is_college_escalation: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const College = mongoose.models.College || mongoose.model("College", collegeSchema);
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
    // Fetch the user to check if they are flagged
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: "User not found" });
    if (user.status === "flagged") {
      return res.status(403).json({ success: false, message: "Your account is suspended due to outstanding unreturned items. Please contact college administration." });
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ success: false, message: "Invalid token" });
  }
};

const authenticateCollege = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "college") {
      return res.status(403).json({ success: false, message: "Access denied: Not a college administrator" });
    }
    const college = await College.findById(decoded.id);
    if (!college) return res.status(401).json({ success: false, message: "College not found" });
    req.college = decoded;
    next();
  } catch (error) {
    res.status(403).json({ success: false, message: "Invalid token" });
  }
};

// ─── Auth Routes ─────────────────────────────────────────────────────────────

app.get("/", (req, res) => res.send("CampusTrade API running"));

// College Portal Registration & Login
app.post("/college/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) 
    return res.status(400).json({ success: false, message: "Name, email, and password are required" });
  try {
    const existing = await College.findOne({ $or: [{ name }, { email }] });
    if (existing) return res.status(400).json({ success: false, message: "College name or email already exists" });

    // Generate unique college code (e.g. IITD-9982)
    const prefix = name.substring(0, 4).toUpperCase();
    const suffix = Math.floor(1000 + Math.random() * 9000).toString();
    const college_code = `${prefix}-${suffix}`;

    const hashedPassword = await bcrypt.hash(password, 10);
    const newCollege = new College({ name, email, password: hashedPassword, college_code });
    await newCollege.save();

    return res.status(201).json({ success: true, message: "College registered successfully", college_code });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/college/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const college = await College.findOne({ email });
    if (!college || !(await bcrypt.compare(password, college.password)))
      return res.json({ success: false, message: "Invalid credentials" });

    const accessToken = jwt.sign({ id: college._id, email: college.email, role: "college" }, JWT_SECRET, { expiresIn: "1h" });
    return res.json({ success: true, message: "Login successful", accessToken, college_code: college.college_code, name: college.name });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/college/notifications", authenticateCollege, async (req, res) => {
  try {
    // Find notifications sent to the college email
    const list = await Notification.find({ recipient: req.college.email, is_college_escalation: true }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, notifications: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

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
  const { email, password, otp, college_code } = req.body;
  if (!email || !password || !otp || !college_code) 
    return res.status(400).json({ success: false, message: "Email, password, OTP, and college code are required" });
  try {
    // Validate college code
    const college = await College.findOne({ college_code });
    if (!college) return res.status(400).json({ success: false, message: "Invalid college code" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: "User already exists" });
    const otpDoc = await Otp.findOne({ email, otp });
    if (!otpDoc) return res.status(400).json({ success: false, message: "Invalid OTP" });
    if (otpDoc.expiresAt < new Date()) return res.status(400).json({ success: false, message: "OTP expired" });
    const hashedPassword = await bcrypt.hash(password, 10);
    await new User({ email, password: hashedPassword, college_code }).save();
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
    if (user.status === "flagged") {
      return res.json({ success: false, message: "Your account is suspended due to outstanding unreturned items. Please contact college administration." });
    }
    const accessToken = jwt.sign({ id: user._id, email: user.email, college_code: user.college_code }, JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ id: user._id, email: user.email, college_code: user.college_code }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
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
        security_deposit: req.body.security_deposit || "0",
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
      // Only fetch items belonging to users from the same college space
      const dbUser = await User.findOne({ email: user.email });
      let data = [];
      if (dbUser) {
        // Find users in the same college
        const sameCollegeUsers = await User.find({ college_code: dbUser.college_code }).select("email");
        const emails = sameCollegeUsers.map(u => u.email);
        data = await Items.find({ user: { $in: emails } }).lean();
      } else {
        data = await Items.find().lean();
      }
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
    const item = await Items.findOne({ _id: id });
    if (!item) return res.status(404).send("Item not found");
    if (item.status === "rented") {
      return res.status(400).send("Cannot delete item while it is currently rented or pending handover.");
    }
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
    const securityDeposit = parseFloat(item.security_deposit || "0");
    if (isNaN(pricePerDay)) return res.status(400).json({ success: false, message: "Invalid item price" });
    
    // Total price includes the security deposit
    const totalPrice = (pricePerDay * rentalDays) + securityDeposit;
    const options = {
      amount: Math.round(totalPrice * 100),
      currency: "INR",
      receipt: `receipt_order_${item.id.substring(0, 10)}`,
      notes: { days: rentalDays, price_per_day: pricePerDay, security_deposit: securityDeposit, total_price: totalPrice },
    };
    const order = await razorpay.orders.create(options);
    return res.status(200).json({ success: true, order, key_id: process.env.RAZORPAY_KEY_ID, days: rentalDays, totalPrice, securityDeposit });
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

    const pricePerDay = parseFloat(item.price_per_day);
    const securityDeposit = parseFloat(item.security_deposit || "0");
    const totalPrice = (pricePerDay * rentalDays) + securityDeposit;

    // Mark item as rented (so it is hidden from listings)
    await Items.updateOne({ _id: itemId }, { status: "rented" });

    // Generate a secure 4-digit handover OTP
    const handoverOtp = Math.floor(1000 + Math.random() * 9000).toString();

    // Create rental record (status starts as pending_handover)
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
      status: "pending_handover",
      handover_otp: handoverOtp,
      security_deposit: item.security_deposit,
    });
    await rental.save();

    // Notify buyer with their Handover OTP
    const buyerNotification = new Notification({
      recipient: req.user.email,
      sender: "system",
      item_name: item.name,
      price: item.price_per_day,
      days: rentalDays,
      total_price: totalPrice.toString(),
      rental_id: rental._id.toString(),
      type: "handover_otp",
    });
    await buyerNotification.save();

    // Notify seller that a buyer has paid and is ready for meetup
    const sellerNotification = new Notification({
      recipient: item.user,
      sender: req.user.email,
      item_name: item.name,
      price: item.price_per_day,
      days: rentalDays,
      total_price: totalPrice.toString(),
      rental_id: rental._id.toString(),
      type: "pending_handover",
    });
    await sellerNotification.save();

    console.log(`[PAYMENT VERIFIED] Rental ID: ${rental._id}. Handover OTP: ${handoverOtp}`);

    return res.status(200).json({ success: true, message: "Payment verified! Handover OTP generated.", rental_id: rental._id, handover_otp: handoverOtp });
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

// Seller marks handover complete using OTP
app.post("/verify-handover/:rentalId", authenticate, async (req, res) => {
  const { otp } = req.body;
  if (!otp) return res.status(400).json({ success: false, message: "Handover OTP is required" });
  try {
    const rental = await Rental.findById(req.params.rentalId);
    if (!rental) return res.status(404).json({ success: false, message: "Rental not found" });
    if (rental.seller !== req.user.email)
      return res.status(403).json({ success: false, message: "Only the seller can confirm handover" });
    if (rental.status !== "pending_handover")
      return res.status(400).json({ success: false, message: "Rental is not in pending handover state" });
    if (rental.handover_otp !== otp.trim())
      return res.status(400).json({ success: false, message: "Invalid handover OTP" });

    // Activate rental
    rental.status = "active";
    rental.handoverAt = new Date();
    await rental.save();

    // Release rent to seller, hold deposit
    const rentAmount = parseFloat(rental.total_price) - parseFloat(rental.security_deposit);
    console.log(`[MOCK PAYOUT] Released Rent of ₹${rentAmount} to Seller: ${rental.seller}`);
    console.log(`[MOCK ESCROW] Holding Security Deposit of ₹${rental.security_deposit} in Escrow.`);

    // Notification to Seller
    await new Notification({
      recipient: rental.seller,
      sender: "system",
      item_name: rental.item_name,
      price: rental.price_per_day,
      days: rental.days,
      total_price: rentAmount.toString(),
      rental_id: rental._id.toString(),
      type: "handover_complete_seller",
    }).save();

    // Notification to Buyer
    await new Notification({
      recipient: rental.buyer,
      sender: "system",
      item_name: rental.item_name,
      price: rental.price_per_day,
      days: rental.days,
      total_price: rental.security_deposit,
      rental_id: rental._id.toString(),
      type: "handover_complete_buyer",
    }).save();

    return res.status(200).json({ success: true, message: "Handover verified! Rental is now active." });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error during handover verification" });
  }
});

// Buyer cancels order before handover (No-Show)
app.post("/cancel-rental/:rentalId", authenticate, async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.rentalId);
    if (!rental) return res.status(404).json({ success: false, message: "Rental not found" });
    if (rental.buyer !== req.user.email)
      return res.status(403).json({ success: false, message: "Only the buyer can cancel the booking" });
    if (rental.status !== "pending_handover")
      return res.status(400).json({ success: false, message: "Can only cancel before handover is complete" });

    // Cancel rental and release item
    rental.status = "disputed";
    await rental.save();

    await Items.findOneAndUpdate({ _id: rental.item_id }, { status: "available" });

    console.log(`[MOCK REFUND] Booking cancelled. Full refund of ₹${rental.total_price} initiated to Buyer: ${rental.buyer}`);

    // Notify Buyer
    await new Notification({
      recipient: rental.buyer,
      sender: "system",
      item_name: rental.item_name,
      price: rental.price_per_day,
      days: rental.days,
      total_price: rental.total_price,
      rental_id: rental._id.toString(),
      type: "buyer_cancelled",
    }).save();

    // Notify Seller
    await new Notification({
      recipient: rental.seller,
      sender: "system",
      item_name: rental.item_name,
      price: rental.price_per_day,
      days: rental.days,
      total_price: rental.total_price,
      rental_id: rental._id.toString(),
      type: "booking_cancelled_seller",
    }).save();

    return res.status(200).json({ success: true, message: "Rental booking cancelled and refunded." });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error during cancellation" });
  }
});

// Seller marks item as returned
app.post("/return-item/:rentalId", authenticate, async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.rentalId);
    if (!rental) return res.status(404).json({ success: false, message: "Rental not found" });
    if (rental.seller !== req.user.email)
      return res.status(403).json({ success: false, message: "Only the seller can mark as returned" });
    if (rental.status !== "active")
      return res.status(400).json({ success: false, message: "Rental is not active" });

    // Calculate late fees if applicable
    const deadline = new Date(rental.handoverAt.getTime() + rental.days * 24 * 60 * 60 * 1000);
    const now = new Date();
    let lateFee = 0;

    if (now > deadline) {
      const diffTime = Math.abs(now - deadline);
      const lateDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const dailyPrice = parseFloat(rental.price_per_day);
      const securityDeposit = parseFloat(rental.security_deposit || "0");
      lateFee = lateDays * (1.5 * dailyPrice);
      if (lateFee > securityDeposit) {
        lateFee = securityDeposit;
        // Flag the buyer
        await User.updateOne({ email: rental.buyer }, { status: "flagged" });
      }
    }

    const refundAmount = parseFloat(rental.security_deposit || "0") - lateFee;

    rental.status = "returned";
    rental.returnedAt = now;
    rental.late_fee = lateFee;
    await rental.save();

    // Reset item status to available so it can be rented again
    await Items.findOneAndUpdate({ _id: rental.item_id }, { status: "available" });

    console.log(`[MOCK REFUND] Returned item. Refunded ₹${refundAmount} to Buyer: ${rental.buyer}. Late fee kept: ₹${lateFee}`);

    // Notify buyer
    await new Notification({
      recipient: rental.buyer,
      sender: req.user.email,
      item_name: rental.item_name,
      price: rental.price_per_day,
      days: rental.days,
      total_price: refundAmount.toString(),
      rental_id: rental._id.toString(),
      type: "returned",
    }).save();

    // Notify seller if they got any late fee
    if (lateFee > 0) {
      await new Notification({
        recipient: rental.seller,
        sender: "system",
        item_name: rental.item_name,
        price: rental.price_per_day,
        days: rental.days,
        total_price: lateFee.toString(),
        rental_id: rental._id.toString(),
        type: "late_fee_payout",
      }).save();
    }

    return res.status(200).json({ success: true, message: "Item marked as returned, payouts processed.", late_fee: lateFee, refund: refundAmount });
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

// ─── Background Scheduler (Method A) ──────────────────────────────────────────

const checkOverdueRentals = async () => {
  try {
    console.log("[BACKGROUND SCHEDULER] Scanning active rentals...");
    const activeRentals = await Rental.find({ status: "active" });

    for (const rental of activeRentals) {
      if (!rental.handoverAt) continue;

      const deadline = new Date(rental.handoverAt.getTime() + rental.days * 24 * 60 * 60 * 1000);
      const now = new Date();

      if (now > deadline) {
        const diffTime = Math.abs(now - deadline);
        const lateDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const dailyPrice = parseFloat(rental.price_per_day);
        const securityDeposit = parseFloat(rental.security_deposit || "0");

        const lateFee = lateDays * (1.5 * dailyPrice);

        if (lateFee >= securityDeposit) {
          // Depleted deposit! Flag student & Escalate to College
          console.log(`[BACKGROUND SCHEDULER] Rental ${rental._id} overdue. Security deposit depleted. Flagging buyer: ${rental.buyer}`);
          
          rental.status = "disputed";
          rental.late_fee = securityDeposit;
          await rental.save();

          // Flag user
          const buyer = await User.findOneAndUpdate({ email: rental.buyer }, { status: "flagged" });
          
          if (buyer) {
            // Find college associated with the student to escalate
            const college = await College.findOne({ college_code: buyer.college_code });
            if (college) {
              // Send notification to College Admin
              await new Notification({
                recipient: college.email,
                sender: "system",
                item_name: rental.item_name,
                price: rental.price_per_day,
                days: rental.days,
                total_price: securityDeposit.toString(),
                rental_id: rental._id.toString(),
                type: "college_escalation",
                is_college_escalation: true,
              }).save();

              console.log(`[BACKGROUND SCHEDULER] Escalated default to College: ${college.name} (${college.email})`);
            }
          }

          // Notify Seller that the deposit has been captured due to student default
          await new Notification({
            recipient: rental.seller,
            sender: "system",
            item_name: rental.item_name,
            price: rental.price_per_day,
            days: rental.days,
            total_price: securityDeposit.toString(),
            rental_id: rental._id.toString(),
            type: "escrow_captured_seller",
          }).save();

          // Notify Buyer that their account is suspended
          await new Notification({
            recipient: rental.buyer,
            sender: "system",
            item_name: rental.item_name,
            price: rental.price_per_day,
            days: rental.days,
            total_price: securityDeposit.toString(),
            rental_id: rental._id.toString(),
            type: "account_suspended_buyer",
          }).save();

        } else {
          // Late but deposit not fully depleted yet. Send warning notifications.
          const daysRemaining = Math.max(0, Math.floor((securityDeposit - lateFee) / (1.5 * dailyPrice)));
          console.log(`[BACKGROUND SCHEDULER] Rental ${rental._id} late by ${lateDays} days. Late fee: ₹${lateFee}. Deposit remaining: ₹${securityDeposit - lateFee}. Days left: ${daysRemaining}`);

          // Daily late warning notification
          await new Notification({
            recipient: rental.buyer,
            sender: "system",
            item_name: rental.item_name,
            price: rental.price_per_day,
            days: rental.days,
            total_price: lateFee.toString(),
            rental_id: rental._id.toString(),
            type: "late_warning_buyer",
          }).save();
        }
      }
    }
  } catch (error) {
    console.error("[BACKGROUND SCHEDULER] Error during scan:", error);
  }
};

// Check every 10 minutes in production, run a scan 5 seconds after startup
setInterval(checkOverdueRentals, 10 * 60 * 1000);
setTimeout(checkOverdueRentals, 5000);

server.listen(port, () => {
  console.log(`CampusTrade server running on port ${port}`);
});
