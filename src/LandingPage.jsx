import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#0A0E1A", card: "#111827", cardBorder: "#1E2D45",
  accent: "#00D4FF", accent2: "#7C3AED", accent3: "#10B981",
  warn: "#F59E0B", pink: "#EC4899",
  text: "#E2E8F0", muted: "#64748B",
};

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function AnimSection({ children, delay = 0 }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(40px)", transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s` }}>
      {children}
    </div>
  );
}

// Floating particle background
function Particles() {
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    dur: Math.random() * 10 + 8,
    delay: Math.random() * 5,
    color: [C.accent, C.accent2, C.accent3, C.pink][Math.floor(Math.random() * 4)],
  }));
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size, borderRadius: "50%",
          background: p.color, opacity: 0.4,
          animation: `floatParticle ${p.dur}s ease-in-out ${p.delay}s infinite`,
          boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
        }} />
      ))}
    </div>
  );
}

// Grid lines background
function GridBg() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(${C.cardBorder}44 1px, transparent 1px), linear-gradient(90deg, ${C.cardBorder}44 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
        maskImage: "radial-gradient(ellipse at center, black 0%, transparent 70%)",
      }} />
    </div>
  );
}

const features = [
  { icon: "✦", title: "Resume AI", desc: "Paste your resume and get instant scores for ATS compatibility, impact and overall quality with actionable improvements.", color: C.accent, tag: "AI Powered" },
  { icon: "🎯", title: "Interview Prep", desc: "Practice with an AI mock interviewer across behavioral, technical, system design and leadership topics. Get real-time feedback.", color: C.accent2, tag: "Interactive" },
  { icon: "💰", title: "Salary Insights", desc: "Know your market value. Get real compensation data, top paying companies, and negotiation strategies for your role.", color: C.accent3, tag: "Data Driven" },
  { icon: "✉️", title: "Cover Letter", desc: "Generate tailored cover letters in seconds. Choose your tone, paste the job description, and get a standout letter.", color: C.warn, tag: "AI Generated" },
  { icon: "🔗", title: "LinkedIn Optimizer", desc: "Transform your LinkedIn headline, summary, experience bullets and skills into recruiter magnets with AI.", color: C.pink, tag: "Profile Boost" },
  { icon: "📊", title: "Job Tracker", desc: "Track every application in one place. Monitor your pipeline from applied to offer with notes and salary data.", color: C.accent, tag: "Organized" },
];

const stats = [
  { value: "8", suffix: "+", label: "AI-Powered Tools" },
  { value: "100", suffix: "%", label: "Free to Use" },
  { value: "10", suffix: "x", label: "Faster Job Search" },
  { value: "24", suffix: "/7", label: "Always Available" },
];

const steps = [
  { num: "01", title: "Analyze Your Resume", desc: "Paste your resume and get instant AI-powered scores and feedback in seconds.", color: C.accent },
  { num: "02", title: "Practice Interviews", desc: "Run mock interviews with our AI across any topic and get personalized feedback.", color: C.accent2 },
  { num: "03", title: "Track & Apply", desc: "Manage all your applications, generate cover letters and optimize your LinkedIn.", color: C.accent3 },
  { num: "04", title: "Land Your Dream Job", desc: "Walk into every interview prepared, every application polished, every offer negotiated.", color: C.pink },
];

export default function LandingPage({ onEnter }) {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; overflow-x: hidden; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #1E2D45; border-radius: 4px; }
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.4; }
          33% { transform: translateY(-30px) translateX(15px); opacity: 0.8; }
          66% { transform: translateY(15px) translateX(-10px); opacity: 0.3; }
        }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 20px ${C.accent}44; } 50% { box-shadow: 0 0 60px ${C.accent}88, 0 0 100px ${C.accent}44; } }
        @keyframes rotateSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes scanline { 0% { top: -10%; } 100% { top: 110%; } }
        .cta-btn:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 8px 40px ${C.accent}66 !important; }
        .feature-card:hover { transform: translateY(-6px); border-color: var(--card-color) !important; background: var(--card-bg) !important; }
        .nav-link:hover { color: ${C.accent} !important; }
      `}</style>

      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.text }}>

        {/* NAV */}
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          padding: "0 40px", height: 64,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: scrollY > 50 ? "#0A0E1AEE" : "transparent",
          backdropFilter: scrollY > 50 ? "blur(20px)" : "none",
          borderBottom: scrollY > 50 ? `1px solid ${C.cardBorder}` : "none",
          transition: "all 0.3s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg,${C.accent2},${C.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: `0 4px 16px ${C.accent}44` }}>⚡</div>
            <span style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Syne', sans-serif", letterSpacing: -0.5 }}>Career<span style={{ color: C.accent }}>Pulse</span></span>
          </div>
          <div style={{ display: "flex", gap: 32 }}>
            {["Features", "How It Works", "Stats"].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(" ", "-")}`} className="nav-link" style={{ color: C.muted, fontSize: 14, fontWeight: 500, textDecoration: "none", transition: "color 0.2s" }}>{l}</a>
            ))}
          </div>
          <button onClick={onEnter} className="cta-btn" style={{
            background: `linear-gradient(135deg,${C.accent2},${C.accent})`,
            border: "none", borderRadius: 10, padding: "9px 20px",
            color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700,
            transition: "all 0.2s", boxShadow: `0 4px 20px ${C.accent}44`,
          }}>Launch App →</button>
        </nav>

        {/* HERO */}
        <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", paddingTop: 64 }}>
          <GridBg />
          <Particles />

          {/* Glow orbs */}
          <div style={{ position: "absolute", top: "20%", left: "10%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${C.accent2}22 0%, transparent 70%)`, filter: "blur(40px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "20%", right: "10%", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${C.accent}22 0%, transparent 70%)`, filter: "blur(40px)", pointerEvents: "none" }} />

          <div style={{ position: "relative", textAlign: "center", maxWidth: 800, padding: "0 24px", animation: "fadeUp 0.8s ease" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `${C.accent}18`, border: `1px solid ${C.accent}44`, borderRadius: 100, padding: "6px 16px", marginBottom: 28 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent3, animation: "pulseGlow 2s infinite" }} />
              <span style={{ color: C.accent, fontSize: 12, fontWeight: 600, fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>AI-POWERED CAREER ASSISTANT</span>
            </div>

            <h1 style={{
              fontSize: "clamp(42px, 7vw, 80px)", fontWeight: 800,
              fontFamily: "'Syne', sans-serif", letterSpacing: -2, lineHeight: 1.05,
              marginBottom: 24,
              background: `linear-gradient(135deg, ${C.text} 0%, ${C.text} 40%, ${C.accent} 70%, ${C.accent2} 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Land Your Dream<br />Job Faster
            </h1>

            <p style={{ color: C.muted, fontSize: 18, lineHeight: 1.7, marginBottom: 40, maxWidth: 560, margin: "0 auto 40px" }}>
              CareerPulse is your AI-powered career co-pilot. Resume analysis, mock interviews, salary insights, cover letters and LinkedIn optimization — all in one place.
            </p>

            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={onEnter} className="cta-btn" style={{
                background: `linear-gradient(135deg,${C.accent2},${C.accent})`,
                border: "none", borderRadius: 12, padding: "14px 32px",
                color: "#fff", cursor: "pointer", fontSize: 15, fontWeight: 700,
                transition: "all 0.2s", boxShadow: `0 4px 30px ${C.accent}55`,
                display: "flex", alignItems: "center", gap: 8,
              }}>⚡ Launch CareerPulse <span style={{ fontSize: 18 }}>→</span></button>
              <a href="#features" style={{
                background: "transparent", border: `1px solid ${C.cardBorder}`,
                borderRadius: 12, padding: "14px 32px", color: C.muted,
                cursor: "pointer", fontSize: 15, fontWeight: 600,
                transition: "all 0.2s", textDecoration: "none",
                display: "flex", alignItems: "center", gap: 8,
              }}>See Features ↓</a>
            </div>

            {/* Hero preview mockup */}
            <div style={{ marginTop: 60, position: "relative" }}>
              <div style={{
                background: C.card, border: `1px solid ${C.cardBorder}`,
                borderRadius: 20, padding: "20px 24px",
                boxShadow: `0 40px 80px #00000088, 0 0 60px ${C.accent}22`,
                animation: "pulseGlow 4s ease-in-out infinite",
              }}>
                {/* Fake browser bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${C.cardBorder}` }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["#EF4444","#F59E0B","#10B981"].map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.7 }} />)}
                  </div>
                  <div style={{ flex: 1, background: "#0D1525", borderRadius: 6, padding: "5px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: C.accent3, fontSize: 10, fontFamily: "'DM Mono', monospace" }}>🔒</span>
                    <span style={{ color: C.muted, fontSize: 11, fontFamily: "'DM Mono', monospace" }}>careerpulse-rose.vercel.app</span>
                  </div>
                </div>
                {/* Fake tabs */}
                <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
                  {["⚡ Dashboard","✦ Resume AI","🎯 Interview","💰 Salary","✉️ Cover Letter","🔗 LinkedIn"].map((t,i) => (
                    <div key={i} style={{ padding: "5px 10px", borderRadius: 6, background: i===0?`${C.accent}18`:"transparent", color: i===0?C.accent:C.muted, fontSize: 11, fontWeight: i===0?700:400, borderBottom: i===0?`2px solid ${C.accent}`:"2px solid transparent" }}>{t}</div>
                  ))}
                </div>
                {/* Fake stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                  {[{l:"Resume Score",v:"87",c:C.accent},{l:"Applications",v:"24",c:C.accent3},{l:"Interviews",v:"6",c:C.accent2},{l:"Offer Rate",v:"33%",c:C.warn}].map((s,i)=>(
                    <div key={i} style={{ background: "#0D1525", borderRadius: 10, padding: "12px 10px", textAlign: "center", border: `1px solid ${s.c}33` }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: s.c, fontFamily: "'DM Mono', monospace" }}>{s.v}</div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 2, fontFamily: "'DM Mono', monospace", letterSpacing: 0.5 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Scanline effect */}
              <div style={{ position: "absolute", inset: 0, borderRadius: 20, overflow: "hidden", pointerEvents: "none" }}>
                <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${C.accent}44, transparent)`, animation: "scanline 4s linear infinite" }} />
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section id="stats" style={{ padding: "80px 40px", borderTop: `1px solid ${C.cardBorder}` }}>
          <AnimSection>
            <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 2 }}>
              {stats.map((s, i) => (
                <div key={i} style={{ textAlign: "center", padding: "32px 20px", borderRight: i < stats.length - 1 ? `1px solid ${C.cardBorder}` : "none" }}>
                  <div style={{ fontSize: 48, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: C.accent, lineHeight: 1 }}>{s.value}<span style={{ color: C.accent2 }}>{s.suffix}</span></div>
                  <div style={{ color: C.muted, fontSize: 13, marginTop: 8, fontFamily: "'DM Mono', monospace", letterSpacing: 1, textTransform: "uppercase" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </AnimSection>
        </section>

        {/* FEATURES */}
        <section id="features" style={{ padding: "100px 40px" }}>
          <AnimSection>
            <div style={{ textAlign: "center", marginBottom: 60 }}>
              <div style={{ color: C.accent, fontSize: 12, fontFamily: "'DM Mono', monospace", letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>Everything You Need</div>
              <h2 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, fontFamily: "'Syne', sans-serif", letterSpacing: -1.5, marginBottom: 16 }}>8 Tools. One Platform.</h2>
              <p style={{ color: C.muted, fontSize: 16, maxWidth: 480, margin: "0 auto" }}>Everything you need to go from job seeker to hired — powered by Claude AI.</p>
            </div>
          </AnimSection>

          <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {features.map((f, i) => (
              <AnimSection key={i} delay={i * 0.1}>
                <div className="feature-card" style={{
                  background: C.card, border: `1px solid ${C.cardBorder}`,
                  borderRadius: 16, padding: "28px 24px", cursor: "default",
                  transition: "all 0.3s ease",
                  "--card-color": f.color + "88",
                  "--card-bg": f.color + "0A",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: f.color + "22", border: `1px solid ${f.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{f.icon}</div>
                    <span style={{ background: f.color + "22", color: f.color, border: `1px solid ${f.color}44`, borderRadius: 6, padding: "3px 10px", fontSize: 10, fontFamily: "'DM Mono', monospace", letterSpacing: 0.5, fontWeight: 600 }}>{f.tag}</span>
                  </div>
                  <div style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 10, fontFamily: "'Syne', sans-serif" }}>{f.title}</div>
                  <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{f.desc}</div>
                </div>
              </AnimSection>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" style={{ padding: "100px 40px", background: "#0D1120" }}>
          <AnimSection>
            <div style={{ textAlign: "center", marginBottom: 60 }}>
              <div style={{ color: C.accent2, fontSize: 12, fontFamily: "'DM Mono', monospace", letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>Simple Process</div>
              <h2 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, fontFamily: "'Syne', sans-serif", letterSpacing: -1.5 }}>How It Works</h2>
            </div>
          </AnimSection>

          <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
            {steps.map((s, i) => (
              <AnimSection key={i} delay={i * 0.15}>
                <div style={{ position: "relative", padding: "32px 24px", background: C.card, borderRadius: 16, border: `1px solid ${C.cardBorder}` }}>
                  {i < steps.length - 1 && (
                    <div style={{ position: "absolute", top: "50%", right: -12, transform: "translateY(-50%)", color: C.muted, fontSize: 20, zIndex: 1 }}>→</div>
                  )}
                  <div style={{ fontSize: 36, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: s.color, opacity: 0.3, marginBottom: 12, lineHeight: 1 }}>{s.num}</div>
                  <div style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 10, fontFamily: "'Syne', sans-serif" }}>{s.title}</div>
                  <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{s.desc}</div>
                  <div style={{ marginTop: 16, height: 3, borderRadius: 2, background: `linear-gradient(90deg, ${s.color}, ${s.color}44)` }} />
                </div>
              </AnimSection>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: "120px 40px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${C.accent2}18 0%, transparent 70%)`, pointerEvents: "none" }} />
          <AnimSection>
            <div style={{ textAlign: "center", position: "relative", maxWidth: 600, margin: "0 auto" }}>
              <h2 style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 800, fontFamily: "'Syne', sans-serif", letterSpacing: -1.5, marginBottom: 20, lineHeight: 1.1 }}>
                Ready to Supercharge<br />Your Career? <span style={{ color: C.accent }}>⚡</span>
              </h2>
              <p style={{ color: C.muted, fontSize: 16, lineHeight: 1.7, marginBottom: 40 }}>
                Join thousands of job seekers using CareerPulse to land their dream jobs faster with AI.
              </p>
              <button onClick={onEnter} className="cta-btn" style={{
                background: `linear-gradient(135deg,${C.accent2},${C.accent})`,
                border: "none", borderRadius: 14, padding: "16px 40px",
                color: "#fff", cursor: "pointer", fontSize: 16, fontWeight: 700,
                transition: "all 0.2s", boxShadow: `0 4px 40px ${C.accent}55`,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>⚡ Launch CareerPulse — It's Free</button>
              <div style={{ marginTop: 20, color: C.muted, fontSize: 12, fontFamily: "'DM Mono', monospace" }}>No signup required · Powered by Claude AI</div>
            </div>
          </AnimSection>
        </section>

        {/* FOOTER */}
        <footer style={{ padding: "32px 40px", borderTop: `1px solid ${C.cardBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: `linear-gradient(135deg,${C.accent2},${C.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>⚡</div>
            <span style={{ fontSize: 15, fontWeight: 800, fontFamily: "'Syne', sans-serif" }}>Career<span style={{ color: C.accent }}>Pulse</span></span>
          </div>
          <div style={{ color: C.muted, fontSize: 12, fontFamily: "'DM Mono', monospace" }}>Built with React + Claude AI · {new Date().getFullYear()}</div>
          <a href="https://github.com/Josueize/careerpulse" target="_blank" rel="noreferrer" style={{ color: C.muted, fontSize: 12, fontFamily: "'DM Mono', monospace", textDecoration: "none" }}>GitHub →</a>
        </footer>
      </div>
    </>
  );
}
