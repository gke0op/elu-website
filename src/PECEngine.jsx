import { useState, useCallback, useMemo, useRef, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════
// PEC CARD ENGINE v2.0 — Earth Love United
// AI-Powered Autonomous Research, Scoring & Card Minting
// ═══════════════════════════════════════════════════════════════

const ELU_SCHEMA_VERSION = "2.0.0";
const CMP_MAX = 29403;

// ─── PROVIDER CONFIGURATION ──────────────────────────────────

const AI_PROVIDER = {
  id: "gemini",
  name: "Gemini 2.0 Flash",
  icon: "✨",
  keyLabel: "Google API Key",
  lsKey: "elu_gemini_api_key",
  studioUrl: "https://aistudio.google.com/apikey",
  studioLabel: "Google AI Studio",
};

const LS_CARDS = "elu_pec_cards";

// Suggested searches — past ELU contest winners & notable technologies
const SUGGESTED_SEARCHES = [
  "Perovskite solar cells",
  "Direct air carbon capture",
  "Solid-state batteries",
];

function getGeminiKey() {
  return localStorage.getItem(AI_PROVIDER.lsKey) || "";
}

// ─── CARD PERSISTENCE ────────────────────────────────────────

function loadCards() {
  try {
    const raw = localStorage.getItem(LS_CARDS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCards(cards) {
  try {
    localStorage.setItem(LS_CARDS, JSON.stringify(cards));
  } catch (e) {
    console.error("[CARDS] Failed to persist:", e);
  }
}

// ─── PEC TIER DEFINITIONS ────────────────────────────────────

const P_TIERS = [
  { min: 1, max: 20, name: "Common", color: "#8a8a8a", bg: "#2a2a2e" },
  { min: 21, max: 40, name: "Uncommon", color: "#22c55e", bg: "#0a2a14" },
  { min: 41, max: 60, name: "Rare", color: "#3b82f6", bg: "#0a1a2e" },
  { min: 61, max: 80, name: "Epic", color: "#a855f7", bg: "#1a0a2e" },
  { min: 81, max: 99, name: "Legendary", color: "#eab308", bg: "#2a2200" },
];

const E_BANDS = [
  { min: 1, max: 11, label: "Basic principles observed", color: "#9ca3af", trl: "TRL 1" },      // Grey/White
  { min: 12, max: 22, label: "Technology concept formulated", color: "#6b7280", trl: "TRL 2" }, // Darker grey
  { min: 23, max: 33, label: "Experimental proof of concept", color: "#3b82f6", trl: "TRL 3" }, // Blue
  { min: 34, max: 44, label: "Technology validated in lab", color: "#0ea5e9", trl: "TRL 4" },   // Cyan-blue
  { min: 45, max: 55, label: "Validated in relevant environment", color: "#06b6d4", trl: "TRL 5" }, // Cyan
  { min: 56, max: 66, label: "Demonstrated in relevant environment", color: "#8b5cf6", trl: "TRL 6" }, // Purple
  { min: 67, max: 77, label: "Prototype in operational environment", color: "#a855f7", trl: "TRL 7" }, // Bright purple
  { min: 78, max: 88, label: "System complete and qualified", color: "#f97316", trl: "TRL 8" }, // Orange
  { min: 89, max: 99, label: "Proven in operational environment", color: "#ea580c", trl: "TRL 9" }, // Deep orange
];


const C_ZONES = [
  { min: 1, max: 33, label: "Carbon Positive", color: "#ef4444", desc: "Net emitter" },
  { min: 34, max: 66, label: "Carbon Neutral", color: "#f59e0b", desc: "Net zero" },
  { min: 67, max: 99, label: "Carbon Negative", color: "#10b981", desc: "Net sequester" },
];

const TECH_SECTORS = [
  "Solar PV", "Wind Energy", "Geothermal", "Biomass", "Hydrogen",
  "Nuclear Fusion", "CCUS", "Ocean Energy", "Battery Storage",
  "Smart Grid", "Biofuels", "Nature-Based", "Genetic Engineering",
  "AI/ML Climate", "Green Transport", "Circular Economy",
  "Water Treatment", "Sustainable Agriculture", "Green Building",
  "Carbon Markets", "Nuclear Fission", "Energy Efficiency",
];

const SECTOR_ICONS = {
  "Solar PV": "☀️", "Wind Energy": "🌬️", "Geothermal": "🌋", "Biomass": "🌿",
  "Hydrogen": "💧", "Nuclear Fusion": "⚛️", "CCUS": "🏭", "Ocean Energy": "🌊",
  "Battery Storage": "🔋", "Smart Grid": "⚡", "Biofuels": "🛢️", "Nature-Based": "🌳",
  "Genetic Engineering": "🧬", "AI/ML Climate": "🤖", "Green Transport": "🚃",
  "Circular Economy": "♻️", "Water Treatment": "💦", "Sustainable Agriculture": "🌾",
  "Green Building": "🏗️", "Carbon Markets": "📊", "Nuclear Fission": "☢️",
  "Energy Efficiency": "💡",
};

// ─── PEC CALCULATION ENGINE ──────────────────────────────────

function getPTier(p) { return P_TIERS.find(t => p >= t.min && p <= t.max) || P_TIERS[0]; }
function getEBand(e) { return E_BANDS.find(b => e >= b.min && e <= b.max) || E_BANDS[0]; }
function getCZone(c) { return C_ZONES.find(z => c >= z.min && c <= z.max) || C_ZONES[0]; }

function computeCMP(p, e, c) {
  const bmp = p * e;
  const cr = c / 33;
  return Math.round(bmp * cr * 100) / 100;
}

function computeRank(cmp) {
  const pct = (cmp / CMP_MAX) * 100;
  if (pct >= 90) return { rank: "S", label: "Apex", color: "#ffd700" };
  if (pct >= 75) return { rank: "A", label: "Elite", color: "#a855f7" };
  if (pct >= 55) return { rank: "B", label: "Advanced", color: "#3b82f6" };
  if (pct >= 35) return { rank: "C", label: "Developing", color: "#22c55e" };
  if (pct >= 15) return { rank: "D", label: "Emerging", color: "#f59e0b" };
  return { rank: "E", label: "Nascent", color: "#8a8a8a" };
}

// ─── BLOCKCHAIN JSON GENERATOR ───────────────────────────────

function generateBlockchainJSON(card) {
  const pTier = getPTier(card.p);
  const eBand = getEBand(card.e);
  const cZone = getCZone(card.c);
  const cmp = computeCMP(card.p, card.e, card.c);
  const rank = computeRank(cmp);
  return {
    schema: "ELU-PEC", version: ELU_SCHEMA_VERSION, standard: "ERC-721",
    metadata: {
      id: card.id || `ELU-${Date.now().toString(36).toUpperCase()}`,
      name: card.name, description: card.description || "",
      sector: card.sector, creator: card.creator || "ELU Foundation",
      created_at: card.created_at || new Date().toISOString(),
      image_uri: card.image_uri || "", external_url: "https://earthloveunited.org",
    },
    pec_values: {
      potential: { value: card.p, tier: pTier.name, color: pTier.color },
      existence: { value: card.e, trl: eBand.trl, stage: eBand.label, color: eBand.color },
      climate: { value: card.c, zone: cZone.label, color: cZone.color, category: cZone.desc },
    },
    mining: {
      base_mining_power: card.p * card.e, climate_ratio: Math.round((card.c / 33) * 1000) / 1000,
      combined_mining_power: cmp, cmp_max: CMP_MAX,
      cmp_percentile: Math.round((cmp / CMP_MAX) * 10000) / 100,
      rank: rank.rank, rank_label: rank.label,
    },
    research: card.research || null,
    provenance: {
      chain: "BSC", contract: "0x2553ad2bf2111915dd55f264360b69d5460b60a0",
      token_standard: "BEP-20/ERC-721", grading_authority: "ELU PEC Engine v2 + AI Research",
      ai_model: card.ai_model || null, research_timestamp: card.research_timestamp || null,
    },
  };
}

// ─── RESEARCH AUDIT LOG (LOCAL → IPFS/ARWEAVE READY) ─────────

const AUDIT_LOG_KEY = "elu_research_audit_log";

// SHA-256 hash function using Web Crypto API
async function sha256(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(typeof data === "string" ? data : JSON.stringify(data));
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Generate audit record for a minted card
async function generateAuditRecord(card) {
  const blockchainJSON = generateBlockchainJSON(card);
  const contentHash = await sha256(blockchainJSON);
  const queryHash = card.research?.query ? await sha256(card.research.query) : null;

  return {
    // Immutable identifiers
    card_id: card.id,
    content_hash: contentHash,
    query_hash: queryHash,

    // Quick lookup fields
    name: card.name,
    sector: card.sector,
    p: card.p,
    e: card.e,
    c: card.c,
    cmp: computeCMP(card.p, card.e, card.c),
    rank: computeRank(computeCMP(card.p, card.e, card.c)).rank,

    // Provenance
    ai_model: card.ai_model,
    created_at: card.created_at,

    // Audit metadata
    logged_at: new Date().toISOString(),
    version: ELU_SCHEMA_VERSION,
    storage: "local", // Will change to "ipfs" or "arweave" when scaled
  };
}

// Save audit record to local storage
function saveAuditRecord(record) {
  try {
    const existing = JSON.parse(localStorage.getItem(AUDIT_LOG_KEY) || "[]");
    existing.push(record);
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(existing));
    return true;
  } catch (e) {
    console.error("[AUDIT] Failed to save:", e);
    return false;
  }
}

// Get all audit records
function getAuditLog() {
  try {
    return JSON.parse(localStorage.getItem(AUDIT_LOG_KEY) || "[]");
  } catch {
    return [];
  }
}

// Export audit log as JSON
async function downloadJSON(data, filename) {
  const json = JSON.stringify(data, null, 2);

  // Primary: Native "Save As" dialog (Chrome 86+) — bulletproof filename
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(json);
      await writable.close();
      return;
    } catch (e) {
      if (e.name === 'AbortError') return; // user cancelled
      // fall through to legacy
    }
  }

  // Fallback: blob URL
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 200);
}

function exportAuditLog() {
  const log = getAuditLog();
  downloadJSON(log, `ELU_Audit_Log_${new Date().toISOString().split("T")[0]}.json`);
}


// ─── AI RESEARCH ENGINE ──────────────────────────────────────

const RESEARCH_SYSTEM_PROMPT = `You are the ELU PEC Research Engine — an AI analyst for the Earth Love United Foundation's technology grading system. Your job is to research a sustainable technology and produce a structured assessment.

THE PEC GRADING SYSTEM:
- P (Potential) 1-99: Market impact potential. Based on current and projected market size. 1-20=Common, 21-40=Uncommon, 41-60=Rare, 61-80=Epic, 81-99=Legendary.
- E (Existence) 1-99: Technology readiness level. 1-11=Basic principles, 12-22=Concept formulated, 23-33=Proof of concept, 34-44=Lab validated, 45-55=Relevant environment validated, 56-66=Demonstrated, 67-77=Prototype operational, 78-88=System qualified, 89-99=Proven operational.
- C (Climate) 1-99: Carbon impact. 1-33=Carbon positive (emitter), 34-66=Carbon neutral, 67-99=Carbon negative (sequester).

Combined Mining Power = P × E × (C / 33). Max theoretical = 29,403.

RESPOND ONLY IN THIS EXACT JSON FORMAT (no markdown, no backticks, no preamble):
{
  "name": "Technology Display Name",
  "sector": "One of: Solar PV, Wind Energy, Geothermal, Biomass, Hydrogen, Nuclear Fusion, CCUS, Ocean Energy, Battery Storage, Smart Grid, Biofuels, Nature-Based, Genetic Engineering, AI/ML Climate, Green Transport, Circular Economy, Water Treatment, Sustainable Agriculture, Green Building, Carbon Markets, Nuclear Fission, Energy Efficiency",
  "description": "2-3 sentence technology summary",
  "p_score": <number 1-99>,
  "p_justification": "Why this P score - market data and projections",
  "e_score": <number 1-99>,
  "e_justification": "Why this E score - TRL assessment with evidence",
  "c_score": <number 1-99>,
  "c_justification": "Why this C score - carbon impact analysis",
  "key_players": ["Company1", "Company2", "Company3"],
  "market_size_current_usd": "e.g. $50B",
  "market_size_projected_usd": "e.g. $200B by 2030",
  "co2_impact": "e.g. -2.5 GtCO2/year potential",
  "risks": ["Risk 1", "Risk 2"],
  "breakthroughs": ["Recent breakthrough 1", "Recent breakthrough 2"],
  "summary": "One-paragraph deep analysis suitable for investor briefing"
}

Be rigorous. Use real data. Justify every score with evidence. This grades technologies that could save our planet — accuracy matters.`;

// ─── JSON EXTRACTION HELPER ──────────────────────────────────

function extractJSON(fullText) {
  let parsed = null;
  try {
    parsed = JSON.parse(fullText.trim());
  } catch {
    const jsonMatch = fullText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        const cleaned = fullText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const innerMatch = cleaned.match(/\{[\s\S]*\}/);
        if (innerMatch) {
          parsed = JSON.parse(innerMatch[0]);
        }
      }
    }
  }
  if (!parsed || !parsed.name) throw new Error("Could not parse structured research data from AI response");

  // Clamp scores & validate sector
  parsed.p_score = Math.max(1, Math.min(99, Number(parsed.p_score) || 50));
  parsed.e_score = Math.max(1, Math.min(99, Number(parsed.e_score) || 50));
  parsed.c_score = Math.max(1, Math.min(99, Number(parsed.c_score) || 50));
  if (!TECH_SECTORS.includes(parsed.sector)) parsed.sector = "AI/ML Climate";
  return parsed;
}

// ─── GEMINI RESEARCH ─────────────────────────────────────────

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function callGemini(apiKey, prompt, useGrounding) {
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 4000 },
  };
  if (useGrounding) body.tools = [{ google_search: {} }];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(body),
    }
  );
  return response;
}

async function runGeminiResearch(techQuery, apiKey, onProgress) {
  const userPrompt = `${RESEARCH_SYSTEM_PROMPT}\n\n---\n\nResearch this sustainable technology thoroughly and provide a PEC assessment: "${techQuery}"\n\nSearch for current market data, recent developments, key companies, carbon impact studies, and technology readiness information. Be thorough — this assessment will be used for investment grading.`;

  // ── ATTEMPT 1: Power Mode (grounded search) ──
  onProgress({ stage: "researching", message: "⚡ Power Mode — researching with Google Search..." });
  let response = await callGemini(apiKey, userPrompt, true);

  let mode = "power";

  // ── If 429: switch to Free Mode (no grounding + retry with backoff) ──
  if (response.status === 429) {
    mode = "free";
    onProgress({ stage: "researching", message: "🆓 Free tier detected — switching to Free Mode (no search grounding)..." });
    await sleep(2000);

    const FREE_DELAYS = [0, 10, 20, 30, 45];
    for (let attempt = 0; attempt < FREE_DELAYS.length; attempt++) {
      const delaySec = FREE_DELAYS[attempt];
      if (delaySec > 0) {
        for (let s = delaySec; s > 0; s--) {
          onProgress({ stage: "researching", message: `🆓 Free Mode — rate limited, retrying in ${s}s... (attempt ${attempt + 1}/${FREE_DELAYS.length})` });
          await sleep(1000);
        }
      }
      onProgress({ stage: "researching", message: `🆓 Free Mode — sending research request (attempt ${attempt + 1})...` });
      response = await callGemini(apiKey, userPrompt, false);

      if (response.ok) break;
      if (response.status !== 429) break; // non-rate-limit error, let it fall through
    }
  }

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 429) {
      throw new Error("Rate limit exceeded on all retries. Free tier has limited requests/minute. Wait 60s and try again, or upgrade to a billing-enabled key for instant results.");
    }
    throw new Error(`Gemini API error ${response.status}: ${errText.slice(0, 200)}`);
  }

  const modeLabel = mode === "power" ? "⚡ Power Mode (grounded)" : "🆓 Free Mode";
  onProgress({ stage: "researching", message: `${modeLabel} — parsing research data...` });

  const data = await response.json();
  const candidates = data.candidates || [];
  const textParts = candidates[0]?.content?.parts?.filter(p => p.text) || [];
  const fullText = textParts.map(p => p.text).join("\n");
  if (!fullText) throw new Error("Empty response from Gemini");

  onProgress({ stage: "parsing", message: `${modeLabel} — structuring PEC scores...` });
  return { parsed: extractJSON(fullText), model: "gemini-2.0-flash", mode };
}

// ─── UNIFIED RESEARCH DISPATCHER ─────────────────────────────

async function runAIResearch(techQuery, onProgress) {
  onProgress({ stage: "connecting", message: `Connecting to ${AI_PROVIDER.name}...` });

  const apiKey = getGeminiKey();
  if (!apiKey) {
    onProgress({ stage: "error", message: `No API key found. Use ⚙️ Settings to add your Google API key.` });
    return { success: false, error: `Google API key not configured` };
  }

  try {
    const result = await runGeminiResearch(techQuery, apiKey, onProgress);
    const modeMsg = result.mode === "power" ? "⚡ Power Mode" : "🆓 Free Mode";
    onProgress({ stage: "complete", message: `Research complete! (${modeMsg})` });
    return { success: true, data: result.parsed, model: result.model, mode: result.mode };
  } catch (error) {
    onProgress({ stage: "error", message: error.message });
    return { success: false, error: error.message };
  }
}


// ─── PEC CARD COMPONENT ──────────────────────────────────────

function PECCard({ card, size = "md", onClick, glowAnim }) {
  const pTier = getPTier(card.p);
  const eBand = getEBand(card.e);
  const cZone = getCZone(card.c);
  const cmp = computeCMP(card.p, card.e, card.c);
  const rank = computeRank(cmp);
  const cmpPct = Math.min((cmp / CMP_MAX) * 100, 100);
  const dims = size === "lg" ? { w: 340, h: 480 } : size === "sm" ? { w: 210, h: 295 } : { w: 270, h: 380 };
  const icon = card.icon || SECTOR_ICONS[card.sector] || "⚡";

  return (
    <div
      onClick={onClick}
      style={{
        width: dims.w, height: dims.h, borderRadius: 16,
        border: `3px solid ${eBand.color}`,
        background: `linear-gradient(160deg, ${pTier.bg} 0%, #0d0d0f 60%, ${pTier.bg} 100%)`,
        position: "relative", overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: `0 0 ${glowAnim ? 40 : 20}px ${eBand.color}${glowAnim ? '66' : '33'}, 0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 ${eBand.color}22`,
        animation: glowAnim ? "cardGlow 2s ease-in-out infinite" : undefined,
        flexShrink: 0,
      }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = "translateY(-4px) scale(1.02)"; } }}
      onMouseLeave={e => { if (onClick) { e.currentTarget.style.transform = ""; } }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "40%", background: `radial-gradient(ellipse at 50% 0%, ${pTier.color}15 0%, transparent 70%)`, pointerEvents: "none" }} />

      {/* Rank badge */}
      <div style={{
        position: "absolute", top: 12, right: 12,
        width: size === "sm" ? 28 : 36, height: size === "sm" ? 28 : 36,
        borderRadius: "50%", background: `linear-gradient(135deg, ${rank.color}, ${rank.color}88)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size === "sm" ? 13 : 16, fontWeight: 900, color: "#000",
        boxShadow: `0 0 12px ${rank.color}66`, border: `1px solid ${rank.color}`,
      }}>{rank.rank}</div>

      {/* Tier label */}
      <div style={{
        position: "absolute", top: 12, left: 12, padding: "2px 8px", borderRadius: 4,
        background: `${pTier.color}22`, border: `1px solid ${pTier.color}44`,
        color: pTier.color, fontSize: size === "sm" ? 8 : 10, fontWeight: 700,
        letterSpacing: "0.08em", textTransform: "uppercase",
      }}>{pTier.name}</div>

      {/* AI badge with model name */}
      {card.ai_model && (
        <div style={{
          position: "absolute", top: size === "sm" ? 36 : 44, left: 12,
          padding: "1px 6px", borderRadius: 3, background: "#3b82f622",
          border: "1px solid #3b82f644", color: "#3b82f6",
          fontSize: 7, fontWeight: 700, letterSpacing: "0.1em",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <span>🤖</span>
          <span>{card.ai_model.toUpperCase()}</span>
        </div>
      )}
      {card.research && !card.ai_model && (
        <div style={{
          position: "absolute", top: size === "sm" ? 36 : 44, left: 12,
          padding: "1px 6px", borderRadius: 3, background: "#3b82f622",
          border: "1px solid #3b82f644", color: "#3b82f6",
          fontSize: 7, fontWeight: 700, letterSpacing: "0.1em",
        }}>AI RESEARCHED</div>
      )}

      {/* Icon */}
      <div style={{ position: "absolute", top: "15%", left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <div style={{
          width: size === "sm" ? 56 : 80, height: size === "sm" ? 56 : 80, borderRadius: 12,
          background: `linear-gradient(135deg, ${eBand.color}33, ${pTier.color}22)`,
          border: `1px solid ${eBand.color}44`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: size === "sm" ? 28 : 40,
        }}>{icon}</div>
        <div style={{
          color: "#fff", fontSize: size === "sm" ? 12 : 15, fontWeight: 800,
          textAlign: "center", padding: "0 16px", maxWidth: "90%",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{card.name}</div>
        <div style={{ color: "#ffffff66", fontSize: size === "sm" ? 8 : 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {card.sector}
        </div>
      </div>

      {/* PEC Values */}
      <div style={{ position: "absolute", bottom: size === "sm" ? 52 : 72, left: 12, right: 12, display: "flex", justifyContent: "space-between", gap: 6 }}>
        {[
          { label: "P", value: card.p, color: pTier.color },
          { label: "E", value: card.e, color: eBand.color },
          { label: "C", value: card.c, color: cZone.color },
        ].map(v => (
          <div key={v.label} style={{
            flex: 1, textAlign: "center", padding: size === "sm" ? "4px 0" : "6px 0",
            background: `${v.color}11`, borderRadius: 6, border: `1px solid ${v.color}33`,
          }}>
            <div style={{ color: v.color, fontSize: size === "sm" ? 8 : 9, fontWeight: 700, letterSpacing: "0.1em" }}>{v.label}</div>
            <div style={{ color: "#fff", fontSize: size === "sm" ? 14 : 18, fontWeight: 900 }}>{v.value}</div>
          </div>
        ))}
      </div>

      {/* Climate slider */}
      <div style={{ position: "absolute", bottom: size === "sm" ? 36 : 48, left: 12, right: 12 }}>
        <div style={{ height: 4, borderRadius: 2, background: "#1a1a1e", position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(card.c / 99) * 100}%`, borderRadius: 2, background: "linear-gradient(90deg, #ef4444, #f59e0b, #10b981)" }} />
          <div style={{
            position: "absolute", top: -3, left: `${(card.c / 99) * 100}%`,
            width: 10, height: 10, borderRadius: "50%", background: cZone.color,
            border: "2px solid #fff", transform: "translateX(-5px)",
            boxShadow: `0 0 8px ${cZone.color}88`,
          }} />
        </div>
      </div>

      {/* CMP bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: size === "sm" ? "6px 12px" : "8px 12px",
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
        borderTop: `1px solid ${eBand.color}22`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: "#ffffff55", fontSize: size === "sm" ? 7 : 8, letterSpacing: "0.1em" }}>CMP</span>
          <span style={{ color: rank.color, fontSize: size === "sm" ? 11 : 13, fontWeight: 900 }}>{cmp.toLocaleString()}</span>
        </div>
        <div style={{ flex: 1, maxWidth: "40%", height: 3, borderRadius: 2, background: "#1a1a1e", marginLeft: 8 }}>
          <div style={{ width: `${cmpPct}%`, height: "100%", borderRadius: 2, background: `linear-gradient(90deg, ${rank.color}88, ${rank.color})` }} />
        </div>
        <span style={{ color: "#ffffff33", fontSize: size === "sm" ? 7 : 8, marginLeft: 6 }}>/{CMP_MAX.toLocaleString()}</span>
      </div>
    </div>
  );
}

// ─── AI RESEARCH TERMINAL ────────────────────────────────────

function ResearchTerminal({ onMint }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(null); // { stage, message }
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [overrides, setOverrides] = useState({});
  const [showJSON, setShowJSON] = useState(false);
  const termRef = useRef(null);
  const [logs, setLogs] = useState([]);

  const addLog = (msg, type = "info") => {
    setLogs(prev => [...prev, { msg, type, ts: new Date().toLocaleTimeString() }]);
  };

  const runResearch = async (overrideQuery) => {
    const q = overrideQuery || query;
    if (!q.trim()) return;
    if (overrideQuery) setQuery(overrideQuery);
    setResult(null);
    setError(null);
    setOverrides({});
    setLogs([]);
    setShowJSON(false);

    addLog(`Initiating PEC research: "${q}"`, "cmd");
    addLog(`Provider: ${AI_PROVIDER.icon} ${AI_PROVIDER.name}`, "info");
    addLog("Connecting to AI research engine...", "info");

    const res = await runAIResearch(q, (progress) => {
      setStatus(progress);
      if (progress.stage === "connecting") addLog(`${AI_PROVIDER.name} connected. Deploying research...`, "info");
      if (progress.stage === "researching") addLog(progress.message, "search");
      if (progress.stage === "parsing") addLog(progress.message, "info");
      if (progress.stage === "complete") addLog(progress.message, "success");
      if (progress.stage === "error") addLog(`Error: ${progress.message}`, "error");
    });

    if (res.success) {
      const d = res.data;
      const modeTag = res.mode === "power" ? "⚡ Power Mode (grounded)" : "🆓 Free Mode";
      addLog(`Research mode: ${modeTag}`, "info");
      addLog(`Technology: ${d.name}`, "data");
      addLog(`Model: ${res.model}`, "info");
      addLog(`Sector: ${d.sector}`, "data");
      addLog(`P=${d.p_score} E=${d.e_score} C=${d.c_score}`, "data");
      addLog(`CMP = ${computeCMP(d.p_score, d.e_score, d.c_score).toLocaleString()}`, "data");
      if (d.market_size_current_usd) addLog(`Market: ${d.market_size_current_usd} → ${d.market_size_projected_usd}`, "data");
      if (d.co2_impact) addLog(`CO₂ Impact: ${d.co2_impact}`, "data");
      setResult({ ...d, model: res.model, researchMode: res.mode });
    } else {
      setError(res.error);
    }
  };

  const getEffective = (field) => overrides[field] !== undefined ? overrides[field] : result?.[field === 'p' ? 'p_score' : field === 'e' ? 'e_score' : 'c_score'];

  const handleMint = () => {
    if (!result) return;
    const card = {
      id: `ELU-${Date.now().toString(36).toUpperCase()}`,
      name: result.name,
      description: result.description,
      sector: result.sector,
      icon: SECTOR_ICONS[result.sector] || "⚡",
      p: overrides.p !== undefined ? overrides.p : result.p_score,
      e: overrides.e !== undefined ? overrides.e : result.e_score,
      c: overrides.c !== undefined ? overrides.c : result.c_score,
      creator: "PEC Engine v2 — AI Research",
      created_at: new Date().toISOString(),
      ai_model: result.model,
      research_timestamp: new Date().toISOString(),
      research: {
        query: query,
        p_justification: result.p_justification,
        e_justification: result.e_justification,
        c_justification: result.c_justification,
        key_players: result.key_players,
        market_current: result.market_size_current_usd,
        market_projected: result.market_size_projected_usd,
        co2_impact: result.co2_impact,
        risks: result.risks,
        breakthroughs: result.breakthroughs,
        summary: result.summary,
        overrides_applied: Object.keys(overrides).length > 0 ? overrides : null,
      },
    };
    onMint(card);
  };

  const previewCard = result ? {
    name: result.name, sector: result.sector,
    icon: SECTOR_ICONS[result.sector] || "⚡",
    p: overrides.p !== undefined ? overrides.p : result.p_score,
    e: overrides.e !== undefined ? overrides.e : result.e_score,
    c: overrides.c !== undefined ? overrides.c : result.c_score,
    research: true,
  } : null;

  const logColors = { cmd: "#eab308", info: "#ffffff55", search: "#3b82f6", data: "#22c55e", success: "#10b981", error: "#ef4444" };

  return (
    <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
      {/* Left: Terminal */}
      <div style={{ flex: "1 1 420px", minWidth: 320 }}>
        {/* Search bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && runResearch()}
              placeholder="Enter technology to research... (e.g. Solid-state batteries)"
              style={{
                width: "100%", padding: "12px 16px", paddingLeft: 40, borderRadius: 10,
                border: "1px solid #2a2a3a", background: "#0a0a10", color: "#fff",
                fontSize: 14, fontFamily: "'JetBrains Mono', monospace", outline: "none",
                boxSizing: "border-box",
              }}
            />
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>🔬</span>
          </div>
          <button
            onClick={runResearch}
            disabled={!query.trim() || status?.stage === "researching" || status?.stage === "connecting"}
            style={{
              padding: "12px 24px", borderRadius: 10, border: "none",
              background: (!query.trim() || status?.stage === "researching") ? "#1a1a2a" : "linear-gradient(135deg, #3b82f6, #6366f1)",
              color: (!query.trim() || status?.stage === "researching") ? "#555" : "#fff",
              fontSize: 13, fontWeight: 800, cursor: query.trim() ? "pointer" : "default",
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.04em",
              minWidth: 120,
            }}
          >
            {status?.stage === "researching" || status?.stage === "connecting" ? "⟳ WORKING..." : "RESEARCH"}
          </button>
        </div>

        {/* Quick suggestions + status */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ color: "#ffffff33", fontSize: 10, marginRight: 4 }}>TRY:</span>
          {SUGGESTED_SEARCHES.map(s => (
            <button
              key={s}
              onClick={() => runResearch(s)}
              disabled={status?.stage === "researching" || status?.stage === "connecting"}
              style={{
                padding: "4px 10px", borderRadius: 6, border: "1px solid #22c55e33",
                background: "#22c55e08", color: "#22c55e", fontSize: 10,
                fontFamily: "'JetBrains Mono', monospace", cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {s}
            </button>
          ))}
          <span style={{
            marginLeft: "auto", display: "flex", alignItems: "center", gap: 6,
            fontSize: 10, color: getGeminiKey() ? "#22c55e88" : "#ef444488",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: getGeminiKey() ? "#22c55e" : "#ef4444" }} />
            {getGeminiKey() ? `${AI_PROVIDER.icon} ${AI_PROVIDER.name}` : "⚠ No API key — use ⚙️ Settings"}
          </span>
        </div>

        {/* Terminal output */}
        <div ref={termRef} style={{
          background: "#05050a", border: "1px solid #1a1a2a", borderRadius: 12,
          padding: 16, minHeight: 200, maxHeight: 300, overflowY: "auto",
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11, lineHeight: 1.8,
        }}>
          <div style={{ color: "#ffffff22", marginBottom: 8 }}>
            ELU PEC ENGINE v2.0 — AI RESEARCH TERMINAL
          </div>
          {logs.length === 0 && (
            <div style={{ color: "#ffffff22" }}>
              Type a technology name and press RESEARCH to begin autonomous assessment...
            </div>
          )}
          {logs.map((log, i) => (
            <div key={i} style={{ color: logColors[log.type] || "#fff" }}>
              <span style={{ color: "#ffffff22", marginRight: 8 }}>[{log.ts}]</span>
              {log.type === "cmd" ? "▸ " : log.type === "search" ? "🔍 " : log.type === "error" ? "⚠ " : log.type === "success" ? "✓ " : "  "}
              {log.msg}
            </div>
          ))}
          {(status?.stage === "connecting" || status?.stage === "researching") && (
            <div style={{ color: "#3b82f6", animation: "pulse 1.5s ease-in-out infinite" }}>
              ● {status.message}
            </div>
          )}
        </div>

        {/* Research results */}
        {result && (
          <div style={{ marginTop: 16 }}>
            {/* Score justifications */}
            <div style={{
              background: "#0a0a10", border: "1px solid #1a1a2a", borderRadius: 12,
              padding: 16, marginBottom: 12,
            }}>
              <div style={{ color: "#ffffff55", fontSize: 10, letterSpacing: "0.12em", marginBottom: 12 }}>SCORE JUSTIFICATIONS</div>
              {[
                { label: "P", score: result.p_score, just: result.p_justification, color: getPTier(result.p_score).color, key: "p" },
                { label: "E", score: result.e_score, just: result.e_justification, color: getEBand(result.e_score).color, key: "e" },
                { label: "C", score: result.c_score, just: result.c_justification, color: getCZone(result.c_score).color, key: "c" },
              ].map(item => (
                <div key={item.label} style={{ marginBottom: 12, padding: 12, background: `${item.color}08`, borderRadius: 8, border: `1px solid ${item.color}22` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: item.color, fontWeight: 900, fontSize: 14 }}>{item.label}</span>
                      <span style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>
                        {overrides[item.key] !== undefined ? overrides[item.key] : item.score}
                      </span>
                      {overrides[item.key] !== undefined && (
                        <span style={{ color: "#ffffff33", fontSize: 10, textDecoration: "line-through" }}>{item.score}</span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "#ffffff33", fontSize: 9 }}>OVERRIDE</span>
                      <input
                        type="range" min={1} max={99}
                        value={overrides[item.key] !== undefined ? overrides[item.key] : item.score}
                        onChange={e => {
                          const v = Number(e.target.value);
                          if (v === item.score) {
                            setOverrides(prev => { const n = { ...prev }; delete n[item.key]; return n; });
                          } else {
                            setOverrides(prev => ({ ...prev, [item.key]: v }));
                          }
                        }}
                        style={{ width: 80, accentColor: item.color }}
                      />
                    </div>
                  </div>
                  <div style={{ color: "#ffffff77", fontSize: 11, lineHeight: 1.5 }}>{item.just}</div>
                </div>
              ))}
            </div>

            {/* Intel panel */}
            <div style={{
              background: "#0a0a10", border: "1px solid #1a1a2a", borderRadius: 12,
              padding: 16, marginBottom: 12,
            }}>
              <div style={{ color: "#ffffff55", fontSize: 10, letterSpacing: "0.12em", marginBottom: 12 }}>INTELLIGENCE BRIEF</div>

              {result.summary && (
                <div style={{ color: "#ffffff88", fontSize: 12, lineHeight: 1.6, marginBottom: 16, padding: 12, background: "#08080c", borderRadius: 8, borderLeft: "3px solid #3b82f6" }}>
                  {result.summary}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {result.market_size_current_usd && (
                  <div style={{ padding: 10, background: "#08080c", borderRadius: 8 }}>
                    <div style={{ color: "#ffffff33", fontSize: 8, letterSpacing: "0.12em" }}>MARKET NOW</div>
                    <div style={{ color: "#eab308", fontSize: 14, fontWeight: 800 }}>{result.market_size_current_usd}</div>
                  </div>
                )}
                {result.market_size_projected_usd && (
                  <div style={{ padding: 10, background: "#08080c", borderRadius: 8 }}>
                    <div style={{ color: "#ffffff33", fontSize: 8, letterSpacing: "0.12em" }}>PROJECTED</div>
                    <div style={{ color: "#22c55e", fontSize: 14, fontWeight: 800 }}>{result.market_size_projected_usd}</div>
                  </div>
                )}
                {result.co2_impact && (
                  <div style={{ padding: 10, background: "#08080c", borderRadius: 8, gridColumn: "1 / -1" }}>
                    <div style={{ color: "#ffffff33", fontSize: 8, letterSpacing: "0.12em" }}>CO₂ IMPACT</div>
                    <div style={{ color: "#10b981", fontSize: 14, fontWeight: 800 }}>{result.co2_impact}</div>
                  </div>
                )}
              </div>

              {result.key_players?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ color: "#ffffff33", fontSize: 8, letterSpacing: "0.12em", marginBottom: 6 }}>KEY PLAYERS</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {result.key_players.map((p, i) => (
                      <span key={i} style={{ padding: "3px 8px", borderRadius: 4, background: "#ffffff08", border: "1px solid #ffffff11", color: "#ffffff77", fontSize: 10 }}>{p}</span>
                    ))}
                  </div>
                </div>
              )}

              {result.breakthroughs?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ color: "#ffffff33", fontSize: 8, letterSpacing: "0.12em", marginBottom: 6 }}>RECENT BREAKTHROUGHS</div>
                  {result.breakthroughs.map((b, i) => (
                    <div key={i} style={{ color: "#ffffff66", fontSize: 11, marginBottom: 4, paddingLeft: 12, position: "relative" }}>
                      <span style={{ position: "absolute", left: 0, color: "#22c55e" }}>▸</span> {b}
                    </div>
                  ))}
                </div>
              )}

              {result.risks?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ color: "#ffffff33", fontSize: 8, letterSpacing: "0.12em", marginBottom: 6 }}>RISK FACTORS</div>
                  {result.risks.map((r, i) => (
                    <div key={i} style={{ color: "#ffffff55", fontSize: 11, marginBottom: 4, paddingLeft: 12, position: "relative" }}>
                      <span style={{ position: "absolute", left: 0, color: "#ef4444" }}>⚠</span> {r}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Blockchain JSON toggle */}
            <button onClick={() => setShowJSON(!showJSON)} style={{
              width: "100%", padding: "8px 16px", borderRadius: 8, border: "1px solid #1a1a2a",
              background: "#08080c", color: "#3b82f6", fontSize: 11, fontWeight: 700,
              cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", marginBottom: 12,
              textAlign: "left",
            }}>
              {showJSON ? "▾" : "▸"} BLOCKCHAIN JSON PREVIEW
            </button>

            {showJSON && (
              <pre style={{
                background: "#05050a", border: "1px solid #1a1a2a", borderRadius: 10,
                padding: 14, overflow: "auto", maxHeight: 300, marginBottom: 12,
                color: "#a0a0b0", fontSize: 10, lineHeight: 1.5,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {JSON.stringify(generateBlockchainJSON(previewCard ? { ...previewCard, description: result.description, id: "PREVIEW", research: result } : {}), null, 2)}
              </pre>
            )}

            {/* Mint button */}
            <button onClick={handleMint} style={{
              width: "100%", padding: "14px 24px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #22c55e, #10b981)",
              color: "#000", fontSize: 15, fontWeight: 900, cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.04em",
              boxShadow: "0 4px 20px #22c55e33",
            }}>
              ⚡ MINT THIS CARD
            </button>
            {Object.keys(overrides).length > 0 && (
              <div style={{ color: "#f59e0b", fontSize: 10, textAlign: "center", marginTop: 6 }}>
                ⚠ Human overrides applied — provenance will reflect manual adjustments
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Live card preview */}
      {previewCard && (
        <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <span style={{ color: "#ffffff33", fontSize: 10, letterSpacing: "0.15em" }}>PREVIEW</span>
          <PECCard card={previewCard} size="lg" glowAnim />
          <div style={{ textAlign: "center" }}>
            <div style={{ color: computeRank(computeCMP(previewCard.p, previewCard.e, previewCard.c)).color, fontSize: 20, fontWeight: 900 }}>
              CMP {computeCMP(previewCard.p, previewCard.e, previewCard.c).toLocaleString()}
            </div>
            <div style={{ color: "#ffffff33", fontSize: 10 }}>
              {((computeCMP(previewCard.p, previewCard.e, previewCard.c) / CMP_MAX) * 100).toFixed(1)}% of max
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── STATS DASHBOARD ─────────────────────────────────────────

function StatsDashboard({ cards }) {
  if (cards.length === 0) return null;
  const avgP = Math.round(cards.reduce((s, c) => s + c.p, 0) / cards.length);
  const avgE = Math.round(cards.reduce((s, c) => s + c.e, 0) / cards.length);
  const avgC = Math.round(cards.reduce((s, c) => s + c.c, 0) / cards.length);
  const totalCMP = Math.round(cards.reduce((s, c) => s + computeCMP(c.p, c.e, c.c), 0));
  const maxCard = cards.reduce((best, c) => computeCMP(c.p, c.e, c.c) > computeCMP(best.p, best.e, best.c) ? c : best);
  const aiCount = cards.filter(c => c.research).length;

  const stats = [
    { label: "CARDS", value: cards.length, color: "#fff" },
    { label: "TOTAL CMP", value: totalCMP.toLocaleString(), color: "#eab308" },
    { label: "TOP", value: maxCard.name, sub: `CMP ${computeCMP(maxCard.p, maxCard.e, maxCard.c).toLocaleString()}`, color: computeRank(computeCMP(maxCard.p, maxCard.e, maxCard.c)).color },
    { label: "AVG P/E/C", value: `${avgP}/${avgE}/${avgC}`, color: "#3b82f6" },
    { label: "AI RESEARCHED", value: aiCount, sub: `${cards.length - aiCount} manual`, color: "#a855f7" },
  ];

  return (
    <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, marginBottom: 20 }}>
      {stats.map(s => (
        <div key={s.label} style={{ flex: "1 0 120px", padding: "10px 14px", borderRadius: 10, background: "#0a0a10", border: "1px solid #1a1a2a" }}>
          <div style={{ color: "#ffffff33", fontSize: 8, letterSpacing: "0.12em" }}>{s.label}</div>
          <div style={{ color: s.color, fontSize: 14, fontWeight: 800, marginTop: 2, fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.value}</div>
          {s.sub && <div style={{ color: "#ffffff22", fontSize: 9, marginTop: 1 }}>{s.sub}</div>}
        </div>
      ))}
    </div>
  );
}

// ─── CARD DETAIL MODAL ───────────────────────────────────────

function CardDetail({ card, onClose, onDelete }) {
  const pTier = getPTier(card.p);
  const eBand = getEBand(card.e);
  const cZone = getCZone(card.c);
  const cmp = computeCMP(card.p, card.e, card.c);
  const rank = computeRank(cmp);
  const [showJSON, setShowJSON] = useState(false);
  const [copied, setCopied] = useState(false);

  const jsonStr = JSON.stringify(generateBlockchainJSON(card), null, 2);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)",
      backdropFilter: "blur(16px)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: "#0d0d12", borderRadius: 20, maxWidth: 920, width: "100%",
        maxHeight: "92vh", overflow: "auto", border: `1px solid ${eBand.color}33`,
        padding: 28, boxShadow: `0 0 80px ${eBand.color}11`,
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
          <div style={{ flex: "0 0 auto" }}><PECCard card={card} size="lg" /></div>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div>
                <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 900, margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>{card.name}</h2>
                <div style={{ color: "#ffffff44", fontSize: 11, marginTop: 4 }}>
                  {card.sector} • {card.creator || "Unknown"}
                  {card.ai_model && <span style={{ color: "#3b82f6", marginLeft: 8 }}>● {card.ai_model}</span>}
                  {card.research && !card.ai_model && <span style={{ color: "#3b82f6", marginLeft: 8 }}>● AI Researched</span>}
                </div>
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: 22, cursor: "pointer" }}>✕</button>
            </div>

            {card.description && <p style={{ color: "#ffffff77", fontSize: 12, lineHeight: 1.6, marginTop: 10 }}>{card.description}</p>}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 16 }}>
              {[
                { label: "POTENTIAL", sub: pTier.name, value: card.p, color: pTier.color },
                { label: "EXISTENCE", sub: eBand.trl, value: card.e, color: eBand.color },
                { label: "CLIMATE", sub: cZone.label, value: card.c, color: cZone.color },
              ].map(v => (
                <div key={v.label} style={{ padding: 12, borderRadius: 8, background: `${v.color}08`, border: `1px solid ${v.color}22` }}>
                  <div style={{ color: "#ffffff33", fontSize: 8, letterSpacing: "0.12em" }}>{v.label}</div>
                  <div style={{ color: v.color, fontSize: 24, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace" }}>{v.value}</div>
                  <div style={{ color: v.color, fontSize: 9, opacity: 0.6 }}>{v.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 14, padding: 12, borderRadius: 8, background: "#08080c", border: "1px solid #1a1a2a" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ color: "#ffffff33", fontSize: 8, letterSpacing: "0.12em" }}>COMBINED MINING POWER</div>
                  <div style={{ color: rank.color, fontSize: 28, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace" }}>{cmp.toLocaleString()}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#ffffff33", fontSize: 8, letterSpacing: "0.12em" }}>RANK</div>
                  <div style={{ color: rank.color, fontSize: 24, fontWeight: 900 }}>{rank.rank} <span style={{ fontSize: 11, opacity: 0.7 }}>{rank.label}</span></div>
                </div>
              </div>
              <div style={{ marginTop: 8, height: 5, borderRadius: 3, background: "#1a1a1e" }}>
                <div style={{ width: `${(cmp / CMP_MAX) * 100}%`, height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${rank.color}66, ${rank.color})` }} />
              </div>
              <div style={{ color: "#ffffff88", fontSize: 10, marginTop: 8, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6 }}>
                BMP = {card.p} × {card.e} = {card.p * card.e} | CR = {card.c}/33 = {(card.c / 33).toFixed(3)} | CMP = {cmp.toLocaleString()}
              </div>
            </div>

            {/* Research data if present */}
            {card.research && (
              <div style={{ marginTop: 14 }}>
                {card.research.summary && (
                  <div style={{ padding: 12, background: "#08080c", borderRadius: 8, borderLeft: "3px solid #3b82f6", marginBottom: 10 }}>
                    <div style={{ color: "#ffffff33", fontSize: 8, letterSpacing: "0.12em", marginBottom: 4 }}>AI RESEARCH SUMMARY</div>
                    <div style={{ color: "#ffffff77", fontSize: 11, lineHeight: 1.6 }}>{card.research.summary}</div>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {card.research.market_current && (
                    <div style={{ padding: 8, background: "#08080c", borderRadius: 6 }}>
                      <div style={{ color: "#ffffff22", fontSize: 7, letterSpacing: "0.12em" }}>MARKET</div>
                      <div style={{ color: "#eab308", fontSize: 12, fontWeight: 800 }}>{card.research.market_current} → {card.research.market_projected}</div>
                    </div>
                  )}
                  {card.research.co2_impact && (
                    <div style={{ padding: 8, background: "#08080c", borderRadius: 6 }}>
                      <div style={{ color: "#ffffff22", fontSize: 7, letterSpacing: "0.12em" }}>CO₂</div>
                      <div style={{ color: "#10b981", fontSize: 12, fontWeight: 800 }}>{card.research.co2_impact}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* JSON export */}
            <button onClick={() => setShowJSON(!showJSON)} style={{
              width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #1a1a2a",
              background: "#08080c", color: "#3b82f6", fontSize: 10, fontWeight: 700,
              cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", marginTop: 12,
              textAlign: "left",
            }}>
              {showJSON ? "▾" : "▸"} BLOCKCHAIN JSON
            </button>
            {showJSON && (
              <div style={{ position: "relative", marginTop: 8 }}>
                <button onClick={() => { navigator.clipboard?.writeText(jsonStr); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{
                  position: "absolute", top: 8, right: 8, padding: "4px 10px", borderRadius: 4,
                  border: "1px solid #2a2a3a", background: copied ? "#22c55e22" : "#0d0d12",
                  color: copied ? "#22c55e" : "#666", fontSize: 10, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", zIndex: 2,
                }}>{copied ? "✓" : "COPY"}</button>
                <pre style={{
                  background: "#05050a", border: "1px solid #1a1a2a", borderRadius: 8,
                  padding: 12, overflow: "auto", maxHeight: 250,
                  color: "#a0a0b0", fontSize: 9, lineHeight: 1.5, fontFamily: "'JetBrains Mono', monospace",
                }}>{jsonStr}</pre>
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={onClose} style={{
                flex: 1, padding: "10px", borderRadius: 8, border: "1px solid #2a2a3a",
                background: "transparent", color: "#888", fontSize: 12, cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
              }}>CLOSE</button>
              <button onClick={() => { onDelete(card.id); }} style={{
                padding: "10px 20px", borderRadius: 8, border: "1px solid #ef444444",
                background: "transparent", color: "#ef4444", fontSize: 12, cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
              }}>DELETE</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MANUAL CARD CREATOR ─────────────────────────────────────

function ManualCreator({ onSave, onCancel }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [sector, setSector] = useState(TECH_SECTORS[0]);
  const [icon, setIcon] = useState("⚡");
  const [p, setP] = useState(50);
  const [e, setE] = useState(50);
  const [c, setC] = useState(50);
  const [creator, setCreator] = useState("");

  // Required justifications (API-less mode)
  const [pJustification, setPJustification] = useState("");
  const [eJustification, setEJustification] = useState("");
  const [cJustification, setCJustification] = useState("");
  const [sources, setSources] = useState("");
  const [showGuides, setShowGuides] = useState(true);

  const card = {
    name: name || "Untitled",
    description: desc,
    sector,
    icon,
    p,
    e,
    c,
    creator: creator || "Community Researcher",
    research: {
      p_justification: pJustification,
      e_justification: eJustification,
      c_justification: cJustification,
      sources: sources.split('\n').filter(s => s.trim()),
      mode: "manual",
    }
  };
  const cmp = computeCMP(p, e, c);
  const rank = computeRank(cmp);

  // Validation
  const isValid = name.trim().length >= 3 &&
    pJustification.trim().length >= 20 &&
    eJustification.trim().length >= 20 &&
    cJustification.trim().length >= 20 &&
    sources.trim().length > 0;

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 8,
    border: "1px solid #2a2a3a", background: "#0d0d12", color: "#fff",
    fontSize: 13, fontFamily: "'JetBrains Mono', monospace", outline: "none", boxSizing: "border-box",
  };

  const labelStyle = { color: "#ffffff55", fontSize: 10, letterSpacing: "0.1em", display: "block", marginBottom: 4 };
  const requiredStyle = { color: "#ef4444", marginLeft: 4, fontSize: 10 };

  // Inline scoring guides
  const GUIDES = {
    P: [
      { range: "1-20", tier: "Common", desc: "Niche market, limited growth potential" },
      { range: "21-40", tier: "Uncommon", desc: "Emerging sector, early adoption" },
      { range: "41-60", tier: "Rare", desc: "Growing market, established players" },
      { range: "61-80", tier: "Epic", desc: "Major industry, strong growth trajectory" },
      { range: "81-99", tier: "Legendary", desc: "Civilization-scale impact potential" },
    ],
    E: [
      { range: "1-11", tier: "TRL 1", desc: "Basic principles observed" },
      { range: "12-22", tier: "TRL 2", desc: "Concept formulated" },
      { range: "23-33", tier: "TRL 3", desc: "Proof of concept" },
      { range: "34-44", tier: "TRL 4", desc: "Lab validated" },
      { range: "45-55", tier: "TRL 5", desc: "Relevant environment validated" },
      { range: "56-66", tier: "TRL 6", desc: "Demonstrated in environment" },
      { range: "67-77", tier: "TRL 7", desc: "Prototype operational" },
      { range: "78-88", tier: "TRL 8", desc: "System qualified" },
      { range: "89-99", tier: "TRL 9", desc: "Proven operational at scale" },
    ],
    C: [
      { range: "1-33", tier: "Carbon Positive", desc: "Net emitter of CO₂" },
      { range: "34-66", tier: "Carbon Neutral", desc: "Net zero emissions" },
      { range: "67-99", tier: "Carbon Negative", desc: "Net sequestration of CO₂" },
    ],
  };

  const renderGuide = (key, val) => {
    const guide = GUIDES[key];
    return (
      <div style={{ marginTop: 6, fontSize: 9, color: "#ffffff44", lineHeight: 1.5 }}>
        {guide.map(g => {
          const [lo, hi] = g.range.split('-').map(Number);
          const isActive = val >= lo && val <= hi;
          return (
            <div key={g.range} style={{
              padding: "2px 6px",
              marginBottom: 2,
              borderRadius: 3,
              background: isActive ? "#ffffff08" : "transparent",
              border: isActive ? "1px solid #ffffff22" : "1px solid transparent",
              color: isActive ? "#fff" : "#ffffff44",
            }}>
              <span style={{ fontWeight: 700, marginRight: 6 }}>{g.range}</span>
              <span style={{ color: isActive ? "#22c55e" : "#ffffff55" }}>{g.tier}</span> — {g.desc}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
      {/* Left: Form */}
      <div style={{ flex: "1 1 480px", minWidth: 340 }}>
        {/* Header */}
        <div style={{
          padding: 12, marginBottom: 16, borderRadius: 8,
          background: "linear-gradient(90deg, #3b82f622, #10b98122)",
          border: "1px solid #3b82f644",
        }}>
          <div style={{ color: "#3b82f6", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
            📝 MANUAL RESEARCH MODE (API-Less)
          </div>
          <div style={{ color: "#ffffff77", fontSize: 10, lineHeight: 1.5 }}>
            Submit your own technology assessment. All fields with <span style={{ color: "#ef4444" }}>*</span> are required for community validation.
            Provide justifications and cite your sources.
          </div>
        </div>

        {/* Basic Info */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>TECHNOLOGY NAME<span style={requiredStyle}>* (min 3 chars)</span></label>
          <input
            style={{ ...inputStyle, borderColor: name.length < 3 && name.length > 0 ? "#ef4444" : "#2a2a3a" }}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Perovskite Solar Cells"
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>DESCRIPTION</label>
          <textarea style={{ ...inputStyle, minHeight: 50, resize: "vertical" }} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief overview of the technology" />
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>SECTOR</label>
            <select style={inputStyle} value={sector} onChange={e => { setSector(e.target.value); setIcon(SECTOR_ICONS[e.target.value] || "⚡"); }}>
              {TECH_SECTORS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ width: 70 }}>
            <label style={labelStyle}>ICON</label>
            <input style={{ ...inputStyle, textAlign: "center", fontSize: 20 }} value={icon} onChange={e => setIcon(e.target.value)} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>RESEARCHER / ORGANIZATION</label>
          <input style={inputStyle} value={creator} onChange={e => setCreator(e.target.value)} placeholder="Your name or organization" />
        </div>

        {/* Toggle Guides */}
        <button
          onClick={() => setShowGuides(!showGuides)}
          style={{
            width: "100%", padding: 8, marginBottom: 14, borderRadius: 6,
            border: "1px solid #2a2a3a", background: "#0a0a10",
            color: "#ffffff77", fontSize: 10, cursor: "pointer",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {showGuides ? "▾ HIDE" : "▸ SHOW"} SCORING GUIDES
        </button>

        {/* P Score */}
        <div style={{ padding: 14, background: "#0a0a10", borderRadius: 10, border: "1px solid #1a1a2a", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: getPTier(p).color, fontSize: 11, fontWeight: 700 }}>POTENTIAL (P) — Market Size & Growth</span>
            <span style={{ color: "#fff", fontSize: 18, fontWeight: 900 }}>{p}</span>
          </div>
          <input type="range" min={1} max={99} value={p} onChange={ev => setP(Number(ev.target.value))} style={{ width: "100%", accentColor: getPTier(p).color }} />
          <div style={{ color: getPTier(p).color, fontSize: 10, marginTop: 4 }}>{getPTier(p).name}</div>
          {showGuides && renderGuide('P', p)}
          <div style={{ marginTop: 10 }}>
            <label style={labelStyle}>P JUSTIFICATION<span style={requiredStyle}>* (min 20 chars)</span></label>
            <textarea
              style={{ ...inputStyle, minHeight: 60, resize: "vertical", borderColor: pJustification.length < 20 && pJustification.length > 0 ? "#ef4444" : "#2a2a3a" }}
              value={pJustification}
              onChange={e => setPJustification(e.target.value)}
              placeholder="Explain why this Potential score is justified based on market data, growth projections, and addressable market size..."
            />
            <div style={{ color: "#ffffff44", fontSize: 9, marginTop: 2 }}>{pJustification.length}/20 min chars</div>
          </div>
        </div>

        {/* E Score */}
        <div style={{ padding: 14, background: "#0a0a10", borderRadius: 10, border: "1px solid #1a1a2a", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: getEBand(e).color, fontSize: 11, fontWeight: 700 }}>EXISTENCE (E) — Technology Readiness Level</span>
            <span style={{ color: "#fff", fontSize: 18, fontWeight: 900 }}>{e}</span>
          </div>
          <input type="range" min={1} max={99} value={e} onChange={ev => setE(Number(ev.target.value))} style={{ width: "100%", accentColor: getEBand(e).color }} />
          <div style={{ color: getEBand(e).color, fontSize: 10, marginTop: 4 }}>{getEBand(e).trl} — {getEBand(e).label}</div>
          {showGuides && renderGuide('E', e)}
          <div style={{ marginTop: 10 }}>
            <label style={labelStyle}>E JUSTIFICATION<span style={requiredStyle}>* (min 20 chars)</span></label>
            <textarea
              style={{ ...inputStyle, minHeight: 60, resize: "vertical", borderColor: eJustification.length < 20 && eJustification.length > 0 ? "#ef4444" : "#2a2a3a" }}
              value={eJustification}
              onChange={e => setEJustification(e.target.value)}
              placeholder="Explain the technology readiness level: What stage is it at? Lab, pilot, or commercial? Reference demos, patents, or deployments..."
            />
            <div style={{ color: "#ffffff44", fontSize: 9, marginTop: 2 }}>{eJustification.length}/20 min chars</div>
          </div>
        </div>

        {/* C Score */}
        <div style={{ padding: 14, background: "#0a0a10", borderRadius: 10, border: "1px solid #1a1a2a", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: getCZone(c).color, fontSize: 11, fontWeight: 700 }}>CLIMATE (C) — Carbon Impact</span>
            <span style={{ color: "#fff", fontSize: 18, fontWeight: 900 }}>{c}</span>
          </div>
          <input type="range" min={1} max={99} value={c} onChange={ev => setC(Number(ev.target.value))} style={{ width: "100%", accentColor: getCZone(c).color }} />
          <div style={{ color: getCZone(c).color, fontSize: 10, marginTop: 4 }}>{getCZone(c).label} — {getCZone(c).desc}</div>
          {showGuides && renderGuide('C', c)}
          <div style={{ marginTop: 10 }}>
            <label style={labelStyle}>C JUSTIFICATION<span style={requiredStyle}>* (min 20 chars)</span></label>
            <textarea
              style={{ ...inputStyle, minHeight: 60, resize: "vertical", borderColor: cJustification.length < 20 && cJustification.length > 0 ? "#ef4444" : "#2a2a3a" }}
              value={cJustification}
              onChange={e => setCJustification(e.target.value)}
              placeholder="Explain the carbon impact: Does it reduce, prevent, or sequester CO₂? Reference lifecycle analyses or carbon accounting studies..."
            />
            <div style={{ color: "#ffffff44", fontSize: 9, marginTop: 2 }}>{cJustification.length}/20 min chars</div>
          </div>
        </div>

        {/* Sources */}
        <div style={{ padding: 14, background: "#0a0a10", borderRadius: 10, border: "1px solid #3b82f633", marginBottom: 14 }}>
          <label style={labelStyle}>SOURCES<span style={requiredStyle}>* (one URL per line)</span></label>
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: "vertical", borderColor: sources.trim().length === 0 ? "#ef4444" : "#2a2a3a" }}
            value={sources}
            onChange={e => setSources(e.target.value)}
            placeholder="https://example.com/market-report&#10;https://doi.org/10.1234/paper&#10;https://news.example.com/article"
          />
          <div style={{ color: "#ffffff44", fontSize: 9, marginTop: 4 }}>
            Provide URLs to reports, papers, news articles, or data sources that support your assessment.
          </div>
        </div>

        {/* CMP Summary */}
        <div style={{ padding: 14, background: "#08080c", borderRadius: 10, border: "1px solid #1a1a2a", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "#ffffff44", fontSize: 8, letterSpacing: "0.12em" }}>COMBINED MINING POWER</div>
              <div style={{ color: rank.color, fontSize: 28, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace" }}>{cmp.toLocaleString()}</div>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: `linear-gradient(135deg, ${rank.color}, ${rank.color}66)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#000" }}>{rank.rank}</div>
          </div>
          <div style={{ marginTop: 8, height: 5, borderRadius: 3, background: "#1a1a1e" }}>
            <div style={{ width: `${(cmp / CMP_MAX) * 100}%`, height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${rank.color}66, ${rank.color})` }} />
          </div>
        </div>

        {/* Validation Status */}
        {!isValid && (
          <div style={{ padding: 10, marginBottom: 14, borderRadius: 6, background: "#ef444411", border: "1px solid #ef444433", color: "#ef4444", fontSize: 10 }}>
            ⚠️ Required: Name (3+ chars), all justifications (20+ chars each), and at least one source URL.
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onSave(card)}
            disabled={!isValid}
            style={{
              flex: 1, padding: "14px", borderRadius: 8, border: "none",
              background: isValid ? "linear-gradient(135deg, #22c55e, #10b981)" : "#333",
              color: isValid ? "#000" : "#666",
              fontSize: 13, fontWeight: 800,
              cursor: isValid ? "pointer" : "not-allowed",
              fontFamily: "'JetBrains Mono', monospace",
              opacity: isValid ? 1 : 0.5,
            }}
          >
            {isValid ? "✓ SUBMIT FOR VALIDATION" : "⊘ FILL REQUIRED FIELDS"}
          </button>
          <button onClick={onCancel} style={{
            padding: "14px 20px", borderRadius: 8, border: "1px solid #333",
            background: "transparent", color: "#888", fontSize: 13, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
          }}>CANCEL</button>
        </div>
      </div>

      {/* Right: Preview */}
      <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <span style={{ color: "#ffffff33", fontSize: 10, letterSpacing: "0.15em" }}>PREVIEW</span>
        <PECCard card={card} size="lg" />
        <div style={{ color: "#ffffff44", fontSize: 9, textAlign: "center", maxWidth: 280 }}>
          This card will be submitted for community validation. Validators will verify your justifications against your cited sources.
        </div>
      </div>
    </div>
  );
}



// ─── API KEY SETTINGS MODAL ──────────────────────────────────

function APIKeySettings({ onClose }) {
  const [key, setKey] = useState(getGeminiKey());
  const [testResult, setTestResult] = useState(null);
  const [showKey, setShowKey] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const testApiKey = async () => {
    if (!key.trim()) return;
    setTestResult("testing");
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key.trim() },
          body: JSON.stringify({ contents: [{ parts: [{ text: "Reply with only: OK" }] }] })
        }
      );
      setTestResult(resp.ok ? "success" : "error");
      if (resp.ok) localStorage.setItem(AI_PROVIDER.lsKey, key.trim());
    } catch { setTestResult("error"); }
  };

  const handleSave = () => {
    if (key.trim()) localStorage.setItem(AI_PROVIDER.lsKey, key.trim());
    else localStorage.removeItem(AI_PROVIDER.lsKey);
    onClose();
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      // Auto-cancel after 3 seconds if user doesn't confirm
      setTimeout(() => setConfirmReset(false), 3000);
      return;
    }
    // Second click — actually reset
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'JetBrains Mono', monospace" }}>
      <div style={{ maxWidth: 480, width: "100%", borderRadius: 16, border: "1px solid #3b82f644", background: "#0d0d12", padding: 28, boxShadow: "0 16px 64px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#3b82f6" }}>⚙️ API Key Settings</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#ffffff44", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ color: "#ffffff66", fontSize: 11, marginBottom: 16, lineHeight: 1.6 }}>
          {AI_PROVIDER.icon} <strong>{AI_PROVIDER.name}</strong> — Get your free key at{" "}
          <a href={AI_PROVIDER.studioUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6" }}>{AI_PROVIDER.studioLabel}</a>
        </div>

        <div style={{ position: "relative", marginBottom: 12 }}>
          <input
            type={showKey ? "text" : "password"} value={key}
            onChange={e => { setKey(e.target.value); setTestResult(null); }}
            placeholder="AIzaSy... (paste your Google key)"
            style={{ width: "100%", padding: "12px 50px 12px 14px", borderRadius: 8, border: `2px solid ${testResult === "success" ? "#22c55e" : testResult === "error" ? "#ef4444" : "#2a2a3a"}`, background: "#0a0a10", color: "#fff", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", outline: "none", boxSizing: "border-box" }}
          />
          <button onClick={() => setShowKey(!showKey)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#ffffff44", fontSize: 16, cursor: "pointer" }}>{showKey ? "🙈" : "👁️"}</button>
        </div>

        {testResult === "success" && <div style={{ padding: "8px 14px", borderRadius: 6, background: "#22c55e15", border: "1px solid #22c55e44", color: "#22c55e", fontSize: 11, fontWeight: 700, marginBottom: 12 }}>✅ Connection successful!</div>}
        {testResult === "error" && <div style={{ padding: "8px 14px", borderRadius: 6, background: "#ef444415", border: "1px solid #ef444444", color: "#ef4444", fontSize: 11, marginBottom: 12 }}>❌ Key rejected. Check your key and try again.</div>}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={testApiKey} disabled={!key.trim() || testResult === "testing"} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #3b82f644", background: "transparent", color: key.trim() ? "#3b82f6" : "#555", fontSize: 11, fontWeight: 700, cursor: key.trim() ? "pointer" : "default", fontFamily: "'JetBrains Mono', monospace" }}>
            {testResult === "testing" ? "⏳ TESTING..." : "🔬 TEST KEY"}
          </button>
          <button onClick={handleSave} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #22c55e, #10b981)", color: "#000", fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace" }}>
            💾 SAVE
          </button>
        </div>

        <div style={{ color: "#ffffff22", fontSize: 9, marginTop: 16, textAlign: "center" }}>💡 Your API key is stored only in your browser. It never leaves your device.</div>

        {/* Reset Section — two-step inline confirmation, no native dialog */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #ef444422" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "#ef4444", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" }}>🗑️ RESET APP</div>
              <div style={{ color: "#ffffff33", fontSize: 9, marginTop: 2 }}>Clears all cards, keys, and settings</div>
            </div>
            <button onClick={handleReset} style={{
              padding: "8px 16px", borderRadius: 6,
              border: confirmReset ? "1px solid #ef4444" : "1px solid #ef444444",
              background: confirmReset ? "#ef4444" : "transparent",
              color: confirmReset ? "#fff" : "#ef4444",
              fontSize: 10, fontWeight: 700,
              cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
              transition: "all 0.2s",
            }}>{confirmReset ? "⚠ CONFIRM DELETE" : "RESET"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────

export default function PECEngineV2({ initialTab = "research", onNavigateHome }) {
  const [cards, setCards] = useState(() => loadCards());
  const [view, setView] = useState(initialTab);
  const [selectedCard, setSelectedCard] = useState(null);
  const [sortBy, setSortBy] = useState("cmp");
  const [lastModel, setLastModel] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // Persist cards whenever they change
  useEffect(() => { saveCards(cards); }, [cards]);
  const [filterSector, setFilterSector] = useState("All");
  const [recentMint, setRecentMint] = useState(null);

  const sortedCards = useMemo(() => {
    let f = filterSector === "All" ? cards : cards.filter(c => c.sector === filterSector);
    return [...f].sort((a, b) => {
      if (sortBy === "cmp") return computeCMP(b.p, b.e, b.c) - computeCMP(a.p, a.e, a.c);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return b[sortBy] - a[sortBy];
    });
  }, [cards, sortBy, filterSector]);

  const handleMintFromResearch = useCallback(async (card) => {
    setCards(prev => [card, ...prev]);
    setRecentMint(card.id);
    if (card.ai_model) setLastModel(card.ai_model);
    setView("gallery");
    setTimeout(() => setRecentMint(null), 3000);

    // Log to audit trail
    try {
      const auditRecord = await generateAuditRecord(card);
      saveAuditRecord(auditRecord);
    } catch (e) {
      console.error("[AUDIT] Failed to generate audit record:", e);
    }
  }, []);

  const handleManualSave = useCallback((card) => {
    const newCard = { ...card, id: `ELU-${Date.now().toString(36).toUpperCase()}`, created_at: new Date().toISOString() };
    setCards(prev => [newCard, ...prev]);
    setRecentMint(newCard.id);
    setView("gallery");
    setTimeout(() => setRecentMint(null), 3000);
  }, []);

  const handleExportAll = useCallback(() => {
    const all = cards.map(c => generateBlockchainJSON(c));
    downloadJSON(all, `ELU_PEC_Collection_${new Date().toISOString().slice(0, 10)}.json`);
  }, [cards]);

  const usedSectors = useMemo(() => ["All", ...new Set(cards.map(c => c.sector))].sort(), [cards]);

  const navBtn = (key, label, icon) => (
    <button onClick={() => setView(key)} style={{
      padding: "8px 14px", borderRadius: 8,
      border: view === key ? "1px solid #ffffff22" : "1px solid transparent",
      background: view === key ? "#ffffff08" : "transparent",
      color: view === key ? "#fff" : "#555", fontSize: 11, fontWeight: 700,
      cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
      display: "flex", alignItems: "center", gap: 5,
    }}>
      <span>{icon}</span> {label}
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#08080c", color: "#fff", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", padding: "0 20px 40px" }}>
      <style>{`
        @keyframes cardGlow { 0%,100% { filter: brightness(1); } 50% { filter: brightness(1.15); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes mintFlash { 0% { box-shadow: 0 0 60px #22c55e88; } 100% { box-shadow: none; } }
        input[type="range"] { height: 4px; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a10; }
        ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "20px 0 16px", borderBottom: "1px solid #1a1a2a", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 24, cursor: onNavigateHome ? "pointer" : "default" }} onClick={onNavigateHome} title="Back to Homepage">🌍</span>
              <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
                PEC <span style={{ color: "#22c55e" }}>CARD</span> ENGINE <span style={{ color: "#3b82f6", fontSize: 12 }}>v2</span>
              </h1>
            </div>
            <div style={{ color: "#ffffff22", fontSize: 9, marginTop: 2, letterSpacing: "0.12em" }}>
              EARTH LOVE UNITED • AI-POWERED TECHNOLOGY GRADING • BSC: 0x2553...60a0
            </div>
          </div>
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            {navBtn("research", "AI RESEARCH", "🔬")}
            {navBtn("gallery", "GALLERY", "🃏")}
            {navBtn("manual", "MANUAL", "✏️")}

            {cards.length > 0 && (
              <button onClick={handleExportAll} style={{
                padding: "8px 14px", borderRadius: 8, border: "1px solid #3b82f633",
                background: "transparent", color: "#3b82f6", fontSize: 11, fontWeight: 700,
                cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
              }}>⎘ EXPORT ALL</button>
            )}
            <button onClick={exportAuditLog} style={{
              padding: "8px 14px", borderRadius: 8, border: "1px solid #10b98133",
              background: "transparent", color: "#10b981", fontSize: 11, fontWeight: 700,
              cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
            }}>🔐 AUDIT LOG</button>
            <button onClick={() => setShowSettings(true)} style={{
              padding: "8px 14px", borderRadius: 8, border: "1px solid #ffffff22",
              background: "transparent", color: "#ffffff55", fontSize: 11, fontWeight: 700,
              cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
            }}>⚙️ SETTINGS</button>
            {onNavigateHome && (
              <button onClick={onNavigateHome} style={{
                padding: "8px 14px", borderRadius: 8, border: "1px solid #ffffff22",
                background: "transparent", color: "#ffffff55", fontSize: 11, fontWeight: 700,
                cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
              }}>🏠 HOME</button>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && <APIKeySettings onClose={() => setShowSettings(false)} />}

      {/* Views — ResearchTerminal stays mounted to preserve state */}
      <div style={{ display: view === "research" ? "block" : "none" }}>
        <ResearchTerminal onMint={handleMintFromResearch} />
      </div>

      {view === "gallery" && (
        <>
          <StatsDashboard cards={cards} />
          {cards.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 6 }}>
              <div style={{ display: "flex", gap: 3 }}>
                {["cmp", "name", "p", "e", "c"].map(s => (
                  <button key={s} onClick={() => setSortBy(s)} style={{
                    padding: "3px 8px", borderRadius: 4, border: "1px solid #1a1a2a",
                    background: sortBy === s ? "#ffffff0a" : "transparent",
                    color: sortBy === s ? "#fff" : "#444", fontSize: 9, cursor: "pointer",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>{s.toUpperCase()}</button>
                ))}
              </div>
              {usedSectors.length > 2 && (
                <select value={filterSector} onChange={e => setFilterSector(e.target.value)} style={{
                  padding: "5px 8px", borderRadius: 5, border: "1px solid #1a1a2a",
                  background: "#0d0d12", color: "#888", fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {usedSectors.map(s => <option key={s}>{s}</option>)}
                </select>
              )}
            </div>
          )}
          {cards.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", border: "1px dashed #1a1a2a", borderRadius: 16 }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🔬</div>
              <div style={{ color: "#ffffff44", fontSize: 15, fontWeight: 700, marginBottom: 6 }}>No Cards Minted Yet</div>
              <div style={{ color: "#ffffff22", fontSize: 11, maxWidth: 380, margin: "0 auto", lineHeight: 1.6 }}>
                Use the AI Research tab to autonomously research and grade any sustainable technology, or mint cards manually.
              </div>
              <button onClick={() => setView("research")} style={{
                marginTop: 20, padding: "10px 24px", borderRadius: 8, border: "none",
                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
              }}>🔬 START RESEARCHING</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
              {sortedCards.map(card => (
                <div key={card.id} style={{ animation: recentMint === card.id ? "mintFlash 1s ease-out" : undefined }}>
                  <PECCard card={card} onClick={() => setSelectedCard(card)} glowAnim={recentMint === card.id} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view === "manual" && <ManualCreator onSave={handleManualSave} onCancel={() => setView("gallery")} />}


      {selectedCard && <CardDetail card={selectedCard} onClose={() => setSelectedCard(null)} onDelete={(id) => { setCards(prev => prev.filter(c => c.id !== id)); setSelectedCard(null); }} />}

      <div style={{ marginTop: 40, paddingTop: 12, borderTop: "1px solid #1a1a2a", display: "flex", justifyContent: "space-between", color: "#ffffff18", fontSize: 9, letterSpacing: "0.1em" }}>
        <span>ELU PEC ENGINE v{ELU_SCHEMA_VERSION} • earthloveunited.org</span>
        <span>MAX CMP {CMP_MAX.toLocaleString()} • AI: {lastModel ? lastModel.toUpperCase() : AI_PROVIDER.name.toUpperCase()}</span>
      </div>
    </div>
  );
}
