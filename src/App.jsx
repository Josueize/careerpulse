import { useState, useEffect } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import LandingPage from "./LandingPage";
import CareerPulseApp from "./CareerPulseApp";

const C = {
  bg: "#0A0E1A", card: "#111827", cardBorder: "#1E2D45",
  accent: "#00D4FF", accent2: "#7C3AED", accent3: "#10B981",
  text: "#E2E8F0", muted: "#64748B",
};

function AuthScreen({ onSkip }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function signInWithGoogle() {
    setLoading(true); setError("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      setError("Sign in failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseRing { 0% { transform: scale(0.8); opacity: 0.8; } 100% { transform: scale(2); opacity: 0; } }
      `}</style>
      <div style={{
        minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center",
        justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif",
        backgroundImage: `radial-gradient(ellipse at 30% 40%, #7C3AED18 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, #00D4FF11 0%, transparent 60%)`,
      }}>
        <div style={{ width: "100%", maxWidth: 420, padding: "0 24px", animation: "fadeUp 0.6s ease" }}>

          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ position: "absolute", width: 60, height: 60, borderRadius: "50%", border: `2px solid ${C.accent}`, animation: `pulseRing 2s ease-out ${i * 0.6}s infinite`, opacity: 0 }} />
              ))}
              <div style={{ width: 60, height: 60, borderRadius: 16, background: `linear-gradient(135deg,${C.accent2},${C.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, boxShadow: `0 8px 32px ${C.accent}44`, position: "relative" }}>⚡</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: C.text, letterSpacing: -0.5 }}>
              Career<span style={{ color: C.accent }}>Pulse</span>
            </div>
            <div style={{ color: C.muted, fontSize: 14, marginTop: 8 }}>Your AI-powered career assistant</div>
          </div>

          {/* Card */}
          <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 20, padding: "36px 32px", boxShadow: `0 20px 60px #00000066, 0 0 40px ${C.accent2}18` }}>
            <div style={{ color: C.text, fontSize: 20, fontWeight: 800, fontFamily: "'Syne', sans-serif", marginBottom: 6, textAlign: "center" }}>Welcome Back</div>
            <div style={{ color: C.muted, fontSize: 13, marginBottom: 28, textAlign: "center", lineHeight: 1.6 }}>Sign in to save your progress, track applications and access all AI tools</div>

            {/* Google Sign In Button */}
            <button onClick={signInWithGoogle} disabled={loading} style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
              background: "#fff", border: "none", borderRadius: 12, padding: "14px 20px",
              cursor: loading ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 700,
              color: "#1a1a2e", transition: "all 0.2s", opacity: loading ? 0.7 : 1,
              boxShadow: "0 4px 20px #00000033", marginBottom: 16,
            }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              {loading ? "Signing in..." : "Continue with Google"}
            </button>

            {error && <div style={{ color: "#EF4444", fontSize: 12, textAlign: "center", marginBottom: 16, padding: "8px 12px", background: "#EF444422", borderRadius: 8 }}>{error}</div>}

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: C.cardBorder }} />
              <span style={{ color: C.muted, fontSize: 12, fontFamily: "'DM Mono', monospace" }}>or</span>
              <div style={{ flex: 1, height: 1, background: C.cardBorder }} />
            </div>

            <button onClick={onSkip} style={{
              width: "100%", background: "transparent", border: `1px solid ${C.cardBorder}`,
              borderRadius: 12, padding: "12px 20px", color: C.muted,
              cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.color = C.muted; }}
            >
              Continue without signing in →
            </button>

            <div style={{ marginTop: 20, color: C.muted, fontSize: 11, textAlign: "center", fontFamily: "'DM Mono', monospace", lineHeight: 1.6 }}>
              By signing in you agree to our terms.<br />Your data is never sold or shared.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [entered, setEntered] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecked(true);
      if (u) { setEntered(true); setShowAuth(false); }
    });
    return unsub;
  }, []);

  async function handleSignOut() {
    await signOut(auth);
    setUser(null);
    setEntered(false);
    setShowAuth(false);
  }

  if (!authChecked) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: C.accent, fontSize: 32 }}>⚡</div>
    </div>
  );

  if (!entered && !showAuth) return <LandingPage onEnter={() => setShowAuth(true)} />;
  if (showAuth && !user) return <AuthScreen onSkip={() => { setShowAuth(false); setEntered(true); }} />;

  return <CareerPulseApp user={user} onSignOut={handleSignOut} />;
}
