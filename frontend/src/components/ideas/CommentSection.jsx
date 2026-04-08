import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ChevronUp, MessageSquare, Skull } from "lucide-react";
import { useComments, useAddComment } from "@/hooks/index";
import { useAuthStore } from "@/store/auth.store";
import { useIdeaSocket } from "@/hooks/useSocket";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

function CommentItem({ comment, ideaId, depth = 0 }) {
  const [replying, setReplying] = useState(false);
  const [body,     setBody]     = useState("");
  const user    = useAuthStore(s => s.user);
  const addMut  = useAddComment(ideaId);

  const submitReply = () => {
    if (!body.trim()) return;
    addMut.mutate({ body, parent: comment._id }, { onSuccess: () => { setReplying(false); setBody(""); }});
  };

  return (
    <div style={{ paddingLeft: depth > 0 ? 16 : 0, borderLeft: depth > 0 ? "2px solid var(--border)" : "none", marginLeft: depth > 0 ? 8 : 0 }}>
      <div style={{ padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
          <div style={{ width:24, height:24, borderRadius:"50%", background:"var(--bg3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"var(--accent2)", flexShrink:0 }}>
            {comment.author?.avatar ? <img src={comment.author.avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"50%" }} /> : comment.author?.name?.[0]}
          </div>
          <span style={{ fontSize:12, fontWeight:500, color:"var(--accent2)" }}>@{comment.author?.username}</span>
          {comment.isBrutal && (
            <span style={{ display:"flex", alignItems:"center", gap:3, padding:"1px 6px", borderRadius:4, fontSize:10, background:"rgba(244,63,94,.12)", color:"var(--red)", border:"1px solid rgba(244,63,94,.2)" }}>
              <Skull size={9}/> Brutal
            </span>
          )}
          <span style={{ fontSize:11, color:"var(--text3)", marginLeft:"auto" }}>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix:true })}</span>
        </div>
        <p style={{ fontSize:13, color:"var(--text2)", lineHeight:1.5, margin:"0 0 8px" }}>{comment.body}</p>
        <div style={{ display:"flex", gap:10 }}>
          <button style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:"var(--text3)", background:"none", border:"none", cursor:"pointer", padding:0, fontFamily:"inherit" }}
            onMouseEnter={e=>e.currentTarget.style.color="var(--green)"}
            onMouseLeave={e=>e.currentTarget.style.color="var(--text3)"}>
            <ChevronUp size={12}/>{comment.upvotes}
          </button>
          {user && depth < 2 && (
            <button onClick={() => setReplying(!replying)} style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:"var(--text3)", background:"none", border:"none", cursor:"pointer", padding:0, fontFamily:"inherit" }}
              onMouseEnter={e=>e.currentTarget.style.color="var(--accent2)"}
              onMouseLeave={e=>e.currentTarget.style.color="var(--text3)"}>
              <MessageSquare size={12}/>Reply
            </button>
          )}
        </div>
      </div>

      {replying && (
        <div style={{ paddingLeft:16, paddingTop:8 }}>
          <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Write a reply..." style={{ minHeight:64, resize:"vertical", marginBottom:8 }} />
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={submitReply} disabled={addMut.isPending} className="btn-primary" style={{ padding:"6px 14px", fontSize:12 }}>Reply</button>
            <button onClick={() => setReplying(false)} className="btn-ghost" style={{ padding:"6px 14px", fontSize:12 }}>Cancel</button>
          </div>
        </div>
      )}

      {(comment.replies || []).map(r => <CommentItem key={r._id} comment={r} ideaId={ideaId} depth={depth+1} />)}
    </div>
  );
}

export default function CommentSection({ ideaId }) {
  const [sort,     setSort]     = useState("newest");
  const [brutal,   setBrutal]   = useState(false);
  const [body,     setBody]     = useState("");
  const [isBrutal, setIsBrutal] = useState(false);
  const user    = useAuthStore(s => s.user);
  const qc      = useQueryClient();
  const { data: comments = [], isLoading } = useComments(ideaId, sort);
  const addMut  = useAddComment(ideaId);

  useIdeaSocket(ideaId, {
    "comment:new": (comment) => {
      qc.setQueryData(["comments", ideaId, sort], old =>
        Array.isArray(old) && !comment.parent ? [comment, ...old] : old
      );
    },
  });

  const handleSubmit = () => {
    if (!user)       return toast.error("Log in to comment.");
    if (!body.trim()) return;
    addMut.mutate({ body, isBrutal }, { onSuccess: () => { setBody(""); setIsBrutal(false); }});
  };

  const displayed = brutal ? comments.filter(c => c.isBrutal) : comments;

  return (
    <div className="card">
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14, flexWrap:"wrap" }}>
        <div className="sidebar-title" style={{ margin:0, flex:1 }}>💬 Community Feedback</div>
        <div style={{ display:"flex", gap:4 }}>
          {["newest","helpful","critical"].map(s => (
            <button key={s} onClick={() => setSort(s)} style={{ padding:"4px 10px", borderRadius:99, fontSize:11, border:`1px solid ${sort===s?"var(--accent)":"var(--border)"}`, background: sort===s?"rgba(124,106,247,.1)":"transparent", color: sort===s?"var(--accent2)":"var(--text3)", cursor:"pointer", fontFamily:"inherit", transition:".12s" }}>
              {s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
          <button onClick={() => setBrutal(!brutal)} style={{ padding:"4px 10px", borderRadius:99, fontSize:11, border:`1px solid ${brutal?"var(--red)":"var(--border)"}`, background: brutal?"rgba(244,63,94,.1)":"transparent", color: brutal?"var(--red)":"var(--text3)", cursor:"pointer", fontFamily:"inherit", transition:".12s", display:"flex", alignItems:"center", gap:4 }}>
            <Skull size={10}/>Brutal only
          </button>
        </div>
      </div>

      {/* Composer */}
      {user && (
        <div style={{ marginBottom:16 }}>
          <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Share your honest take. What works? What doesn't?" style={{ minHeight:80, resize:"vertical", marginBottom:8 }} />
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--text2)", cursor:"pointer" }}>
              <input type="checkbox" checked={isBrutal} onChange={e=>setIsBrutal(e.target.checked)} style={{ width:"auto", padding:0 }} />
              <Skull size={12}/> Brutal mode
            </label>
            <button onClick={handleSubmit} disabled={addMut.isPending || !body.trim()} className="btn-primary" style={{ marginLeft:"auto", padding:"7px 16px", fontSize:13 }}>
              {addMut.isPending ? "Posting..." : "Post feedback →"}
            </button>
          </div>
        </div>
      )}

      {/* Comments */}
      {isLoading
        ? Array.from({length:3}).map((_,i) => <div key={i} style={{ height:60, background:"var(--bg3)", borderRadius:8, marginBottom:8 }} />)
        : displayed.length === 0
          ? <div style={{ textAlign:"center", padding:"24px 0", color:"var(--text3)", fontSize:13 }}>No comments yet. Be the first to share feedback.</div>
          : displayed.map(c => <CommentItem key={c._id} comment={c} ideaId={ideaId} />)
      }
    </div>
  );
}