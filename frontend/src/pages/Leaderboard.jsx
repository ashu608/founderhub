import { useState } from "react";
import { useLeaderboardIdeas, useLeaderboardBuilders, useLeaderboardGrowing } from "@/hooks/index";

export default function Leaderboard() {
  const [tab, setTab] = useState("ideas");
  const { data: ideas }    = useLeaderboardIdeas();
  const { data: builders } = useLeaderboardBuilders();
  const { data: growing }  = useLeaderboardGrowing();

  const RANK_COLORS = ["#f59e0b","#94a3b8","#cd7c4a"];

  const rows = tab==="ideas" ? ideas : tab==="builders" ? builders : growing;

  return (
    <div style={{ maxWidth:800, margin:"0 auto", padding:"32px 24px" }}>
      <h1 style={{ fontFamily:"Syne,sans-serif", fontSize:28, fontWeight:800, marginBottom:6 }}>🏆 Leaderboards</h1>
      <p style={{ fontSize:14, color:"var(--text2)", marginBottom:20 }}>The builders who are actually executing.</p>

      <div style={{ display:"flex", gap:2, background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:8, padding:3, marginBottom:20 }}>
        {[{k:"ideas",l:"Most Validated"},{k:"builders",l:"Top Builders"},{k:"growing",l:"Fastest Growing"}].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{ flex:1, padding:8, borderRadius:6, border:"none", background: tab===t.k?"var(--bg4)":"transparent", color: tab===t.k?"var(--text)":"var(--text2)", fontSize:13, cursor:"pointer", fontFamily:"inherit", fontWeight: tab===t.k?500:400 }}>
            {t.l}
          </button>
        ))}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {(rows || []).map((item, i) => (
          <div key={item._id} className="card" style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ fontFamily:"Syne,sans-serif", fontSize:22, fontWeight:800, color: RANK_COLORS[i] || "var(--text3)", minWidth:32 }}>#{i+1}</div>
            {tab !== "growing" && (
              <div style={{ width:38, height:38, borderRadius:"50%", background:"var(--bg3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:"var(--accent2)", overflow:"hidden", flexShrink:0 }}>
                {(item.avatar||item.author?.avatar) ? <img src={item.avatar||item.author?.avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : (item.name||item.title||"?")[0]}
              </div>
            )}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:"Syne,sans-serif", fontWeight:700, fontSize:14, color:"var(--text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                {tab==="ideas" ? item.title : tab==="builders" ? item.name : item.title}
              </div>
              <div style={{ fontSize:12, color:"var(--text3)", marginTop:2 }}>
                {tab==="ideas" ? `${item.willPayRate}% would pay · @${item.author?.username}` :
                 tab==="builders" ? `@${item.username} · ${item.ideasCount} ideas` :
                 `Day ${item.currentDay} · @${item.founder?.username}`}
              </div>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ fontFamily:"Syne,sans-serif", fontSize:18, fontWeight:800, color: tab==="growing"?"var(--green)":"var(--accent2)" }}>
                {tab==="growing" ? `₹${(item.currentMRR||0).toLocaleString()}` : item.validationScore}
              </div>
              <div style={{ fontSize:10, color:"var(--text3)" }}>{tab==="growing" ? "MRR" : "score"}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}