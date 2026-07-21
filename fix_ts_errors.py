import re

with open('src/screens/SettingsScreen.tsx', 'r') as f:
    content = f.read()

content = content.replace("style={{ WebkitTextSecurity: 'disc' }}", "style={{ WebkitTextSecurity: 'disc' } as any}")
content = content.replace("style={{ WebkitTextSecurity: showApiKey ? 'none' : 'disc' }}", "style={{ WebkitTextSecurity: showApiKey ? 'none' : 'disc' } as any}")

# Remove duplicate autoComplete="off" at line 1820
lines = content.split('\n')
if len(lines) >= 1820 and 'autoComplete="off"' in lines[1819]:
    lines.pop(1819)
    content = '\n'.join(lines)

with open('src/screens/SettingsScreen.tsx', 'w') as f:
    f.write(content)
