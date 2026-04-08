const router = require("express").Router();
const { battlesRouter, usersRouter, lbRouter, notifRouter, searchRouter } = require("./remaining.routes");

router.use("/auth",          require("./auth.routes"));
router.use("/ideas",         require("./ideas.routes"));
router.use("/ideas/:ideaId/comments", require("./comments.routes"));
router.use("/projects",      require("./projects.routes"));
router.use("/battles",       battlesRouter);
router.use("/users",         usersRouter);
router.use("/leaderboard",   lbRouter);
router.use("/notifications", notifRouter);
router.use("/search",        searchRouter);

module.exports = router;