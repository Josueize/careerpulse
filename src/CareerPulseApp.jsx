import { useState, useEffect, useRef } from "react"; import { subscribeToJobs, addJob as addJobFn, deleteJob, updateJob } from "./db.js";

const C = {
  bg: "#0A0E1A", card: "#111827", cardBorder: "#1E2D45",
  accent: "#00D4FF", accent2: "#7C3AED", accent3: "#10B981",
  warn: "#F59E0B", danger: "#EF4444", pink: "#EC4899",
  text: "#E2E8F0", muted: "#64748B",
};

function AnimatedNumber({ value, suffix = "" }) {
  const [cur, setCur] = useState(0);
  useEffect(() => {
    let s = 0; const end = parseInt(value);
    const step = Math.ceil(end / (1200 / 16));
    const t = setInterval(() => { s += step; if (s >= end) { setCur(end); clearInterval(t); } else setCur(s); }, 16);
    return () => clearInterval(t);
  }, [value]);
  return <span>{cur}{suffix}</span>;
}

function PulseRing({ color, size = 60 }) {
  return (
    <div style={{ position:"relative", width:size, height:size, display:"flex", alignItems:"center", justifyContent:"center" }}>
      {[0,1,2].map(i=><div key={i} style={{ position:"absolute", borderRadius:"50%", border:`2px solid ${color}`, width:size, height:size, animation:`pulseRing 2s ease-out ${i*0.6}s infinite`, opacity:0 }}/>)}
      <div style={{ width:size*0.35, height:size*0.35, borderRadius:"50%", background:color, boxShadow:`0 0 20px ${color}` }}/>
    </div>
  );
}

function ScoreCircle({ score, label, color }) {
  const r=38, cx=45, cy=45, circ=2*Math.PI*r;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1E2D45" strokeWidth="6"/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={circ-(score/100)*circ}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition:"stroke-dashoffset 1.5s ease", filter:`drop-shadow(0 0 8px ${color})` }}/>
        <text x={cx} y={cy+2} textAnchor="middle" dominantBaseline="middle" fill={color} fontSize="18" fontWeight="700" fontFamily="'DM Mono',monospace">{score}</text>
      </svg>
      <span style={{ color:C.muted, fontSize:11, fontFamily:"'DM Mono',monospace", letterSpacing:1, textTransform:"uppercase" }}>{label}</span>
    </div>
  );
}

function Card({ children, style={}, glow }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${glow?glow+"55":C.cardBorder}`, borderRadius:16, padding:"24px", boxShadow:glow?`0 0 30px ${glow}22,inset 0 1px 0 ${glow}22`:"0 4px 24px #00000044", ...style }}>
      {children}
    </div>
  );
}

function Badge({ label, color }) {
  return <span style={{ background:color+"22", color, border:`1px solid ${color}44`, borderRadius:6, padding:"3px 10px", fontSize:11, fontFamily:"'DM Mono',monospace", letterSpacing:0.5, fontWeight:600 }}>{label}</span>;
}

function Btn({ onClick, disabled, children, color, small }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ background:color||`linear-gradient(135deg,${C.accent2},${C.accent})`, border:"none", borderRadius:10, padding:small?"8px 16px":"12px 28px", color:"#fff", cursor:disabled?"not-allowed":"pointer", fontSize:small?12:14, fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", opacity:disabled?0.6:1, boxShadow:`0 4px 20px ${C.accent}33`, transition:"opacity 0.2s" }}>{children}</button>
  );
}

function TArea({ value, onChange, placeholder, height=140 }) {
  return <textarea value={value} onChange={onChange} placeholder={placeholder} style={{ width:"100%", height, background:"#0D1525", border:`1px solid ${C.cardBorder}`, borderRadius:10, color:C.text, padding:"12px 14px", fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif", resize:"vertical", outline:"none", boxSizing:"border-box", lineHeight:1.6 }}/>;
}

function Inp({ value, onChange, placeholder }) {
  return <input value={value} onChange={onChange} placeholder={placeholder} style={{ background:"#0D1525", border:`1px solid ${C.cardBorder}`, borderRadius:8, padding:"10px 14px", color:C.text, fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none", width:"100%", boxSizing:"border-box" }} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.cardBorder}/>;
}

function ResultBox({ children }) {
  return <div style={{ background:"#0D1525", borderRadius:12, padding:"16px 18px", color:C.text, fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1.8, whiteSpace:"pre-wrap", border:`1px solid ${C.cardBorder}` }}>{children}</div>;
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return <button onClick={()=>{navigator.clipboard.writeText(text);setCopied(true);setTimeout(()=>setCopied(false),2000);}} style={{ background:copied?C.accent3+"22":"#0D1525", border:`1px solid ${copied?C.accent3:C.cardBorder}`, borderRadius:8, padding:"7px 14px", color:copied?C.accent3:C.muted, cursor:"pointer", fontSize:12, fontFamily:"'DM Mono',monospace", transition:"all 0.2s" }}>{copied?"✓ Copied":"Copy"}</button>;
}

function AIChat({ systemPrompt, placeholder, height=320 }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  async function send() {
    if (!input.trim()||loading) return;
    const userMsg = {role:"user",content:input.trim()};
    setMessages(p=>[...p,userMsg]); setInput(""); setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:systemPrompt,messages:[...messages,userMsg].map(m=>({role:m.role,content:m.content}))})});
      const data = await res.json();
      setMessages(p=>[...p,{role:"assistant",content:data.content?.find(b=>b.type==="text")?.text||"No response."}]);
    } catch { setMessages(p=>[...p,{role:"assistant",content:"⚠️ Connection error."}]); }
    setLoading(false);
  }

  return (
    <div style={{display:"flex",flexDirection:"column",height,gap:12}}>
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,padding:"4px 0",scrollbarWidth:"thin",scrollbarColor:"#1E2D45 transparent"}}>
        {messages.length===0&&<div style={{textAlign:"center",color:C.muted,paddingTop:40,fontFamily:"'DM Mono',monospace",fontSize:13}}><div style={{fontSize:28,marginBottom:8}}>✦</div>Ask me anything...</div>}
        {messages.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
            <div style={{maxWidth:"82%",padding:"10px 14px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="user"?`linear-gradient(135deg,${C.accent2},${C.accent})`:C.cardBorder,color:C.text,fontSize:13,lineHeight:1.6,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{m.content}</div>
          </div>
        ))}
        {loading&&<div style={{display:"flex",gap:6,padding:"10px 14px"}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:C.accent,animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}</div>}
        <div ref={bottomRef}/>
      </div>
      <div style={{display:"flex",gap:10}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder={placeholder} style={{flex:1,background:"#0D1525",border:`1px solid ${C.cardBorder}`,borderRadius:10,padding:"10px 14px",color:C.text,fontSize:13,fontFamily:"'Plus Jakarta Sans',sans-serif",outline:"none"}} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.cardBorder}/>
        <button onClick={send} disabled={loading} style={{background:`linear-gradient(135deg,${C.accent2},${C.accent})`,border:"none",borderRadius:10,padding:"10px 18px",color:"#fff",cursor:loading?"not-allowed":"pointer",fontSize:16,fontWeight:700,opacity:loading?0.6:1}}>↑</button>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ setTab, deadlineJobs=[], lang="en" }) {
  const jobs=deadlineJobs;const total=jobs.length;const applied=jobs.filter(j=>j.status==="Applied").length;const interviews=jobs.filter(j=>j.status==="Interview").length;const offers=jobs.filter(j=>j.status==="Offer").length;const rejected=jobs.filter(j=>j.status==="Rejected").length;const offerRate=total>0?Math.round((offers/total)*100):0;const interviewRate=total>0?Math.round(((interviews+offers)/total)*100):0;const sc={Applied:C.accent,Interview:C.accent2,Offer:C.accent3,Rejected:C.danger};const stats=[{label:"Applications",value:total,suffix:"",color:C.accent},{label:"Interviews",value:interviews,suffix:"",color:C.accent2},{label:"Offers",value:offers,suffix:"",color:C.accent3},{label:"Offer Rate",value:offerRate,suffix:"%",color:C.warn}];
  const DT={en:{morning:"Good Morning",afternoon:"Good Afternoon",evening:"Good Evening",fire:"Your Career is on Fire"},es:{morning:"Buenos Dias",afternoon:"Buenas Tardes",evening:"Buenas Noches",fire:"Tu Carrera esta en Llamas"},pt:{morning:"Bom Dia",afternoon:"Boa Tarde",evening:"Boa Noite",fire:"Sua Carreira esta em Chamas"},fr:{morning:"Bonjour",afternoon:"Bon Apres-midi",evening:"Bonsoir",fire:"Votre Carriere est en Feu"},de:{morning:"Guten Morgen",afternoon:"Guten Tag",evening:"Guten Abend",fire:"Ihre Karriere brennt"}};const dt=DT[lang]||DT.en;
  const tools = [{icon:"✦",label:"Resume AI",tab:"Resume AI",color:C.accent,desc:"Analyze & score"},{icon:"🎯",label:"Interview",tab:"Interview Prep",color:C.accent2,desc:"AI mock practice"},{icon:"💰",label:"Salary",tab:"Salary Insights",color:C.accent3,desc:"Know your worth"},{icon:"✉️",label:"Cover Letter",tab:"Cover Letter",color:C.warn,desc:"AI-crafted letters"},{icon:"🔗",label:"LinkedIn",tab:"LinkedIn",color:C.pink,desc:"Optimize profile"},{icon:"🚀",label:"Career Path",tab:"Career Path",color:C.accent,desc:"Plan your future"}];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <Card glow={C.accent} style={{background:"linear-gradient(135deg,#0D1A2E,#111827)",padding:"28px 32px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
          <div>
            <div style={{color:C.muted,fontSize:13,fontFamily:"monospace",letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>{(()=>{const h=new Date().getHours();return h<12?dt.morning:h<17?dt.afternoon:dt.evening;})()} ✦</div>
            <div style={{color:C.text,fontSize:26,fontWeight:800,letterSpacing:-0.5}}>{dt.fire} 🔥</div>
            <div style={{color:C.muted,fontSize:14,marginTop:6}}>{total} jobs tracked · {interviews} interview{interviews!==1?"s":""} · {offers} offer{offers!==1?"s":""}</div>
          </div>
          <PulseRing color={C.accent} size={64}/>
        </div>
      </Card>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:14}}>
        {stats.map((s,i)=>(
          <Card key={i} glow={s.color} style={{textAlign:"center",padding:"18px 12px"}}>
            <div style={{fontSize:30,fontWeight:800,color:s.color,fontFamily:"'DM Mono',monospace"}}><AnimatedNumber value={s.value} suffix={s.suffix}/></div>
            <div style={{color:C.muted,fontSize:11,marginTop:4,fontFamily:"'DM Mono',monospace",letterSpacing:1,textTransform:"uppercase"}}>{s.label}</div>
          </Card>
        ))}
      </div>

      <div>
        <div style={{color:C.muted,fontSize:11,fontFamily:"'DM Mono',monospace",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>Quick Tools</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12}}>
          {tools.map((t,i)=>(
            <button key={i} onClick={()=>setTab(t.tab)} style={{background:C.card,border:`1px solid ${t.color}33`,borderRadius:12,padding:"16px 10px",cursor:"pointer",textAlign:"center",transition:"all 0.2s",display:"flex",flexDirection:"column",alignItems:"center",gap:6}} onMouseEnter={e=>{e.currentTarget.style.borderColor=t.color+"88";e.currentTarget.style.background=t.color+"11";}} onMouseLeave={e=>{e.currentTarget.style.borderColor=t.color+"33";e.currentTarget.style.background=C.card;}}>
              <div style={{fontSize:22}}>{t.icon}</div>
              <div style={{color:C.text,fontSize:12,fontWeight:700}}>{t.label}</div>
              <div style={{color:C.muted,fontSize:11}}>{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{marginBottom:4}}>
        <div style={{color:C.muted,fontSize:11,fontFamily:"monospace",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>🏆 Achievements</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
          {[{icon:"🚀",label:"First App",desc:"Applied to first job",unlocked:total>=1},{icon:"🔥",label:"On a Roll",desc:"5+ applications",unlocked:total>=5},{icon:"💼",label:"Job Hunter",desc:"10+ applications",unlocked:total>=10},{icon:"🎯",label:"Interviewing",desc:"Got first interview",unlocked:interviews>=1},{icon:"⭐",label:"Interview Pro",desc:"3+ interviews",unlocked:interviews>=3},{icon:"💰",label:"Offer!",desc:"Got first offer",unlocked:offers>=1},{icon:"🏆",label:"Top Performer",desc:"50%+ offer rate",unlocked:offerRate>=50&&total>=4},{icon:"🌟",label:"Dream Chaser",desc:"20+ applications",unlocked:total>=20}].map((b,i)=>(
            <div key={i} style={{background:b.unlocked?C.card:"#0D1525",border:"1px solid "+(b.unlocked?C.accent+"44":C.cardBorder),borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,opacity:b.unlocked?1:0.4,minWidth:150}}>
              <div style={{fontSize:22,filter:b.unlocked?"none":"grayscale(1)"}}>{b.icon}</div>
              <div><div style={{color:b.unlocked?C.text:C.muted,fontSize:12,fontWeight:700}}>{b.label}</div><div style={{color:C.muted,fontSize:11}}>{b.desc}</div></div>
              {b.unlocked&&<div style={{marginLeft:"auto",color:C.accent3,fontSize:11,fontWeight:700}}>✓</div>}
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <Card glow={C.accent}>
          <div style={{color:C.text,fontWeight:700,fontSize:15,marginBottom:16}}>📈 Job Status Breakdown</div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {[{label:"Applied",val:applied,color:C.accent},{label:"Interview",val:interviews,color:C.accent2},{label:"Offer",val:offers,color:C.accent3},{label:"Rejected",val:rejected,color:C.danger}].map((s,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{color:C.muted,fontSize:13}}>{s.label}</span><span style={{color:s.color,fontWeight:700,fontSize:13}}>{s.val} job{s.val!==1?"s":""}</span></div>
            ))}
          </div>
        </Card>
        <Card>
          <div style={{color:C.text,fontWeight:700,fontSize:15,marginBottom:14}}>Recent Applications</div>
          <div style={{display:"flex",flexDirection:"column",gap:11}}>
            {jobs.map((j,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div><div style={{color:C.text,fontSize:13,fontWeight:600}}>{j.title}</div><div style={{color:C.muted,fontSize:11,fontFamily:"'DM Mono',monospace"}}>{j.company} · {j.date}</div></div>
                <Badge label={j.status} color={j.statusColor}/>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── RESUME AI ────────────────────────────────────────────────────────────────
function ResumeAI() {
  const [resume, setResume] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  async function analyze() {
    if (!resume.trim()) return;
    setAnalyzing(true); setResult(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:`You are an expert resume reviewer. Return ONLY valid JSON: {"overallScore":number,"atsScore":number,"impactScore":number,"strengths":[string,string,string],"improvements":[string,string,string],"summary":string}`,messages:[{role:"user",content:`Analyze:\n${resume}`}]})});
      const data = await res.json();
      const text = data.content?.find(b=>b.type==="text")?.text||"{}";
      setResult(JSON.parse(text.replace(/```json|```/g,"").trim()));
    } catch { setResult({error:true}); }
    setAnalyzing(false);
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <Card glow={C.accent}>
        <div style={{color:C.text,fontWeight:700,fontSize:16,marginBottom:4}}>AI Resume Analyzer ✦</div>
        <div style={{color:C.muted,fontSize:13,marginBottom:16}}>Paste your resume for instant scores & feedback</div>
        <TArea value={resume} onChange={e=>setResume(e.target.value)} placeholder="Paste your resume content here..." height={160}/>
        <div style={{marginTop:12}}><Btn onClick={analyze} disabled={analyzing||!resume.trim()}>{analyzing?"Analyzing...":"✦ Analyze Resume"}</Btn></div>
      </Card>
      {result&&!result.error&&(
        <div style={{display:"flex",flexDirection:"column",gap:16,animation:"fadeUp 0.5s ease"}}>
          <Card glow={C.accent}>
            <div style={{color:C.text,fontWeight:700,fontSize:15,marginBottom:16}}>Score Breakdown</div>
            <div style={{display:"flex",justifyContent:"space-around"}}><ScoreCircle score={result.overallScore} label="Overall" color={C.accent}/><ScoreCircle score={result.atsScore} label="ATS" color={C.accent3}/><ScoreCircle score={result.impactScore} label="Impact" color={C.accent2}/></div>
            <div style={{marginTop:16,padding:"12px 14px",background:"#0D1525",borderRadius:10,color:C.muted,fontSize:13,lineHeight:1.6}}>{result.summary}</div>
          </Card>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <Card glow={C.accent3}><div style={{color:C.accent3,fontWeight:700,fontSize:14,marginBottom:12}}>✓ Strengths</div>{result.strengths?.map((s,i)=><div key={i} style={{color:C.text,fontSize:13,marginBottom:8,paddingLeft:12,borderLeft:`2px solid ${C.accent3}`,lineHeight:1.5}}>{s}</div>)}</Card>
            <Card glow={C.warn}><div style={{color:C.warn,fontWeight:700,fontSize:14,marginBottom:12}}>⚡ Improvements</div>{result.improvements?.map((s,i)=><div key={i} style={{color:C.text,fontSize:13,marginBottom:8,paddingLeft:12,borderLeft:`2px solid ${C.warn}`,lineHeight:1.5}}>{s}</div>)}</Card>
          </div>
        </div>
      )}
      {result?.error&&<Card glow={C.danger}><div style={{color:C.danger,textAlign:"center"}}>Analysis failed. Please try again.</div></Card>}
    </div>
  );
}

// ─── GMAIL SCANNER ───────────────────────────────────────────────────────────
function GmailScanner({ user }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState(false);

  async function scanEmail() {
    if (!email.trim()) return;
    setLoading(true); setResult(null); setSaved(false);
    try {
      const res = await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:500,system:`You are a job application email parser. Extract job info from emails and return ONLY valid JSON: {"title":string,"company":string,"status":string,"notes":string} where status is one of: Applied, Interview, Offer, Rejected. If not a job email return {"error":"not a job email"}.`,messages:[{role:"user",content:"Parse this email:\n"+email}]})});
      const data = await res.json();
      const text = data.content?.find(b=>b.type==="text")?.text||"{}";
      setResult(JSON.parse(text.replace(/```json|```/g,"").trim()));
    } catch(e) { setResult({error:"parse failed"}); }
    setLoading(false);
  }

  async function saveToTracker() {
    if (!result||result.error||!user) return;
    await addJobFn(user.uid,{...result,date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"})});
    setSaved(true);
  }

  const sc = {Applied:C.accent,Interview:C.accent2,Offer:C.accent3,Rejected:C.danger};

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <Card glow={C.accent}>
        <div style={{color:C.text,fontWeight:700,fontSize:16,marginBottom:4}}>📧 Gmail Job Scanner</div>
        <div style={{color:C.muted,fontSize:13,marginBottom:16}}>Paste any job-related email — AI extracts the details and adds it to your tracker</div>
        <TArea value={email} onChange={e=>setEmail(e.target.value)} placeholder={"Paste email content here...\n\nExample:\nSubject: Your application for Frontend Engineer at Stripe\n\nHi Josue, we received your application..."} height={180}/>
        <div style={{marginTop:12}}><Btn onClick={scanEmail} disabled={loading||!email.trim()}>{loading?"Scanning...":"📧 Scan Email"}</Btn></div>
      </Card>
      {result&&!result.error&&(
        <Card glow={C.accent2} style={{animation:"fadeUp 0.5s ease"}}>
          <div style={{color:C.text,fontWeight:700,fontSize:15,marginBottom:16}}>✦ Extracted Job Info</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"flex",justifyContent:"space-between",padding:"10px 14px",background:"#0D1525",borderRadius:8}}>
              <span style={{color:C.muted,fontSize:13}}>Position</span>
              <span style={{color:C.text,fontSize:13,fontWeight:600}}>{result.title}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",padding:"10px 14px",background:"#0D1525",borderRadius:8}}>
              <span style={{color:C.muted,fontSize:13}}>Company</span>
              <span style={{color:C.text,fontSize:13,fontWeight:600}}>{result.company}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",padding:"10px 14px",background:"#0D1525",borderRadius:8}}>
              <span style={{color:C.muted,fontSize:13}}>Status</span>
              <Badge label={result.status} color={sc[result.status]||C.accent}/>
            </div>
            {result.notes&&<div style={{padding:"10px 14px",background:"#0D1525",borderRadius:8,color:C.muted,fontSize:12,fontStyle:"italic"}}>{result.notes}</div>}
          </div>
          <div style={{marginTop:16}}>
            {saved?<div style={{color:C.accent3,fontWeight:700,fontSize:14}}>✓ Added to Job Tracker!</div>:<Btn onClick={saveToTracker} color={C.accent3}>+ Add to Job Tracker</Btn>}
          </div>
        </Card>
      )}
      {result?.error&&<Card glow={C.warn}><div style={{color:C.warn,textAlign:"center",fontSize:14}}>{result.error==="not a job email"?"This does not look like a job email. Try another one.":"Scan failed. Please try again."}</div></Card>}
    </div>
  );
}

// ─── JOB MATCH ────────────────────────────────────────────────────────────────
function JobMatch() {
  const [resume, setResume] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  async function analyze() {
    if (!resume.trim()||!jobDesc.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:`You are an ATS system. Return ONLY valid JSON: {"matchScore":number,"skillsMatch":[string],"skillsMissing":[string],"recommendation":string,"verdict":string}`,messages:[{role:"user",content:"Resume:\n"+resume+"\n\nJob:\n"+jobDesc}]})});
      const data = await res.json();
      const text = data.content?.find(b=>b.type==="text")?.text||"{}";
      setResult(JSON.parse(text.replace(/```json|```/g,"").trim()));
    } catch(e) { setResult({error:true}); }
    setLoading(false);
  }
  const score = result?.matchScore||0;
  const color = score>=80?C.accent3:score>=60?C.warn:C.danger;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <Card glow={C.accent2}>
        <div style={{color:C.text,fontWeight:700,fontSize:16,marginBottom:4}}>🤖 AI Job Match Score</div>
        <div style={{color:C.muted,fontSize:13,marginBottom:16}}>Paste your resume + job description to get your match %</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <TArea value={resume} onChange={e=>setResume(e.target.value)} placeholder="Paste your resume..." height={140}/>
          <TArea value={jobDesc} onChange={e=>setJobDesc(e.target.value)} placeholder="Paste job description..." height={140}/>
        </div>
        <div style={{marginTop:12}}><Btn onClick={analyze} disabled={loading||!resume.trim()||!jobDesc.trim()}>{loading?"Analyzing...":"🤖 Get Match Score"}</Btn></div>
      </Card>
      {result&&!result.error&&(
        <div style={{display:"flex",flexDirection:"column",gap:16,animation:"fadeUp 0.5s ease"}}>
          <Card glow={color}>
            <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:52,fontWeight:800,color,fontFamily:"monospace",lineHeight:1}}>{score}%</div>
                <div style={{color:C.muted,fontSize:12,marginTop:4}}>Match Score</div>
              </div>
              <div style={{flex:1}}>
                <div style={{color:color,fontWeight:700,fontSize:16,marginBottom:6}}>{result.verdict}</div>
                <div style={{color:C.muted,fontSize:13,lineHeight:1.6}}>{result.recommendation}</div>
              </div>
            </div>
            <div style={{marginTop:12,height:8,background:"#0D1525",borderRadius:8}}><div style={{height:"100%",width:score+"%",background:color,borderRadius:8,transition:"width 1s"}}/></div>
          </Card>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <Card glow={C.accent3}><div style={{color:C.accent3,fontWeight:700,fontSize:14,marginBottom:12}}>✓ Matching Skills</div>{result.skillsMatch?.map((s,i)=><div key={i} style={{color:C.text,fontSize:13,marginBottom:8,paddingLeft:12,borderLeft:"2px solid "+C.accent3}}>{s}</div>)}</Card>
            <Card glow={C.danger}><div style={{color:C.danger,fontWeight:700,fontSize:14,marginBottom:12}}>✗ Missing Skills</div>{result.skillsMissing?.map((s,i)=><div key={i} style={{color:C.text,fontSize:13,marginBottom:8,paddingLeft:12,borderLeft:"2px solid "+C.danger}}>{s}</div>)}</Card>
          </div>
        </div>
      )}
      {result?.error&&<Card glow={C.danger}><div style={{color:C.danger,textAlign:"center"}}>Analysis failed. Please try again.</div></Card>}
    </div>
  );
}

// ─── INTERVIEW PREP ───────────────────────────────────────────────────────────
function InterviewPrep() {
  const topics = ["Behavioral","Technical","System Design","Leadership","Culture Fit"];
  const [selected, setSelected] = useState("Behavioral");
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <Card glow={C.accent2}>
        <div style={{color:C.text,fontWeight:700,fontSize:16,marginBottom:4}}>AI Mock Interviewer 🎯</div>
        <div style={{color:C.muted,fontSize:13,marginBottom:16}}>Practice with an AI interviewer — get real-time feedback</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
          {topics.map(t=><button key={t} onClick={()=>setSelected(t)} style={{padding:"7px 14px",borderRadius:8,fontSize:12,fontWeight:600,fontFamily:"'DM Mono',monospace",cursor:"pointer",background:selected===t?`linear-gradient(135deg,${C.accent2},${C.accent})`:"#0D1525",color:selected===t?"#fff":C.muted,border:`1px solid ${selected===t?"transparent":C.cardBorder}`,transition:"all 0.2s"}}>{t}</button>)}
        </div>
        <AIChat systemPrompt={`You are an expert ${selected} interviewer. Ask ONE question at a time. After each answer give specific 2-3 sentence feedback then ask the next.`} placeholder={`Answer the ${selected} interview question...`} height={340}/>
      </Card>
    </div>
  );
}

// ─── CAREER PATH ──────────────────────────────────────────────────────────────
function CareerPath() {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <Card glow={C.accent3}>
        <div style={{color:C.text,fontWeight:700,fontSize:16,marginBottom:4}}>Career Path Advisor 🚀</div>
        <div style={{color:C.muted,fontSize:13,marginBottom:16}}>Explore paths, skill gaps & growth opportunities</div>
        <AIChat systemPrompt="You are an expert career coach. Help users explore career paths, identify skill gaps, suggest learning resources, and plan professional growth. Be specific, actionable, and encouraging." placeholder="Ask about career paths, skill gaps, salary, transitions..." height={400}/>
      </Card>
    </div>
  );
}

// ─── JOB TRACKER ─────────────────────────────────────────────────────────────
function JobTracker({ user }) {
  const [jobs, setJobs] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({title:"",company:"",status:"Applied",salary:"",notes:"",deadline:""});
  const sc = {Applied:C.accent,Interview:C.accent2,Offer:C.accent3,Rejected:C.danger};
  useEffect(()=>{ if(!user) return; const unsub=subscribeToJobs(user.uid,j=>setJobs(j)); return ()=>unsub(); },[user]);





  async function addJob() {
    if (!form.title||!form.company) return;
    await addJobFn(user.uid,{...form,date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"})});
    setForm({title:"",company:"",status:"Applied",salary:"",notes:"",deadline:""}); setShowAdd(false);
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {["Applied","Interview","Offer","Rejected"].map(s=>(
          <Card key={s} glow={sc[s]} style={{textAlign:"center",padding:"16px 12px"}}>
            <div style={{fontSize:26,fontWeight:800,color:sc[s],fontFamily:"'DM Mono',monospace"}}>{jobs.filter(j=>j.status===s).length}</div>
            <div style={{color:C.muted,fontSize:11,fontFamily:"'DM Mono',monospace",letterSpacing:1}}>{s.toUpperCase()}</div>
          </Card>
        ))}
      </div>
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{color:C.text,fontWeight:700,fontSize:15}}>Applications ({jobs.length})</div>
          <Btn onClick={()=>setShowAdd(!showAdd)} small>+ Add Job</Btn>
        </div>
        {showAdd&&(
          <div style={{background:"#0D1525",borderRadius:12,padding:16,marginBottom:16,display:"flex",flexDirection:"column",gap:10}}>
            {[["Job Title","title"],["Company","company"],["Salary","salary"],["Notes","notes"]].map(([ph,key])=><input key={key} placeholder={ph} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:8,padding:"8px 12px",color:C.text,fontSize:13,outline:"none"}}/>)}<input type="date" value={form.deadline} onChange={e=>setForm(f=>({...f,deadline:e.target.value}))} style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:8,padding:"8px 12px",color:C.text,fontSize:13,outline:"none"}}/>
            <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:8,padding:"8px 12px",color:C.text,fontSize:13,outline:"none"}}>
              {["Applied","Interview","Offer","Rejected"].map(s=><option key={s}>{s}</option>)}
            </select>
            <Btn onClick={addJob} color={C.accent3} small>Save Job</Btn>
          </div>
        )}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {jobs.map(j=>(
            <div key={j.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:"#0D1525",borderRadius:10,border:`1px solid ${C.cardBorder}`,flexWrap:"wrap",gap:8}}>
              <div style={{flex:1,minWidth:150}}>
                <div style={{color:C.text,fontSize:14,fontWeight:600}}>{j.title}</div>
                <div style={{color:C.muted,fontSize:11,fontFamily:"'DM Mono',monospace",marginTop:2}}>{j.company} · {j.date}{j.salary&&` · ${j.salary}`}</div>
                {j.notes&&<div style={{color:C.muted,fontSize:11,marginTop:2,fontStyle:"italic"}}>{j.notes}</div>}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <Badge label={j.status} color={sc[j.status]}/>
                {j.deadline&&<button onClick={()=>addToGoogleCalendar(j)} style={{background:"none",border:`1px solid ${C.accent2}44`,borderRadius:6,color:C.accent2,cursor:"pointer",fontSize:10,padding:"3px 7px"}}>📅</button>}<button onClick={()=>deleteJob(user.uid,j.id)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16}}>×</button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── SALARY INSIGHTS ──────────────────────────────────────────────────────────
function SalaryInsights() {
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [exp, setExp] = useState("Mid-level (3-5 years)");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const levels = ["Junior (0-2 yrs)","Mid-level (3-5 yrs)","Senior (5-8 yrs)","Staff / Principal (8+)","Director / VP"];

  async function getSalary() {
    if (!role.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:`You are a compensation expert. Return ONLY valid JSON:\n{"low":number,"mid":number,"high":number,"totalCompLow":number,"totalCompMid":number,"totalCompHigh":number,"topCompanies":[{"name":string,"range":string}],"skills":[string,string,string,string],"negotiationTips":[string,string,string],"marketOutlook":string,"remoteImpact":string}\nAll numbers are annual salary in thousands (e.g. 150 = $150k).`,messages:[{role:"user",content:`Role: ${role}, Location: ${location||"United States"}, Experience: ${exp}. Provide realistic current market data.`}]})});
      const data = await res.json();
      const text = data.content?.find(b=>b.type==="text")?.text||"{}";
      setResult(JSON.parse(text.replace(/```json|```/g,"").trim()));
    } catch { setResult({error:true}); }
    setLoading(false);
  }

  function SalaryBar({low,mid,high,color,label}) {
    const max = high*1.15;
    return (
      <div style={{marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{color:C.muted,fontSize:12,fontFamily:"'DM Mono',monospace"}}>{label}</span>
          <span style={{color,fontSize:13,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>${low}k – ${high}k</span>
        </div>
        <div style={{position:"relative",height:10,background:"#0D1525",borderRadius:10,overflow:"hidden"}}>
          <div style={{position:"absolute",left:`${(low/max)*100}%`,width:`${((high-low)/max)*100}%`,height:"100%",background:`linear-gradient(90deg,${color}88,${color})`,borderRadius:10,boxShadow:`0 0 10px ${color}55`}}/>
          <div style={{position:"absolute",left:`${(mid/max)*100}%`,transform:"translateX(-50%)",width:3,height:"100%",background:"#fff",borderRadius:2}}/>
        </div>
        <div style={{display:"flex",justifyContent:"center",marginTop:4}}>
          <span style={{color:C.muted,fontSize:11,fontFamily:"'DM Mono',monospace"}}>Median: <span style={{color}}>${mid}k</span></span>
        </div>
      </div>
    );
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <Card glow={C.accent3}>
        <div style={{color:C.text,fontWeight:700,fontSize:16,marginBottom:4}}>Salary Insights 💰</div>
        <div style={{color:C.muted,fontSize:13,marginBottom:20}}>Know your market value — real compensation data powered by AI</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div><div style={{color:C.muted,fontSize:11,fontFamily:"'DM Mono',monospace",marginBottom:6,letterSpacing:1}}>JOB TITLE *</div><Inp value={role} onChange={e=>setRole(e.target.value)} placeholder="e.g. Senior Frontend Engineer"/></div>
          <div><div style={{color:C.muted,fontSize:11,fontFamily:"'DM Mono',monospace",marginBottom:6,letterSpacing:1}}>LOCATION</div><Inp value={location} onChange={e=>setLocation(e.target.value)} placeholder="e.g. San Francisco, CA"/></div>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{color:C.muted,fontSize:11,fontFamily:"'DM Mono',monospace",marginBottom:8,letterSpacing:1}}>EXPERIENCE LEVEL</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {levels.map(l=><button key={l} onClick={()=>setExp(l)} style={{padding:"7px 12px",borderRadius:8,fontSize:11,fontWeight:600,fontFamily:"'DM Mono',monospace",cursor:"pointer",background:exp===l?C.accent3+"22":"#0D1525",color:exp===l?C.accent3:C.muted,border:`1px solid ${exp===l?C.accent3+"66":C.cardBorder}`,transition:"all 0.2s"}}>{l}</button>)}
          </div>
        </div>
        <Btn onClick={getSalary} disabled={loading||!role.trim()} color={`linear-gradient(135deg,${C.accent3},${C.accent})`}>{loading?"Analyzing market...":"💰 Get Salary Insights"}</Btn>
      </Card>

      {result&&!result.error&&(
        <div style={{display:"flex",flexDirection:"column",gap:16,animation:"fadeUp 0.5s ease"}}>
          <Card glow={C.accent3}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
              <div><div style={{color:C.text,fontWeight:700,fontSize:15,marginBottom:6}}>{role} · {location||"United States"}</div><Badge label={exp} color={C.accent3}/></div>
              <div style={{textAlign:"right"}}><div style={{color:C.accent3,fontSize:36,fontWeight:800,fontFamily:"'DM Mono',monospace",lineHeight:1}}>${result.mid}k</div><div style={{color:C.muted,fontSize:12,fontFamily:"'DM Mono',monospace"}}>Median Base</div></div>
            </div>
            <SalaryBar low={result.low} mid={result.mid} high={result.high} color={C.accent3} label="Base Salary"/>
            <SalaryBar low={result.totalCompLow} mid={result.totalCompMid} high={result.totalCompHigh} color={C.accent} label="Total Comp (inc. equity & bonus)"/>
          </Card>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <Card glow={C.accent2}>
              <div style={{color:C.text,fontWeight:700,fontSize:14,marginBottom:14}}>🏢 Top Paying Companies</div>
              {result.topCompanies?.map((c,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,paddingBottom:10,borderBottom:i<result.topCompanies.length-1?`1px solid ${C.cardBorder}`:"none"}}>
                  <span style={{color:C.text,fontSize:13,fontWeight:600}}>{c.name}</span>
                  <Badge label={c.range} color={C.accent2}/>
                </div>
              ))}
            </Card>
            <Card glow={C.warn}>
              <div style={{color:C.text,fontWeight:700,fontSize:14,marginBottom:14}}>⚡ Skills That Pay More</div>
              {result.skills?.map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}><div style={{width:6,height:6,borderRadius:"50%",background:C.warn,flexShrink:0}}/><span style={{color:C.text,fontSize:13}}>{s}</span></div>)}
            </Card>
          </div>
          <Card glow={C.pink}>
            <div style={{color:C.text,fontWeight:700,fontSize:14,marginBottom:14}}>🤝 Negotiation Tips</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {result.negotiationTips?.map((t,i)=>(
                <div key={i} style={{display:"flex",gap:12,padding:"10px 14px",background:"#0D1525",borderRadius:10,border:`1px solid ${C.cardBorder}`}}>
                  <span style={{color:C.pink,fontWeight:800,fontFamily:"'DM Mono',monospace",fontSize:13,flexShrink:0}}>{i+1}.</span>
                  <span style={{color:C.text,fontSize:13,lineHeight:1.5}}>{t}</span>
                </div>
              ))}
            </div>
          </Card>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <Card glow={C.accent}><div style={{color:C.muted,fontSize:11,fontFamily:"'DM Mono',monospace",letterSpacing:1,marginBottom:8}}>MARKET OUTLOOK</div><div style={{color:C.text,fontSize:13,lineHeight:1.6}}>{result.marketOutlook}</div></Card>
            <Card glow={C.accent3}><div style={{color:C.muted,fontSize:11,fontFamily:"'DM Mono',monospace",letterSpacing:1,marginBottom:8}}>REMOTE IMPACT</div><div style={{color:C.text,fontSize:13,lineHeight:1.6}}>{result.remoteImpact}</div></Card>
          </div>
        </div>
      )}
      {result?.error&&<Card glow={C.danger}><div style={{color:C.danger,textAlign:"center"}}>Failed to fetch data. Please try again.</div></Card>}
    </div>
  );
}

// ─── COVER LETTER ─────────────────────────────────────────────────────────────
function CoverLetter() {
  const [form, setForm] = useState({name:"",role:"",company:"",resume:"",jd:"",tone:"Professional"});
  const [loading, setLoading] = useState(false);
  const [letter, setLetter] = useState("");
  const tones = ["Professional","Enthusiastic","Concise","Creative","Executive"];

  async function generate() {
    if (!form.role||!form.company) return;
    setLoading(true); setLetter("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:`You are an expert cover letter writer. Tone: ${form.tone}. Be specific, avoid clichés, make it human and authentic. Return only the cover letter text.`,messages:[{role:"user",content:`Name: ${form.name||"[Your Name]"}\nRole: ${form.role}\nCompany: ${form.company}\n${form.resume?"Resume highlights:\n"+form.resume:""}\n${form.jd?"Job description:\n"+form.jd:""}`}]})});
      const data = await res.json();
      setLetter(data.content?.find(b=>b.type==="text")?.text||"Generation failed.");
    } catch { setLetter("⚠️ Failed to generate. Please try again."); }
    setLoading(false);
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <Card glow={C.warn}>
        <div style={{color:C.text,fontWeight:700,fontSize:16,marginBottom:4}}>Cover Letter Generator ✉️</div>
        <div style={{color:C.muted,fontSize:13,marginBottom:20}}>AI-crafted cover letters tailored to every application</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          {[["Your Name (optional)","name"],["Job Title *","role"],["Company *","company"]].map(([ph,key])=>(
            <div key={key}><div style={{color:C.muted,fontSize:11,fontFamily:"'DM Mono',monospace",marginBottom:6,letterSpacing:1}}>{ph.toUpperCase()}</div><Inp value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} placeholder={ph}/></div>
          ))}
        </div>
        <div style={{marginBottom:12}}>
          <div style={{color:C.muted,fontSize:11,fontFamily:"'DM Mono',monospace",marginBottom:8,letterSpacing:1}}>TONE</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {tones.map(t=><button key={t} onClick={()=>setForm(f=>({...f,tone:t}))} style={{padding:"7px 14px",borderRadius:8,fontSize:12,fontWeight:600,fontFamily:"'DM Mono',monospace",cursor:"pointer",background:form.tone===t?C.warn+"22":"#0D1525",color:form.tone===t?C.warn:C.muted,border:`1px solid ${form.tone===t?C.warn+"66":C.cardBorder}`,transition:"all 0.2s"}}>{t}</button>)}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          <div><div style={{color:C.muted,fontSize:11,fontFamily:"'DM Mono',monospace",marginBottom:6,letterSpacing:1}}>RESUME HIGHLIGHTS (optional)</div><TArea value={form.resume} onChange={e=>setForm(f=>({...f,resume:e.target.value}))} placeholder="Paste key bullets from your resume..." height={110}/></div>
          <div><div style={{color:C.muted,fontSize:11,fontFamily:"'DM Mono',monospace",marginBottom:6,letterSpacing:1}}>JOB DESCRIPTION (optional)</div><TArea value={form.jd} onChange={e=>setForm(f=>({...f,jd:e.target.value}))} placeholder="Paste the job description for tailored output..." height={110}/></div>
        </div>
        <Btn onClick={generate} disabled={loading||!form.role||!form.company} color={`linear-gradient(135deg,${C.warn},${C.pink})`}>{loading?"Crafting your letter...":"✉️ Generate Cover Letter"}</Btn>
      </Card>
      {letter&&(
        <Card glow={C.warn} style={{animation:"fadeUp 0.5s ease"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{color:C.text,fontWeight:700,fontSize:15}}>Your Cover Letter</div>
            <div style={{display:"flex",gap:8}}><CopyBtn text={letter}/><Btn onClick={generate} color={C.cardBorder} small>↻ Regenerate</Btn></div>
          </div>
          <ResultBox>{letter}</ResultBox>
        </Card>
      )}
    </div>
  );
}

// ─── LINKEDIN OPTIMIZER ───────────────────────────────────────────────────────
function LinkedIn() {
  const [section, setSection] = useState("Headline");
  const [input, setInput] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const sections = [{label:"Headline",icon:"✦"},{label:"Summary",icon:"📝"},{label:"Experience",icon:"💼"},{label:"Skills",icon:"⚡"},{label:"Connection Note",icon:"🤝"}];
  const descs = {Headline:"Craft a magnetic headline that gets you noticed",Summary:"Write an About section that tells your story",Experience:"Transform duties into impact statements",Skills:"Identify the right skills to feature","Connection Note":"Write personalized connection request messages"};
  const prompts = {
    Headline:`You are a LinkedIn expert. Generate 5 compelling LinkedIn headlines (under 220 chars each, keyword-rich). Return ONLY JSON: {"headlines":[{"text":string,"why":string}]}`,
    Summary:`You are a LinkedIn expert. Write a compelling LinkedIn About section (300-400 words, first person, story-driven, keyword-optimized). Return ONLY JSON: {"summary":string,"keywords":[string]}`,
    Experience:`You are a LinkedIn expert. Rewrite job bullets using STAR format with strong action verbs and quantified impact. Return ONLY JSON: {"bullets":[string],"tips":[string]}`,
    Skills:`You are a LinkedIn expert. Suggest top LinkedIn skills based on the role. Return ONLY JSON: {"topSkills":[string],"emergingSkills":[string],"tip":string}`,
    "Connection Note":`You are a LinkedIn expert. Write 3 personalized connection request messages (under 300 chars each). Return ONLY JSON: {"messages":[{"message":string,"context":string}]}`,
  };
  const placeholders = {Headline:"e.g. Senior Frontend Engineer at Stripe | React, TypeScript | Building products used by millions",Summary:"e.g. 5 years in frontend engineering, led teams at 2 startups, passionate about design systems...",Experience:"e.g. Built new onboarding flow. Worked on dashboard features. Helped with bug fixes...",Skills:"e.g. Frontend engineer with React, TypeScript, Node.js, 4 years experience, applying to senior roles","Connection Note":"e.g. Reaching out to a PM at Figma after seeing their talk on design systems"};

  async function optimize() {
    if (!input.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:prompts[section],messages:[{role:"user",content:`${input}${context?"\nAdditional context: "+context:""}`}]})});
      const data = await res.json();
      const text = data.content?.find(b=>b.type==="text")?.text||"{}";
      setResult(JSON.parse(text.replace(/```json|```/g,"").trim()));
    } catch { setResult({error:true}); }
    setLoading(false);
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <Card glow={C.pink}>
        <div style={{color:C.text,fontWeight:700,fontSize:16,marginBottom:4}}>LinkedIn Profile Optimizer 🔗</div>
        <div style={{color:C.muted,fontSize:13,marginBottom:20}}>Turn your LinkedIn into a recruiter magnet with AI</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:16}}>
          {sections.map(s=>(
            <button key={s.label} onClick={()=>{setSection(s.label);setResult(null);setInput("");}} style={{padding:"10px 6px",borderRadius:10,border:`1px solid ${section===s.label?C.pink+"66":C.cardBorder}`,background:section===s.label?C.pink+"18":"#0D1525",cursor:"pointer",textAlign:"center",transition:"all 0.2s"}}>
              <div style={{fontSize:16,marginBottom:4}}>{s.icon}</div>
              <div style={{color:section===s.label?C.pink:C.muted,fontSize:11,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{s.label}</div>
            </button>
          ))}
        </div>
        <div style={{color:C.muted,fontSize:13,marginBottom:12,padding:"10px 14px",background:"#0D1525",borderRadius:8,borderLeft:`3px solid ${C.pink}`}}>{descs[section]}</div>
        <div style={{marginBottom:12}}>
          <div style={{color:C.muted,fontSize:11,fontFamily:"'DM Mono',monospace",marginBottom:6,letterSpacing:1}}>YOUR {section.toUpperCase()} / CONTEXT *</div>
          <TArea value={input} onChange={e=>setInput(e.target.value)} placeholder={placeholders[section]} height={100}/>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{color:C.muted,fontSize:11,fontFamily:"'DM Mono',monospace",marginBottom:6,letterSpacing:1}}>TARGET ROLE / EXTRA CONTEXT (optional)</div>
          <Inp value={context} onChange={e=>setContext(e.target.value)} placeholder="e.g. Targeting Staff Engineer roles at FAANG companies"/>
        </div>
        <Btn onClick={optimize} disabled={loading||!input.trim()} color={`linear-gradient(135deg,${C.pink},${C.accent2})`}>{loading?"Optimizing...":"🔗 Optimize LinkedIn"}</Btn>
      </Card>

      {result&&!result.error&&(
        <div style={{display:"flex",flexDirection:"column",gap:12,animation:"fadeUp 0.5s ease"}}>
          {result.headlines&&result.headlines.map((h,i)=>(
            <Card key={i} glow={C.pink} style={{padding:"16px 20px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                <div style={{flex:1}}><div style={{color:C.text,fontSize:14,fontWeight:600,lineHeight:1.5,marginBottom:6}}>{h.text}</div><div style={{color:C.muted,fontSize:12,lineHeight:1.5}}>{h.why}</div></div>
                <CopyBtn text={h.text}/>
              </div>
            </Card>
          ))}
          {result.summary&&(
            <Card glow={C.pink}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><div style={{color:C.text,fontWeight:700,fontSize:15}}>📝 Optimized About Section</div><CopyBtn text={result.summary}/></div>
              <ResultBox>{result.summary}</ResultBox>
              {result.keywords&&<div style={{marginTop:14}}><div style={{color:C.muted,fontSize:11,fontFamily:"'DM Mono',monospace",marginBottom:8,letterSpacing:1}}>KEYWORDS TO INCLUDE</div><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{result.keywords.map((k,i)=><Badge key={i} label={k} color={C.pink}/>)}</div></div>}
            </Card>
          )}
          {result.bullets&&(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <Card glow={C.pink}>
                <div style={{color:C.text,fontWeight:700,fontSize:15,marginBottom:14}}>💼 Rewritten Bullets</div>
                {result.bullets.map((b,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:10,padding:"10px 14px",background:"#0D1525",borderRadius:8}}>
                    <div style={{color:C.text,fontSize:13,lineHeight:1.6,flex:1}}>{b}</div><CopyBtn text={b}/>
                  </div>
                ))}
              </Card>
              {result.tips&&<Card glow={C.warn}><div style={{color:C.warn,fontWeight:700,fontSize:14,marginBottom:12}}>⚡ Pro Tips</div>{result.tips.map((t,i)=><div key={i} style={{color:C.text,fontSize:13,marginBottom:8,paddingLeft:12,borderLeft:`2px solid ${C.warn}`,lineHeight:1.5}}>{t}</div>)}</Card>}
            </div>
          )}
          {result.topSkills&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <Card glow={C.pink}><div style={{color:C.text,fontWeight:700,fontSize:14,marginBottom:12}}>⚡ Must-Have Skills</div><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{result.topSkills.map((s,i)=><Badge key={i} label={s} color={C.pink}/>)}</div></Card>
              <Card glow={C.accent3}><div style={{color:C.text,fontWeight:700,fontSize:14,marginBottom:12}}>🚀 Emerging Skills</div><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{result.emergingSkills?.map((s,i)=><Badge key={i} label={s} color={C.accent3}/>)}</div>{result.tip&&<div style={{color:C.muted,fontSize:12,marginTop:10,lineHeight:1.5}}>{result.tip}</div>}</Card>
            </div>
          )}
          {result.messages&&result.messages.map((m,i)=>(
            <Card key={i} glow={C.pink} style={{padding:"16px 20px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                <div style={{flex:1}}><div style={{color:C.muted,fontSize:11,fontFamily:"'DM Mono',monospace",marginBottom:6}}>{m.context}</div><div style={{color:C.text,fontSize:13,lineHeight:1.6}}>{m.message}</div><div style={{color:C.muted,fontSize:11,marginTop:6,fontFamily:"'DM Mono',monospace"}}>{m.message?.length||0} / 300 chars</div></div>
                <CopyBtn text={m.message}/>
              </div>
            </Card>
          ))}
        </div>
      )}
      {result?.error&&<Card glow={C.danger}><div style={{color:C.danger,textAlign:"center"}}>Optimization failed. Please try again.</div></Card>}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
function addToGoogleCalendar(job) {
  const title = encodeURIComponent("Apply to: " + job.title + " at " + job.company);
  const date = job.deadline ? job.deadline.replace(/-/g,"") : new Date().toISOString().slice(0,10).replace(/-/g,"");
  const details = encodeURIComponent("Job application deadline tracked via CareerPulse");
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${date}/${date}&details=${details}`;
  window.open(url, "_blank");
}

export default function CareerPulseApp({ user, onSignOut }) {
  const [tab, setTab] = useState("Dashboard"); const [lang, setLang] = useState("en"); const [deadlineJobs, setDeadlineJobs] = useState([]);

  useEffect(()=>{ if(!user) return; const unsub=subscribeToJobs(user.uid,jobs=>setDeadlineJobs(jobs)); return ()=>unsub(); },[user]);
  const T = {en:{dash:"Dashboard",resume:"Resume AI",interview:"Interview Prep",career:"Career Path",jobs:"Job Tracker",salary:"Salary Insights",cover:"Cover Letter",linkedin:"LinkedIn",morning:"Good Morning",afternoon:"Good Afternoon",evening:"Good Evening",fire:"Your Career is on Fire",signout:"Sign Out"},es:{dash:"Inicio",resume:"CV con IA",interview:"Entrevistas",career:"Carrera",jobs:"Empleos",salary:"Salarios",cover:"Carta",linkedin:"LinkedIn",morning:"Buenos Dias",afternoon:"Buenas Tardes",evening:"Buenas Noches",fire:"Tu Carrera esta en Llamas",signout:"Cerrar Sesion"},pt:{dash:"Inicio",resume:"CV com IA",interview:"Entrevistas",career:"Carreira",jobs:"Vagas",salary:"Salarios",cover:"Carta",linkedin:"LinkedIn",morning:"Bom Dia",afternoon:"Boa Tarde",evening:"Boa Noite",fire:"Sua Carreira esta em Chamas",signout:"Sair"},fr:{dash:"Accueil",resume:"CV IA",interview:"Entretiens",career:"Carriere",jobs:"Emplois",salary:"Salaires",cover:"Lettre",linkedin:"LinkedIn",morning:"Bonjour",afternoon:"Bon Apres-midi",evening:"Bonsoir",fire:"Votre Carriere est en Feu",signout:"Deconnexion"},de:{dash:"Dashboard",resume:"Lebenslauf KI",interview:"Vorstellungen",career:"Karriere",jobs:"Stellen",salary:"Gehalter",cover:"Anschreiben",linkedin:"LinkedIn",morning:"Guten Morgen",afternoon:"Guten Tag",evening:"Guten Abend",fire:"Ihre Karriere brennt",signout:"Abmelden"}};
  const LANGS = {en:{flag:"🇺🇸",name:"EN"},es:{flag:"🇪🇸",name:"ES"},pt:{flag:"🇧🇷",name:"PT"},fr:{flag:"🇫🇷",name:"FR"},de:{flag:"🇩🇪",name:"DE"}};
  const t = T[lang]||T.en;
  const tabs = [{i:"⚡",l:t.dash,k:"Dashboard"},{i:"✦",l:t.resume,k:"Resume AI"},{i:"🎯",l:t.interview,k:"Interview Prep"},{i:"🚀",l:t.career,k:"Career Path"},{i:"📊",l:t.jobs,k:"Job Tracker"},{i:"💰",l:t.salary,k:"Salary Insights"},{i:"✉️",l:t.cover,k:"Cover Letter"},{i:"🔗",l:t.linkedin,k:"LinkedIn"},{i:"🤖",l:"Job Match",k:"Job Match"},{i:"📧",l:"Gmail Scan",k:"Gmail Scan"}];
  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#0A0E1A;}
        @keyframes bounce{0%,80%,100%{transform:translateY(0);}40%{transform:translateY(-8px);}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
      `}</style>
      <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Plus Jakarta Sans',sans-serif",backgroundImage:`radial-gradient(ellipse at 20% 50%,#0D1E3522 0%,transparent 50%),radial-gradient(ellipse at 80% 20%,#7C3AED11 0%,transparent 50%)`}}>

        {/* Header */}
        <div style={{borderBottom:`1px solid ${C.cardBorder}`,padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#0A0E1AEE",position:"sticky",top:0,zIndex:100,backdropFilter:"blur(16px)",minHeight:54,gap:12,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0,padding:"10px 0"}}>
            <div style={{width:30,height:30,borderRadius:8,background:`linear-gradient(135deg,${C.accent2},${C.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,boxShadow:`0 4px 16px ${C.accent}44`}}>⚡</div>
            <span style={{fontSize:17,fontWeight:800,color:C.text,letterSpacing:-0.5}}>Career<span style={{color:C.accent}}>Pulse</span></span>
          </div>
          <div style={{display:"flex",gap:2,flexWrap:"wrap",justifyContent:"center"}}>
            {tabs.map(t=>(<button key={t.k} onClick={()=>setTab(t.k)} style={{padding:"6px 10px",borderRadius:8,border:"none",cursor:"pointer",background:tab===t.k?`${C.accent}18`:"transparent",color:tab===t.k?C.accent:C.muted,fontSize:11,fontWeight:tab===t.k?700:500,borderBottom:tab===t.k?`2px solid ${C.accent}`:"2px solid transparent",transition:"all 0.2s",whiteSpace:"nowrap"}}><span style={{marginRight:3}}>{t.i}</span>{t.l}</button>))}




          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {user?.photoURL?<img src={user.photoURL} style={{width:30,height:30,borderRadius:"50%",objectFit:"cover"}} alt=""/>:<div style={{width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent2},${C.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff"}}>{(user?.displayName||user?.email||"?")[0].toUpperCase()}</div>}
            <select value={lang} onChange={e=>setLang(e.target.value)} style={{background:"#0D1525",border:`1px solid ${C.cardBorder}`,color:C.text,borderRadius:8,padding:"4px 8px",fontSize:11,cursor:"pointer"}}>{Object.entries(LANGS).map(([k,v])=>(<option key={k} value={k}>{v.flag} {v.name}</option>))}</select>
            <button onClick={onSignOut} style={{background:"transparent",border:`1px solid ${C.danger}44`,color:C.danger,borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:600}}>{t.signout}</button>
          </div>
        </div>
        <div style={{maxWidth:940,margin:"0 auto",padding:"28px 20px"}}>
          <div key={tab} style={{animation:"fadeUp 0.4s ease"}}>
            {tab==="Dashboard"       && <Dashboard setTab={setTab} deadlineJobs={deadlineJobs} lang={lang}/>}
            {tab==="Resume AI"       && <ResumeAI/>}
            {tab==="Interview Prep"  && <InterviewPrep/>}
            {tab==="Career Path"     && <CareerPath/>}
            {tab==="Job Tracker"     && <JobTracker user={user}/>}
            {tab==="Salary Insights" && <SalaryInsights/>}
            {tab==="Cover Letter"    && <CoverLetter user={user}/>}
            {tab==="LinkedIn"        && <LinkedIn/>}
            {tab==="Job Match"       && <JobMatch/>}
            {tab==="Gmail Scan"      && <GmailScanner user={user}/>}
          </div>
        </div>
      </div>
    </>
  );
}
