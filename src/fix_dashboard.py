import sys

src = open(sys.argv[1], encoding='utf-8').read()
lines = src.split('\n')

dash_start = next(i for i,l in enumerate(lines) if '\u2500\u2500 DASHBOARD' in l)
resume_start = next(i for i,l in enumerate(lines) if '\u2500\u2500 RESUME AI' in l)

dm = "'DM Mono',monospace"

new_dashboard = [
"// \u2500\u2500\u2500 DASHBOARD \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500",
"function Dashboard({ setTab, deadlineJobs=[] }) {",
"  const jobs = deadlineJobs; const total = jobs.length;",
"  const applied = jobs.filter(j=>j.status===\"Applied\").length;",
"  const interviews = jobs.filter(j=>j.status===\"Interview\").length;",
"  const offers = jobs.filter(j=>j.status===\"Offer\").length;",
"  const rejected = jobs.filter(j=>j.status===\"Rejected\").length;",
"  const offerRate = total>0?Math.round((offers/total)*100):0;",
"  const interviewRate = total>0?Math.round(((interviews+offers)/total)*100):0;",
'  const stats = [{label:"Applications",value:total,suffix:"",color:C.accent},{label:"Interviews",value:interviews,suffix:"",color:C.accent2},{label:"Offers",value:offers,suffix:"",color:C.accent3},{label:"Offer Rate",value:offerRate,suffix:"%",color:C.warn}];',
"  const sc = {Applied:C.accent,Interview:C.accent2,Offer:C.accent3,Rejected:C.danger};",
'  const tools = [{icon:"\u2726",label:"Resume AI",tab:"Resume AI",color:C.accent,desc:"Analyze & score"},{icon:"\U0001f3af",label:"Interview",tab:"Interview Prep",color:C.accent2,desc:"AI mock practice"},{icon:"\U0001f4b0",label:"Salary",tab:"Salary Insights",color:C.accent3,desc:"Know your worth"},{icon:"\u2709\ufe0f",label:"Cover Letter",tab:"Cover Letter",color:C.warn,desc:"AI-crafted letters"},{icon:"\U0001f517",label:"LinkedIn",tab:"LinkedIn",color:C.pink,desc:"Optimize profile"},{icon:"\U0001f680",label:"Career Path",tab:"Career Path",color:C.accent,desc:"Plan your future"}];',
"  return (",
'    <div style={{display:"flex",flexDirection:"column",gap:24}}>',
'      <Card glow={C.accent} style={{background:"linear-gradient(135deg,#0D1A2E,#111827)",padding:"28px 32px"}}>',
'        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>',
"          <div>",
"            <div style={{color:C.muted,fontSize:13,fontFamily:\"'DM Mono',monospace\",letterSpacing:2,textTransform:\"uppercase\",marginBottom:6}}>Good morning \u2726</div>",
'            <div style={{color:C.text,fontSize:26,fontWeight:800,letterSpacing:-0.5}}>Your Career is on Fire \U0001f525</div>',
"            <div style={{color:C.muted,fontSize:14,marginTop:6}}>{total} applications \u00b7 {interviews} interviews \u00b7 {offers} offers</div>",
"          </div>",
"          <PulseRing color={C.accent} size={64}/>",
"        </div>",
"      </Card>",
'      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:14}}>',
"        {stats.map((s,i)=>(",
'          <Card key={i} glow={s.color} style={{textAlign:"center",padding:"18px 12px"}}>',
"            <div style={{fontSize:30,fontWeight:800,color:s.color,fontFamily:\"'DM Mono',monospace\"}}><AnimatedNumber value={s.value} suffix={s.suffix}/></div>",
"            <div style={{color:C.muted,fontSize:11,marginTop:4,fontFamily:\"'DM Mono',monospace\",letterSpacing:1,textTransform:\"uppercase\"}}>{s.label}</div>",
"          </Card>",
"        ))}",
"      </div>",
"      <div>",
"        <div style={{color:C.muted,fontSize:11,fontFamily:\"'DM Mono',monospace\",letterSpacing:2,textTransform:\"uppercase\",marginBottom:12}}>Quick Tools</div>",
'        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12}}>',
"          {tools.map((t,i)=>(",
'            <button key={i} onClick={()=>setTab(t.tab)} style={{background:C.card,border:`1px solid ${t.color}33`,borderRadius:12,padding:"16px 10px",cursor:"pointer",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:6}} onMouseEnter={e=>{e.currentTarget.style.borderColor=t.color+"88";e.currentTarget.style.background=t.color+"11";}} onMouseLeave={e=>{e.currentTarget.style.borderColor=t.color+"33";e.currentTarget.style.background=C.card;}}><div style={{fontSize:22}}>{t.icon}</div><div style={{color:C.text,fontSize:12,fontWeight:700}}>{t.label}</div><div style={{color:C.muted,fontSize:11}}>{t.desc}</div></button>',
"          ))}",
"        </div>",
"      </div>",
'      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>',
"        <Card glow={C.accent}>",
'          <div style={{color:C.text,fontWeight:700,fontSize:15,marginBottom:16}}>\U0001f4ca Pipeline</div>',
'          {total===0?<div style={{color:C.muted,fontSize:12,textAlign:"center",padding:"20px 0"}}>Add jobs to see pipeline!</div>:<div style={{display:"flex",flexDirection:"column",gap:10}}>{[{label:"Applied",val:applied,color:C.accent},{label:"Interview",val:interviews,color:C.accent2},{label:"Offer",val:offers,color:C.accent3},{label:"Rejected",val:rejected,color:C.danger}].map((s,i)=>(<div key={i}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{color:C.muted,fontSize:12}}>{s.label}</span><span style={{color:s.color,fontSize:12,fontWeight:700}}>{s.val}</span></div><div style={{height:8,background:"#0D1525",borderRadius:8}}><div style={{height:"100%",width:`${total>0?(s.val/total)*100:0}%`,background:s.color,borderRadius:8}}/></div></div>))}<div style={{marginTop:8,padding:"8px 12px",background:"#0D1525",borderRadius:8,display:"flex",justifyContent:"space-between"}}><span style={{color:C.muted,fontSize:12}}>Interview Rate</span><span style={{color:C.accent2,fontSize:12,fontWeight:700}}>{interviewRate}%</span></div></div>}',
"        </Card>",
"        <Card>",
'          <div style={{color:C.text,fontWeight:700,fontSize:15,marginBottom:14}}>\U0001f550 Recent Applications</div>',
'          <div style={{display:"flex",flexDirection:"column",gap:11}}>',
'            {jobs.length===0?<div style={{color:C.muted,fontSize:12,textAlign:"center",padding:"10px 0"}}>No applications yet \U0001f680</div>:[...jobs].reverse().slice(0,5).map((j,i)=>(<div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><div><div style={{color:C.text,fontSize:13,fontWeight:600}}>{j.title}</div><div style={{color:C.muted,fontSize:11}}>{j.company} \u00b7 {j.date}</div></div><Badge label={j.status} color={sc[j.status]||C.muted}/></div>))}',
"          </div>",
"        </Card>",
"      </div>",
"    </div>",
"  );",
"}",
"",
]

new_lines = lines[:dash_start] + new_dashboard + lines[resume_start:]
open(sys.argv[1], 'w', encoding='utf-8').write('\n'.join(new_lines))
print(f"Done! Total lines: {len(new_lines)}")
