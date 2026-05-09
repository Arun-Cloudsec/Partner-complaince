import { useState } from "react";
import PartnerApp from "./PartnerApp.jsx";
import CustomerApp from "./CustomerApp.jsx";

export default function App() {
  const [agent, setAgent] = useState(null);

  if (agent === "partner") return <PartnerApp onBack={() => setAgent(null)} />;
  if (agent === "customer") return <CustomerApp onBack={() => setAgent(null)} />;

  return (
    <div style={{ background: "#F7F3EA", minHeight: "100vh", fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "80px 32px" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 48 }}>
          <div style={{ width: 44, height: 44, background: "#14120F", display: "flex", alignItems: "center", justifyContent: "center", color: "#F7F3EA", fontSize: 20 }}>⊹</div>
          <div>
            <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 24, color: "#14120F", fontWeight: 500 }}>Compliance Intelligence</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#8A8175", textTransform: "uppercase", letterSpacing: "0.2em", marginTop: 2 }}>AI-Powered Compliance Agents</div>
          </div>
        </div>

        <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 56, color: "#14120F", fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.02em", marginBottom: 16 }}>
          Which compliance<br/><span style={{ fontStyle: "italic", fontWeight: 300 }}>workflow</span> today?
        </h1>
        <p style={{ fontSize: 17, color: "#5A544A", maxWidth: 540, lineHeight: 1.7, marginBottom: 48 }}>
          Two agents, one platform. Choose the workflow that matches what landed in your inbox.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Partner Agent Card */}
          <button onClick={() => setAgent("partner")} style={{ background: "#FDFBF5", border: "1px solid #E3DCC9", padding: 0, cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#14120F"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#E3DCC9"; e.currentTarget.style.transform = "translateY(0)"; }}>
            <div style={{ background: "#14120F", padding: "24px 28px", color: "#F7F3EA" }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.25em", opacity: 0.5, marginBottom: 8 }}>Agent 01</div>
              <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 26, fontWeight: 400 }}>Vanguard</div>
              <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>Partner Compliance Review</div>
            </div>
            <div style={{ padding: "24px 28px" }}>
              <div style={{ fontSize: 14, color: "#14120F", lineHeight: 1.7, marginBottom: 16 }}>
                A partner sent back their questionnaire responses. Upload it and AI reviews every answer — flags vague claims, catches items they marked Non-Compliant that could actually be met, and rewrites responses.
              </div>
              <div style={{ fontSize: 12, color: "#5A544A", lineHeight: 1.6, padding: "12px 0", borderTop: "1px solid #EFE8D6" }}>
                <strong style={{ color: "#14120F" }}>You have:</strong> A filled questionnaire from a partner<br/>
                <strong style={{ color: "#14120F" }}>You get:</strong> Reviewed & improved responses + verdict
              </div>
              <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: "#14120F" }}>Launch Vanguard →</div>
            </div>
          </button>

          {/* Customer Agent Card */}
          <button onClick={() => setAgent("customer")} style={{ background: "#FDFBF5", border: "1px solid #E3DCC9", padding: 0, cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#1B3B5F"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#E3DCC9"; e.currentTarget.style.transform = "translateY(0)"; }}>
            <div style={{ background: "#1B3B5F", padding: "24px 28px", color: "#F7F3EA" }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.25em", opacity: 0.5, marginBottom: 8 }}>Agent 02</div>
              <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 26, fontWeight: 400 }}>Sentinel</div>
              <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>Customer Compliance Response</div>
            </div>
            <div style={{ padding: "24px 28px" }}>
              <div style={{ fontSize: 14, color: "#14120F", lineHeight: 1.7, marginBottom: 16 }}>
                A customer sent you a blank compliance questionnaire to fill. Upload it with your control documents and AI drafts every response — citing your actual controls and flagging gaps.
              </div>
              <div style={{ fontSize: 12, color: "#5A544A", lineHeight: 1.6, padding: "12px 0", borderTop: "1px solid #EFE8D6" }}>
                <strong style={{ color: "#14120F" }}>You have:</strong> A blank questionnaire from a customer<br/>
                <strong style={{ color: "#14120F" }}>You get:</strong> Drafted responses ready for review & submission
              </div>
              <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: "#1B3B5F" }}>Launch Sentinel →</div>
            </div>
          </button>
        </div>

        <div style={{ marginTop: 48, paddingTop: 20, borderTop: "1px solid #E3DCC9", display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: "#8A8175" }}>
          <span>Compliance Intelligence · {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
          <span>Powered by Claude</span>
        </div>
      </div>
    </div>
  );
}
