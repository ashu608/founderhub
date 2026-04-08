const router  = require("express").Router();
const bcrypt  = require("bcrypt");
const { User } = require("../models");
const { sign } = require("../utils/jwt");
const { requireAuth } = require("../middleware/auth");
const { OAuth2Client } = require("google-auth-library");

const sanitize = (u) => ({
  _id: u._id, name: u.name, username: u.username,
  email: u.email, avatar: u.avatar, bio: u.bio,
  plan: u.plan, validationScore: u.validationScore,
  ideasCount: u.ideasCount, streakDays: u.streakDays,
  badges: u.badges, createdAt: u.createdAt,
});

// POST /auth/register
router.post("/register", async (req, res, next) => {
  try {
    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password)
      return res.status(400).json({ error: "All fields are required" });
    if (password.length < 8)
      return res.status(400).json({ error: "Password must be at least 8 characters" });

    const exists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] });
    if (exists) return res.status(409).json({ error: "Email or username already taken" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, username: username.toLowerCase(), email: email.toLowerCase(), passwordHash });
    const token = sign({ userId: user._id });
    res.status(201).json({ token, user: sanitize(user) });
  } catch (err) { next(err); }
});

// POST /auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    user.lastActiveAt = new Date();
    user.streakDays   = user.streakDays + 1;
    await user.save();

    const token = sign({ userId: user._id });
    res.json({ token, user: sanitize(user) });
  } catch (err) { next(err); }
});

// POST /auth/google
router.post("/google", async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: "idToken is required" });

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

    if (!user) {
      const base     = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
      let   username = base;
      let   attempt  = 1;
      while (await User.exists({ username })) { username = `${base}${attempt++}`; }

      user = await User.create({
        name, username, email: email.toLowerCase(),
        googleId, avatar: picture, emailVerified: true,
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      if (!user.avatar) user.avatar = picture;
      await user.save();
    }

    user.lastActiveAt = new Date();
    await user.save();

    const token = sign({ userId: user._id });
    res.json({ token, user: sanitize(user) });
  } catch (err) { next(err); }
});

// GET /auth/me
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("-passwordHash -googleId");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) { next(err); }
});

// POST /auth/refresh  — extend token if valid
router.post("/refresh", requireAuth, async (req, res) => {
  const token = sign({ userId: req.userId });
  res.json({ token });
});

module.exports = router;