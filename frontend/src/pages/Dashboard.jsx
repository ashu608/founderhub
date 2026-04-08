import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useQuery } from "@tanstack/react-query";
import * as api from "@/api/index";
import ExecutionTimeline from "@/components/projects/ExecutionTimeline";
import IdeaCard from "@/components/ideas/IdeaCard";

export default function Dashboard() {
  const user = useAuthStore(s => s.user);
  const { data: projects } = useQuery({ queryKey:["myProjects"], queryFn: () => api.getProjects() });
  const { data: ideas }    = useQuery({ queryKey:["myIdeas"],    queryFn: () => api.getIdeas({ limit:20 }) });
  const { data: notifs }   = useQuery({ queryKey:["notifs"],     queryFn: api.getNotifs });

  const myIdeas    = ideas?.ideas?.filter(i => i.author?._id === user?._id) || [];
  const myProjects = (projects || []).filter(p => p.founder?._id === user?._id);
  const activeProject = myProjects.find(p => p.status === "building");

  return (
    <div style={{ maxWidth:900, margin:"0 auto", padding:"32px 24px" }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:"Syne,sans-serif", fontSize:28, fontWeight:800, marginBottom:4 }}>
          Hey, {user?.name?.split(" ")[0]} 👋
        </h1>
        <div style={{ display:"flex", gap:16, fontSize:13, color:"var(--text2)" }}>
          <span>🔥 {user?.streakDays || 0} day streak</span>
          <span>💡 {user?.ideasCount || 0} ideas</span>
          <span>⭐ {user?.validationScore || 0} score</span>
        </div>
      </div>

      {activeProject && (
        <div style={{ marginBottom:24 }}>
          <h2 style={{ fontFamily:"Syne,sans-serif", fontSize:16, fontWeight:700, marginBottom:12, color:"var(--text2)", textTransform:"uppercase", letterSpacing:".05em" }}>Active Build</h2>
          <ExecutionTimeline project={activeProject} isOwner />
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
        {[
          { label:"Total Upvotes Received", val: myIdeas.reduce((a,i)=>a+i.upvotes,0) },
          { label:"Watchers",               val: myIdeas.reduce((a,i)=>a+(i.watcherCount||0),0) },
          { label:"Avg Validation Score",   val: myIdeas.length ? Math.round(myIdeas.reduce((a,i)=>a+i.validationScore,0)/myIdeas.length) : 0 },
          { label:"Comments Received",      val: myIdeas.reduce((a,i)=>a+i.commentCount,0) },
        ].map(s => (
          <div key={s.label} style={{ background:"var(--bg2)", borderRadius:8, padding:"12px 16px", border:"1px solid var(--border)" }}>
            <div style={{ fontSize:11, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".06em", marginBottom:4 }}>{s.label}</div>
            <div style={{ fontFamily:"Syne,sans-serif", fontSize:28, fontWeight:800, color:"var(--text)" }}>{s.val}</div>
          </div>
        ))}
      </div>

      {myIdeas.length > 0 && (
        <div>
          <h2 style={{ fontFamily:"Syne,sans-serif", fontSize:16, fontWeight:700, marginBottom:12, color:"var(--text2)", textTransform:"uppercase", letterSpacing:".05em" }}>Your Ideas</h2>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {myIdeas.map(idea => <IdeaCard key={idea._id} idea={idea} />)}
          </div>
        </div>
      )}
    </div>
  );
}