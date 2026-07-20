import re

with open('src/screens/AICompanionScreen.tsx', 'r') as f:
    content = f.read()

# Add autoSendNoteToAI and setAutoSendNoteToAI to destructured useAppStore
content = content.replace(
    "const { notes, moods, transactions, tasks, streak, savingsBalance, savingsTarget, lang, tempNoteContext, setTempNoteContext, geminiApiKey } = useAppStore();",
    "const { notes, moods, transactions, tasks, streak, savingsBalance, savingsTarget, lang, tempNoteContext, setTempNoteContext, autoSendNoteToAI, setAutoSendNoteToAI, geminiApiKey } = useAppStore();"
)

# Add a useEffect to trigger it
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

  const updateCredits = (newCount: number) => {"""

content = content.replace("  const updateCredits = (newCount: number) => {", use_effect_block)

with open('src/screens/AICompanionScreen.tsx', 'w') as f:
    f.write(content)
