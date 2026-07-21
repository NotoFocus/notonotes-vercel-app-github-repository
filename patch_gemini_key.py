import re

with open('src/screens/SettingsScreen.tsx', 'r') as f:
    content = f.read()

content = content.replace(
"""                      <div className="relative">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={testApiKey}""",
"""                      <div className="relative">
                        <input
                          type="text" autoComplete="off" spellCheck="false" autoCorrect="off" style={{ WebkitTextSecurity: showApiKey ? 'none' : 'disc' }}
                          value={testApiKey}""")

with open('src/screens/SettingsScreen.tsx', 'w') as f:
    f.write(content)
