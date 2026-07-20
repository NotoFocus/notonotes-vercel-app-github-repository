import re

with open('src/screens/AICompanionScreen.tsx', 'r') as f:
    content = f.read()

# Remove the useEffect I just added
content = re.sub(
    r"  // Auto send note context when navigated from note editor with 'Tanya AI'\n  useEffect\(\(\) => \{\n    if \(tempNoteContext && autoSendNoteToAI\) \{\n      setAutoSendNoteToAI\(false\);\n      const defaultPrompt = lang === 'id' \n        \? \"Tolong berikan ringkasan atau tanggapan untuk catatan ini\.\" \n        : \"Please provide a summary or response for this note\.\";\n      handleSend\(defaultPrompt\);\n    \}\n  \}, \[tempNoteContext, autoSendNoteToAI, lang\]\);\n\n",
    "",
    content,
    flags=re.DOTALL
)

# Find the end of handleConsentCancel and insert the useEffect there
use_effect_block = """  // Auto send note context when navigated from note editor with 'Tanya AI'
  useEffect(() => {
    if (tempNoteContext && autoSendNoteToAI) {
      setAutoSendNoteToAI(false);
      const defaultPrompt = lang === 'id' 
        ? "Tolong berikan ringkasan atau tanggapan untuk catatan ini." 
        : "Please provide a summary or response for this note.";
      handleSend(defaultPrompt);
    }
  }, [tempNoteContext, autoSendNoteToAI, lang]);

  const executeChatCall = async (fullPrompt: string, userFacingPrompt?: string) => {"""

content = content.replace("  const executeChatCall = async (fullPrompt: string, userFacingPrompt?: string) => {", use_effect_block)

with open('src/screens/AICompanionScreen.tsx', 'w') as f:
    f.write(content)
