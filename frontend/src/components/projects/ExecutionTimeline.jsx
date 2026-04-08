import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { Plus, X, AlertTriangle } from "lucide-react";
import { useLogMilestone } from "@/hooks/index";
import { useAuthStore } from "@/store/auth.store";

function MilestoneDot({ status }) {
  const styles = {
    done:     { background:"var(--green)", boxShadow:"none" },
    active:   { background:"var(--accent)", boxShadow:"0 0 0 4px rgba(124,106,247,.2)" },
    upcoming: { background:"var(--bg4)", border:"1px solid var(--border2)" },
  };
  return <div style={{ width:14, height:14, borderRadius:"50%", flexShrink:0, marginTop:3, ...styles[status] }} />;
}

function LogMilestoneModal({ projectId, currentDay, onClose }) {
  const logMut = useLogMilestone(projectId);
  const [form, setForm] = useState({ day: currentDay + 1, title:"", note:"", revenue:"", users:"" });

  const handleSubmit = (e) => {
    e.preventDefault();
    logMut.mutate({
      day:   Number(form.day),
      title: form.title,
      note:  form.note,
      metrics: {
        revenue: form.revenue ? Number(form.revenue) : undefined,
        users:   form.users   ? Number(form.users)   : undefined,
      },
    }, { onSuccess: onClose });
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:400, display:"flex", alignItems:"center", justifyContent:"center", padding:16, backdropFilter:"blur(4px)" }}
      onClick={(e) => e.target===e.currentTarget && onClose()}>
      <div style={{ background:"var(--bg2)", border:"1px solid var(--border2)", borderRadius:16, padding:24, width:"100%", maxWidth:420 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <h3 style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:18, margin:0 }}>Log a milestone 🚀</h3>
          <button onClick={onClose} style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:8, width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"var(--text2)" }}><X size={13}/></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:10 }}>
            <div><label className="form-label">Day #</label><input type="number" value={form.day} min={1} onChange={e=>setForm({...form,day:e.target.value})} required /></div>
            <div><label className="form-label">Milestone title *</label><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="First paying user" required /></div>
          </div>
          <div><label className="form-label">Note (optional)</label><textarea value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="What happened? What did you learn?" style={{ minHeight:64 }} /></div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div><label className="form-label">MRR (₹)</label><input type="number" value={form.revenue} onChange={e=>setForm({...form,revenue:e.target.value})} placeholder="0" /></div>
            <div><label className="form-label">Total Users</label><input type="number" value={form.users} onChange={e=>setForm({...form,users:e.target.value})} placeholder="0" /></div>
          </div>
          <button type="submit" className="btn-primary" style={{ width:"100%", padding:11, fontSize:14, fontFamily:"Syne,sans-serif", fontWeight:700 }} disabled={logMut.isPending}>
            {logMut.isPending ? "Saving..." : "Log Milestone →"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ExecutionTimeline({ project, isOwner }) {
  const [modalOpen, setModalOpen] = useState(false);
  const user = useAuthStore(s => s.user);
  const canLog = isOwner && user?._id === project?.founder?._id;

  if (!project) return null;

  const milestones = [...(project.milestones || [])].sort((a,b) => a.day - b.day);

  return (
    <div className="card">
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div className="sidebar-title" style={{ margin:0 }}>🚀 Build Timeline</div>
        {canLog && (
          <button onClick={() => setModalOpen(true)} className="btn-primary" style={{ padding:"5px 12px", fontSize:12, display:"flex", alignItems:"center", gap:5 }}>
            <Plus size={12}/>Log update
          </button>
        )}
      </div>

      {project.inactiveWarning && (
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:"rgba(245,158,11,.1)", border:"1px solid rgba(245,158,11,.25)", borderRadius:8, marginBottom:12, fontSize:12, color:"var(--amber)" }}>
          <AlertTriangle size={13}/>No update in 7 days. Log a milestone to stay active!
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
        {milestones.map((m, i) => (
          <div key={m._id || i} style={{ display:"flex", gap:12, paddingBottom: i < milestones.length-1 ? 14 : 0, position:"relative" }}>
            {i < milestones.length-1 && <div style={{ position:"absolute", left:6, top:17, bottom:0, width:1, background:"var(--border)" }} />}
            <MilestoneDot status={m.status} />
            <div style={{ flex:1, paddingBottom: i < milestones.length-1 ? 0 : 0 }}>
              <div style={{ fontSize:10, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".08em" }}>Day {m.day}</div>
              <div style={{ fontSize:13, fontWeight:500, color: m.status==="upcoming" ? "var(--text3)" : "var(--text)", marginTop:1 }}>{m.title}</div>
              {m.note && <div style={{ fontSize:12, color:"var(--text2)", marginTop:2, lineHeight:1.4 }}>{m.note}</div>}
              {m.metrics?.revenue && <div style={{ fontSize:11, color:"var(--green)", marginTop:3 }}>₹{m.metrics.revenue.toLocaleString()} MRR · {m.metrics.users || 0} users</div>}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:16, marginTop:14, paddingTop:12, borderTop:"1px solid var(--border)", fontSize:12 }}>
        <div><span style={{ color:"var(--text3)" }}>Current MRR: </span><span style={{ fontFamily:"Syne,sans-serif", fontWeight:700, color:"var(--green)" }}>₹{(project.currentMRR||0).toLocaleString()}</span></div>
        <div><span style={{ color:"var(--text3)" }}>Users: </span><span style={{ fontFamily:"Syne,sans-serif", fontWeight:700, color:"var(--accent2)" }}>{(project.totalUsers||0).toLocaleString()}</span></div>
        <div><span style={{ color:"var(--text3)" }}>Day </span><span style={{ fontFamily:"Syne,sans-serif", fontWeight:700, color:"var(--text)" }}>{project.currentDay}</span></div>
      </div>

      {modalOpen && <LogMilestoneModal projectId={project._id} currentDay={project.currentDay} onClose={() => setModalOpen(false)} />}
    </div>
  );
}