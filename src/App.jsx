import { useState, useEffect } from "react";
import LandingPage from "./LandingPage";
import CareerPulseApp from "./CareerPulseApp";
import { auth, googleProvider } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

function SharedResumeViewer({ resumeId }) {
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { getDoc, doc } = await import("firebase/firestore");
        const { db } = await import("./firebase");
        const snap = await getDoc(doc(db, "shared_resumes", resumeId));
        if (snap.exists()) setResume(snap.data());
      } catch(e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [resumeId]);

  const S = { bg:"#0A0E1A", card:"#111827", text:"#E2E8F0", muted:"#64748B", accent:"#00D4FF", border:"#1E2D45" };

  if (loading) return <div style={{background:S.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:S.accent,fontFamily:"'DM Mono',monospace"}}>Loading resume...</div>;
  if (!resume) return <div style={{background:S.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:S.muted,fontFamily:"'DM Mono',monospace"}}>Resume not found.</div>;

  return (
    <div style={{background:S.bg,minHeight:"100vh",padding:"40px 20px",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <div style={{maxWidth:700,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:8}}>
          <span style={{color:S.accent,fontSize:12,fontFamily:"'DM Mono',monospace",letterSpacing:2}}>⚡ CAREERPULSE RESUME</span>
        </div>
        <div style={{background:S.card,borderRadius:16,padding:"40px",border:`1px solid ${S.border}`}}>
          <div style={{borderBottom:`2px solid ${S.accent}`,paddingBottom:20,marginBottom:24}}>
            <h1 style={{color:S.text,fontSize:28,fontWeight:800,marginBottom:6}}>{resume.name}</h1>
            <div style={{color:S.muted,fontSize:14,display:"flex",gap:16,flexWrap:"wrap"}}>
              {resume.email&&<span>✉ {resume.email}</span>}
              {resume.phone&&<span>📞 {resume.phone}</span>}
              {resume.location&&<span>📍 {resume.location}</span>}
              {resume.linkedin&&<span>🔗 {resume.linkedin}</span>}
            </div>
          </div>
          {resume.summary&&<div style={{marginBottom:24}}><h2 style={{color:S.accent,fontSize:13,fontWeight:700,letterSpacing:2,marginBottom:10,fontFamily:"'DM Mono',monospace"}}>SUMMARY</h2><p style={{color:S.text,fontSize:14,lineHeight:1.7}}>{resume.summary}</p></div>}
          {resume.experience?.length>0&&<div style={{marginBottom:24}}><h2 style={{color:S.accent,fontSize:13,fontWeight:700,letterSpacing:2,marginBottom:10,fontFamily:"'DM Mono',monospace"}}>EXPERIENCE</h2>{resume.experience.map((e,i)=>(<div key={i} style={{marginBottom:16}}><div style={{color:S.text,fontWeight:700,fontSize:15}}>{e.title}</div><div style={{color:S.muted,fontSize:13,marginBottom:6}}>{e.company}{e.start&&` · ${e.start} - ${e.current?"Present":e.end}`}</div>{e.bullets&&e.bullets.split("\n").map((b,j)=>b.trim()&&<div key={j} style={{color:S.text,fontSize:13,lineHeight:1.6,paddingLeft:12}}>{b}</div>)}</div>))}</div>}
          {resume.education?.length>0&&<div style={{marginBottom:24}}><h2 style={{color:S.accent,fontSize:13,fontWeight:700,letterSpacing:2,marginBottom:10,fontFamily:"'DM Mono',monospace"}}>EDUCATION</h2>{resume.education.map((e,i)=>(<div key={i} style={{marginBottom:10}}><div style={{color:S.text,fontWeight:700,fontSize:15}}>{e.degree}</div><div style={{color:S.muted,fontSize:13}}>{e.school}{e.year&&` · ${e.year}`}{e.gpa&&` · GPA: ${e.gpa}`}</div></div>))}</div>}
          {resume.skills&&<div style={{marginBottom:24}}><h2 style={{color:S.accent,fontSize:13,fontWeight:700,letterSpacing:2,marginBottom:10,fontFamily:"'DM Mono',monospace"}}>SKILLS</h2><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{resume.skills.split(",").map((s,i)=>s.trim()&&<span key={i} style={{background:S.accent+"18",border:`1px solid ${S.accent}33`,borderRadius:6,padding:"4px 10px",color:S.accent,fontSize:12}}>{s.trim()}</span>)}</div></div>}
          {resume.projects?.length>0&&<div><h2 style={{color:S.accent,fontSize:13,fontWeight:700,letterSpacing:2,marginBottom:10,fontFamily:"'DM Mono',monospace"}}>PROJECTS</h2>{resume.projects.map((p,i)=>(<div key={i} style={{marginBottom:12}}><div style={{color:S.text,fontWeight:700,fontSize:15}}>{p.name}{p.tech&&<span style={{color:S.muted,fontSize:12,fontWeight:400}}> · {p.tech}</span>}</div>{p.desc&&<div style={{color:S.text,fontSize:13,lineHeight:1.6}}>{p.desc}</div>}</div>))}</div>}
        </div>
        <div style={{textAlign:"center",marginTop:20}}>
          <a href="/" style={{color:S.accent,fontSize:13,fontFamily:"'DM Mono',monospace",textDecoration:"none"}}>⚡ Build your own resume at CareerPulse</a>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [entered, setEntered] = useState(false);
  const [loading, setLoading] = useState(true);

  const resumeId = new URLSearchParams(window.location.search).get("resume");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  async function handleSignIn() {
    try { await signInWithPopup(auth, googleProvider); } catch(e) { console.error(e); }
  }

  async function handleSignOut() {
    await signOut(auth);
    setEntered(false);
  }

  if (resumeId) return <SharedResumeViewer resumeId={resumeId}/>;

  if (loading) return <div style={{background:"#0A0E1A",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#00D4FF",fontFamily:"'DM Mono',monospace",fontSize:16}}>Loading...</div>;

  if (!entered) return <LandingPage onEnter={() => setEntered(true)} />;

  if (!user) return (
    <div style={{background:"#0A0E1A",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:24,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>⚡</div>
        <div style={{color:"#E2E8F0",fontSize:28,fontWeight:800,marginBottom:8}}>Welcome to <span style={{color:"#00D4FF"}}>CareerPulse</span></div>
        <div style={{color:"#64748B",fontSize:15,marginBottom:40}}>Sign in to save your data across devices</div>
        <div style={{display:"flex",flexDirection:"column",gap:14,alignItems:"center"}}>
          <button onClick={handleSignIn} style={{background:"#fff",border:"none",borderRadius:12,padding:"14px 40px",fontSize:15,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:12,boxShadow:"0 4px 24px #00000066"}}>
            <img src="https://www.google.com/favicon.ico" width="20" height="20" alt="G"/>
            Continue with Google
          </button>
          <button onClick={()=>setUser({uid:null,photoURL:null,displayName:"Guest"})} style={{background:"transparent",border:"1px solid #1E2D45",borderRadius:12,padding:"12px 40px",fontSize:14,fontWeight:600,cursor:"pointer",color:"#64748B"}}>
            Continue without signing in
          </button>
        </div>
      </div>
    </div>
  );

  return <CareerPulseApp user={user.uid ? user : null} onSignOut={handleSignOut} />;
}
