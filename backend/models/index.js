// ============================================================
//  FOUNDERHUB — MongoDB Schemas (Mongoose)
//  File: models/index.js  (or split into individual files)
// ============================================================

const mongoose = require("mongoose");
const { Schema } = mongoose;

// ─────────────────────────────────────────────────────────────
//  1. USER
// ─────────────────────────────────────────────────────────────
const UserSchema = new Schema(
  {
    name:          { type: String, required: true, trim: true },
    username:      { type: String, required: true, unique: true, lowercase: true, trim: true },
    email:         { type: String, required: true, unique: true, lowercase: true },
    passwordHash:  { type: String },                         // null for OAuth users
    avatar:        { type: String, default: "" },
    bio:           { type: String, maxlength: 280 },
    location:      { type: String },
    twitter:       { type: String },
    linkedin:      { type: String },

    // Auth
    googleId:      { type: String, sparse: true },           // for Google OAuth
    emailVerified: { type: Boolean, default: false },

    // Gamification
    validationScore: { type: Number, default: 0 },           // computed score across all ideas
    streakDays:      { type: Number, default: 0 },
    lastActiveAt:    { type: Date, default: Date.now },
    badges:          [{ type: String }],                     // e.g. "first_idea", "10_votes", "builder"

    // Relations (denormalised counts for performance)
    ideasCount:    { type: Number, default: 0 },
    followersCount:{ type: Number, default: 0 },
    followingCount:{ type: Number, default: 0 },

    // Settings
    plan:          { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
    planExpiresAt: { type: Date },
    notifications: {
      email:   { type: Boolean, default: true },
      inApp:   { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

UserSchema.index({ username: 1 });
UserSchema.index({ validationScore: -1 });
UserSchema.index({ createdAt: -1 });

const User = mongoose.model("User", UserSchema);


// ─────────────────────────────────────────────────────────────
//  2. IDEA
// ─────────────────────────────────────────────────────────────
const IdeaSchema = new Schema(
  {
    author:      { type: Schema.Types.ObjectId, ref: "User", required: true },
    title:       { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, maxlength: 2000 },
    problem:     { type: String, required: true, maxlength: 1000 },
    solution:    { type: String, maxlength: 1000 },
    audience:    { type: String, maxlength: 300 },

    monetization: {
      type:    { type: String, enum: ["saas", "marketplace", "d2c", "freemium", "ads", "enterprise", "other"] },
      details: { type: String },
    },

    tags: [{ type: String, enum: ["AI", "SaaS", "D2C", "Fintech", "EdTech", "HealthTech", "Marketplace", "Web3", "Gaming", "Other"] }],

    status: {
      type: String,
      enum: ["draft", "published", "building", "launched", "dropped"],
      default: "published",
    },

    // Validation score (recomputed on each vote)
    // Formula: (upvoteRatio × 40) + (willPayRate × 40) + (engagementScore × 20)
    validationScore: { type: Number, default: 0, min: 0, max: 100 },

    // Aggregate counters (denormalised for feed speed)
    upvotes:       { type: Number, default: 0 },
    downvotes:     { type: Number, default: 0 },
    commentCount:  { type: Number, default: 0 },
    watcherCount:  { type: Number, default: 0 },
    shareCount:    { type: Number, default: 0 },

    // Willingness-to-pay buckets
    wtpVotes: {
      zero:     { type: Number, default: 0 },   // Won't pay
      low:      { type: Number, default: 0 },   // ₹99–199
      mid:      { type: Number, default: 0 },   // ₹299–499
      high:     { type: Number, default: 0 },   // ₹500+
    },
    wtpTotal:       { type: Number, default: 0 },   // sum of all wtp votes
    willPayRate:    { type: Number, default: 0 },   // % who picked low/mid/high

    // Battle stats
    battleWins:   { type: Number, default: 0 },
    battleTotal:  { type: Number, default: 0 },

    // Linked project (set when founder converts idea → project)
    project: { type: Schema.Types.ObjectId, ref: "Project" },

    // Moderation
    isHidden:   { type: Boolean, default: false },
    isPinned:   { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    flagCount:  { type: Number, default: 0 },

    // Pro feature: highlighted
    isHighlighted:     { type: Boolean, default: false },
    highlightExpiresAt:{ type: Date },
  },
  { timestamps: true }
);

IdeaSchema.index({ author: 1 });
IdeaSchema.index({ validationScore: -1 });
IdeaSchema.index({ createdAt: -1 });
IdeaSchema.index({ tags: 1 });
IdeaSchema.index({ status: 1 });
IdeaSchema.index({ isFeatured: 1, validationScore: -1 });

// Virtual: net votes
IdeaSchema.virtual("netVotes").get(function () {
  return this.upvotes - this.downvotes;
});

const Idea = mongoose.model("Idea", IdeaSchema);


// ─────────────────────────────────────────────────────────────
//  3. VOTE  (upvote / downvote on ideas)
// ─────────────────────────────────────────────────────────────
const VoteSchema = new Schema(
  {
    user:      { type: Schema.Types.ObjectId, ref: "User", required: true },
    idea:      { type: Schema.Types.ObjectId, ref: "Idea", required: true },
    direction: { type: Number, enum: [1, -1], required: true },   // 1 = up, -1 = down
  },
  { timestamps: true }
);

VoteSchema.index({ user: 1, idea: 1 }, { unique: true });  // one vote per user per idea

const Vote = mongoose.model("Vote", VoteSchema);


// ─────────────────────────────────────────────────────────────
//  4. WTP_VOTE  (willingness-to-pay)
// ─────────────────────────────────────────────────────────────
const WTPVoteSchema = new Schema(
  {
    user:   { type: Schema.Types.ObjectId, ref: "User", required: true },
    idea:   { type: Schema.Types.ObjectId, ref: "Idea", required: true },
    bucket: { type: String, enum: ["zero", "low", "mid", "high"], required: true },
  },
  { timestamps: true }
);

WTPVoteSchema.index({ user: 1, idea: 1 }, { unique: true });

const WTPVote = mongoose.model("WTPVote", WTPVoteSchema);


// ─────────────────────────────────────────────────────────────
//  5. COMMENT
// ─────────────────────────────────────────────────────────────
const CommentSchema = new Schema(
  {
    author:   { type: Schema.Types.ObjectId, ref: "User", required: true },
    idea:     { type: Schema.Types.ObjectId, ref: "Idea", required: true },
    parent:   { type: Schema.Types.ObjectId, ref: "Comment", default: null }, // null = top-level
    body:     { type: String, required: true, maxlength: 1000 },
    isBrutal: { type: Boolean, default: false },  // "Brutal feedback" toggle
    upvotes:  { type: Number, default: 0 },

    // Moderation
    isHidden:  { type: Boolean, default: false },
    flagCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CommentSchema.index({ idea: 1, createdAt: -1 });
CommentSchema.index({ idea: 1, upvotes: -1 });
CommentSchema.index({ parent: 1 });

const Comment = mongoose.model("Comment", CommentSchema);


// ─────────────────────────────────────────────────────────────
//  6. PROJECT  (idea → execution tracker)
// ─────────────────────────────────────────────────────────────
const MilestoneSchema = new Schema({
  day:       { type: Number, required: true },
  title:     { type: String, required: true, maxlength: 120 },
  note:      { type: String, maxlength: 500 },
  status:    { type: String, enum: ["done", "active", "upcoming"], default: "upcoming" },
  metrics: {
    revenue:    { type: Number },          // ₹ MRR at this milestone
    users:      { type: Number },
    signups:    { type: Number },
  },
  loggedAt:  { type: Date },
});

const ProjectSchema = new Schema(
  {
    founder:     { type: Schema.Types.ObjectId, ref: "User", required: true },
    idea:        { type: Schema.Types.ObjectId, ref: "Idea", required: true },
    title:       { type: String, required: true },
    description: { type: String },
    liveUrl:     { type: String },
    repoUrl:     { type: String },

    status: {
      type: String,
      enum: ["planning", "building", "launched", "revenue", "dropped"],
      default: "building",
    },

    milestones: [MilestoneSchema],

    // Build-or-Drop enforcement
    lastUpdateAt:    { type: Date, default: Date.now },
    inactiveWarning: { type: Boolean, default: false },  // flagged after 7 days

    // Metrics (latest snapshot)
    currentMRR:     { type: Number, default: 0 },
    totalUsers:     { type: Number, default: 0 },
    currentDay:     { type: Number, default: 1 },   // days since project start

    // Watchers / followers of this build
    watcherCount:   { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProjectSchema.index({ founder: 1 });
ProjectSchema.index({ idea: 1 }, { unique: true });
ProjectSchema.index({ status: 1, currentMRR: -1 });
ProjectSchema.index({ lastUpdateAt: 1 });           // for inactive detection cron

const Project = mongoose.model("Project", ProjectSchema);


// ─────────────────────────────────────────────────────────────
//  7. BATTLE
// ─────────────────────────────────────────────────────────────
const BattleSchema = new Schema(
  {
    ideaA:  { type: Schema.Types.ObjectId, ref: "Idea", required: true },
    ideaB:  { type: Schema.Types.ObjectId, ref: "Idea", required: true },
    votesA: { type: Number, default: 0 },
    votesB: { type: Number, default: 0 },
    endsAt: { type: Date, required: true },
    active: { type: Boolean, default: true },
    winner: { type: Schema.Types.ObjectId, ref: "Idea" },  // set on close
  },
  { timestamps: true }
);

BattleSchema.index({ active: 1, endsAt: 1 });

const Battle = mongoose.model("Battle", BattleSchema);


// ─────────────────────────────────────────────────────────────
//  8. BATTLE_VOTE
// ─────────────────────────────────────────────────────────────
const BattleVoteSchema = new Schema(
  {
    user:   { type: Schema.Types.ObjectId, ref: "User", required: true },
    battle: { type: Schema.Types.ObjectId, ref: "Battle", required: true },
    picked: { type: Schema.Types.ObjectId, ref: "Idea", required: true },  // ideaA or ideaB
  },
  { timestamps: true }
);

BattleVoteSchema.index({ user: 1, battle: 1 }, { unique: true });

const BattleVote = mongoose.model("BattleVote", BattleVoteSchema);


// ─────────────────────────────────────────────────────────────
//  9. FOLLOW  (user → user)
// ─────────────────────────────────────────────────────────────
const FollowSchema = new Schema(
  {
    follower:  { type: Schema.Types.ObjectId, ref: "User", required: true },
    following: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

FollowSchema.index({ follower: 1, following: 1 }, { unique: true });
FollowSchema.index({ following: 1 });

const Follow = mongoose.model("Follow", FollowSchema);


// ─────────────────────────────────────────────────────────────
//  10. WATCH  (user watching an idea or project)
// ─────────────────────────────────────────────────────────────
const WatchSchema = new Schema(
  {
    user:       { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, enum: ["idea", "project"], required: true },
    targetId:   { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

WatchSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

const Watch = mongoose.model("Watch", WatchSchema);


// ─────────────────────────────────────────────────────────────
//  11. NOTIFICATION
// ─────────────────────────────────────────────────────────────
const NotificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "idea_upvoted", "idea_commented", "idea_featured",
        "project_watched", "project_inactive_warning",
        "battle_started", "battle_result",
        "new_follower", "wtp_milestone",
      ],
      required: true,
    },
    actor:     { type: Schema.Types.ObjectId, ref: "User" },
    entityId:  { type: Schema.Types.ObjectId },              // idea / project / battle
    message:   { type: String },
    isRead:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", NotificationSchema);


// ─────────────────────────────────────────────────────────────
//  EXPORTS
// ─────────────────────────────────────────────────────────────
module.exports = {
  User,
  Idea,
  Vote,
  WTPVote,
  Comment,
  Project,
  Battle,
  BattleVote,
  Follow,
  Watch,
  Notification,
};