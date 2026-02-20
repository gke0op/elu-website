import { useState, useEffect, Component } from "react";
import PECEngine from "./PECEngine";
import "./App.css";

// ═══════════════════════════════════════════════════════════════
// ELU PEC ENGINE v2.0 — App Shell with Onboarding
// Homepage → API Key Setup OR Manual Tutorial → Engine
// ═══════════════════════════════════════════════════════════════

const GEMINI_CONFIG = {
  id: "gemini",
  name: "Gemini 2.0 Flash",
  icon: "✨",
  keyLabel: "Google API Key",
  lsKey: "elu_gemini_api_key",
  studioUrl: "https://aistudio.google.com/apikey",
  studioLabel: "Google AI Studio",
  placeholder: "AIzaSy... (paste your Google key)",
  testEndpoint: (key) => `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
  testBody: JSON.stringify({ contents: [{ parts: [{ text: "Reply with only: OK" }] }] }),
  testHeaders: { "Content-Type": "application/json" },
};

const LS_ONBOARDED = "elu_onboarded";

function getStoredKey() {
  return localStorage.getItem(GEMINI_CONFIG.lsKey) || "";
}

function hasKey() {
  return !!localStorage.getItem(GEMINI_CONFIG.lsKey);
}

// ── Error Boundary ──────────────────────────────────────────

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("[ELU] Crash caught:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="elu-error-boundary">
          <div style={{ fontSize: 64, marginBottom: 16 }}>🛡️</div>
          <h2>PEC Engine Encountered an Error</h2>
          <p>Something went wrong. Your data is safe in localStorage. Try reloading.</p>
          <p style={{ fontSize: 10, color: "#ef444488" }}>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>↻ RELOAD ENGINE</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Homepage ──────────────────────────────────────────────────

function Homepage({ onChooseAI, onChooseManual }) {
  const [phase, setPhase] = useState(0);
  const [hoveredPath, setHoveredPath] = useState(null);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2000),
      setTimeout(() => setPhase(4), 2800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const s = (p, extra = {}) => ({
    opacity: phase >= p ? 1 : 0,
    transform: phase >= p ? "translateY(0)" : "translateY(18px)",
    transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
    ...extra,
  });

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "40px 20px",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      position: "relative", overflow: "hidden", background: "#08080c",
    }}>
      {/* Grid overlay */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.03,
        backgroundImage: "linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />
      {/* Glow */}
      <div style={{
        position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, -50%)",
        width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, #22c55e08 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Title */}
      <div style={s(1, { textAlign: "center", position: "relative" })}>
        <div style={{ fontSize: 64, marginBottom: 8, filter: "drop-shadow(0 0 20px #22c55e44)" }}>🌍</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, letterSpacing: "-0.03em", color: "#fff" }}>
          PEC <span style={{ color: "#22c55e" }}>CARD</span> ENGINE
        </h1>
        <div style={{ color: "#3b82f6", fontSize: 12, fontWeight: 700, marginTop: 4, letterSpacing: "0.15em" }}>
          v2.0 • EARTH LOVE UNITED
        </div>
      </div>

      {/* Description */}
      <div style={s(2, { marginTop: 24, textAlign: "center", maxWidth: 520 })}>
        <div style={{ color: "#ffffff88", fontSize: 14, lineHeight: 1.7 }}>
          Grade any sustainable technology on the planet.
        </div>
        <div style={{ color: "#ffffff44", fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>
          Research green technologies, score their impact with the P·E·C system,
          and mint collectible cards backed by real data.
        </div>
      </div>

      {/* PEC dimensions */}
      <div style={s(3, { display: "flex", gap: 16, marginTop: 32, flexWrap: "wrap", justifyContent: "center" })}>
        {[
          { letter: "P", label: "Potential", desc: "Market size & growth", color: "#a855f7", icon: "📈" },
          { letter: "E", label: "Existence", desc: "Technology readiness", color: "#3b82f6", icon: "🔬" },
          { letter: "C", label: "Climate", desc: "Carbon impact", color: "#22c55e", icon: "🌱" },
        ].map(dim => (
          <div key={dim.letter} style={{
            padding: "12px 18px", borderRadius: 10, background: `${dim.color}08`,
            border: `1px solid ${dim.color}33`, textAlign: "center", minWidth: 130,
          }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{dim.icon}</div>
            <div style={{ color: dim.color, fontSize: 18, fontWeight: 900 }}>{dim.letter}</div>
            <div style={{ color: "#ffffffbb", fontSize: 10, fontWeight: 700, marginTop: 2 }}>{dim.label}</div>
            <div style={{ color: "#ffffff44", fontSize: 9, marginTop: 2 }}>{dim.desc}</div>
          </div>
        ))}
      </div>

      {/* Two paths */}
      <div style={s(4, { display: "flex", gap: 20, marginTop: 40, flexWrap: "wrap", justifyContent: "center", maxWidth: 680 })}>
        {[
          {
            key: "ai", onClick: onChooseAI, color: "#3b82f6", icon: "🤖",
            title: "AI RESEARCH MODE", sub: "GEMINI 2.0 FLASH • GOOGLE AI",
            desc: "Type any technology name and AI will autonomously research it across the web, analyze market data, and generate PEC scores with full justifications.",
            badge: "⚡ REQUIRES FREE API KEY — 2 MIN SETUP",
          },
          {
            key: "manual", onClick: onChooseManual, color: "#22c55e", icon: "✏️",
            title: "MANUAL MODE", sub: "NO SETUP NEEDED • START IMMEDIATELY",
            desc: "Score technologies yourself using your own research. Provide justifications and sources for each score. Perfect for researchers and domain experts.",
            badge: "✓ READY TO GO — NO API KEY NEEDED",
          },
        ].map(path => (
          <button
            key={path.key} onClick={path.onClick}
            onMouseEnter={() => setHoveredPath(path.key)}
            onMouseLeave={() => setHoveredPath(null)}
            style={{
              flex: "1 1 280px", padding: "24px 20px", borderRadius: 14,
              border: `2px solid ${hoveredPath === path.key ? path.color : path.color + "33"}`,
              background: hoveredPath === path.key
                ? `linear-gradient(160deg, ${path.color}12, #08080c, ${path.color}08)`
                : `linear-gradient(160deg, ${path.color}08, #08080c)`,
              color: "#fff", cursor: "pointer", textAlign: "left",
              fontFamily: "'JetBrains Mono', monospace",
              transition: "all 0.3s ease",
              transform: hoveredPath === path.key ? "translateY(-2px)" : "none",
              boxShadow: hoveredPath === path.key ? `0 8px 32px ${path.color}22` : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>{path.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: path.color }}>{path.title}</div>
                <div style={{ fontSize: 9, color: "#ffffff44", letterSpacing: "0.08em" }}>{path.sub}</div>
              </div>
            </div>
            <div style={{ color: "#ffffff77", fontSize: 11, lineHeight: 1.6, marginBottom: 14 }}>{path.desc}</div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 6,
              background: `${path.color}22`, color: path.color,
              fontSize: 10, fontWeight: 700,
            }}>
              {path.badge}
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div style={s(4, { marginTop: 40, textAlign: "center" })}>
        <div style={{ color: "#ffffff22", fontSize: 9, letterSpacing: "0.12em", lineHeight: 1.8 }}>
          BSC: 0x2553...60a0 • SCHEMA v2.0.0 • MAX CMP 29,403
        </div>
      </div>
    </div>
  );
}

// ── API Key Wizard (Gemini) ──────────────────────────────────

function APIKeyWizard({ onComplete, onBack }) {
  const [step, setStep] = useState(1);
  const [apiKey, setApiKey] = useState(getStoredKey());
  const [testResult, setTestResult] = useState(null);
  const [showKey, setShowKey] = useState(false);

  const testApiKey = async () => {
    if (!apiKey.trim()) return;
    setTestResult("testing");
    try {
      const res = await fetch(
        GEMINI_CONFIG.testEndpoint(apiKey.trim()),
        { method: "POST", headers: GEMINI_CONFIG.testHeaders, body: GEMINI_CONFIG.testBody }
      );
      if (res.ok) {
        localStorage.setItem(GEMINI_CONFIG.lsKey, apiKey.trim());
        setTestResult("success");
      } else {
        console.error(`Gemini test failed:`, await res.text().catch(() => ""));
        setTestResult("error");
      }
    } catch (e) {
      console.error(`Gemini test error:`, e);
      setTestResult("error");
    }
  };

  const keyValid = testResult === "success" || hasKey();

  const handleComplete = () => {
    if (apiKey.trim()) localStorage.setItem(GEMINI_CONFIG.lsKey, apiKey.trim());
    localStorage.setItem(LS_ONBOARDED, "true");
    onComplete();
  };

  const stepDot = (num, label) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: step >= num ? 1 : 0.3 }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 900,
        background: step > num ? "#22c55e" : step === num ? "#3b82f6" : "#1a1a2a",
        color: step > num || step === num ? "#000" : "#555",
      }}>
        {step > num ? "✓" : num}
      </div>
      <span style={{ color: step >= num ? "#ffffffaa" : "#ffffff33", fontSize: 10, fontWeight: 700 }}>{label}</span>
      {num < 3 && <span style={{ color: "#ffffff15", margin: "0 4px" }}>──</span>}
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "40px 20px",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace", background: "#08080c", color: "#fff",
    }}>
      <button onClick={onBack} style={{
        position: "absolute", top: 20, left: 20, padding: "8px 14px",
        borderRadius: 8, border: "1px solid #ffffff15", background: "transparent",
        color: "#ffffff55", fontSize: 11, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
      }}>← BACK</button>

      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 40 }}>
        {stepDot(1, "GET KEY")}
        {stepDot(2, "PASTE KEY")}
        {stepDot(3, "READY")}
      </div>

      <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
        {/* Step 1: Get Key */}
        {step === 1 && (
          <div style={{ animation: "fadeIn 0.5s ease" }}>
            <div style={{ fontSize: 44, marginBottom: 16 }}>🔑</div>
            <h2 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 8px", color: "#3b82f6" }}>Get Your Google API Key</h2>
            <div style={{ color: "#ffffff66", fontSize: 12, lineHeight: 1.7, marginBottom: 24 }}>
              Get a free API key from Google AI Studio. It takes 30 seconds.
            </div>

            <div style={{ textAlign: "left", padding: 20, borderRadius: 12, border: "1px solid #1a1a2a", background: "#0a0a10", marginBottom: 24 }}>
              {[
                { num: "1", text: "Click below to open Google AI Studio" },
                { num: "2", text: "Sign in with your Google account" },
                { num: "3", text: "Create an API key and copy it" },
                { num: "4", text: "Come back here and paste it" },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: i < 3 ? 14 : 0 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                    background: "#3b82f622", color: "#3b82f6",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900,
                  }}>{s.num}</div>
                  <div style={{ color: "#ffffffaa", fontSize: 12, lineHeight: 1.5, paddingTop: 2 }}>{s.text}</div>
                </div>
              ))}
            </div>
            <a
              href={GEMINI_CONFIG.studioUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 28px", borderRadius: 10,
                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer",
                boxShadow: "0 4px 20px #3b82f644", textDecoration: "none",
                transition: "all 0.2s ease",
              }}
            >🔗 OPEN GOOGLE AI STUDIO</a>
            <div style={{ marginTop: 20 }}>
              <button onClick={() => setStep(2)} style={{
                padding: "10px 24px", borderRadius: 8, border: "1px solid #ffffff22",
                background: "transparent", color: "#ffffffaa", fontSize: 11, fontWeight: 700,
                cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
              }}>I HAVE MY KEY → NEXT STEP</button>
            </div>
            <div style={{ color: "#ffffff22", fontSize: 9, marginTop: 20 }}>
              💡 Your API key is stored only in your browser. It never leaves your device.
            </div>
          </div>
        )}

        {/* Step 2: Paste & Test */}
        {step === 2 && (
          <div style={{ animation: "fadeIn 0.5s ease" }}>
            <div style={{ fontSize: 44, marginBottom: 16 }}>📋</div>
            <h2 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 8px", color: "#3b82f6" }}>Paste Your API Key</h2>

            <div style={{ color: "#ffffff66", fontSize: 11, lineHeight: 1.7, marginBottom: 14 }}>
              Paste your Google API Key below. We'll test it live.
            </div>
            <div style={{ position: "relative", marginBottom: 16 }}>
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={e => { setApiKey(e.target.value); setTestResult(null); }}
                placeholder={GEMINI_CONFIG.placeholder}
                style={{
                  width: "100%", padding: "14px 50px 14px 16px", borderRadius: 10,
                  border: `2px solid ${testResult === "success" ? "#22c55e" : testResult === "error" ? "#ef4444" : "#2a2a3a"}`,
                  background: "#0d0d12", color: "#fff", fontSize: 13,
                  fontFamily: "'JetBrains Mono', monospace", outline: "none", boxSizing: "border-box",
                }}
              />
              <button onClick={() => setShowKey(!showKey)} style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: "#ffffff44", fontSize: 16, cursor: "pointer",
              }}>{showKey ? "🙈" : "👁️"}</button>
            </div>
            {testResult === "success" && (
              <div style={{ padding: "10px 16px", borderRadius: 8, background: "#22c55e15", border: "1px solid #22c55e44", color: "#22c55e", fontSize: 12, fontWeight: 700, marginBottom: 16 }}>
                ✅ Gemini key validated! Connection successful.
              </div>
            )}
            {testResult === "error" && (
              <div style={{ padding: "10px 16px", borderRadius: 8, background: "#ef444415", border: "1px solid #ef444444", color: "#ef4444", fontSize: 11, marginBottom: 16, lineHeight: 1.5 }}>
                ❌ Key rejected. Make sure you copied the full key from <a href={GEMINI_CONFIG.studioUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", textDecoration: "underline" }}>Google AI Studio</a>.
              </div>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setStep(1)} style={{
                padding: "10px 20px", borderRadius: 8, border: "1px solid #ffffff15",
                background: "transparent", color: "#ffffff55", fontSize: 11, fontWeight: 700,
                cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
              }}>← BACK</button>
              {keyValid ? (
                <button onClick={() => setStep(3)} style={{
                  padding: "10px 28px", borderRadius: 8, border: "none",
                  background: "linear-gradient(135deg, #22c55e, #10b981)",
                  color: "#000", fontSize: 13, fontWeight: 800, cursor: "pointer",
                  fontFamily: "'JetBrains Mono', monospace", boxShadow: "0 4px 20px #22c55e44",
                }}>CONTINUE →</button>
              ) : (
                <button onClick={testApiKey} disabled={!apiKey.trim() || testResult === "testing"} style={{
                  padding: "10px 28px", borderRadius: 8, border: "none",
                  background: apiKey.trim() && testResult !== "testing" ? "linear-gradient(135deg, #3b82f6, #6366f1)" : "#1a1a2a",
                  color: apiKey.trim() && testResult !== "testing" ? "#fff" : "#555",
                  fontSize: 13, fontWeight: 800, cursor: apiKey.trim() ? "pointer" : "not-allowed",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {testResult === "testing" ? "⏳ TESTING..." : "🔬 TEST KEY"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Ready */}
        {step === 3 && (
          <div style={{ animation: "fadeIn 0.5s ease" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🚀</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 8px", color: "#22c55e" }}>You're All Set!</h2>
            <div style={{ color: "#ffffff66", fontSize: 12, lineHeight: 1.7, marginBottom: 12 }}>
              Your API key is saved locally. The PEC Engine is ready.
            </div>

            <div style={{ textAlign: "left", padding: 16, borderRadius: 10, border: "1px solid #ffffff0a", background: "#ffffff04", marginBottom: 20, lineHeight: 1.8 }}>
              <div style={{ color: "#ffffffcc", fontSize: 11, marginBottom: 6 }}>🌍 <strong>Earth Love United</strong> is a foundation dedicated to accelerating the transition to sustainable technology through open, verifiable research.</div>
              <div style={{ color: "#ffffffaa", fontSize: 11, marginBottom: 6 }}>🔬 The <strong>PEC Engine</strong> empowers anyone to autonomously research and grade green technologies using AI — no expertise required.</div>
              <div style={{ color: "#ffffff88", fontSize: 11 }}>📊 Every card you mint creates a <strong>verifiable audit trail</strong> — building a decentralized knowledge base for the planet's most promising clean technologies.</div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20 }}>
              <div style={{
                padding: "8px 14px", borderRadius: 8,
                border: "1px solid #22c55e33", background: "#22c55e08", color: "#22c55e",
                fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 6,
              }}>
                <span>✨</span> <span>Gemini 2.0 Flash</span> <span>✓</span>
              </div>
            </div>
            <div style={{ textAlign: "left", padding: 20, borderRadius: 12, border: "1px solid #22c55e33", background: "#22c55e08", marginBottom: 28 }}>
              <div style={{ color: "#22c55e", fontSize: 11, fontWeight: 700, marginBottom: 12, letterSpacing: "0.08em" }}>TRY THESE FIRST SEARCHES:</div>
              {["Perovskite solar cells", "Direct air carbon capture", "Solid-state batteries"].map((q, i) => (
                <div key={i} style={{ padding: "6px 10px", borderRadius: 6, marginBottom: 4, background: "#ffffff06", color: "#ffffffaa", fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "#22c55e" }}>▸</span> {q}
                </div>
              ))}
            </div>
            <button onClick={handleComplete} style={{
              padding: "14px 36px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #22c55e, #10b981)",
              color: "#000", fontSize: 15, fontWeight: 900, cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace", boxShadow: "0 4px 24px #22c55e55",
            }}>🔬 START RESEARCHING</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Manual Tutorial ──────────────────────────────────────────

function ManualTutorial({ onComplete }) {
  const [step, setStep] = useState(0);
  const steps = [
    {
      icon: "🌍", title: "Welcome to Manual Mode", color: null,
      content: "You don't need AI to grade technologies. Manual mode lets you submit your own research-backed assessments. Every technology gets scored on three dimensions.",
    },
    {
      icon: "📈", title: "P — Potential (1-99)", color: "#a855f7",
      content: "How big is the market? Score based on current market size, growth trajectory, and total addressable market.",
      examples: [
        { score: "1-20", label: "Common", example: "e.g. Micro-hydro generators" },
        { score: "41-60", label: "Rare", example: "e.g. Offshore wind farms" },
        { score: "81-99", label: "Legendary", example: "e.g. Nuclear fusion energy" },
      ],
    },
    {
      icon: "🔬", title: "E — Existence (1-99)", color: "#3b82f6",
      content: "How ready is this technology? Based on Technology Readiness Levels. A concept on paper is low E. Proven at scale is high E.",
      examples: [
        { score: "1-22", label: "TRL 1-2", example: "Concept & basic research" },
        { score: "45-66", label: "TRL 5-6", example: "Validated prototypes" },
        { score: "89-99", label: "TRL 9", example: "Proven & operational at scale" },
      ],
    },
    {
      icon: "🌱", title: "C — Climate (1-99)", color: "#22c55e",
      content: "What's the carbon impact? Technologies that emit CO₂ score low. Those that actively remove carbon score highest.",
      examples: [
        { score: "1-33", label: "Carbon Positive", example: "Net emitter" },
        { score: "34-66", label: "Carbon Neutral", example: "Net zero" },
        { score: "67-99", label: "Carbon Negative", example: "Actively sequesters carbon" },
      ],
    },
  ];
  const current = steps[step];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, fontFamily: "'JetBrains Mono', monospace",
    }}>
      <div style={{
        maxWidth: 480, width: "100%", borderRadius: 16,
        border: `1px solid ${current.color || "#ffffff22"}`,
        background: "#0d0d12",
        boxShadow: current.color ? `0 0 40px ${current.color}22` : "0 16px 64px rgba(0,0,0,0.5)",
        overflow: "hidden",
      }}>
        <div style={{ height: 3, background: "#1a1a2a" }}>
          <div style={{ height: "100%", background: current.color || "#3b82f6", width: `${((step + 1) / steps.length) * 100}%`, transition: "width 0.4s ease" }} />
        </div>
        <div style={{ padding: "28px 24px" }}>
          <div style={{ fontSize: 40, marginBottom: 12, textAlign: "center" }}>{current.icon}</div>
          <h3 style={{ fontSize: 18, fontWeight: 900, margin: "0 0 12px", textAlign: "center", color: current.color || "#fff" }}>{current.title}</h3>
          <div style={{ color: "#ffffff88", fontSize: 12, lineHeight: 1.7, textAlign: "center", marginBottom: 20 }}>{current.content}</div>
          {current.examples && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
              {current.examples.map((ex, i) => (
                <div key={i} style={{ padding: "8px 12px", borderRadius: 8, background: `${current.color}0a`, border: `1px solid ${current.color}22`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ color: current.color, fontWeight: 900, fontSize: 12, marginRight: 8 }}>{ex.score}</span>
                    <span style={{ color: "#ffffffaa", fontSize: 11, fontWeight: 700 }}>{ex.label}</span>
                  </div>
                  <span style={{ color: "#ffffff44", fontSize: 9 }}>{ex.example}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={() => step > 0 ? setStep(step - 1) : onComplete()} style={{
              padding: "8px 16px", borderRadius: 6, border: "1px solid #ffffff15",
              background: "transparent", color: "#ffffff55", fontSize: 10, fontWeight: 700,
              cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
            }}>{step === 0 ? "SKIP" : "← BACK"}</button>
            <div style={{ display: "flex", gap: 4 }}>
              {steps.map((_, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i === step ? (current.color || "#3b82f6") : i < step ? "#ffffff44" : "#ffffff15" }} />
              ))}
            </div>
            <button onClick={() => step < steps.length - 1 ? setStep(step + 1) : onComplete()} style={{
              padding: "8px 16px", borderRadius: 6, border: "none",
              background: step === steps.length - 1 ? "linear-gradient(135deg, #22c55e, #10b981)" : (current.color || "#3b82f6"),
              color: step === steps.length - 1 ? "#000" : "#fff",
              fontSize: 10, fontWeight: 800, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
            }}>{step === steps.length - 1 ? "✏️ START CREATING" : "NEXT →"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main App Router ──────────────────────────────────────────

export default function App() {
  // Check if user has already onboarded
  const hasApiKey = hasKey();
  const wasOnboarded = localStorage.getItem(LS_ONBOARDED) === "true";
  const [screen, setScreen] = useState(hasApiKey && wasOnboarded ? "engine" : "home");
  const [initialTab, setInitialTab] = useState("research");
  const [showManualTutorial, setShowManualTutorial] = useState(false);

  return (
    <div style={{ background: "#08080c", minHeight: "100vh" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        * { box-sizing: border-box; }
      `}</style>

      {screen === "home" && (
        <Homepage
          onChooseAI={() => {
            if (hasApiKey) {
              // Already has a stored key, skip wizard
              localStorage.setItem(LS_ONBOARDED, "true");
              setInitialTab("research");
              setScreen("engine");
            } else {
              setScreen("apiSetup");
            }
          }}
          onChooseManual={() => {
            localStorage.setItem(LS_ONBOARDED, "true");
            setInitialTab("manual");
            setShowManualTutorial(true);
            setScreen("engine");
          }}
        />
      )}

      {screen === "apiSetup" && (
        <APIKeyWizard
          onComplete={() => {
            setInitialTab("research");
            setScreen("engine");
          }}
          onBack={() => setScreen("home")}
        />
      )}

      {screen === "engine" && (
        <>
          {showManualTutorial && (
            <ManualTutorial onComplete={() => setShowManualTutorial(false)} />
          )}
          <PECEngine initialTab={initialTab} onNavigateHome={() => {
            setScreen("home");
          }} />
        </>
      )}
    </div>
  );
}

// Wrap export with error boundary
const AppWithBoundary = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
export { AppWithBoundary };
