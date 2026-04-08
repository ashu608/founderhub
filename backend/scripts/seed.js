// scripts/seed.js
// Run: node scripts/seed.js
// Clears existing data and inserts realistic sample data for dev.

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt   = require("bcrypt");
const { User, Idea, Vote, WTPVote, Comment, Project, Battle } = require("../models");
const { recalcValidationScore } = require("../utils/scoring");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/founderhub";

const users = [
  { name: "Rohan Mehta",    username: "rohan_builds",   email: "rohan@demo.com",   bio: "Building in public. Ex-Razorpay. 2x founder.", streakDays: 34 },
  { name: "Priya Sharma",   username: "priya_builds",   email: "priya@demo.com",   bio: "Indie hacker. EdTech obsessed. BITS Pilani.", streakDays: 21 },
  { name: "Arjun Dev",      username: "arjun_dev",      email: "arjun@demo.com",   bio: "Developer turned founder. Building SkillSwap.", streakDays: 15 },
  { name: "Kavita Singh",   username: "kav_launches",   email: "kavita@demo.com",  bio: "D2C consultant. Obsessed with Tier 2 markets.", streakDays: 9 },
  { name: "Vikram Reddy",   username: "vikram_founder", email: "vikram@demo.com",  bio: "Pre-product PM. Validating ideas full-time.", streakDays: 5 },
  { name: "Demo User",      username: "demo",           email: "demo@founderhub.in", bio: "This is your test account. Password: demo1234", streakDays: 1 },
];

const ideaData = [
  {
    authorIdx: 2,
    title:       "SkillSwap — Barter skills, no money needed",
    description: "A platform where professionals trade skills directly. A developer teaches Python, gets UI design in return. No cash changes hands.",
    problem:     "Learning new skills is expensive. Courses cost ₹5K–₹20K. Most people already have a skill someone else needs.",
    solution:    "A barter-based marketplace where your skill IS your currency. Match based on what you know vs what you need.",
    audience:    "Freelancers, students, early-career professionals in Tier 2/3 cities",
    monetization:{ type: "freemium", details: "Free for basic swaps. ₹299/mo Pro for priority matching and verified badge." },
    tags:        ["SaaS", "Marketplace"],
    upvotes: 234, downvotes: 18, commentCount: 47,
    wtpVotes: { zero: 12, low: 56, mid: 89, high: 34 },
    status: "building",
  },
  {
    authorIdx: 0,
    title:       "InvoiceFlow AI — Smart invoicing for Indian freelancers",
    description: "Auto-generates GST-compliant invoices from WhatsApp voice notes. Sends payment reminders, tracks dues, exports for CA.",
    problem:     "67% of Indian freelancers lose money from late payments and manual invoicing errors. Most tools are built for the West.",
    solution:    "WhatsApp-first flow: dictate invoice details, AI fills the form, sends to client, follows up automatically.",
    audience:    "Freelancers, consultants, solo founders across India",
    monetization:{ type: "saas", details: "₹299/month. Free for first 5 invoices." },
    tags:        ["AI", "Fintech"],
    upvotes: 198, downvotes: 11, commentCount: 32,
    wtpVotes: { zero: 8, low: 34, mid: 78, high: 42 },
    status: "building",
  },
  {
    authorIdx: 3,
    title:       "CampusCart — Student marketplace for Tier 2 colleges",
    description: "Buy/sell textbooks, notes, hostel essentials within your campus. Verified college IDs only. Cash-on-delivery within campus.",
    problem:     "Students overpay for second-hand goods because there's no trusted platform. Facebook groups are chaotic.",
    solution:    "Hyper-local campus marketplace. Sellers meet buyers at the campus gate. No shipping, no trust issues.",
    audience:    "College students in Tier 2/3 cities — 50M+ addressable users",
    monetization:{ type: "marketplace", details: "5% commission on each sale. Promoted listings ₹49/week." },
    tags:        ["D2C", "Marketplace"],
    upvotes: 156, downvotes: 24, commentCount: 28,
    wtpVotes: { zero: 34, low: 67, mid: 23, high: 8 },
    status: "published",
  },
  {
    authorIdx: 4,
    title:       "MentalSpace — Anonymous peer support for startup founders",
    description: "Burnout is an epidemic among founders. Connect anonymously with other founders to vent, get advice, and share wins without judgment.",
    problem:     "Founders don't talk about mental health publicly. Investors and employees can't know. Therapy is expensive and stigmatised.",
    solution:    "Anonymous 1:1 matching with another founder at a similar stage. Optional escalation to vetted counsellors.",
    audience:    "Early-stage founders, solo builders, indie hackers",
    monetization:{ type: "freemium", details: "Free peer support. ₹999/mo for professional counsellor access." },
    tags:        ["HealthTech", "SaaS"],
    upvotes: 187, downvotes: 9, commentCount: 61,
    wtpVotes: { zero: 23, low: 41, mid: 67, high: 29 },
    status: "published",
  },
  {
    authorIdx: 1,
    title:       "EduStack AI — Personalised learning paths for JEE/UPSC",
    description: "AI analyses past performance and builds a dynamic study schedule. Identifies weak topics, suggests resources, tracks progress daily.",
    problem:     "Generic coaching is one-size-fits-all. Students pay ₹1.5L/year for content that ignores their specific gaps.",
    solution:    "Adaptive AI tutor that acts like a personal coach — adjusts difficulty, paces revision, predicts exam readiness.",
    audience:    "JEE/UPSC aspirants, class 11–12 students, working professionals upskilling",
    monetization:{ type: "saas", details: "₹499/month. Free 14-day trial. School/college B2B licensing." },
    tags:        ["AI", "EdTech"],
    upvotes: 312, downvotes: 14, commentCount: 89,
    wtpVotes: { zero: 19, low: 78, mid: 134, high: 56 },
    status: "building",
  },
];

const commentData = [
  { authorIdx: 0, body: "This solves a real problem. I've been doing this manually for 2 years. The WhatsApp integration is the killer feature.", isBrutal: false, upvotes: 34 },
  { authorIdx: 3, body: "Your competition is Vyapar and Zoho Books — both free. You need to nail the WhatsApp angle or you're dead on arrival.", isBrutal: true, upvotes: 28 },
  { authorIdx: 4, body: "GTM? College communities could be huge. Have you talked to actual freelancers or just the Twitter bubble?", isBrutal: true, upvotes: 19 },
  { authorIdx: 1, body: "I'd pay ₹499/month for this right now. Building a similar thing in my agency manually.", isBrutal: false, upvotes: 41 },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  // Clear existing data
  await Promise.all([
    User.deleteMany({}), Idea.deleteMany({}), Vote.deleteMany({}),
    WTPVote.deleteMany({}), Comment.deleteMany({}),
    Project.deleteMany({}), Battle.deleteMany({}),
  ]);
  console.log("Cleared existing data");

  // Create users
  const hash       = await bcrypt.hash("demo1234", 10);
  const createdUsers = await User.insertMany(
    users.map(u => ({ ...u, passwordHash: hash, emailVerified: true, validationScore: Math.floor(Math.random() * 60) + 30 }))
  );
  console.log(`Created ${createdUsers.length} users`);

  // Create ideas
  const createdIdeas = [];
  for (const data of ideaData) {
    const author = createdUsers[data.authorIdx];
    const wtpTotal = Object.values(data.wtpVotes).reduce((a, b) => a + b, 0);
    const payers   = data.wtpVotes.low + data.wtpVotes.mid + data.wtpVotes.high;
    const willPayRate = wtpTotal > 0 ? Math.round((payers / wtpTotal) * 100) : 0;

    const idea = new Idea({
      author: author._id,
      title: data.title, description: data.description,
      problem: data.problem, solution: data.solution,
      audience: data.audience, monetization: data.monetization,
      tags: data.tags, status: data.status,
      upvotes: data.upvotes, downvotes: data.downvotes,
      commentCount: data.commentCount,
      wtpVotes: data.wtpVotes, wtpTotal, willPayRate,
      createdAt: new Date(Date.now() - Math.random() * 20 * 86400000),
    });
    idea.validationScore = recalcValidationScore(idea);
    await idea.save();
    createdIdeas.push(idea);

    await User.findByIdAndUpdate(author._id, { $inc: { ideasCount: 1 } });
  }
  console.log(`Created ${createdIdeas.length} ideas`);

  // Create votes (each user upvotes a few ideas)
  const votePromises = [];
  for (const user of createdUsers) {
    const sample = createdIdeas.filter(i => i.author.toString() !== user._id.toString()).slice(0, 3);
    for (const idea of sample) {
      votePromises.push(Vote.create({ user: user._id, idea: idea._id, direction: 1 }));
    }
  }
  await Promise.all(votePromises);
  console.log("Created votes");

  // Create comments on first idea
  const firstIdea = createdIdeas[0];
  for (const c of commentData) {
    await Comment.create({
      author: createdUsers[c.authorIdx]._id,
      idea:   firstIdea._id,
      body:   c.body, isBrutal: c.isBrutal, upvotes: c.upvotes,
    });
  }
  console.log("Created comments");

  // Create projects for building ideas
  const buildingIdeas = createdIdeas.filter(i => i.status === "building");
  for (const idea of buildingIdeas) {
    const project = await Project.create({
      founder:  idea.author,
      idea:     idea._id,
      title:    idea.title,
      description: idea.description.slice(0, 200),
      status:   "building",
      currentDay: Math.floor(Math.random() * 35) + 5,
      currentMRR: Math.floor(Math.random() * 15000),
      totalUsers: Math.floor(Math.random() * 200) + 10,
      lastUpdateAt: new Date(Date.now() - Math.random() * 3 * 86400000),
      milestones: [
        { day: 1,  title: "Idea submitted",      status: "done", loggedAt: new Date(Date.now() - 25*86400000) },
        { day: 5,  title: "Landing page live",   status: "done", note: "First 50 signups from Twitter", loggedAt: new Date(Date.now() - 20*86400000) },
        { day: 10, title: "MVP built",           status: "done", note: "Core feature working on staging", loggedAt: new Date(Date.now() - 15*86400000) },
        { day: 18, title: "First paying user",   status: "done", note: "₹299/mo — found via LinkedIn post", metrics: { revenue: 299, users: 1 }, loggedAt: new Date(Date.now() - 7*86400000) },
        { day: 30, title: "₹10K MRR target",     status: "upcoming", note: "Goal: 35 paying users" },
      ],
    });
    await Idea.findByIdAndUpdate(idea._id, { project: project._id });
  }
  console.log("Created projects");

  // Create 3 battles
  const shuffled = [...createdIdeas].sort(() => Math.random() - 0.5);
  for (let i = 0; i < 3 && i * 2 + 1 < shuffled.length; i++) {
    await Battle.create({
      ideaA:  shuffled[i * 2]._id,
      ideaB:  shuffled[i * 2 + 1]._id,
      votesA: Math.floor(Math.random() * 200) + 50,
      votesB: Math.floor(Math.random() * 200) + 50,
      active: true,
      endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
  }
  console.log("Created battles");

  console.log("\n✅ Seed complete!");
  console.log("   Demo login → demo@founderhub.in / demo1234");
  console.log(`   ${createdUsers.length} users · ${createdIdeas.length} ideas · ${buildingIdeas.length} projects · 3 battles\n`);
  process.exit(0);
}

seed().catch(err => { console.error("Seed failed:", err); process.exit(1); });