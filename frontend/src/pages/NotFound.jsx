import { useState } from "react";
export default function NotFound() {
  return (
    <div style={{ textAlign:"center", padding:"80px 24px" }}>
      <div style={{ fontFamily:"Syne,sans-serif", fontSize:72, fontWeight:800, color:"var(--border2)", marginBottom:16 }}>404</div>
      <div style={{ fontFamily:"Syne,sans-serif", fontSize:22, fontWeight:700, marginBottom:8 }}>Page not found</div>
      <p style={{ color:"var(--text2)", fontSize:14, marginBottom:24 }}>This page doesn't exist. Maybe it's a great startup idea though.</p>
      <Link to="/" className="btn-primary" style={{ textDecoration:"none", padding:"12px 24px" }}>Back to Feed →</Link>
    </div>
  );
}