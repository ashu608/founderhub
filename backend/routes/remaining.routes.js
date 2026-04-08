// ============================================================
//  battles.routes.js
// ============================================================
const battlesRouter = require("express").Router();
const { Battle, BattleVote, Idea, Notification } = require("../models");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const { emitToRoom }                = require("../utils/socket");

battlesRouter.get("/active", optionalAuth, async (req, res, next) => {
  try {
    const battles = await Battle.find({ active: true, endsAt: { $gt: new Date() } })
      .populate("ideaA", "title description tags validationScore upvotes")
      .populate("ideaB", "title description tags validationScore upvotes")
      .limit(5);

    let userVotes = {};
    if (req.userId) {
      const vs = await BattleVote.find({ user: req.userId, battle: { $in: battles.map(b => b._id) } });
      vs.forEach(v => { userVotes[v.battle.toString()] = v.picked.toString(); });
    }
    res.json(battles.map(b => ({ ...b.toObject(), userPicked: userVotes[b._id.toString()] || null })));
  } catch (err) { next(err); }
});

battlesRouter.get("/history", async (req, res, next) => {
  try {
    const battles = await Battle.find({ active: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("ideaA", "title tags")
      .populate("ideaB", "title tags")
      .populate("winner", "title");
    res.json(battles);
  } catch (err) { next(err); }
});

battlesRouter.post("/:id/vote", requireAuth, async (req, res, next) => {
  try {
    const { picked } = req.body;
    const battle     = await Battle.findOne({ _id: req.params.id, active: true });
    if (!battle) return res.status(404).json({ error: "Battle not found or already closed" });

    const exists = await BattleVote.findOne({ user: req.userId, battle: battle._id });
    if (exists)  return res.status(409).json({ error: "Already voted in this battle" });

    if (![battle.ideaA.toString(), battle.ideaB.toString()].includes(picked))
      return res.status(400).json({ error: "picked must be ideaA or ideaB" });

    await BattleVote.create({ user: req.userId, battle: battle._id, picked });
    if (picked === battle.ideaA.toString()) battle.votesA++;
    else                                   battle.votesB++;
    await battle.save();

    emitToRoom(`battle:${battle._id}`, "battle:vote", {
      battleId: battle._id, votesA: battle.votesA, votesB: battle.votesB,
    });
    res.json({ votesA: battle.votesA, votesB: battle.votesB, userPicked: picked });
  } catch (err) { next(err); }
});

// ============================================================
//  users.routes.js
// ============================================================
const usersRouter = require("express").Router();
const { User, Idea: IdeaModel, Project, Follow } = require("../models");
const { requireAuth: uRequireAuth, optionalAuth: uOptionalAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");

usersRouter.get("/:username", uOptionalAuth, async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select("-passwordHash -googleId -email -notifications");
    if (!user) return res.status(404).json({ error: "User not found" });

    const [ideas, projects, isFollowing] = await Promise.all([
      IdeaModel.find({ author: user._id, isHidden: false }).sort({ validationScore: -1 }).limit(6),
      Project.find({ founder: user._id }).populate("idea", "title").limit(6),
      req.userId ? Follow.exists({ follower: req.userId, following: user._id }) : Promise.resolve(false),
    ]);

    res.json({ ...user.toObject(), ideas, projects, isFollowing: !!isFollowing });
  } catch (err) { next(err); }
});

usersRouter.patch("/me", uRequireAuth, async (req, res, next) => {
  try {
    const allowed = ["name", "bio", "location", "twitter", "linkedin", "notifications"];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true })
      .select("-passwordHash -googleId");
    res.json(user);
  } catch (err) { next(err); }
});

usersRouter.post("/me/avatar", uRequireAuth, upload.single("avatar"), async (req, res, next) => {
  try {
    if (!req.file?.path) return res.status(400).json({ error: "No file uploaded" });
    const user = await User.findByIdAndUpdate(
      req.userId, { avatar: req.file.path }, { new: true }
    ).select("-passwordHash -googleId");
    res.json({ avatar: user.avatar });
  } catch (err) { next(err); }
});

usersRouter.post("/:id/follow", uRequireAuth, async (req, res, next) => {
  try {
    if (req.userId === req.params.id) return res.status(400).json({ error: "Cannot follow yourself" });
    const existing = await Follow.findOne({ follower: req.userId, following: req.params.id });
    if (existing) {
      await existing.deleteOne();
      await User.findByIdAndUpdate(req.userId,    { $inc: { followingCount: -1 } });
      await User.findByIdAndUpdate(req.params.id, { $inc: { followersCount: -1 } });
      return res.json({ following: false });
    }
    await Follow.create({ follower: req.userId, following: req.params.id });
    await User.findByIdAndUpdate(req.userId,    { $inc: { followingCount: 1 } });
    await User.findByIdAndUpdate(req.params.id, { $inc: { followersCount: 1 } });
    res.json({ following: true });
  } catch (err) { next(err); }
});

usersRouter.get("/:id/followers", async (req, res, next) => {
  try {
    const follows = await Follow.find({ following: req.params.id })
      .populate("follower", "name username avatar validationScore").limit(20);
    res.json(follows.map(f => f.follower));
  } catch (err) { next(err); }
});

usersRouter.get("/:id/following", async (req, res, next) => {
  try {
    const follows = await Follow.find({ follower: req.params.id })
      .populate("following", "name username avatar validationScore").limit(20);
    res.json(follows.map(f => f.following));
  } catch (err) { next(err); }
});

// ============================================================
//  leaderboard.routes.js
// ============================================================
const lbRouter = require("express").Router();
const { Idea: LbIdea, User: LbUser, Project: LbProject } = require("../models");

lbRouter.get("/ideas", async (req, res, next) => {
  try {
    const ideas = await LbIdea.find({ status: { $ne: "draft" }, isHidden: false })
      .sort({ validationScore: -1 }).limit(20)
      .populate("author", "name username avatar");
    res.json(ideas);
  } catch (err) { next(err); }
});

lbRouter.get("/builders", async (req, res, next) => {
  try {
    const users = await LbUser.find()
      .sort({ validationScore: -1 }).limit(20)
      .select("name username avatar validationScore ideasCount streakDays badges");
    res.json(users);
  } catch (err) { next(err); }
});

lbRouter.get("/growing", async (req, res, next) => {
  try {
    const projects = await LbProject.find({ status: { $in: ["building","launched","revenue"] } })
      .sort({ currentMRR: -1 }).limit(20)
      .populate("founder", "name username avatar")
      .populate("idea",    "title tags");
    res.json(projects);
  } catch (err) { next(err); }
});

// ============================================================
//  notifications.routes.js
// ============================================================
const notifRouter  = require("express").Router();
// const { Notification } = require("../models");
const { requireAuth: nRequireAuth } = require("../middleware/auth");

notifRouter.get("/", nRequireAuth, async (req, res, next) => {
  try {
    const notifs = await Notification.find({ recipient: req.userId })
      .sort({ createdAt: -1 }).limit(30)
      .populate("actor", "name username avatar");
    res.json(notifs);
  } catch (err) { next(err); }
});

notifRouter.get("/unread-count", nRequireAuth, async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.userId, isRead: false });
    res.json({ count });
  } catch (err) { next(err); }
});

notifRouter.patch("/read-all", nRequireAuth, async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.userId, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (err) { next(err); }
});

notifRouter.patch("/:id/read", nRequireAuth, async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.userId }, { isRead: true });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ============================================================
//  search.routes.js
// ============================================================
const searchRouter = require("express").Router();
const { Idea: SIdea, User: SUser } = require("../models");

searchRouter.get("/", async (req, res, next) => {
  try {
    const { q = "", type = "all" } = req.query;
    if (!q.trim()) return res.json({ ideas: [], users: [] });

    const regex   = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const results = {};

    if (type === "ideas" || type === "all") {
      results.ideas = await SIdea.find({
        isHidden: false,
        $or: [{ title: regex }, { description: regex }, { tags: regex }],
      }).limit(10).populate("author", "name username avatar");
    }
    if (type === "users" || type === "all") {
      results.users = await SUser.find({
        $or: [{ name: regex }, { username: regex }],
      }).limit(5).select("name username avatar validationScore ideasCount");
    }

    res.json(results);
  } catch (err) { next(err); }
});

// ============================================================
//  EXPORTS
// ============================================================
module.exports = { battlesRouter, usersRouter, lbRouter, notifRouter, searchRouter };