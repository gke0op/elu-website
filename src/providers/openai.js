// ═══════════════════════════════════════════════════════════════
// OPENAI PROVIDER — Agent Adapter for OpenAI GPT Models
// Part of the ELU PEC Engine Zero-Claw Backbone
// ═══════════════════════════════════════════════════════════════

export const openaiProvider = {
    id: "openai",
    name: "GPT-4o mini",
    icon: "🤖",
    keyPlaceholder: "sk-... (paste your OpenAI key)",
    keyStorageKey: "elu_openai_api_key",
    getKeyUrl: "https://platform.openai.com/api-keys",
    getKeyLabel: "OpenAI Platform",

    getKey() {
        return localStorage.getItem(this.keyStorageKey) || "";
    },

    saveKey(key) {
        if (key) localStorage.setItem(this.keyStorageKey, key.trim());
        else localStorage.removeItem(this.keyStorageKey);
    },

    async testKey(key) {
        if (!key.trim()) return "error";
        try {
            const resp = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${key.trim()}`,
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [{ role: "user", content: "Reply with only: OK" }],
                    max_tokens: 5,
                }),
            });
            if (resp.ok) return "success";
            if (resp.status === 429) return "free";
            return "error";
        } catch {
            return "error";
        }
    },

    async research(techQuery, systemPrompt, extractJSON, onProgress) {
        const apiKey = this.getKey();
        if (!apiKey) {
            throw new Error("No API key found. Use ⚙️ Settings to add your OpenAI API key.");
        }

        onProgress({ stage: "researching", message: "🤖 GPT-4o mini — researching technology..." });

        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: `Research this sustainable technology thoroughly and provide a PEC assessment: "${techQuery}"\n\nSearch for current market data, recent developments, key companies, carbon impact studies, and technology readiness information. Be thorough — this assessment will be used for investment grading.`,
                    },
                ],
                temperature: 0.7,
                max_tokens: 4000,
            }),
        });

        if (!resp.ok) {
            const errText = await resp.text().catch(() => "");
            if (resp.status === 429) {
                throw new Error("Rate limit exceeded. Wait a moment and try again.");
            }
            throw new Error(`OpenAI API error ${resp.status}: ${errText.slice(0, 200)}`);
        }

        onProgress({ stage: "researching", message: "🤖 GPT-4o mini — parsing research data..." });

        const data = await resp.json();
        const fullText = data.choices?.[0]?.message?.content || "";
        if (!fullText) throw new Error("Empty response from OpenAI");

        onProgress({ stage: "parsing", message: "🤖 GPT-4o mini — structuring PEC scores..." });
        return { parsed: extractJSON(fullText), model: "gpt-4o-mini", mode: "power" };
    },
};
