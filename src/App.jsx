import { useState, useEffect } from "react";
import LandingPage from "./LandingPage";
import CareerPulseApp from "./CareerPulseApp";
import { auth, googleProvider } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

export default function App() {
  const [user, setUser] = useState(null);
  const [entered, setEntered] = useState(false);
  const [loading, setLoading] = useState(true);

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
  }

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
