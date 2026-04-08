import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Bell, Search, LogOut, User, LayoutDashboard, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/auth.store";
import { useNotifStore } from "@/store/index";
import { useLogin, useRegister } from "@/hooks/index";
import toast from "react-hot-toast";

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const unread  = useNotifStore(s => s.unreadCount);
  const navigate = useNavigate();
  const location = useLocation();
  const [authOpen,  setAuthOpen]  = useState(false);
  const [authMode,  setAuthMode]  = useState("login"); // "login" | "register"
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [form, setForm] = useState({ name:"", username:"", email:"", password:"" });

  const loginMut    = useLogin();
  const registerMut = useRegister();

  const isActive = (path) => location.pathname === path;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (authMode === "login") {
      loginMut.mutate({ email: form.email, password: form.password }, { onSuccess: () => setAuthOpen(false) });
    } else {
      registerMut.mutate(form, { onSuccess: () => setAuthOpen(false) });
    }
  };

  const handleLogout = () => { logout(); setMenuOpen(false); toast.success("Logged out."); navigate("/"); };

  return (
    <>
      <nav style={{ background: "rgba(10,10,15,0.92)", borderBottom: "1px solid var(--border)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <Link to="/" style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none" }}>
            <div style={{ width:28, height:28, background:"var(--accent)", borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:14, color:"#fff" }}>F</div>
            <span style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:18, color:"var(--text)" }}>FounderHub</span>
          </Link>

          {/* Nav links */}
          <div style={{ display:"flex", gap:4, alignItems:"center" }}>
            {[{to:"/", label:"Feed"},{to:"/battles", label:"Battles ⚔️"},{to:"/leaderboard", label:"Leaderboard"}].map(l => (
              <Link key={l.to} to={l.to} className={`nav-link${isActive(l.to) ? " active" : ""}`} style={{ textDecoration:"none" }}>{l.label}</Link>
            ))}
          </div>

          {/* Right side */}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button className="btn-ghost" style={{ padding:"6px 8px" }} onClick={() => navigate("/search")}><Search size={16} /></button>

            {user ? (
              <>
                <button className="btn-ghost" style={{ padding:"6px 8px", position:"relative" }} onClick={() => navigate("/dashboard")}>
                  <Bell size={16} />
                  {unread > 0 && <span style={{ position:"absolute", top:4, right:4, width:8, height:8, background:"var(--red)", borderRadius:"50%", border:"2px solid var(--bg)" }} />}
                </button>

                <button onClick={() => navigate("/submit")} className="btn-primary" style={{ padding:"7px 16px", fontSize:13 }}>+ Submit Idea</button>

                {/* Avatar menu */}
                <div style={{ position:"relative" }}>
                  <button onClick={() => setMenuOpen(!menuOpen)} style={{ width:32, height:32, borderRadius:"50%", background:"var(--bg3)", border:"2px solid var(--border2)", overflow:"hidden", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {user.avatar
                      ? <img src={user.avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      : <span style={{ fontFamily:"Syne,sans-serif", fontWeight:700, fontSize:12, color:"var(--accent2)" }}>{user.name[0]}</span>}
                  </button>
                  <AnimatePresence>
                    {menuOpen && (
                      <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
                        style={{ position:"absolute", right:0, top:40, background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:10, padding:8, minWidth:180, zIndex:200 }}>
                        <div style={{ padding:"8px 12px", borderBottom:"1px solid var(--border)", marginBottom:4 }}>
                          <div style={{ fontSize:13, fontWeight:600, color:"var(--text)" }}>{user.name}</div>
                          <div style={{ fontSize:11, color:"var(--text3)" }}>@{user.username}</div>
                        </div>
                        {[
                          { icon:<User size={14}/>, label:"Profile", onClick:()=>{navigate(`/u/${user.username}`);setMenuOpen(false)} },
                          { icon:<LayoutDashboard size={14}/>, label:"Dashboard", onClick:()=>{navigate("/dashboard");setMenuOpen(false)} },
                          { icon:<LogOut size={14}/>, label:"Log out", onClick:handleLogout, danger:true },
                        ].map(item => (
                          <button key={item.label} onClick={item.onClick} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"8px 12px", borderRadius:6, background:"transparent", border:"none", color: item.danger ? "var(--red)" : "var(--text2)", fontSize:13, cursor:"pointer", textAlign:"left" }}
                            onMouseEnter={e => e.currentTarget.style.background="var(--bg3)"}
                            onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                            {item.icon}{item.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <button className="btn-ghost" style={{ fontSize:13 }} onClick={() => { setAuthMode("login"); setAuthOpen(true); }}>Log in</button>
                <button className="btn-primary" style={{ padding:"7px 16px", fontSize:13 }} onClick={() => { setAuthMode("register"); setAuthOpen(true); }}>Sign up free</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      <AnimatePresence>
        {authOpen && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:16, backdropFilter:"blur(4px)" }}
            onClick={(e) => e.target === e.currentTarget && setAuthOpen(false)}>
            <motion.div initial={{ scale:.95, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:.95, opacity:0 }}
              style={{ background:"var(--bg2)", border:"1px solid var(--border2)", borderRadius:16, padding:28, width:"100%", maxWidth:400 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <h2 style={{ fontFamily:"Syne,sans-serif", fontSize:20, fontWeight:800 }}>
                  {authMode === "login" ? "Welcome back" : "Join FounderHub"}
                </h2>
                <button onClick={() => setAuthOpen(false)} style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:8, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"var(--text2)" }}><X size={14}/></button>
              </div>

              <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {authMode === "register" && (
                  <>
                    <div><label className="form-label">Full Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Rohan Mehta" required /></div>
                    <div><label className="form-label">Username</label><input value={form.username} onChange={e=>setForm({...form,username:e.target.value})} placeholder="rohan_builds" required /></div>
                  </>
                )}
                <div><label className="form-label">Email</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com" required /></div>
                <div><label className="form-label">Password</label><input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Min 8 characters" required /></div>

                <button type="submit" className="btn-primary" style={{ width:"100%", padding:12, marginTop:4, fontSize:15, fontFamily:"Syne,sans-serif", fontWeight:700 }}
                  disabled={loginMut.isPending || registerMut.isPending}>
                  {(loginMut.isPending || registerMut.isPending) ? "Please wait..." : authMode === "login" ? "Log in →" : "Create account →"}
                </button>
              </form>

              <p style={{ fontSize:13, color:"var(--text3)", textAlign:"center", marginTop:16 }}>
                {authMode === "login" ? "No account? " : "Already have one? "}
                <button onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                  style={{ background:"none", border:"none", color:"var(--accent2)", cursor:"pointer", fontSize:13, padding:0 }}>
                  {authMode === "login" ? "Sign up free" : "Log in"}
                </button>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}