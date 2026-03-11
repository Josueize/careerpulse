import { useState, useEffect, useRef } from "react";
import { subscribeToJobs, addJob, deleteJob, updateJob, saveCoverLetter, subscribeToCoverLetters, deleteCoverLetter, saveResumeScore, subscribeToResumeScores } from "./db";

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
function Dashboard({ setTab }) {
  const stats = [{label:"Resume Score",value:87,suffix:"",color:C.accent},{label:"Applications",value:24,suffix:"",color:C.accent3},{label:"Interviews",value:6,suffix:"",color:C.accent2},{label:"Offer Rate",value:33,suffix:"%",color:C.warn}];
  const jobs = [{title:"Senior Frontend Engineer",company:"Stripe",status:"Interview",statusColor:C.accent2,date:"Mar 5"},{title:"Product Designer",company:"Linear",status:"Applied",statusColor:C.accent,date:"Mar 3"},{title:"Full Stack Dev",company:"Vercel",status:"Offer 🎉",statusColor:C.accent3,date:"Feb 28"},{title:"UI Engineer",company:"Figma",status:"Rejected",statusColor:C.danger,date:"Feb 22"}];
  const tools = [{icon:"✦",label:"Resume AI",tab:"Resume AI",color:C.accent,desc:"Analyze & score"},{icon:"🎯",label:"Interview",tab:"Interview Prep",color:C.accent2,desc:"AI mock practice"},{icon:"💰",label:"Salary",tab:"Salary Insights",color:C.accent3,desc:"Know your worth"},{icon:"✉️",label:"Cover Letter",tab:"Cover Letter",color:C.warn,desc:"AI-crafted letters"},{icon:"🔗",label:"LinkedIn",tab:"LinkedIn",color:C.pink,desc:"Optimize profile"},{icon:"🚀",label:"Career Path",tab:"Career Path",color:C.accent,desc:"Plan your future"}];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <Card glow={C.accent} style={{background:"linear-gradient(135deg,#0D1A2E,#111827)",padding:"28px 32px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
          <div>
            <div style={{color:C.muted,fontSize:13,fontFamily:"'DM Mono',monospace",letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>Good morning ✦</div>
            <div style={{color:C.text,fontSize:26,fontWeight:800,letterSpacing:-0.5}}>Your Career is on Fire 🔥</div>
            <div style={{color:C.muted,fontSize:14,marginTop:6}}>3 new job matches · 1 interview scheduled · Resume needs 2 updates</div>
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

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <Card glow={C.accent}>
          <div style={{color:C.text,fontWeight:700,fontSize:15,marginBottom:16}}>Resume Health</div>
          <div style={{display:"flex",justifyContent:"space-around"}}>
            <ScoreCircle score={87} label="Overall" color={C.accent}/>
            <ScoreCircle score={72} label="ATS" color={C.accent3}/>
            <ScoreCircle score={94} label="Impact" color={C.accent2}/>
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
  const [form, setForm] = useState({title:"",company:"",status:"Applied",salary:"",notes:""});
  const sc = {Applied:C.accent,Interview:C.accent2,Offer:C.accent3,Rejected:C.danger};

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToJobs(user.uid, setJobs);
    return unsub;
  }, [user]);

  async function handleAddJob() {
    if (!form.title||!form.company) return;
    const date = new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"});
    if (user) {
      await addJob(user.uid, {...form, date});
    } else {
      setJobs(p=>[...p,{...form,id:Date.now(),date}]);
    }
    setForm({title:"",company:"",status:"Applied",salary:"",notes:""}); setShowAdd(false);
  }

  async function handleDeleteJob(jobId) {
    if (user) {
      await deleteJob(user.uid, jobId);
    } else {
      setJobs(p=>p.filter(x=>x.id!==jobId));
    }
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {!user&&<div style={{background:C.accent+"18",border:`1px solid ${C.accent}44`,borderRadius:10,padding:"10px 16px",color:C.accent,fontSize:13,textAlign:"center"}}>⚡ Sign in to save your applications across devices</div>}
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
            {[["Job Title","title"],["Company","company"],["Salary","salary"],["Notes","notes"]].map(([ph,key])=><input key={key} placeholder={ph} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:8,padding:"8px 12px",color:C.text,fontSize:13,outline:"none"}}/>)}
            <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:8,padding:"8px 12px",color:C.text,fontSize:13,outline:"none"}}>
              {["Applied","Interview","Offer","Rejected"].map(s=><option key={s}>{s}</option>)}
            </select>
            <Btn onClick={handleAddJob} color={C.accent3} small>Save Job</Btn>
          </div>
        )}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {jobs.length===0&&<div style={{textAlign:"center",color:C.muted,padding:"30px 0",fontFamily:"'DM Mono',monospace",fontSize:13}}>No applications yet. Add your first job! 🚀</div>}
          {jobs.map(j=>(
            <div key={j.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:"#0D1525",borderRadius:10,border:`1px solid ${C.cardBorder}`,flexWrap:"wrap",gap:8}}>
              <div style={{flex:1,minWidth:150}}>
                <div style={{color:C.text,fontSize:14,fontWeight:600}}>{j.title}</div>
                <div style={{color:C.muted,fontSize:11,fontFamily:"'DM Mono',monospace",marginTop:2}}>{j.company} · {j.date}{j.salary&&` · ${j.salary}`}</div>
                {j.notes&&<div style={{color:C.muted,fontSize:11,marginTop:2,fontStyle:"italic"}}>{j.notes}</div>}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <Badge label={j.status} color={sc[j.status]}/>
                <button onClick={()=>handleDeleteJob(j.id)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16}}>×</button>
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

// ─── JOB SEARCH ──────────────────────────────────────────────────────────────
function JobSearch({ user }) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [searched, setSearched] = useState(false);
  const [saved, setSaved] = useState({});

  async function search() {
    if (!query.trim()) return;
    setLoading(true); setJobs([]); setSearched(true);
    try {
      const url = `/api/jobs?what=${encodeURIComponent(query)}${location ? "&where=" + encodeURIComponent(location) : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      setJobs(data.results || []);
    } catch { setJobs([]); }
    setLoading(false);
  }

  async function saveJob(job) {
    if (!user) { alert("Sign in to save jobs!"); return; }
    const { addJob } = await import("./db");
    await addJob(user.uid, {
      title: job.title,
      company: job.company?.display_name || "Unknown",
      status: "Applied",
      salary: job.salary_min ? `$${Math.round(job.salary_min/1000)}k - $${Math.round(job.salary_max/1000)}k` : "",
      notes: job.location?.display_name || "",
      date: new Date().toLocaleDateString("en-US", {month:"short", day:"numeric"}),
      url: job.redirect_url,
    });
    setSaved(p => ({...p, [job.id]: true}));
  }

  const categories = ["Software Engineer","Frontend Developer","Backend Developer","Product Manager","Data Scientist","UX Designer","DevOps Engineer","Full Stack Developer"];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <Card glow={C.accent2}>
        <div style={{color:C.text,fontWeight:700,fontSize:16,marginBottom:4}}>Job Search 🔍</div>
        <div style={{color:C.muted,fontSize:13,marginBottom:20}}>Search millions of real jobs and track them instantly</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div><div style={{color:C.muted,fontSize:11,fontFamily:"'DM Mono',monospace",marginBottom:6,letterSpacing:1}}>JOB TITLE / KEYWORDS *</div><Inp value={query} onChange={e=>setQuery(e.target.value)} placeholder="e.g. Frontend Engineer"/></div>
          <div><div style={{color:C.muted,fontSize:11,fontFamily:"'DM Mono',monospace",marginBottom:6,letterSpacing:1}}>LOCATION</div><Inp value={location} onChange={e=>setLocation(e.target.value)} placeholder="e.g. New York, NY"/></div>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{color:C.muted,fontSize:11,fontFamily:"'DM Mono',monospace",marginBottom:8,letterSpacing:1}}>POPULAR SEARCHES</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {categories.map(c=><button key={c} onClick={()=>setQuery(c)} style={{padding:"6px 12px",borderRadius:8,fontSize:11,fontWeight:600,fontFamily:"'DM Mono',monospace",cursor:"pointer",background:query===c?C.accent2+"22":"#0D1525",color:query===c?C.accent2:C.muted,border:`1px solid ${query===c?C.accent2+"66":C.cardBorder}`,transition:"all 0.2s"}}>{c}</button>)}
          </div>
        </div>
        <Btn onClick={search} disabled={loading||!query.trim()} color={`linear-gradient(135deg,${C.accent2},${C.accent})`}>{loading?"Searching...":"🔍 Search Jobs"}</Btn>
      </Card>

      {loading&&(
        <Card><div style={{textAlign:"center",padding:"40px 0",color:C.muted,fontFamily:"'DM Mono',monospace",fontSize:13}}>
          <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:12}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:C.accent2,animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}</div>
          Searching millions of jobs...
        </div></Card>
      )}

      {!loading&&searched&&jobs.length===0&&(
        <Card glow={C.warn}><div style={{textAlign:"center",color:C.muted,padding:"30px 0",fontFamily:"'DM Mono',monospace",fontSize:13}}>No jobs found. Try different keywords! 🔍</div></Card>
      )}

      {jobs.length>0&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{color:C.muted,fontSize:12,fontFamily:"'DM Mono',monospace",letterSpacing:1}}>{jobs.length} JOBS FOUND FOR "{query.toUpperCase()}"</div>
          {jobs.map((j,i)=>(
            <Card key={j.id||i} glow={C.accent2} style={{padding:"20px 24px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16,flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:200}}>
                  <div style={{color:C.text,fontSize:15,fontWeight:700,marginBottom:4}}>{j.title}</div>
                  <div style={{color:C.accent2,fontSize:13,fontWeight:600,marginBottom:6}}>{j.company?.display_name}</div>
                  <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:8}}>
                    {j.location?.display_name&&<span style={{color:C.muted,fontSize:12,fontFamily:"'DM Mono',monospace"}}>📍 {j.location.display_name}</span>}
                    {j.salary_min&&<span style={{color:C.accent3,fontSize:12,fontFamily:"'DM Mono',monospace",fontWeight:600}}>💰 ${Math.round(j.salary_min/1000)}k - ${Math.round(j.salary_max/1000)}k</span>}
                    {j.contract_time&&<Badge label={j.contract_time.replace("_"," ")} color={C.accent}/>}
                  </div>
                  <div style={{color:C.muted,fontSize:12,lineHeight:1.6,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{j.description?.replace(/<[^>]*>/g,"")}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8,flexShrink:0}}>
                  <a href={j.redirect_url} target="_blank" rel="noreferrer" style={{background:`linear-gradient(135deg,${C.accent2},${C.accent})`,border:"none",borderRadius:10,padding:"8px 16px",color:"#fff",cursor:"pointer",fontSize:12,fontWeight:700,textDecoration:"none",textAlign:"center"}}>Apply →</a>
                  <button onClick={()=>saveJob(j)} disabled={saved[j.id]} style={{background:saved[j.id]?C.accent3+"22":"#0D1525",border:`1px solid ${saved[j.id]?C.accent3:C.cardBorder}`,borderRadius:10,padding:"8px 16px",color:saved[j.id]?C.accent3:C.muted,cursor:saved[j.id]?"default":"pointer",fontSize:12,fontWeight:600,transition:"all 0.2s"}}>{saved[j.id]?"✓ Saved":"+ Track"}</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── RESUME BUILDER ───────────────────────────────────────────────────────────
function ResumeBuilder() {
  const empty = { name:"", email:"", phone:"", location:"", linkedin:"", summary:"",
    experience:[{id:1,title:"",company:"",start:"",end:"",current:false,bullets:""}],
    education:[{id:1,degree:"",school:"",year:"",gpa:""}],
    skills:"", projects:[{id:1,name:"",tech:"",desc:""}] };
  const [data, setData] = useState(empty);
  const [view, setView] = useState("edit"); // edit | preview
  const [enhancing, setEnhancing] = useState(null);

  function setField(path, val) {
    setData(d => {
      const clone = JSON.parse(JSON.stringify(d));
      const keys = path.split(".");
      let cur = clone;
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
      cur[keys[keys.length - 1]] = val;
      return clone;
    });
  }

  function addItem(section, template) {
    setData(d => ({ ...d, [section]: [...d[section], { ...template, id: Date.now() }] }));
  }

  function removeItem(section, id) {
    setData(d => ({ ...d, [section]: d[section].filter(x => x.id !== id) }));
  }

  async function enhanceBullets(idx) {
    const exp = data.experience[idx];
    if (!exp.bullets.trim()) return;
    setEnhancing(idx);
    try {
      const res = await fetch("/api/claude", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:600,
          system:"You are a resume expert. Rewrite job bullets using strong action verbs and quantified impact. Return ONLY the improved bullets, one per line, starting with •",
          messages:[{role:"user",content:`Role: ${exp.title} at ${exp.company}\nBullets:\n${exp.bullets}`}] })});
      const json = await res.json();
      const improved = json.content?.find(b=>b.type==="text")?.text || exp.bullets;
      const clone = JSON.parse(JSON.stringify(data));
      clone.experience[idx].bullets = improved;
      setData(clone);
    } catch(e) { console.error(e); }
    setEnhancing(null);
  }

  async function enhanceSummary() {
    if (!data.summary.trim() && !data.experience[0]?.title) return;
    setEnhancing("summary");
    try {
      const res = await fetch("/api/claude", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:400,
          system:"You are a resume expert. Write a compelling 3-sentence professional summary. Return ONLY the summary text.",
          messages:[{role:"user",content:`Name: ${data.name}\nCurrent/Last role: ${data.experience[0]?.title} at ${data.experience[0]?.company}\nCurrent summary: ${data.summary}\nSkills: ${data.skills}`}] })});
      const json = await res.json();
      const improved = json.content?.find(b=>b.type==="text")?.text || data.summary;
      setData(d => ({ ...d, summary: improved }));
    } catch(e) { console.error(e); }
    setEnhancing(null);
  }

  const Label = ({children}) => <div style={{color:C.muted,fontSize:11,fontFamily:"'DM Mono',monospace",marginBottom:5,letterSpacing:1,textTransform:"uppercase"}}>{children}</div>;
  const SectionTitle = ({children,color=C.accent}) => <div style={{color,fontWeight:700,fontSize:14,marginBottom:14,paddingBottom:8,borderBottom:`1px solid ${C.cardBorder}`,display:"flex",alignItems:"center",gap:8}}>{children}</div>;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {/* Header */}
      <Card glow={C.accent}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{color:C.text,fontWeight:700,fontSize:16,marginBottom:4}}>Resume Builder 📄</div>
            <div style={{color:C.muted,fontSize:13}}>Build a professional resume with AI-enhanced content</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setView(view==="edit"?"preview":"edit")} style={{background:view==="preview"?C.accent+"22":"#0D1525",border:`1px solid ${view==="preview"?C.accent:C.cardBorder}`,borderRadius:8,padding:"8px 16px",color:view==="preview"?C.accent:C.muted,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"'DM Mono',monospace",transition:"all 0.2s"}}>
              {view==="edit"?"👁 Preview":"✏️ Edit"}
            </button>
          </div>
        </div>
      </Card>

      {view==="edit" ? (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>

          {/* Personal Info */}
          <Card glow={C.accent}>
            <SectionTitle color={C.accent}>👤 Personal Information</SectionTitle>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[["Full Name","name"],["Email","email"],["Phone","phone"],["Location","location"],["LinkedIn URL","linkedin"]].map(([ph,key])=>(
                <div key={key} style={key==="name"?{gridColumn:"1/-1"}:{}}>
                  <Label>{ph}</Label>
                  <Inp value={data[key]} onChange={e=>setField(key,e.target.value)} placeholder={ph}/>
                </div>
              ))}
            </div>
          </Card>

          {/* Summary */}
          <Card glow={C.accent2}>
            <SectionTitle color={C.accent2}>✦ Professional Summary</SectionTitle>
            <TArea value={data.summary} onChange={e=>setField("summary",e.target.value)} placeholder="Write a compelling summary of your professional background..." height={90}/>
            <div style={{marginTop:10}}>
              <Btn onClick={enhanceSummary} disabled={enhancing==="summary"} color={`linear-gradient(135deg,${C.accent2},${C.accent})`} small>
                {enhancing==="summary"?"Enhancing...":"✦ AI Enhance Summary"}
              </Btn>
            </div>
          </Card>

          {/* Experience */}
          <Card glow={C.accent3}>
            <SectionTitle color={C.accent3}>💼 Work Experience</SectionTitle>
            {data.experience.map((exp,idx)=>(
              <div key={exp.id} style={{background:"#0D1525",borderRadius:12,padding:16,marginBottom:12,border:`1px solid ${C.cardBorder}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <span style={{color:C.accent3,fontSize:12,fontFamily:"'DM Mono',monospace",fontWeight:700}}>POSITION {idx+1}</span>
                  {data.experience.length>1&&<button onClick={()=>removeItem("experience",exp.id)} style={{background:"none",border:"none",color:C.danger,cursor:"pointer",fontSize:16}}>×</button>}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  <div><Label>Job Title</Label><Inp value={exp.title} onChange={e=>{const c=JSON.parse(JSON.stringify(data));c.experience[idx].title=e.target.value;setData(c);}} placeholder="e.g. Senior Frontend Engineer"/></div>
                  <div><Label>Company</Label><Inp value={exp.company} onChange={e=>{const c=JSON.parse(JSON.stringify(data));c.experience[idx].company=e.target.value;setData(c);}} placeholder="e.g. Google"/></div>
                  <div><Label>Start Date</Label><Inp value={exp.start} onChange={e=>{const c=JSON.parse(JSON.stringify(data));c.experience[idx].start=e.target.value;setData(c);}} placeholder="e.g. Jan 2022"/></div>
                  <div><Label>End Date</Label><Inp value={exp.end} onChange={e=>{const c=JSON.parse(JSON.stringify(data));c.experience[idx].end=e.target.value;setData(c);}} placeholder="e.g. Present"/></div>
                </div>
                <div style={{marginBottom:10}}><Label>Responsibilities & Achievements</Label><TArea value={exp.bullets} onChange={e=>{const c=JSON.parse(JSON.stringify(data));c.experience[idx].bullets=e.target.value;setData(c);}} placeholder={"• Built new onboarding flow reducing drop-off by 30%\n• Led team of 4 engineers on dashboard redesign\n• Improved API response time by 50%"} height={100}/></div>
                <Btn onClick={()=>enhanceBullets(idx)} disabled={enhancing===idx} color={`linear-gradient(135deg,${C.accent3},${C.accent})`} small>
                  {enhancing===idx?"Enhancing...":"⚡ AI Enhance Bullets"}
                </Btn>
              </div>
            ))}
            <button onClick={()=>addItem("experience",{title:"",company:"",start:"",end:"",current:false,bullets:""})} style={{background:"transparent",border:`1px dashed ${C.accent3}66`,borderRadius:8,padding:"10px 20px",color:C.accent3,cursor:"pointer",fontSize:13,fontWeight:600,width:"100%",transition:"all 0.2s"}}>+ Add Position</button>
          </Card>

          {/* Education */}
          <Card glow={C.warn}>
            <SectionTitle color={C.warn}>🎓 Education</SectionTitle>
            {data.education.map((edu,idx)=>(
              <div key={edu.id} style={{background:"#0D1525",borderRadius:12,padding:16,marginBottom:12,border:`1px solid ${C.cardBorder}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <span style={{color:C.warn,fontSize:12,fontFamily:"'DM Mono',monospace",fontWeight:700}}>DEGREE {idx+1}</span>
                  {data.education.length>1&&<button onClick={()=>removeItem("education",edu.id)} style={{background:"none",border:"none",color:C.danger,cursor:"pointer",fontSize:16}}>×</button>}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div style={{gridColumn:"1/-1"}}><Label>Degree & Major</Label><Inp value={edu.degree} onChange={e=>{const c=JSON.parse(JSON.stringify(data));c.education[idx].degree=e.target.value;setData(c);}} placeholder="e.g. B.S. Computer Science"/></div>
                  <div><Label>School</Label><Inp value={edu.school} onChange={e=>{const c=JSON.parse(JSON.stringify(data));c.education[idx].school=e.target.value;setData(c);}} placeholder="e.g. UC Berkeley"/></div>
                  <div><Label>Graduation Year</Label><Inp value={edu.year} onChange={e=>{const c=JSON.parse(JSON.stringify(data));c.education[idx].year=e.target.value;setData(c);}} placeholder="e.g. 2022"/></div>
                </div>
              </div>
            ))}
            <button onClick={()=>addItem("education",{degree:"",school:"",year:"",gpa:""})} style={{background:"transparent",border:`1px dashed ${C.warn}66`,borderRadius:8,padding:"10px 20px",color:C.warn,cursor:"pointer",fontSize:13,fontWeight:600,width:"100%",transition:"all 0.2s"}}>+ Add Education</button>
          </Card>

          {/* Skills */}
          <Card glow={C.pink}>
            <SectionTitle color={C.pink}>⚡ Skills</SectionTitle>
            <TArea value={data.skills} onChange={e=>setField("skills",e.target.value)} placeholder="e.g. React, TypeScript, Node.js, Python, AWS, Docker, PostgreSQL, GraphQL..." height={80}/>
          </Card>

          {/* Projects */}
          <Card glow={C.accent2}>
            <SectionTitle color={C.accent2}>🚀 Projects</SectionTitle>
            {data.projects.map((proj,idx)=>(
              <div key={proj.id} style={{background:"#0D1525",borderRadius:12,padding:16,marginBottom:12,border:`1px solid ${C.cardBorder}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <span style={{color:C.accent2,fontSize:12,fontFamily:"'DM Mono',monospace",fontWeight:700}}>PROJECT {idx+1}</span>
                  {data.projects.length>1&&<button onClick={()=>removeItem("projects",proj.id)} style={{background:"none",border:"none",color:C.danger,cursor:"pointer",fontSize:16}}>×</button>}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  <div><Label>Project Name</Label><Inp value={proj.name} onChange={e=>{const c=JSON.parse(JSON.stringify(data));c.projects[idx].name=e.target.value;setData(c);}} placeholder="e.g. CareerPulse"/></div>
                  <div><Label>Tech Stack</Label><Inp value={proj.tech} onChange={e=>{const c=JSON.parse(JSON.stringify(data));c.projects[idx].tech=e.target.value;setData(c);}} placeholder="e.g. React, Firebase, Claude AI"/></div>
                </div>
                <div><Label>Description</Label><TArea value={proj.desc} onChange={e=>{const c=JSON.parse(JSON.stringify(data));c.projects[idx].desc=e.target.value;setData(c);}} placeholder="What did you build and what impact did it have?" height={70}/></div>
              </div>
            ))}
            <button onClick={()=>addItem("projects",{name:"",tech:"",desc:""})} style={{background:"transparent",border:`1px dashed ${C.accent2}66`,borderRadius:8,padding:"10px 20px",color:C.accent2,cursor:"pointer",fontSize:13,fontWeight:600,width:"100%",transition:"all 0.2s"}}>+ Add Project</button>
          </Card>

          <Btn onClick={()=>setView("preview")} color={`linear-gradient(135deg,${C.accent2},${C.accent})`}>👁 Preview Resume</Btn>
        </div>
      ) : (
        /* PREVIEW */
        <Card style={{background:"#fff",color:"#111",padding:0,overflow:"hidden"}} id="resume-preview">
          <div style={{padding:"40px 48px",fontFamily:"Georgia,serif",color:"#111",lineHeight:1.5}}>
            {/* Header */}
            <div style={{borderBottom:"2px solid #111",paddingBottom:16,marginBottom:20}}>
              <div style={{fontSize:28,fontWeight:700,letterSpacing:-0.5,marginBottom:4}}>{data.name||"Your Name"}</div>
              <div style={{fontSize:13,color:"#444",display:"flex",flexWrap:"wrap",gap:16}}>
                {data.email&&<span>✉ {data.email}</span>}
                {data.phone&&<span>📞 {data.phone}</span>}
                {data.location&&<span>📍 {data.location}</span>}
                {data.linkedin&&<span>🔗 {data.linkedin}</span>}
              </div>
            </div>

            {/* Summary */}
            {data.summary&&<div style={{marginBottom:20}}>
              <div style={{fontSize:13,fontWeight:700,textTransform:"uppercase",letterSpacing:2,marginBottom:8,color:"#333"}}>Summary</div>
              <div style={{fontSize:13,lineHeight:1.7,color:"#333"}}>{data.summary}</div>
            </div>}

            {/* Experience */}
            {data.experience.some(e=>e.title)&&<div style={{marginBottom:20}}>
              <div style={{fontSize:13,fontWeight:700,textTransform:"uppercase",letterSpacing:2,marginBottom:12,color:"#333",borderBottom:"1px solid #ddd",paddingBottom:6}}>Experience</div>
              {data.experience.filter(e=>e.title).map((exp,i)=>(
                <div key={i} style={{marginBottom:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                    <div style={{fontWeight:700,fontSize:14}}>{exp.title}</div>
                    <div style={{fontSize:12,color:"#666"}}>{exp.start}{exp.end?` – ${exp.end}`:""}</div>
                  </div>
                  <div style={{fontSize:13,color:"#555",marginBottom:6,fontStyle:"italic"}}>{exp.company}</div>
                  <div style={{fontSize:13,color:"#333",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{exp.bullets}</div>
                </div>
              ))}
            </div>}

            {/* Education */}
            {data.education.some(e=>e.school)&&<div style={{marginBottom:20}}>
              <div style={{fontSize:13,fontWeight:700,textTransform:"uppercase",letterSpacing:2,marginBottom:12,color:"#333",borderBottom:"1px solid #ddd",paddingBottom:6}}>Education</div>
              {data.education.filter(e=>e.school).map((edu,i)=>(
                <div key={i} style={{marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                  <div><div style={{fontWeight:700,fontSize:14}}>{edu.degree}</div><div style={{fontSize:13,color:"#555",fontStyle:"italic"}}>{edu.school}</div></div>
                  <div style={{fontSize:12,color:"#666"}}>{edu.year}</div>
                </div>
              ))}
            </div>}

            {/* Projects */}
            {data.projects.some(p=>p.name)&&<div style={{marginBottom:20}}>
              <div style={{fontSize:13,fontWeight:700,textTransform:"uppercase",letterSpacing:2,marginBottom:12,color:"#333",borderBottom:"1px solid #ddd",paddingBottom:6}}>Projects</div>
              {data.projects.filter(p=>p.name).map((proj,i)=>(
                <div key={i} style={{marginBottom:12}}>
                  <div style={{display:"flex",gap:8,alignItems:"baseline",marginBottom:4}}>
                    <span style={{fontWeight:700,fontSize:14}}>{proj.name}</span>
                    {proj.tech&&<span style={{fontSize:12,color:"#666"}}>— {proj.tech}</span>}
                  </div>
                  <div style={{fontSize:13,color:"#333",lineHeight:1.7}}>{proj.desc}</div>
                </div>
              ))}
            </div>}

            {/* Skills */}
            {data.skills&&<div>
              <div style={{fontSize:13,fontWeight:700,textTransform:"uppercase",letterSpacing:2,marginBottom:8,color:"#333",borderBottom:"1px solid #ddd",paddingBottom:6}}>Skills</div>
              <div style={{fontSize:13,color:"#333",lineHeight:1.7}}>{data.skills}</div>
            </div>}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function CareerPulseApp({ user, onSignOut }) {
  const [tab, setTab] = useState("Dashboard");
  const tabs = [{l:"Dashboard",i:"⚡"},{l:"Resume AI",i:"✦"},{l:"Interview Prep",i:"🎯"},{l:"Career Path",i:"🚀"},{l:"Job Tracker",i:"📊"},{l:"Resume Builder",i:"📄"},{l:"Salary Insights",i:"💰"},{l:"Cover Letter",i:"✉️"},{l:"Job Search",i:"🔍"},{l:"LinkedIn",i:"🔗"}];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#0A0E1A;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:#1E2D45;border-radius:4px;}
        @keyframes pulseRing{0%{transform:scale(0.5);opacity:0.8;}100%{transform:scale(2);opacity:0;}}
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
            {tabs.map(t=>(
              <button key={t.l} onClick={()=>setTab(t.l)} style={{padding:"6px 10px",borderRadius:8,border:"none",cursor:"pointer",background:tab===t.l?`${C.accent}18`:"transparent",color:tab===t.l?C.accent:C.muted,fontSize:11,fontWeight:tab===t.l?700:500,borderBottom:tab===t.l?`2px solid ${C.accent}`:"2px solid transparent",transition:"all 0.2s",whiteSpace:"nowrap"}}>
                <span style={{marginRight:3}}>{t.i}</span>{t.l}
              </button>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>{user?(<><img src={user.photoURL} alt="" style={{width:30,height:30,borderRadius:"50%",border:`1px solid ${C.accent}44`}}/><button onClick={onSignOut} style={{background:"none",border:`1px solid ${C.cardBorder}`,borderRadius:6,padding:"4px 10px",color:C.muted,cursor:"pointer",fontSize:11,fontFamily:"'DM Mono',monospace"}}>Sign out</button></>):(<div style={{width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent2},${C.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff"}}>?</div>)}</div>
        </div>

        {/* Content */}
        <div style={{maxWidth:940,margin:"0 auto",padding:"28px 20px"}}>
          <div key={tab} style={{animation:"fadeUp 0.4s ease"}}>
            {tab==="Dashboard"       && <Dashboard setTab={setTab}/>}
            {tab==="Resume AI"       && <ResumeAI/>}
            {tab==="Interview Prep"  && <InterviewPrep/>}
            {tab==="Career Path"     && <CareerPath/>}
            {tab==="Job Tracker"     && <JobTracker user={user}/>}
            {tab==="Resume Builder"  && <ResumeBuilder/>}
            {tab==="Salary Insights" && <SalaryInsights/>}
            {tab==="Cover Letter"    && <CoverLetter/>}
            {tab==="Job Search"      && <JobSearch user={user}/>}
            {tab==="LinkedIn"        && <LinkedIn/>}
          </div>
        </div>
      </div>
    </>
  );
}
