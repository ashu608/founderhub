import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useVoteBattle } from "@/hooks/index";
import { useBattleSocket } from "@/hooks/useSocket";
import { useAuthStore } from "@/store/auth.store";
import toast from "react-hot-toast";

export default function BattleCard({ battle: initialBattle }) {
  const [battle, setBattle] = useState(initialBattle);
  const user     = useAuthStore(s => s.user);
  const voteMut  = useVoteBattle();
  const total    = battle.votesA + battle.votesB;
  const pctA     = total > 0 ? Math.round((battle.votesA / total) * 100) : 50;
  const pctB     = 100 - pctA;
  const hasVoted = !!battle.userPicked;

  useBattleSocket(battle._id, {
    "battle:vote": (data) => setBattle(prev => ({ ...prev, votesA: data.votesA, votesB: data.votesB })),
  });

  const handleVote = (picked) => {
    if (!user)     return toast.error("Log in to vote.");
    if (hasVoted)  return;
    voteMut.mutate({ id: battle._id, picked }, {
      onSuccess: () => setBattle(prev => ({ ...prev, userPicked: picked })),
    });
  };

  const OptionCard = ({ idea, votes, pct, side }) => {
    const isPicked  = battle.userPicked === idea._id;
    const isWinning = votes >= (side==="a" ? battle.votesB : battle.votesA);

    return (
      <div onClick={() => handleVote(idea._id)}
        style={{ flex:1, background:"var(--bg3)", border:`1px solid ${isPicked?"var(--green)":hasVoted&&isWinning?"var(--accent)":"var(--border)"}`, borderRadius:10, padding:16, cursor: hasVoted ? "default" : "pointer", transition:"all .15s", textAlign:"center" }}
        onMouseEnter={e => { if(!hasVoted) { e.currentTarget.style.borderColor="var(--accent)"; e.currentTarget.style.background="rgba(124,106,247,.05)"; e.currentTarget.style.transform="scale(1.02)"; } }}
        onMouseLeave={e => { if(!hasVoted) { e.currentTarget.style.borderColor=isPicked?"var(--green)":"var(--border)"; e.currentTarget.style.background="var(--bg3)"; e.currentTarget.style.transform="scale(1)"; } }}>
        <div style={{ fontSize:28, marginBottom:8 }}>{side==="a" ? "🤖" : "🌱"}</div>
        <div style={{ fontFamily:"Syne,sans-serif", fontSize:14, fontWeight:700, color:"var(--text)", marginBottom:4, lineHeight:1.2 }}>{idea.title}</div>
        {(idea.tags||[]).slice(0,2).map(t => <span key={t} className={`tag tag-${t}`} style={{ fontSize:10 }}>{t}</span>)}
        {hasVoted && (
          <div style={{ marginTop:10 }}>
            <div style={{ fontFamily:"Syne,sans-serif", fontSize:22, fontWeight:800, color: isPicked?"var(--green)":"var(--text2)" }}>{pct}%</div>
            <div style={{ fontSize:11, color:"var(--text3)" }}>{votes} votes</div>
            <div style={{ height:4, background:"var(--bg4)", borderRadius:99, overflow:"hidden", marginTop:6 }}>
              <div style={{ height:"100%", background: isPicked ? "var(--green)" : "var(--accent)", width:`${pct}%`, transition:".5s" }} />
            </div>
          </div>
        )}
        {isPicked && <div style={{ marginTop:8, fontSize:11, color:"var(--green)" }}>✓ Your pick</div>}
      </div>
    );
  };

  return (
    <div className="card" style={{ marginBottom:14 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <span style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:".1em", color:"var(--text3)" }}>⚔️ Battle</span>
        <div style={{ flex:1, height:1, background:"var(--border)" }} />
        <span style={{ fontSize:11, color:"var(--text3)" }}>Ends {formatDistanceToNow(new Date(battle.endsAt), { addSuffix:true })}</span>
      </div>

      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
        <OptionCard idea={battle.ideaA} votes={battle.votesA} pct={pctA} side="a" />
        <div style={{ fontFamily:"Syne,sans-serif", fontSize:18, fontWeight:800, color:"var(--text3)", flexShrink:0 }}>VS</div>
        <OptionCard idea={battle.ideaB} votes={battle.votesB} pct={pctB} side="b" />
      </div>

      {!hasVoted && !user && (
        <p style={{ textAlign:"center", fontSize:12, color:"var(--text3)", marginTop:10 }}>Log in to vote in battles</p>
      )}
    </div>
  );
}