import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import Navbar   from "@/components/layout/Navbar";
import Home        from "@/pages/Home";
import IdeaDetail  from "@/pages/IdeaDetail";
import Submit      from "@/pages/Submit";
import Profile     from "@/pages/Profile";
import Dashboard   from "@/pages/Dashboard";
import Battles     from "@/pages/Battles";
import Leaderboard from "@/pages/Leaderboard";
import Search      from "@/pages/Search";
import NotFound    from "@/pages/NotFound";

const ProtectedRoute = ({ children }) => {
  const user = useAuthStore(s => s.user);
  return user ? children : <Navigate to="/" replace />;
};

export default function App() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <Routes>
        <Route path="/"              element={<Home />} />
        <Route path="/ideas/:id"     element={<IdeaDetail />} />
        <Route path="/submit"        element={<ProtectedRoute><Submit /></ProtectedRoute>} />
        <Route path="/u/:username"   element={<Profile />} />
        <Route path="/dashboard"     element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/battles"       element={<Battles />} />
        <Route path="/leaderboard"   element={<Leaderboard />} />
        <Route path="/search"        element={<Search />} />
        <Route path="*"              element={<NotFound />} />
      </Routes>
    </div>
  );
}