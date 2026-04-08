import { useState } from "react";
import { useBattles } from "@/hooks/index";
import BattleCard from "@/components/battles/BattleCard";

export default function Battles() {
  const { data: battles, isLoading } = useBattles();

  return (
    <div style={{ maxWidth:700, margin:"0 auto", padding:"32px 24px" }}>
      <h1 style={{ fontFamily:"Syne,sans-serif", fontSize:28, fontWeight:800, marginBottom:6 }}>⚔️ Idea Battles</h1>
      <p style={{ fontSize:14, color:"var(--text2)", marginBottom:28 }}>Pick the idea with more potential. Your votes shape the leaderboard.</p>
      {isLoading
        ? Array.from({length:2}).map((_,i) => <div key={i} style={{ height:200, background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:12, marginBottom:14 }} />)
        : battles?.length
          ? battles.map(b => <BattleCard key={b._id} battle={b} />)
          : <div style={{ textAlign:"center", padding:"48px 0", color:"var(--text3)" }}>No active battles right now. Check back soon!</div>
      }
    </div>
  );
}