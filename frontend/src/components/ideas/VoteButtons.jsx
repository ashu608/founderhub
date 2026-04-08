// src/components/ideas/VoteButtons.jsx
import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useVote } from "@/hooks/index";
import { useAuthStore } from "@/store/auth.store";
import toast from "react-hot-toast";

export default function VoteButtons({ ideaId, upvotes, downvotes, userVote }) {
  const user     = useAuthStore(s => s.user);
  const voteMut  = useVote(ideaId);
  const [local, setLocal] = useState({ upvotes, downvotes, userVote });

  const handleVote = (dir) => {
    if (!user) return toast.error("Log in to vote.");
    const next = local.userVote === dir ? 0 : dir;
    setLocal(prev => ({
      upvotes:   next === 1 ? prev.upvotes + 1 : prev.userVote === 1  ? prev.upvotes - 1  : prev.upvotes,
      downvotes: next === -1 ? prev.downvotes + 1 : prev.userVote === -1 ? prev.downvotes - 1 : prev.downvotes,
      userVote:  next,
    }));
    voteMut.mutate(next);
  };

  return (
    <div style={{ display:"flex", gap:6 }}>
      {[{dir:1,icon:<ChevronUp size={13}/>,count:local.upvotes,color:"var(--green)"},{dir:-1,icon:<ChevronDown size={13}/>,count:null,color:"var(--red)"}].map(({dir,icon,count,color}) => (
        <button key={dir} onClick={() => handleVote(dir)}
          style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 12px", borderRadius:8, border:`1px solid ${local.userVote===dir ? (dir===1?"var(--green2)":"#7f2d3a") : "var(--border)"}`, background: local.userVote===dir ? (dir===1?"rgba(34,211,160,.1)":"rgba(244,63,94,.08)") : "transparent", color: local.userVote===dir ? color : "var(--text2)", fontSize:12, cursor:"pointer", transition:"all .12s", fontFamily:"inherit" }}
          onMouseEnter={e => { if(local.userVote!==dir) e.currentTarget.style.borderColor=color; }}
          onMouseLeave={e => { if(local.userVote!==dir) e.currentTarget.style.borderColor="var(--border)"; }}>
          {icon}{count !== null && count}
        </button>
      ))}
    </div>
  );
}