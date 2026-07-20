import re

with open('src/screens/NoteEditorScreen.tsx', 'r') as f:
    content = f.read()

# Add setAutoSendNoteToAI to destructured useAppStore
content = content.replace(
    "const { notes, addNote, updateNote, deleteNote, lang, setTempNoteContext, geminiApiKey } = useAppStore();",
    "const { notes, addNote, updateNote, deleteNote, lang, setTempNoteContext, setAutoSendNoteToAI, geminiApiKey } = useAppStore();"
)

# Call it in handleGiveToAI
content = content.replace(
    """    setTempNoteContext({
      title: title || (lang === 'id' ? 'Catatan Tanpa Judul' : 'Untitled Note'),
      content: rawContent
    });""",
    """    setTempNoteContext({
      title: title || (lang === 'id' ? 'Catatan Tanpa Judul' : 'Untitled Note'),
      content: rawContent
    });
    setAutoSendNoteToAI(true);"""
)

with open('src/screens/NoteEditorScreen.tsx', 'w') as f:
    f.write(content)
