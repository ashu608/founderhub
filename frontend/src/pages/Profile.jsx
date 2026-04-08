import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useProfile, useFollowUser } from "@/hooks/index";
import { useAuthStore } from "@/store/auth.store";
import IdeaCard from "@/components/ideas/IdeaCard";

export default function Profile() {
  const { username } = useParams();
  const user = useAuthStore(s => s.user);
  const { data: profile, isLoading } = useProfile(username);
  const followMut = useFollowUser(username);
  const [tab, setTab] = useState("ideas");

  if (isLoading) return <div style={{ maxWidth:800, margin:"40px auto", padding:"0 24px", color:"var(--text2)" }}>Loading profile...</div>;
  if (!profile)  return <div style={{ maxWidth:800, margin:"40px auto", padding:"0 24px" }}>User not found.</div>;

  const isMe = user?.username === username;

  return (
    <div style={{ maxWidth:800, margin:"0 auto", padding:"32px 24px" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:16, marginBottom:28 }}>
        <div style={{ width:72, height:72, borderRadius:"50%", background:"var(--bg3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, fontWeight:700, color:"var(--accent2)", overflow:"hidden", flexShrink:0 }}>
          {profile.avatar ? <img src={profile.avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : profile.name[0]}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"Syne,sans-serif", fontSize:22, fontWeight:800, marginBottom:2 }}>{profile.name}</div>
          <div style={{ fontSize:13, color:"var(--text3)", marginBottom:6 }}>@{profile.username}</div>
          {profile.bio && <p style={{ fontSize:14, color:"var(--text2)", lineHeight:1.5, marginBottom:10, maxWidth:480 }}>{profile.bio}</p>}
          <div style={{ display:"flex", gap:20, fontSize:13 }}>
            {[{n:profile.ideasCount,l:"Ideas"},{n:profile.followersCount,l:"Followers"},{n:profile.followingCount,l:"Following"},{n:profile.validationScore,l:"Score"}].map(s => (
              <div key={s.l}><span style={{ fontFamily:"Syne,sans-serif", fontWeight:700 }}>{s.n}</span> <span style={{ color:"var(--text3)" }}>{s.l}</span></div>
            ))}
          </div>
        </div>
        {!isMe && user && (
          <button onClick={() => followMut.mutate(profile._id)} className={profile.isFollowing ? "btn-secondary" : "btn-primary"} style={{ padding:"8px 20px", fontSize:13 }}>
            {profile.isFollowing ? "Following" : "Follow"}
          </button>
        )}
        {isMe && <Link to="/dashboard" className="btn-secondary" style={{ textDecoration:"none", padding:"8px 20px", fontSize:13 }}>Dashboard</Link>}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:2, marginBottom:20, background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:8, padding:3 }}>
        {["ideas","building"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex:1, padding:8, borderRadius:6, border:"none", background: tab===t?"var(--bg4)":"transparent", color: tab===t?"var(--text)":"var(--text2)", fontSize:13, cursor:"pointer", fontFamily:"inherit", fontWeight: tab===t?500:400, textTransform:"capitalize" }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {tab === "ideas" && (profile.ideas||[]).map(idea => <IdeaCard key={idea._id} idea={idea} />)}
        {tab === "building" && (profile.projects||[]).map(p => (
          <div key={p._id} className="card">
            <div style={{ fontFamily:"Syne,sans-serif", fontWeight:700, marginBottom:4 }}>{p.title}</div>
            <div style={{ fontSize:13, color:"var(--text2)", marginBottom:8 }}>Day {p.currentDay} · ₹{(p.currentMRR||0).toLocaleString()} MRR</div>
            <div style={{ height:4, background:"var(--bg4)", borderRadius:99, overflow:"hidden" }}>
              <div style={{ height:"100%", background:"var(--green)", width:`${Math.min((p.currentMRR/10000)*100,100)}%` }} />
            </div>
          </div>
        ))}
        {((tab==="ideas"&&!profile.ideas?.length)||(tab==="building"&&!profile.projects?.length)) && (
          <div style={{ textAlign:"center", padding:"32px 0", color:"var(--text3)", fontSize:14 }}>Nothing here yet.</div>
        )}
      </div>
    </div>
  );
}