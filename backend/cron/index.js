// backend/cron/index.js
const cron = require("node-cron");
const { Project, Battle, Idea, Notification, User } = require("../models");
const { emitToRoom, emitNotification, emitBroadcast } = require("../utils/socket");
const { recalcValidationScore } = require("../utils/scoring");

const startCrons = () => {
  // 1. Build-or-Drop — daily 9AM IST (03:30 UTC)
  cron.schedule("30 3 * * *", async () => {
    try {
      const sevenDaysAgo    = new Date(Date.now() - 7  * 86_400_000);
      const fourteenDaysAgo = new Date(Date.now() - 14 * 86_400_000);

      const toWarn = await Project.find({ status: "building", lastUpdateAt: { $lt: sevenDaysAgo }, inactiveWarning: false });
      for (const p of toWarn) {
        p.inactiveWarning = true;
        await p.save();
        const n = await Notification.create({ recipient: p.founder, type: "project_inactive_warning", entityId: p._id, message: `⚠️ No updates in 7 days on "${p.title}". Log a milestone to stay active.` });
        emitNotification(p.founder.toString(), n);
      }

      const toDrop = await Project.find({ status: "building", lastUpdateAt: { $lt: fourteenDaysAgo }, inactiveWarning: true });
      for (const p of toDrop) {
        p.status = "dropped";
        await p.save();
        await Idea.findByIdAndUpdate(p.idea, { status: "dropped" });
        const n = await Notification.create({ recipient: p.founder, type: "project_inactive_warning", entityId: p._id, message: `💀 "${p.title}" marked dropped after 14 days of inactivity.` });
        emitNotification(p.founder.toString(), n);
      }
      console.log(`[cron] Build-or-Drop: warned=${toWarn.length} dropped=${toDrop.length}`);
    } catch (e) { console.error("[cron] Build-or-Drop error:", e.message); }
  });

  // 2. Close expired battles — every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    try {
      const expired = await Battle.find({ active: true, endsAt: { $lt: new Date() } })
        .populate("ideaA", "title").populate("ideaB", "title");

      for (const b of expired) {
        b.active = false;
        b.winner = b.votesA >= b.votesB ? b.ideaA._id : b.ideaB._id;
        await b.save();
        await Idea.findByIdAndUpdate(b.winner, { $inc: { battleWins: 1, battleTotal: 1 } });
        const loserId = b.winner.toString() === b.ideaA._id.toString() ? b.ideaB._id : b.ideaA._id;
        await Idea.findByIdAndUpdate(loserId, { $inc: { battleTotal: 1 } });
        emitToRoom(`battle:${b._id}`, "battle:closed", { battleId: b._id, winner: b.winner, votesA: b.votesA, votesB: b.votesB });
      }
    } catch (e) { console.error("[cron] Battle closer error:", e.message); }
  });

  // 3. Auto-create daily battles — midnight UTC
  cron.schedule("0 0 * * *", async () => {
    try {
      const today = new Date(); today.setHours(0,0,0,0);
      if (await Battle.findOne({ createdAt: { $gte: today } })) return;

      const ideas  = await Idea.aggregate([{ $match: { status: "published", validationScore: { $gte: 30 }, isHidden: false } }, { $sample: { size: 6 } }]);
      const endsAt = new Date(Date.now() + 86_400_000);
      const battles = [];
      for (let i = 0; i + 1 < ideas.length && battles.length < 3; i += 2) {
        battles.push(await Battle.create({ ideaA: ideas[i]._id, ideaB: ideas[i+1]._id, endsAt }));
      }
      if (battles.length) {
        const populated = await Battle.find({ _id: { $in: battles.map(b=>b._id) } }).populate("ideaA","title tags").populate("ideaB","title tags");
        emitBroadcast("battle:new", { battles: populated });
      }
      console.log(`[cron] Created ${battles.length} battles`);
    } catch (e) { console.error("[cron] Battle creation error:", e.message); }
  });

  // 4. Recompute leaderboard scores — every hour
  cron.schedule("0 * * * *", async () => {
    try {
      const users = await User.find().select("_id");
      for (const u of users) {
        const ideas = await Idea.find({ author: u._id });
        if (!ideas.length) continue;
        const avg = Math.round(ideas.reduce((s,i) => s + (i.validationScore||0), 0) / ideas.length);
        await User.findByIdAndUpdate(u._id, { validationScore: avg });
      }
    } catch (e) { console.error("[cron] Leaderboard error:", e.message); }
  });

  // 5. Reset streaks — 11:55 PM UTC
  cron.schedule("55 23 * * *", async () => {
    try {
      const oneDayAgo = new Date(Date.now() - 86_400_000);
      await User.updateMany({ lastActiveAt: { $lt: oneDayAgo }, streakDays: { $gt: 0 } }, { $set: { streakDays: 0 } });
    } catch (e) { console.error("[cron] Streak reset error:", e.message); }
  });

  console.log("[cron] All jobs scheduled");
};

module.exports = { startCrons };