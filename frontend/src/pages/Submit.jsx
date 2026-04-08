import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import * as api from "@/api/index";
import toast from "react-hot-toast";

const TAGS = ["AI","SaaS","D2C","Fintech","EdTech","HealthTech","Marketplace","Web3","Gaming"];
const MONOS = ["saas","marketplace","d2c","freemium","ads","enterprise","other"];

const schema = z.object({
  title:       z.string().min(10,"Title must be at least 10 characters").max(120),
  description: z.string().min(30,"Description must be at least 30 characters").max(2000),
  problem:     z.string().min(20,"Problem must be at least 20 characters").max(1000),
  solution:    z.string().max(1000).optional(),
  audience:    z.string().max(300).optional(),
});

export default function Submit() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step,     setStep]     = useState(1);
  const [selTags,  setSelTags]  = useState([]);
  const [selMono,  setSelMono]  = useState("");

  const { register, handleSubmit, formState: { errors }, trigger, getValues } = useForm({ resolver: zodResolver(schema) });

  const submitMut = useMutation({
    mutationFn: (data) => api.createIdea(data),
    onSuccess:  (idea) => { qc.invalidateQueries(["ideas"]); navigate(`/ideas/${idea._id}`); toast.success("Idea launched! 🚀"); },
    onError:    (e) => toast.error(e.response?.data?.error || "Failed to submit."),
  });

  const nextStep = async () => {
    const fields = step === 1 ? ["title","description"] : ["problem","solution"];
    const ok = await trigger(fields);
    if (ok) setStep(s => s + 1);
  };

  const onSubmit = (data) => {
    if (!selTags.length) return toast.error("Select at least one tag.");
    submitMut.mutate({ ...data, tags: selTags, monetization: { type: selMono } });
  };

  const toggleTag = (t) => setSelTags(prev => prev.includes(t) ? prev.filter(x=>x!==t) : prev.length < 3 ? [...prev,t] : (toast.error("Max 3 tags."), prev));

  const stepTitles = ["The Idea","The Market","Review & Launch"];

  return (
    <div style={{ maxWidth:560, margin:"40px auto", padding:"0 24px" }}>
      <h1 style={{ fontFamily:"Syne,sans-serif", fontSize:28, fontWeight:800, marginBottom:6 }}>Submit Your Idea 💡</h1>
      <p style={{ fontSize:14, color:"var(--text2)", marginBottom:28 }}>Put it out there. Let the community validate it.</p>

      {/* Step indicator */}
      <div style={{ display:"flex", gap:0, marginBottom:28 }}>
        {stepTitles.map((t,i) => (
          <div key={t} style={{ flex:1, display:"flex", flexDirection:"column", alignItems: i===0?"flex-start":i===2?"flex-end":"center" }}>
            <div style={{ width:"100%", height:3, background: i+1<=step ? "var(--accent)" : "var(--border)", borderRadius:99, marginBottom:6, transition:".3s" }} />
            <span style={{ fontSize:11, color: i+1===step?"var(--accent2)":"var(--text3)" }}>Step {i+1}: {t}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
              <div style={{ marginBottom:14 }}>
                <label className="form-label">Idea Title *</label>
                <input {...register("title")} placeholder="e.g. AI-powered invoice generator for Indian freelancers" />
                {errors.title && <span style={{ fontSize:11, color:"var(--red)", marginTop:4, display:"block" }}>{errors.title.message}</span>}
              </div>
              <div style={{ marginBottom:14 }}>
                <label className="form-label">Description *</label>
                <textarea {...register("description")} style={{ minHeight:100, resize:"vertical" }} placeholder="Describe what you're building and how it works..." />
                {errors.description && <span style={{ fontSize:11, color:"var(--red)", marginTop:4, display:"block" }}>{errors.description.message}</span>}
              </div>
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
              <div style={{ marginBottom:14 }}>
                <label className="form-label">Problem it Solves *</label>
                <textarea {...register("problem")} style={{ minHeight:80, resize:"vertical" }} placeholder="What specific pain does this address? Who feels it most?" />
                {errors.problem && <span style={{ fontSize:11, color:"var(--red)", marginTop:4, display:"block" }}>{errors.problem.message}</span>}
              </div>
              <div style={{ marginBottom:14 }}>
                <label className="form-label">Target Audience</label>
                <input {...register("audience")} placeholder="e.g. Freelance designers in Tier 2 Indian cities" />
              </div>
              <div style={{ marginBottom:14 }}>
                <label className="form-label">Monetisation Model</label>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {MONOS.map(m => (
                    <button key={m} type="button" onClick={() => setSelMono(m)}
                      style={{ padding:"5px 12px", borderRadius:99, fontSize:12, border:`1px solid ${selMono===m?"var(--accent)":"var(--border)"}`, background: selMono===m?"rgba(124,106,247,.1)":"transparent", color: selMono===m?"var(--accent2)":"var(--text2)", cursor:"pointer", fontFamily:"inherit", textTransform:"capitalize" }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom:14 }}>
                <label className="form-label">Tags (max 3)</label>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {TAGS.map(t => (
                    <button key={t} type="button" onClick={() => toggleTag(t)}
                      style={{ padding:"5px 12px", borderRadius:99, fontSize:12, border:`1px solid ${selTags.includes(t)?"var(--accent)":"var(--border)"}`, background: selTags.includes(t)?"rgba(124,106,247,.1)":"transparent", color: selTags.includes(t)?"var(--accent2)":"var(--text2)", cursor:"pointer", fontFamily:"inherit" }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
              <div className="card" style={{ marginBottom:14 }}>
                <div style={{ fontFamily:"Syne,sans-serif", fontSize:18, fontWeight:700, marginBottom:8 }}>{getValues("title")}</div>
                <p style={{ fontSize:13, color:"var(--text2)", lineHeight:1.5, marginBottom:10 }}>{getValues("description")}</p>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {selTags.map(t => <span key={t} className={`tag tag-${t}`}>{t}</span>)}
                </div>
              </div>
              <p style={{ fontSize:13, color:"var(--text3)", marginBottom:14, lineHeight:1.5 }}>
                Once submitted, the community can upvote, comment, and tell you if they'd pay for it. Ready to go public?
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display:"flex", gap:10, marginTop:8 }}>
          {step > 1 && <button type="button" onClick={() => setStep(s=>s-1)} className="btn-secondary" style={{ flex:1, padding:12 }}>← Back</button>}
          {step < 3
            ? <button type="button" onClick={nextStep} className="btn-primary" style={{ flex:1, padding:12, fontFamily:"Syne,sans-serif", fontWeight:700 }}>Next →</button>
            : <button type="submit" className="btn-primary" style={{ flex:1, padding:12, fontFamily:"Syne,sans-serif", fontWeight:700, fontSize:15 }} disabled={submitMut.isPending}>
                {submitMut.isPending ? "Launching..." : "Launch This Idea 🚀"}
              </button>
          }
        </div>
      </form>
    </div>
  );
}