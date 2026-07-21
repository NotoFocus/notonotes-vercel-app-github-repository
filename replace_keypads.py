import re

with open('src/screens/SettingsScreen.tsx', 'r') as f:
    content = f.read()

# 1. Security PIN
pattern1 = r'<div className="relative w-full max-w-\[240px\] mx-auto mb-5">.*?<input[^>]*value={pinInput}[^>]*>.*?</div>\s*</div>'
replacement1 = """<CustomKeypad 
              value={pinInput} 
              onChange={val => setPinInput(val)} 
              onEnter={handlePinSubmit} 
              error={pinError} 
            />"""
content = re.sub(pattern1, replacement1, content, flags=re.DOTALL)

# 2. Auto Backup Enable Verify
pattern2 = r'<div className="relative w-full max-w-\[240px\] mx-auto mb-5">.*?<input[^>]*value={autoBackupEnableVerifyPin}[^>]*>.*?</div>\s*</div>'
replacement2 = """<CustomKeypad 
              value={autoBackupEnableVerifyPin} 
              onChange={val => setAutoBackupEnableVerifyPin(val)} 
              onEnter={handleAutoBackupVerifySubmit} 
            />"""
content = re.sub(pattern2, replacement2, content, flags=re.DOTALL)

# 3. Auto Backup Pin Setup
pattern3 = r'<div className="relative w-full max-w-\[240px\] mx-auto mb-5">.*?<input[^>]*value={autoBackupPinSetupStep === 1 \? autoBackupPinSetupPin : autoBackupPinSetupConfirm}[^>]*>.*?</div>\s*</div>'
replacement3 = """<CustomKeypad 
              value={autoBackupPinSetupStep === 1 ? autoBackupPinSetupPin : autoBackupPinSetupConfirm} 
              onChange={val => {
                if (autoBackupPinSetupStep === 1) setAutoBackupPinSetupPin(val);
                else setAutoBackupPinSetupConfirm(val);
              }} 
              onEnter={handleAutoBackupPinSetupSubmit} 
              error={autoBackupPinSetupError} 
            />"""
content = re.sub(pattern3, replacement3, content, flags=re.DOTALL)

# 4. Auto Backup Pin Change
pattern4 = r'<div className="relative w-full max-w-\[240px\] mx-auto mb-5">.*?<input[^>]*value={[\s\S]*?autoBackupPinChangeStep === 1[\s\S]*?\? autoBackupPinChangeOld[\s\S]*?: autoBackupPinChangeStep === 2[\s\S]*?\? autoBackupPinChangeNew[\s\S]*?: autoBackupPinChangeConfirm[\s\S]*?}[^>]*>.*?</div>\s*</div>'
replacement4 = """<CustomKeypad 
              value={
                autoBackupPinChangeStep === 1 
                  ? autoBackupPinChangeOld 
                  : autoBackupPinChangeStep === 2 
                    ? autoBackupPinChangeNew 
                    : autoBackupPinChangeConfirm
              } 
              onChange={val => {
                if (autoBackupPinChangeStep === 1) setAutoBackupPinChangeOld(val);
                else if (autoBackupPinChangeStep === 2) setAutoBackupPinChangeNew(val);
                else setAutoBackupPinChangeConfirm(val);
              }} 
              onEnter={handleAutoBackupPinChangeSubmit} 
              error={autoBackupPinChangeError} 
            />"""
content = re.sub(pattern4, replacement4, content, flags=re.DOTALL)

with open('src/screens/SettingsScreen.tsx', 'w') as f:
    f.write(content)
