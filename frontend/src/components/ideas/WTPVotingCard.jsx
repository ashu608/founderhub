// src/components/ideas/WTPVotingCard.jsx
import { useState } from "react";
import { useWTP } from "@/hooks/index";
import { useAuthStore } from "@/store/auth.store";
import toast from "react-hot-toast";

const BUCKETS = [
  { key:"zero", label:"₹0",       sub:"Won't pay" },
  { key:"low",  label:"₹99–199",  sub:"per month" },
  { key:"mid",  label:"₹299–499", sub:"per month" },
  { key:"high", label:"₹500+",    sub:"per month" },
];

export default function WTPVotingCard({ ideaId, wtpVotes = {}, willPayRate, userBucket: initialBucket }) {
  const user     = useAuthStore(s => s.user);
  const wtpMut   = useWTP(ideaId);
  const [selected, setSelected] = useState(initialBucket);
  const [voted,    setVoted]    = useState(!!initialBucket);
  const total = Object.values(wtpVotes).reduce((a,b) => a+b, 0);

  const handleSubmit = () => {
    if (!user)     return toast.error("Log in to vote.");
    if (!selected) return toast.error("Select a price range first.");
    wtpMut.mutate(selected, { onSuccess: () => setVoted(true) });
  };

  return (
    <div className="card">
      <div className="sidebar-title">💰 Willingness to Pay</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
        {BUCKETS.map(b => (
          <button key={b.key} onClick={() => !voted && setSelected(b.key)}
            style={{ padding:10, border:`1px solid ${selected===b.key ? "var(--green2)" : "var(--border)"}`, borderRadius:8, background: selected===b.key ? "rgba(34,211,160,.06)" : "var(--bg3)", cursor: voted ? "default" : "pointer", textAlign:"center", transition:".12s" }}>
            <div style={{ fontFamily:"Syne,sans-serif", fontSize:15, fontWeight:700, color:"var(--text)" }}>{b.label}</div>
            <div style={{ fontSize:10, color:"var(--text3)", marginTop:2 }}>{b.sub}</div>
            {voted && total > 0 && (
              <div style={{ marginTop:6 }}>
                <div style={{ height:3, background:"var(--bg4)", borderRadius:99, overflow:"hidden" }}>
                  <div style={{ height:"100%", background:"var(--green)", width:`${Math.round(((wtpVotes[b.key]||0)/total)*100)}%`, transition:".4s" }} />
                </div>
                <div style={{ fontSize:10, color:"var(--text3)", marginTop:2 }}>{Math.round(((wtpVotes[b.key]||0)/total)*100)}%</div>
              </div>
            )}
          </button>
        ))}
      </div>
      {voted
        ? <div style={{ textAlign:"center", padding:"10px 0", fontSize:13, color:"var(--green)" }}>✓ Vote recorded — {willPayRate}% would pay</div>
        : <button onClick={handleSubmit} disabled={wtpMut.isPending} style={{ width:"100%", padding:10, background:"var(--green2)", color:"var(--text)", border:"none", borderRadius:8, fontFamily:"DM Sans,sans-serif", fontWeight:500, fontSize:13, cursor:"pointer" }}>
            {wtpMut.isPending ? "Submitting..." : "Submit Vote →"}
          </button>}
    </div>
  );
}