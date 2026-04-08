import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useIdeaDetail, useCreateProject } from "@/hooks/index";
import { useAuthStore } from "@/store/auth.store";
import VoteButtons       from "@/components/ideas/VoteButtons";
import WTPVotingCard     from "@/components/ideas/WTPVotingCard";
import CommentSection    from "@/components/ideas/CommentSection";
import ExecutionTimeline from "@/components/projects/ExecutionTimeline";
import toast from "react-hot-toast";

export default function IdeaDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const user     = useAuthStore(s => s.user);
  const { data: idea, isLoading, error } = useIdeaDetail(id);
  const createProject = useCreateProject();

  if (isLoading) return <div style={{ maxWidth:900, margin:"40px auto", padding:"0 24px", color:"var(--text2)" }}>Loading idea...</div>;
  if (error || !idea) return <div style={{ maxWidth:900, margin:"40px auto", padding:"0 24px" }}>Idea not found. <Link to="/" style={{ color:"var(--accent2)" }}>Go back</Link></div>;

  const isOwner = user?._id === idea.author?._id;

  const handleStartBuilding = () => {
    if (!user) return toast.error("Log in to start building.");
    createProject.mutate({ ideaId: idea._id, title: idea.title, description: idea.description },
      { onSuccess: () => navigate("/dashboard") }
    );
  };

  return (
    <div style={{ maxWidth:900, margin:"0 auto", padding:"24px" }}>
      <button onClick={() => navigate(-1)} style={{ display:"flex", alignItems:"center", gap:6, color:"var(--text2)", background:"none", border:"none", cursor:"pointer", fontSize:13, marginBottom:20, fontFamily:"inherit" }}>
        <ArrowLeft size={14}/>Back to Feed
      </button>

      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}>
        <div style={{ marginBottom:8 }}>{(idea.tags||[]).map(t => <span key={t} className={`tag tag-${t}`} style={{ marginRight:6 }}>{t}</span>)}</div>
        <h1 style={{ fontFamily:"Syne,sans-serif", fontSize:"clamp(22px,4vw,36px)", fontWeight:800, marginBottom:8, lineHeight:1.15 }}>{idea.title}</h1>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, flexWrap:"wrap" }}>
          <Link to={`/u/${idea.author?.username}`} style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none" }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:"var(--bg3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"var(--accent2)", overflow:"hidden" }}>
              {idea.author?.avatar ? <img src={idea.author.avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : idea.author?.name?.[0]}
            </div>
            <span style={{ fontSize:13, color:"var(--text2)" }}>@{idea.author?.username}</span>
          </Link>
          <span style={{ fontSize:12, color:"var(--text3)" }}>·</span>
          <VoteButtons ideaId={id} upvotes={idea.upvotes} downvotes={idea.downvotes} userVote={idea.userVote} />
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}
            style={{ display:"flex", alignItems:"center", gap:5, marginLeft:"auto", background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:8, padding:"5px 12px", fontSize:12, color:"var(--text2)", cursor:"pointer", fontFamily:"inherit" }}>
            <Share2 size={12}/>Share
          </button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:20, alignItems:"start" }}>
          {/* Left: Main content */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {/* Validation score */}
            <div className="card">
              <div className="sidebar-title">📊 Validation Score</div>
              <div style={{ fontFamily:"Syne,sans-serif", fontSize:52, fontWeight:800, color:"var(--accent2)", lineHeight:1, marginBottom:16 }}>
                {idea.validationScore}<span style={{ fontSize:18, color:"var(--text3)" }}>/100</span>
              </div>
              {[
                { label:"Would pay for this", val:idea.willPayRate, color:"var(--green)" },
                { label:"Upvote ratio", val: Math.round((idea.upvotes/(idea.upvotes+idea.downvotes+1))*100), color:"var(--accent2)" },
                { label:"Comment engagement", val: Math.min(Math.round((idea.commentCount/50)*100),100), color:"var(--amber)" },
              ].map(b => (
                <div key={b.label} style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"var(--text2)", marginBottom:4 }}>
                    <span>{b.label}</span><span style={{ color:b.color, fontWeight:600 }}>{b.val}%</span>
                  </div>
                  <div className="score-bar-track"><div className="score-bar-fill" style={{ width:`${b.val}%`, background:b.color, transition:".5s" }} /></div>
                </div>
              ))}
            </div>

            {idea.project && <ExecutionTimeline project={idea.project} isOwner={isOwner} />}
            <CommentSection ideaId={id} />
          </div>

          {/* Right: Sidebar actions */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <WTPVotingCard ideaId={id} wtpVotes={idea.wtpVotes} willPayRate={idea.willPayRate} userBucket={idea.userWTP} />

            {/* Idea meta */}
            <div className="card">
              <div className="sidebar-title">📋 Details</div>
              {[
                { label:"Problem", val:idea.problem },
                { label:"Audience", val:idea.audience },
                { label:"Monetisation", val:idea.monetization?.type },
              ].filter(r=>r.val).map(row => (
                <div key={row.label} style={{ marginBottom:10 }}>
                  <div style={{ fontSize:10, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".08em", marginBottom:2 }}>{row.label}</div>
                  <div style={{ fontSize:13, color:"var(--text2)", lineHeight:1.4 }}>{row.val}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="card">
              <div className="sidebar-title">⚡ Quick Actions</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {!idea.project && isOwner && (
                  <button onClick={handleStartBuilding} disabled={createProject.isPending} style={{ width:"100%", padding:10, background:"var(--green2)", color:"var(--text)", border:"none", borderRadius:8, fontFamily:"Syne,sans-serif", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                    🚀 Start Building This
                  </button>
                )}
                {idea.project && (
                  <Link to="/dashboard" style={{ display:"block", textAlign:"center", padding:10, background:"var(--accent)", color:"#fff", borderRadius:8, textDecoration:"none", fontFamily:"Syne,sans-serif", fontWeight:700, fontSize:13 }}>
                    View Build Dashboard →
                  </Link>
                )}
                <button style={{ width:"100%", padding:10, background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:8, color:"var(--text2)", fontSize:13, cursor:"pointer", fontFamily:"inherit" }}
                  onClick={() => toast.success(idea.isWatching ? "Removed from watchlist." : "Added to watchlist! You'll get notified of updates.")}>
                  {idea.isWatching ? "👁 Watching" : "👁 Watch This Idea"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}