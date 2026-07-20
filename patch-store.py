import re

with open('src/store.tsx', 'r') as f:
    content = f.read()

# Add to AppStoreState
content = content.replace(
    "tempNoteContext: { title: string; content: string } | null;",
    "tempNoteContext: { title: string; content: string } | null;\n  setTempNoteContext: (context: { title: string; content: string } | null) => void;\n  autoSendNoteToAI: boolean;\n  setAutoSendNoteToAI: (val: boolean) => void;"
)

# Remove the duplicate setTempNoteContext in interface if it exists
content = re.sub(r"setTempNoteContext: \(context: \{ title: string; content: string \} \| null\) => void;\n  setTempNoteContext: \(context: \{ title: string; content: string \} \| null\) => void;", r"setTempNoteContext: (context: { title: string; content: string } | null) => void;", content)

# Add to useAppStore hook
content = content.replace(
    "const [tempNoteContext, setTempNoteContext] = useState<{ title: string; content: string } | null>(null);",
    "const [tempNoteContext, setTempNoteContext] = useState<{ title: string; content: string } | null>(null);\n  const [autoSendNoteToAI, setAutoSendNoteToAI] = useState<boolean>(false);"
)

# Add to return object
content = content.replace(
    "tempNoteContext, setTempNoteContext,",
    "tempNoteContext, setTempNoteContext, autoSendNoteToAI, setAutoSendNoteToAI,"
)

with open('src/store.tsx', 'w') as f:
    f.write(content)
