// ═══════════════════════════════════════════════════════════════
// GEMINI PROVIDER — Agent Adapter for Google Gemini
// Part of the ELU PEC Engine Zero-Claw Backbone
// ═══════════════════════════════════════════════════════════════

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── RAW GEMINI API CALL ─────────────────────────────────────

async function callGemini(apiKey, prompt, useGrounding, model = "gemini-2.0-flash") {
    const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4000 },
    };
    if (useGrounding) body.tools = [{ google_search: {} }];

    return fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
            body: JSON.stringify(body),
        }
    );
}

// ─── PARSE GEMINI RESPONSE ───────────────────────────────────

function parseGeminiResponse(data) {
    const candidates = data.candidates || [];
    const textParts = candidates[0]?.content?.parts?.filter(p => p.text) || [];
    return textParts.map(p => p.text).join("\n");
}

// ─── PROVIDER EXPORT ─────────────────────────────────────────

export const geminiProvider = {
    id: "gemini",
    name: "Gemini 2.0 Flash",
    icon: "✨",
    keyPlaceholder: "AIzaSy... (paste your Google key)",
    keyStorageKey: "elu_gemini_api_key",
    getKeyUrl: "https://aistudio.google.com/apikey",
    getKeyLabel: "Google AI Studio",

    // ── Get stored API key ──
    getKey() {
        return localStorage.getItem(this.keyStorageKey) || "";
    },

    // ── Save API key ──
    saveKey(key) {
        if (key) localStorage.setItem(this.keyStorageKey, key.trim());
        else localStorage.removeItem(this.keyStorageKey);
    },

    // ── Test if key is valid → "success" | "free" | "error" ──
    async testKey(key) {
        if (!key.trim()) return "error";
        try {
            const resp = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-goog-api-key": key.trim() },
                    body: JSON.stringify({ contents: [{ parts: [{ text: "Reply with only: OK" }] }] }),
                }
            );
            if (resp.ok) return "success";
            if (resp.status === 429) return "free"; // 429 = key valid, rate limited
            return "error";
        } catch {
            return "error";
        }
    },

    // ── Run PEC research with Power/Free mode cascade ──
    async research(techQuery, systemPrompt, extractJSON, onProgress) {
        const apiKey = this.getKey();
        if (!apiKey) {
            throw new Error("No API key found. Use ⚙️ Settings to add your Google API key.");
        }

        const userPrompt = `${systemPrompt}\n\n---\n\nResearch this sustainable technology thoroughly and provide a PEC assessment: "${techQuery}"\n\nSearch for current market data, recent developments, key companies, carbon impact studies, and technology readiness information. Be thorough — this assessment will be used for investment grading.`;

        // ── ATTEMPT 1: Power Mode (grounded search) ──
        onProgress({ stage: "researching", message: "⚡ Power Mode — researching with Google Search..." });
        let response = await callGemini(apiKey, userPrompt, true);

        let mode = "power";
        let freeModelUsed = "gemini-2.0-flash";

        // ── If 429: switch to Free Mode (cascade through model families) ──
        if (response.status === 429) {
            mode = "free";
            onProgress({ stage: "researching", message: "🆓 Free tier detected — trying without search grounding..." });
            await sleep(1000);

            const FREE_MODELS = [
                { model: "gemini-2.0-flash", label: "Flash (no grounding)" },
                { model: "gemini-2.0-flash-lite", label: "Flash Lite" },
                { model: "gemini-2.5-flash", label: "2.5 Flash" },
            ];

            let succeeded = false;
            for (let i = 0; i < FREE_MODELS.length; i++) {
                const { model: freeModel, label } = FREE_MODELS[i];

                if (i > 0) {
                    for (let s = 10; s > 0; s--) {
                        onProgress({ stage: "researching", message: `🆓 Trying ${label} in ${s}s... (${i + 1}/${FREE_MODELS.length})` });
                        await sleep(1000);
                    }
                }

                onProgress({ stage: "researching", message: `🆓 Trying ${label}...` });
                response = await callGemini(apiKey, userPrompt, false, freeModel);

                if (response.ok) {
                    freeModelUsed = freeModel;
                    succeeded = true;
                    break;
                }

                const status = response.status;
                if (status === 429) {
                    onProgress({ stage: "researching", message: `🆓 ${label} quota exhausted, trying next...` });
                } else {
                    const errPreview = await response.text().catch(() => "");
                    console.warn(`Free mode: ${freeModel} → ${status}:`, errPreview.slice(0, 150));
                    onProgress({ stage: "researching", message: `🆓 ${label} error (${status}), trying next...` });
                }
            }

            if (!succeeded && !response.ok) {
                throw new Error("All free-tier model quotas exhausted. Your daily free limit has been reached. Options: 1) Wait until tomorrow, or 2) Use a billing-enabled key (still free for low usage at Google).");
            }
        }

        if (!response.ok) {
            const errText = await response.text();
            if (response.status === 429) {
                throw new Error("Rate limit exceeded. Wait 60s and try again, or use a billing-enabled key.");
            }
            throw new Error(`API error ${response.status}: ${errText.slice(0, 200)}`);
        }

        const modeLabel = mode === "power" ? "⚡ Power Mode (grounded)" : "🆓 Free Mode";
        onProgress({ stage: "researching", message: `${modeLabel} — parsing research data...` });

        const data = await response.json();
        const fullText = parseGeminiResponse(data);
        if (!fullText) throw new Error("Empty response from AI");

        onProgress({ stage: "parsing", message: `${modeLabel} — structuring PEC scores...` });
        const actualModel = mode === "free" ? freeModelUsed : "gemini-2.0-flash";
        return { parsed: extractJSON(fullText), model: actualModel, mode };
    },
};
