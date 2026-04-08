const router = require("express").Router();
const { Project, Idea, Watch, Notification } = require("../models");
const { requireAuth, optionalAuth }          = require("../middleware/auth");
const { emitNotification }                   = require("../utils/socket");

// GET /projects  — all active projects feed
router.get("/", async (req, res, next) => {
  try {
    const { sort = "newest", page = 1, limit = 10 } = req.query;
    const sortMap = { mrr: { currentMRR: -1 }, newest: { createdAt: -1 }, day: { currentDay: -1 } };

    const projects = await Project.find({ status: { $ne: "dropped" } })
      .sort(sortMap[sort] || sortMap.newest)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate("founder", "name username avatar")
      .populate("idea",    "title tags validationScore");

    res.json(projects);
  } catch (err) { next(err); }
});

// GET /projects/:id
router.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("founder", "name username avatar bio")
      .populate("idea",    "title description tags validationScore author");
    if (!project) return res.status(404).json({ error: "Project not found" });

    const isWatching = req.userId
      ? !!(await Watch.findOne({ user: req.userId, targetType: "project", targetId: project._id }))
      : false;

    res.json({ ...project.toObject(), isWatching });
  } catch (err) { next(err); }
});

// POST /projects  — convert idea → project
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { ideaId, title, description, liveUrl } = req.body;
    if (!ideaId || !title) return res.status(400).json({ error: "ideaId and title are required" });

    const idea = await Idea.findOne({ _id: ideaId, author: req.userId });
    if (!idea)    return res.status(403).json({ error: "Not authorised or idea not found" });
    if (idea.project) return res.status(409).json({ error: "Project already exists for this idea" });

    const project = await Project.create({
      founder: req.userId, idea: ideaId, title, description, liveUrl,
      milestones: [{ day: 1, title: "Idea submitted", status: "done", loggedAt: new Date() }],
    });

    idea.project = project._id;
    idea.status  = "building";
    await idea.save();

    await project.populate("founder", "name username avatar");
    res.status(201).json(project);
  } catch (err) { next(err); }
});

// PATCH /projects/:id  — update project meta
router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, founder: req.userId });
    if (!project) return res.status(403).json({ error: "Not authorised" });

    const allowed = ["title", "description", "liveUrl", "repoUrl", "status"];
    allowed.forEach(f => { if (req.body[f] !== undefined) project[f] = req.body[f]; });
    await project.save();
    res.json(project);
  } catch (err) { next(err); }
});

// POST /projects/:id/milestones  — log a progress update
router.post("/:id/milestones", requireAuth, async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, founder: req.userId });
    if (!project) return res.status(403).json({ error: "Not authorised" });

    const { day, title, note, metrics } = req.body;
    if (!day || !title) return res.status(400).json({ error: "day and title are required" });

    project.milestones.push({ day, title, note, metrics, status: "done", loggedAt: new Date() });
    project.lastUpdateAt    = new Date();
    project.inactiveWarning = false;
    project.currentDay      = day;
    if (metrics?.revenue) project.currentMRR  = metrics.revenue;
    if (metrics?.users)   project.totalUsers  = metrics.users;
    await project.save();

    res.json(project);
  } catch (err) { next(err); }
});

// POST /projects/:id/watch  — toggle watch
router.post("/:id/watch", requireAuth, async (req, res, next) => {
  try {
    const existing = await Watch.findOne({ user: req.userId, targetType: "project", targetId: req.params.id });
    if (existing) {
      await existing.deleteOne();
      await Project.findByIdAndUpdate(req.params.id, { $inc: { watcherCount: -1 } });
      return res.json({ watching: false });
    }
    await Watch.create({ user: req.userId, targetType: "project", targetId: req.params.id });
    await Project.findByIdAndUpdate(req.params.id, { $inc: { watcherCount: 1 } });

    const project = await Project.findById(req.params.id).select("founder title");
    if (project && project.founder.toString() !== req.userId) {
      const notif = await Notification.create({
        recipient: project.founder, type: "project_watched",
        actor: req.userId, entityId: project._id,
        message: `Someone is watching your project "${project.title}"`,
      });
      emitNotification(project.founder.toString(), notif);
    }
    res.json({ watching: true });
  } catch (err) { next(err); }
});

module.exports = router;