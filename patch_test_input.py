import re

with open('src/screens/SettingsScreen.tsx', 'r') as f:
    content = f.read()

content = content.replace(
"""                                    <input 
                                      type="tel" autoComplete="off" 
                                      maxLength={4}""",
"""                                    <input 
                                      type="text" autoComplete="off" style={{ WebkitTextSecurity: 'disc' }}
                                      maxLength={4}""")

with open('src/screens/SettingsScreen.tsx', 'w') as f:
    f.write(content)
