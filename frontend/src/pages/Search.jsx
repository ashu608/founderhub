import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import * as api from "@/api/index";
import IdeaCard from "@/components/ideas/IdeaCard";
import { Search as SearchIcon } from "lucide-react";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const [input, setInput] = useState(q);
  const [results, setResults] = useState({ ideas:[], users:[] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    api.search(q).then(r => { setResults(r); setLoading(false); }).catch(() => setLoading(false));
  }, [q]);

  const handleSearch = (e) => { e.preventDefault(); setSearchParams({ q: input }); };

  return (
    <div style={{ maxWidth:800, margin:"0 auto", padding:"32px 24px" }}>
      <form onSubmit={handleSearch} style={{ display:"flex", gap:10, marginBottom:28 }}>
        <div style={{ flex:1, position:"relative" }}>
          <SearchIcon size={16} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--text3)" }} />
          <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Search ideas, founders, tags..." style={{ paddingLeft:38 }} />
        </div>
        <button type="submit" className="btn-primary" style={{ padding:"10px 20px" }}>Search</button>
      </form>

      {loading && <div style={{ color:"var(--text2)", fontSize:14 }}>Searching...</div>}

      {!loading && q && (
        <>
          {results.ideas?.length > 0 && (
            <div style={{ marginBottom:24 }}>
              <h2 style={{ fontFamily:"Syne,sans-serif", fontSize:14, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".1em", marginBottom:12 }}>Ideas</h2>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {results.ideas.map(i => <IdeaCard key={i._id} idea={i} compact />)}
              </div>
            </div>
          )}
          {results.users?.length > 0 && (
            <div>
              <h2 style={{ fontFamily:"Syne,sans-serif", fontSize:14, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".1em", marginBottom:12 }}>Founders</h2>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {results.users.map(u => (
                  <Link key={u._id} to={`/u/${u.username}`} className="card" style={{ display:"flex", alignItems:"center", gap:12, textDecoration:"none" }}>
                    <div style={{ width:40, height:40, borderRadius:"50%", background:"var(--bg3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:"var(--accent2)", overflow:"hidden" }}>
                      {u.avatar ? <img src={u.avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : u.name[0]}
                    </div>
                    <div><div style={{ fontWeight:600, fontSize:14, color:"var(--text)" }}>{u.name}</div><div style={{ fontSize:12, color:"var(--text3)" }}>@{u.username} · {u.validationScore} score</div></div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {!results.ideas?.length && !results.users?.length && (
            <div style={{ textAlign:"center", padding:"48px 0", color:"var(--text3)" }}>No results for "{q}"</div>
          )}
        </>
      )}
    </div>
  );
}