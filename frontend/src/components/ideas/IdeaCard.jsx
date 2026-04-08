// src/components/ideas/IdeaCard.jsx
import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Eye, Flame } from "lucide-react";
import VoteButtons from "./VoteButtons";

const IdeaCard = memo(function IdeaCard({ idea, compact = false }) {
  const navigate = useNavigate();

  return (
    <div onClick={() => navigate(`/ideas/${idea._id}`)}
      style={{ background:"var(--bg2)", border:`1px solid var(--border)`, borderLeft: idea.hot ? "3px solid var(--amber)" : `3px solid ${idea.validationScore > 80 ? "var(--accent)" : "transparent"}`, borderRadius:12, padding:18, cursor:"pointer", transition:"all .18s", position:"relative" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor="var(--border2)"; e.currentTarget.style.transform="translateX(2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform="translateX(0)"; }}>

      {/* Top row */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:10 }}>
        <h3 style={{ fontFamily:"Syne,sans-serif", fontSize:16, fontWeight:700, color:"var(--text)", lineHeight:1.3, flex:1, margin:0 }}>{idea.title}</h3>
        <div style={{ textAlign:"center", flexShrink:0 }}>
          <div style={{ fontFamily:"Syne,sans-serif", fontSize:22, fontWeight:800, color:"var(--accent2)", lineHeight:1 }}>{idea.validationScore}</div>
          <div style={{ fontSize:10, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".06em" }}>score</div>
        </div>
      </div>

      {!compact && <p style={{ fontSize:13, color:"var(--text2)", lineHeight:1.5, marginBottom:12 }}>{idea.description}</p>}

      {/* Tags */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
        {(idea.tags || []).map(t => <span key={t} className={`tag tag-${t}`}>{t}</span>)}
        {idea.project && <span style={{ padding:"3px 8px", borderRadius:99, fontSize:11, fontWeight:600, background:"rgba(245,158,11,.15)", color:"var(--amber)", border:"1px solid rgba(245,158,11,.25)" }}>Building Day {idea.project.currentDay}</span>}
        <span style={{ padding:"3px 8px", borderRadius:99, fontSize:11, fontWeight:500, background:"rgba(34,211,160,.12)", color:"var(--green)", border:"1px solid rgba(34,211,160,.2)" }}>{idea.willPayRate}% would pay</span>
      </div>

      {/* Bottom row */}
      <div style={{ display:"flex", alignItems:"center", gap:12 }} onClick={e => e.stopPropagation()}>
        <VoteButtons ideaId={idea._id} upvotes={idea.upvotes} downvotes={idea.downvotes} userVote={idea.userVote} />
        <div style={{ display:"flex", alignItems:"center", gap:10, marginLeft:"auto", fontSize:12, color:"var(--text3)" }}>
          <span style={{ display:"flex", alignItems:"center", gap:4 }}><MessageCircle size={13}/>{idea.commentCount}</span>
          <span style={{ display:"flex", alignItems:"center", gap:4 }}><Eye size={13}/>{idea.watcherCount || 0}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="score-bar-track" style={{ marginTop:12 }}>
        <div className="score-bar-fill" style={{ width:`${idea.validationScore}%`, background:"linear-gradient(90deg,var(--accent),var(--accent2))", transition:"width .4s" }} />
      </div>
    </div>
  );
});

export default IdeaCard;