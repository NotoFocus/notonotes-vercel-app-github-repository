import re

with open('src/screens/SettingsScreen.tsx', 'r') as f:
    content = f.read()

# Remove the unmatched opening div
content = content.replace('<div className="relative w-full max-w-[240px] mx-auto mb-5">\n              <CustomKeypad', '<CustomKeypad')

with open('src/screens/SettingsScreen.tsx', 'w') as f:
    f.write(content)
