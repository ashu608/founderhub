import { Link } from "react-router-dom";
import { useLeaderboardBuilders } from "@/hooks/index";
import { Flame, TrendingUp } from "lucide-react";

const TRENDING_TAGS = [
  { name:"AI", count:489 }, { name:"SaaS", count:312 },
  { name:"D2C", count:248 }, { name:"Fintech", count:201 }, { name:"EdTech", count:178 },
];

const RANK_COLORS = ["#f59e0b","#94a3b8","#cd7c4a"];

export default function Sidebar({ onTagClick }) {
  const { data: builders, isLoading } = useLeaderboardBuilders();

  return (
    <aside style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {/* Top Builders */}
      <div className="card">
        <div className="sidebar-title">🏆 Top Builders</div>
        {isLoading
          ? Array.from({length:4}).map((_,i) => <div key={i} style={{ height:40, background:"var(--bg3)", borderRadius:8, marginBottom:8, opacity:1-(i*0.2) }} />)
          : (builders || []).slice(0,5).map((u, i) => (
              <Link key={u._id} to={`/u/${u.username}`} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom: i < 4 ? "1px solid var(--border)" : "none", textDecoration:"none" }}>
                <span style={{ fontFamily:"Syne,sans-serif", fontSize:16, fontWeight:800, color: RANK_COLORS[i] || "var(--text3)", minWidth:24 }}>{i+1}</span>
                <div style={{ width:28, height:28, borderRadius:"50%", background:"var(--bg3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"var(--accent2)", overflow:"hidden", flexShrink:0 }}>
                  {u.avatar ? <img src={u.avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : u.name[0]}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:"var(--text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{u.name}</div>
                  <div style={{ fontSize:11, color:"var(--text3)" }}>@{u.username}</div>
                </div>
                <span style={{ fontFamily:"Syne,sans-serif", fontSize:13, fontWeight:700, color:"var(--accent2)" }}>{u.validationScore}</span>
              </Link>
            ))
        }
        <Link to="/leaderboard" style={{ display:"block", textAlign:"center", fontSize:12, color:"var(--accent2)", textDecoration:"none", marginTop:10, padding:"6px 0", borderRadius:6, background:"var(--bg3)" }}>
          View full leaderboard →
        </Link>
      </div>

      {/* Trending Tags */}
      <div className="card">
        <div className="sidebar-title">🔥 Trending Tags</div>
        {TRENDING_TAGS.map(t => (
          <button key={t.name} onClick={() => onTagClick?.(t.name)}
            style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", padding:"7px 0", borderBottom:"1px solid var(--border)", background:"none", border:"none", borderBottom:"1px solid var(--border)", cursor:"pointer", textAlign:"left" }}
            onMouseEnter={e => e.currentTarget.style.opacity=".7"}
            onMouseLeave={e => e.currentTarget.style.opacity="1"}>
            <span style={{ fontSize:13, color:"var(--text)", fontFamily:"inherit" }}>#{t.name}</span>
            <span style={{ fontSize:11, color:"var(--text3)", background:"var(--bg3)", padding:"2px 8px", borderRadius:99 }}>{t.count} ideas</span>
          </button>
        ))}
      </div>

      {/* Submit CTA */}
      <div style={{ background:"linear-gradient(135deg,rgba(124,106,247,.15),rgba(34,211,160,.08))", border:"1px solid rgba(124,106,247,.25)", borderRadius:12, padding:16 }}>
        <Flame size={20} color="var(--amber)" style={{ marginBottom:8 }} />
        <div style={{ fontFamily:"Syne,sans-serif", fontWeight:700, fontSize:14, marginBottom:6 }}>Got an idea?</div>
        <div style={{ fontSize:12, color:"var(--text2)", lineHeight:1.5, marginBottom:12 }}>Submit it. Get real validation from builders who've been there.</div>
        <Link to="/submit" style={{ display:"block", textAlign:"center", padding:"8px 0", background:"var(--accent)", color:"#fff", borderRadius:8, textDecoration:"none", fontSize:13, fontWeight:600 }}>Submit your idea →</Link>
      </div>
    </aside>
  );
}