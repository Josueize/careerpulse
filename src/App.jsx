import { useState } from "react";
import LandingPage from "./LandingPage";
import CareerPulseApp from "./CareerPulseApp";

export default function App() {
  const [entered, setEntered] = useState(false);
  return entered
    ? <CareerPulseApp />
    : <LandingPage onEnter={() => setEntered(true)} />;
}
