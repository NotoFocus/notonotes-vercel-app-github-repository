import re

with open('src/screens/SettingsScreen.tsx', 'r') as f:
    content = f.read()

content = content.replace(
"""                        {connectionStatus === 'error' && connectionError && (
                          <p className="text-[11px] text-slate-400 font-semibold mt-1 bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">{connectionError}</p>
                        )}
                      </div>""",
"""                        {connectionStatus === 'error' && connectionError && (
                          <p className="text-[11px] text-slate-400 font-semibold mt-1 bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">{connectionError}</p>
                        )}
                        {connectionStatus === 'connected' && detectedProvider && (
                          <div className="mt-2 text-[11px] text-emerald-400/80 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/10 flex flex-col gap-1">
                            <span className="font-bold flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-emerald-500"></span>{lang === 'id' ? 'Sistem Mendeteksi:' : 'System Detected:'}</span>
                            <span className="text-emerald-300 pl-2.5">- Penyedia: {detectedProvider}</span>
                            {detectedModel && <span className="text-emerald-300 pl-2.5">- Model: {detectedModel}</span>}
                          </div>
                        )}
                      </div>""")

with open('src/screens/SettingsScreen.tsx', 'w') as f:
    f.write(content)
