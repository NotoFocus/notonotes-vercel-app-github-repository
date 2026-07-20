import re

with open('server.ts', 'r') as f:
    content = f.read()

new_content = content.replace(
"""    if (msg.includes("API key not valid") || msg.includes("API_KEY_INVALID") || msg.includes("API key") || msg.includes("GEMINI_API_KEY_MISSING") || errStatus === 401) {
      return lang === 'id' 
        ? `API Key tidak valid atau belum diatur. Harap periksa kembali kunci yang Anda masukkan di Pengaturan.`
        : `Invalid or missing API Key. Please configure your API key in Settings.`;
    }
    
    if (msg.includes("Quota exceeded") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("limit") || msg.includes("quota") || errStatus === 429) {
      return lang === 'id'
        ? `Batas kuota API Key terlampaui (Error 429). Harap coba lagi beberapa saat lagi atau gunakan kunci lain.`
        : `API Key quota exceeded (Error 429). Please try again in a few moments or use a different key.`;
    }
    
    if (msg.includes("experiencing high demand") || msg.includes("UNAVAILABLE") || errStatus === 503) {
      return lang === 'id'
        ? `Layanan AI sedang sibuk (Error 503). Harap coba sesaat lagi.`
        : `The AI service is currently experiencing high demand (Error 503). Please try again shortly.`;
    }""",
"""    if (msg.includes("API key not valid") || msg.includes("API_KEY_INVALID") || msg.includes("API key") || msg.includes("GEMINI_API_KEY_MISSING") || errStatus === 401) {
      return lang === 'id' 
        ? `Error 401: API Key tidak valid atau ditolak oleh penyedia layanan. Detail: ${msg}`
        : `Error 401: Invalid API Key or rejected by provider. Detail: ${msg}`;
    }
    
    if (msg.includes("Quota exceeded") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("limit") || msg.includes("quota") || errStatus === 429) {
      return lang === 'id'
        ? `Error 429: Batas kuota API Key terlampaui atau Anda terkena rate limit. Detail: ${msg}`
        : `Error 429: API Key quota exceeded or rate limited. Detail: ${msg}`;
    }
    
    if (msg.includes("experiencing high demand") || msg.includes("UNAVAILABLE") || errStatus === 503) {
      return lang === 'id'
        ? `Error 503: Layanan AI sedang sibuk. Detail: ${msg}`
        : `Error 503: The AI service is currently experiencing high demand. Detail: ${msg}`;
    }"""
)

with open('server.ts', 'w') as f:
    f.write(new_content)
