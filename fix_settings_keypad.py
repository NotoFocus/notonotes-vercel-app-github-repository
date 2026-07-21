import re

with open('src/screens/SettingsScreen.tsx', 'r') as f:
    content = f.read()

# We need to find the specific block for the 4th keypad.
# It starts around:
# <input
#   type="tel"
#   inputMode="numeric"
#   pattern="[0-9]*"
#   maxLength={4}
#   autoFocus
#   value={

pattern = r'<input[^>]*type="tel"[^>]*value=\{\s*autoBackupPinChangeStep === 1\s*\?\s*autoBackupPinChangeCurrent\s*:\s*autoBackupPinChangeStep === 2\s*\?\s*autoBackupPinChangeNew\s*:\s*autoBackupPinChangeConfirm\s*\}[^>]*>.*?</div>\s*</div>'

replacement = """<CustomKeypad 
              value={
                autoBackupPinChangeStep === 1 
                  ? autoBackupPinChangeCurrent 
                  : autoBackupPinChangeStep === 2 
                    ? autoBackupPinChangeNew 
                    : autoBackupPinChangeConfirm
              } 
              onChange={val => {
                if (autoBackupPinChangeStep === 1) setAutoBackupPinChangeCurrent(val);
                else if (autoBackupPinChangeStep === 2) setAutoBackupPinChangeNew(val);
                else setAutoBackupPinChangeConfirm(val);
              }} 
              onEnter={handleAutoBackupPinChangeSubmit} 
              error={autoBackupPinChangeError} 
            />"""

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('src/screens/SettingsScreen.tsx', 'w') as f:
    f.write(new_content)

