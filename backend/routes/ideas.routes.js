const router  = require("express").Router();
const { Idea, Vote, WTPVote, Watch, Notification, User } = require("../models");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const { recalcValidationScore }     = require("../utils/scoring");
const { emitToRoom, emitNotification } = require("../utils/socket");

// ── Feed ──────────────────────────────────────────────────────
router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const { sort = "trending", tag, page = 1, limit = 10 } = req.query;
    const skip   = (Number(page) - 1) * Number(limit);
    const filter = { isHidden: false, status: { $ne: "draft" } };
    if (tag) filter.tags = tag;

    const sortMap = {
      trending:  { validationScore: -1, createdAt: -1 },
      new:       { createdAt: -1 },
      validated: { willPayRate: -1 },
      building:  { status: -1, createdAt: -1 },
    };

    const [ideas, total] = await Promise.all([
      Idea.find(filter)
        .sort(sortMap[sort] || sortMap.trending)
        .skip(skip).limit(Number(limit))
        .populate("author", "name username avatar validationScore")
        .populate("project", "status currentDay currentMRR"),
      Idea.countDocuments(filter),
    ]);

    let userVotes = {};
    if (req.userId) {
      const vs = await Vote.find({ user: req.userId, idea: { $in: ideas.map(i => i._id) } });
      vs.forEach(v => { userVotes[v.idea.toString()] = v.direction; });
    }

    res.json({
      ideas: ideas.map(i => ({ ...i.toObject(), userVote: userVotes[i._id.toString()] || 0 })),
      total, page: Number(page), pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) { next(err); }
});

// ── Single idea ───────────────────────────────────────────────
router.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const idea = await Idea.findById(req.params.id)
      .populate("author", "name username avatar bio validationScore ideasCount")
      .populate("project");
    if (!idea) return res.status(404).json({ error: "Idea not found" });

    let userVote = 0, userWTP = null, isWatching = false;
    if (req.userId) {
      const [v, wtp, watch] = await Promise.all([
        Vote.findOne({ user: req.userId, idea: idea._id }),
        WTPVote.findOne({ user: req.userId, idea: idea._id }),
        Watch.findOne({ user: req.userId, targetType: "idea", targetId: idea._id }),
      ]);
      userVote = v?.direction || 0;
      userWTP  = wtp?.bucket  || null;
      isWatching = !!watch;
    }
    res.json({ ...idea.toObject(), userVote, userWTP, isWatching });
  } catch (err) { next(err); }
});

// ── Submit idea ───────────────────────────────────────────────
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { title, description, problem, solution, audience, monetization, tags } = req.body;
    if (!title || !description || !problem)
      return res.status(400).json({ error: "title, description and problem are required" });

    const idea = await Idea.create({
      author: req.userId, title, description, problem,
      solution, audience, monetization, tags,
    });
    await User.findByIdAndUpdate(req.userId, { $inc: { ideasCount: 1 } });
    await idea.populate("author", "name username avatar");
    res.status(201).json(idea);
  } catch (err) { next(err); }
});

// ── Edit idea (author only) ───────────────────────────────────
router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const idea = await Idea.findOne({ _id: req.params.id, author: req.userId });
    if (!idea) return res.status(403).json({ error: "Not authorised" });
    const allowed = ["title", "description", "problem", "solution", "audience", "monetization", "tags"];
    allowed.forEach(f => { if (req.body[f] !== undefined) idea[f] = req.body[f]; });
    await idea.save();
    res.json(idea);
  } catch (err) { next(err); }
});

// ── Delete idea ───────────────────────────────────────────────
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const idea = await Idea.findOneAndDelete({ _id: req.params.id, author: req.userId });
    if (!idea) return res.status(403).json({ error: "Not authorised" });
    await User.findByIdAndUpdate(req.userId, { $inc: { ideasCount: -1 } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── Vote ──────────────────────────────────────────────────────
router.post("/:id/vote", requireAuth, async (req, res, next) => {
  try {
    const { direction } = req.body;
    if (![1, -1, 0].includes(direction)) return res.status(400).json({ error: "direction must be 1, -1, or 0" });

    const idea     = await Idea.findById(req.params.id);
    if (!idea)     return res.status(404).json({ error: "Idea not found" });
    const existing = await Vote.findOne({ user: req.userId, idea: idea._id });

    if (direction === 0 && existing) {
      if (existing.direction === 1) idea.upvotes   = Math.max(0, idea.upvotes - 1);
      else                          idea.downvotes = Math.max(0, idea.downvotes - 1);
      await existing.deleteOne();
    } else if (!existing && direction !== 0) {
      await Vote.create({ user: req.userId, idea: idea._id, direction });
      if (direction === 1) idea.upvotes++; else idea.downvotes++;
    } else if (existing && direction !== 0 && direction !== existing.direction) {
      if (existing.direction === 1) { idea.upvotes--;   idea.downvotes++; }
      else                          { idea.downvotes--; idea.upvotes++;   }
      existing.direction = direction;
      await existing.save();
    }

    idea.validationScore = recalcValidationScore(idea);
    await idea.save();

    emitToRoom(`idea:${idea._id}`, "vote:update", {
      ideaId: idea._id, upvotes: idea.upvotes,
      downvotes: idea.downvotes, validationScore: idea.validationScore,
    });

    if (idea.author.toString() !== req.userId && direction === 1) {
      const notif = await Notification.create({
        recipient: idea.author, type: "idea_upvoted",
        actor: req.userId, entityId: idea._id,
        message: `Someone upvoted "${idea.title}"`,
      });
      emitNotification(idea.author.toString(), notif);
    }

    res.json({ upvotes: idea.upvotes, downvotes: idea.downvotes, validationScore: idea.validationScore, userVote: direction });
  } catch (err) { next(err); }
});

// ── WTP vote ──────────────────────────────────────────────────
router.post("/:id/wtp", requireAuth, async (req, res, next) => {
  try {
    const { bucket } = req.body;
    if (!["zero","low","mid","high"].includes(bucket))
      return res.status(400).json({ error: "bucket must be zero, low, mid, or high" });

    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ error: "Idea not found" });

    const existing = await WTPVote.findOne({ user: req.userId, idea: idea._id });
    if (existing) {
      idea.wtpVotes[existing.bucket] = Math.max(0, idea.wtpVotes[existing.bucket] - 1);
      existing.bucket = bucket;
      await existing.save();
    } else {
      await WTPVote.create({ user: req.userId, idea: idea._id, bucket });
      idea.wtpTotal++;
    }
    idea.wtpVotes[bucket]++;
    const payers = idea.wtpVotes.low + idea.wtpVotes.mid + idea.wtpVotes.high;
    idea.willPayRate     = idea.wtpTotal > 0 ? Math.round((payers / idea.wtpTotal) * 100) : 0;
    idea.validationScore = recalcValidationScore(idea);
    await idea.save();

    emitToRoom(`idea:${idea._id}`, "wtp:update", { ideaId: idea._id, wtpVotes: idea.wtpVotes, willPayRate: idea.willPayRate });

    res.json({ wtpVotes: idea.wtpVotes, willPayRate: idea.willPayRate, userBucket: bucket });
  } catch (err) { next(err); }
});

// ── Watch (toggle) ────────────────────────────────────────────
router.post("/:id/watch", requireAuth, async (req, res, next) => {
  try {
    const existing = await Watch.findOne({ user: req.userId, targetType: "idea", targetId: req.params.id });
    if (existing) {
      await existing.deleteOne();
      await Idea.findByIdAndUpdate(req.params.id, { $inc: { watcherCount: -1 } });
      return res.json({ watching: false });
    }
    await Watch.create({ user: req.userId, targetType: "idea", targetId: req.params.id });
    await Idea.findByIdAndUpdate(req.params.id, { $inc: { watcherCount: 1 } });
    res.json({ watching: true });
  } catch (err) { next(err); }
});

// ── Flag idea ─────────────────────────────────────────────────
router.post("/:id/flag", requireAuth, async (req, res, next) => {
  try {
    await Idea.findByIdAndUpdate(req.params.id, { $inc: { flagCount: 1 } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;