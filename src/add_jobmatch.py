import sys

src = open(sys.argv[1], encoding='utf-8').read()

old = '''// ─── INTERVIEW PREP ───────────────────────────────────────────────────────────'''

new_jobmatch = '''// ─── JOB MATCH ────────────────────────────────────────────────────────────────
function JobMatch() {
  const [resume, setResume] = React.useState("");
  const [jobDesc, setJobDesc] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);

  async function analyze() {
    if (!resume.trim() || !jobDesc.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:`You are an expert ATS and job matching system. Return ONLY valid JSON: {"matchScore":number,"skillsMatch":[string],"skillsMissing":[string],"recommendation":string,"verdict":string}`,messages:[{role:"user",content:"Resume:\\n"+resume+"\\n\\nJob Description:\\n"+jobDesc}]})});
      const data = await res.json();
      const text = data.content?.find(b=>b.type==="text")?.text||"{}";
      setResult(JSON.parse(text.replace(/```json|```/g,"").trim()));
    } catch { setResult({error:true}); }
    setLoading(false);
  }

  const score = result?.matchScore||0;
  const color = score>=80?C.accent3:score>=60?C.warn:C.danger;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <Card glow={C.accent2}>
        <div style={{color:C.text,fontWeight:700,fontSize:16,marginBottom:4}}>🤖 AI Job Match Score</div>
        <div style={{color:C.muted,fontSize:13,marginBottom:16}}>Paste your resume and a job description to get your match %</div>
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
            <div style={{marginTop:12,height:8,background:"#0D1525",borderRadius:8}}>
              <div style={{height:"100%",width:score+"%",background:color,borderRadius:8,transition:"width 1s"}}/>
            </div>
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

// ─── INTERVIEW PREP ───────────────────────────────────────────────────────────'''

src = src.replace(old, new_jobmatch)

# Add JobMatch tab to navigation
src = src.replace(
    '{i:"🔗",l:t.linkedin,k:"LinkedIn"}];',
    '{i:"🔗",l:t.linkedin,k:"LinkedIn"},{i:"🤖",l:"Job Match",k:"Job Match"}];'
)

# Add JobMatch to tab rendering
src = src.replace(
    '{tab==="LinkedIn"        && <LinkedIn/>}',
    '{tab==="LinkedIn"        && <LinkedIn/>}\n            {tab==="Job Match"       && <JobMatch/>}'
)

open(sys.argv[1], 'w', encoding='utf-8').write(src)
print("Done! Lines:", src.count('\n'))
