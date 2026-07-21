import re

with open('src/screens/SettingsScreen.tsx', 'r') as f:
    content = f.read()

content = content.replace(
"""                    <input 
                      type="tel" autoComplete="off"
                      value={backupPassword}""",
"""                    <input 
                      type="text" autoComplete="off" style={{ WebkitTextSecurity: 'disc' }}
                      value={backupPassword}""")

with open('src/screens/SettingsScreen.tsx', 'w') as f:
    f.write(content)
