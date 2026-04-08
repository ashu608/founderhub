import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useIdeas, useInfiniteScroll } from "@/hooks/index";
import { useIdeasStore } from "@/store/index";
import IdeaCard from "@/components/ideas/IdeaCard";
import Sidebar  from "@/components/layout/Sidebar";
import BattleCard from "@/components/battles/BattleCard";
import { useBattles } from "@/hooks/index";

const SORTS = [
  { key:"trending",  label:"🔥 Trending" },
  { key:"new",       label:"✨ New" },
  { key:"validated", label:"✅ Most Validated" },
  { key:"building",  label:"🚀 Building" },
];

const STATS = [
  { num:"2,847", label:"Ideas Submitted" },
  { num:"341",   label:"Projects Building" },
  { num:"48.2K", label:"Validation Votes" },
  { num:"1,209", label:"Active Founders" },
];

export default function Home() {
  const { activeSort, activeTag, setSort, setTag } = useIdeasStore();
  const { data, fetchNextPage, hasNextPage, isLoading } = useIdeas({ sort: activeSort, tag: activeTag });
  const { data: battles } = useBattles();
  const sentinelRef = useInfiniteScroll(fetchNextPage, hasNextPage);

  const ideas = data?.pages.flatMap(p => p.ideas) || [];

  return (
    <>
      {/* Hero */}
      <div style={{ padding:"56px 24px 36px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 60% 40% at 50% 0%,rgba(124,106,247,.1) 0%,transparent 70%)", pointerEvents:"none" }} />
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:.5 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"5px 12px", border:"1px solid rgba(124,106,247,.3)", borderRadius:99, fontSize:11, fontWeight:500, color:"var(--accent2)", textTransform:"uppercase", letterSpacing:".08em", marginBottom:20 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--accent)", animation:"pulse 2s infinite" }} />
            Public Startup Lab
          </div>
          <h1 style={{ fontFamily:"Syne,sans-serif", fontSize:"clamp(32px,5vw,54px)", fontWeight:800, lineHeight:1.1, marginBottom:16, letterSpacing:-1 }}>
            Validate your idea.<br /><span style={{ color:"var(--accent2)" }}>Build in public.</span> Win.
          </h1>
          <p style={{ fontSize:16, color:"var(--text2)", maxWidth:480, margin:"0 auto 28px", lineHeight:1.6 }}>
            Not just "post ideas" — validate, execute, and track your startup journey where the community holds you accountable.
          </p>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <Link to="/submit" className="btn-primary" style={{ textDecoration:"none", padding:"12px 24px", fontSize:15 }}>Submit Your Idea →</Link>
            <a href="#feed" className="btn-secondary" style={{ textDecoration:"none", padding:"12px 24px", fontSize:15 }}>Explore Ideas</a>
          </div>
        </motion.div>
      </div>

      {/* Stats */}
      <div style={{ display:"flex", justifyContent:"center", borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)", background:"var(--bg2)", flexWrap:"wrap" }}>
        {STATS.map((s, i) => (
          <div key={s.label} style={{ padding:"16px 28px", textAlign:"center", borderRight: i < STATS.length-1 ? "1px solid var(--border)" : "none" }}>
            <div style={{ fontFamily:"Syne,sans-serif", fontSize:22, fontWeight:700 }}>{s.num}</div>
            <div style={{ fontSize:11, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".08em", marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main */}
      <div id="feed" style={{ maxWidth:1100, margin:"0 auto", padding:"28px 24px", display:"grid", gridTemplateColumns:"1fr 300px", gap:24 }}>
        <div>
          {/* Battle teaser */}
          {battles?.[0] && (
            <div style={{ marginBottom:16 }}>
              <BattleCard battle={battles[0]} />
            </div>
          )}

          {/* Feed filters */}
          <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
            {SORTS.map(s => (
              <button key={s.key} onClick={() => setSort(s.key)}
                style={{ padding:"6px 14px", borderRadius:99, fontSize:12, border:`1px solid ${activeSort===s.key?"var(--accent)":"var(--border)"}`, background: activeSort===s.key?"rgba(124,106,247,.1)":"transparent", color: activeSort===s.key?"var(--accent2)":"var(--text2)", cursor:"pointer", fontFamily:"inherit", transition:".12s" }}>
                {s.label}
              </button>
            ))}
            {activeTag && (
              <button onClick={() => setTag(null)} style={{ padding:"6px 14px", borderRadius:99, fontSize:12, border:"1px solid var(--green2)", background:"rgba(34,211,160,.1)", color:"var(--green)", cursor:"pointer", fontFamily:"inherit" }}>
                #{activeTag} ✕
              </button>
            )}
          </div>

          {/* Ideas feed */}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {isLoading
              ? Array.from({length:4}).map((_,i) => (
                  <div key={i} style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:12, height:160, opacity:1-(i*.2) }} />
                ))
              : ideas.map((idea, i) => (
                  <motion.div key={idea._id} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.04 }}>
                    <IdeaCard idea={idea} />
                  </motion.div>
                ))
            }
            {ideas.length === 0 && !isLoading && (
              <div style={{ textAlign:"center", padding:"48px 0", color:"var(--text3)" }}>
                <div style={{ fontSize:32, marginBottom:8 }}>💡</div>
                <div style={{ fontSize:15 }}>No ideas yet. Be the first to submit!</div>
                <Link to="/submit" className="btn-primary" style={{ textDecoration:"none", display:"inline-block", marginTop:16, padding:"10px 20px" }}>Submit an Idea</Link>
              </div>
            )}
            <div ref={sentinelRef} style={{ height:20 }} />
            {hasNextPage && <div style={{ textAlign:"center", padding:16, color:"var(--text3)", fontSize:13 }}>Loading more...</div>}
          </div>
        </div>

        <Sidebar onTagClick={setTag} />
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </>
  );
}