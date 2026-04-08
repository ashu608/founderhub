const router  = require("express").Router({ mergeParams: true });
const { Comment, Idea, Notification } = require("../models");
const { requireAuth, optionalAuth }   = require("../middleware/auth");
const { emitToRoom, emitNotification } = require("../utils/socket");

// GET /ideas/:ideaId/comments
router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const { sort = "newest", page = 1, limit = 20 } = req.query;
    const sortMap = {
      newest:   { createdAt: -1 },
      helpful:  { upvotes: -1 },
      critical: { isBrutal: -1, createdAt: -1 },
    };

    const topLevel = await Comment.find({ idea: req.params.ideaId, parent: null, isHidden: false })
      .sort(sortMap[sort] || sortMap.newest)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate("author", "name username avatar");

    const ids     = topLevel.map(c => c._id);
    const replies = await Comment.find({ parent: { $in: ids }, isHidden: false })
      .populate("author", "name username avatar");

    const replyMap = {};
    replies.forEach(r => {
      const key = r.parent.toString();
      if (!replyMap[key]) replyMap[key] = [];
      replyMap[key].push(r);
    });

    res.json(topLevel.map(c => ({ ...c.toObject(), replies: replyMap[c._id.toString()] || [] })));
  } catch (err) { next(err); }
});

// POST /ideas/:ideaId/comments
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { body, isBrutal = false, parent = null } = req.body;
    if (!body?.trim()) return res.status(400).json({ error: "body is required" });

    const comment = await Comment.create({
      author: req.userId, idea: req.params.ideaId, body: body.trim(), isBrutal, parent,
    });

    if (!parent) await Idea.findByIdAndUpdate(req.params.ideaId, { $inc: { commentCount: 1 } });

    await comment.populate("author", "name username avatar");

    emitToRoom(`idea:${req.params.ideaId}`, "comment:new", comment);

    const idea = await Idea.findById(req.params.ideaId).select("author title");
    if (idea && idea.author.toString() !== req.userId) {
      const notif = await Notification.create({
        recipient: idea.author, type: "idea_commented",
        actor: req.userId, entityId: idea._id,
        message: `New comment on "${idea.title}"`,
      });
      emitNotification(idea.author.toString(), notif);
    }

    res.status(201).json(comment);
  } catch (err) { next(err); }
});

// POST /ideas/:ideaId/comments/:commentId/upvote
router.post("/:commentId/upvote", requireAuth, async (req, res, next) => {
  try {
    const comment = await Comment.findByIdAndUpdate(
      req.params.commentId,
      { $inc: { upvotes: 1 } },
      { new: true }
    );
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    res.json({ upvotes: comment.upvotes });
  } catch (err) { next(err); }
});

// DELETE /ideas/:ideaId/comments/:commentId
router.delete("/:commentId", requireAuth, async (req, res, next) => {
  try {
    const comment = await Comment.findOneAndDelete({ _id: req.params.commentId, author: req.userId });
    if (!comment) return res.status(403).json({ error: "Not authorised" });
    if (!comment.parent) await Idea.findByIdAndUpdate(req.params.ideaId, { $inc: { commentCount: -1 } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;