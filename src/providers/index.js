// ═══════════════════════════════════════════════════════════════
// PROVIDER REGISTRY — Zero-Claw Backbone
// Add new AI providers here. Zero backbone changes required.
// ═══════════════════════════════════════════════════════════════

import { geminiProvider } from "./gemini";
import { openaiProvider } from "./openai";
// Future providers:
// import { claudeProvider } from "./claude";
// import { ollamaProvider } from "./ollama";

export const PROVIDERS = {
    gemini: geminiProvider,
    openai: openaiProvider,
    // claude: claudeProvider,
    // ollama: ollamaProvider,
};

const ACTIVE_PROVIDER_KEY = "elu_ai_provider";

export function getProvider(id) {
    return PROVIDERS[id] || PROVIDERS.gemini;
}

export function getActiveProvider() {
    const id = localStorage.getItem(ACTIVE_PROVIDER_KEY) || "gemini";
    return getProvider(id);
}

export function setActiveProvider(id) {
    if (PROVIDERS[id]) {
        localStorage.setItem(ACTIVE_PROVIDER_KEY, id);
    }
}

export function getProviderList() {
    return Object.values(PROVIDERS).map(p => ({
        id: p.id,
        name: p.name,
        icon: p.icon,
    }));
}
