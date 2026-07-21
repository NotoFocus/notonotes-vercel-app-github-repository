import re

with open('src/screens/SettingsScreen.tsx', 'r') as f:
    content = f.read()

content = content.replace(
"""                    {/* API Key Input */}
                    <div className="space-y-2">""",
"""                    {/* API Key Input */}
                    <div className="space-y-2">
                      {!geminiApiKey && (
                        <div className="mb-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2 text-amber-200/90 text-[11px] leading-relaxed">
                          <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-400" />
                          <p>
                            {lang === 'id' 
                              ? 'Anda sedang menggunakan API Key default dari sistem (Vercel). Untuk limit yang lebih leluasa dan privasi penuh, harap gunakan API Key Anda sendiri (mendukung Gemini, OpenAI, Groq, Anthropic, OpenRouter).' 
                              : 'You are using the default system API Key (Vercel). For better rate limits and full privacy, please use your own API Key (supports Gemini, OpenAI, Groq, Anthropic, OpenRouter).'}
                          </p>
                        </div>
                      )}""")

with open('src/screens/SettingsScreen.tsx', 'w') as f:
    f.write(content)
