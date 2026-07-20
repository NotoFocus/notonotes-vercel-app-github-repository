import re

with open('src/screens/NoteEditorScreen.tsx', 'r') as f:
    content = f.read()

# 1. Remove states
content = re.sub(
    r"  // Noto AI Helper State\n  const \[showAIHelperModal.*?  }, \[showAIHelperModal\]\);\n",
    r"""  const [showGiveToAIModal, setShowGiveToAIModal] = useState(false);
  const [sharedWithAI, setSharedWithAI] = useState<boolean>(!!note.sharedWithAI);
  const sharedWithAIRef = useRef(!!note.sharedWithAI);
  useEffect(() => {
    sharedWithAIRef.current = sharedWithAI;
  }, [sharedWithAI]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== initialHtml) {
      editorRef.current.innerHTML = initialHtml;
    }
  }, []); // Only run once on mount
""",
    content,
    flags=re.DOTALL
)

# 2. Remove handlers handleRunAIHelper and handleApplyAIResult
content = re.sub(
    r"  const handleRunAIHelper = async \(\) => \{.*?  const handleGiveToAI = \(\) => \{",
    r"  const handleGiveToAI = () => {",
    content,
    flags=re.DOTALL
)

# 3. Remove Noto AI Helper Button
content = re.sub(
    r"            \{/\* Noto AI Surgical Note Helper \*/\}.*?\{/\* Berikan ke AI Button \*/\}",
    r"            {/* Berikan ke AI Button */}",
    content,
    flags=re.DOTALL
)

# 4. Remove Noto AI Helper Modal
content = re.sub(
    r"      \{/\* NOTO AI HELPER MODAL \*/\}.*?      \{/\* GIVE TO AI CONSENT MODAL \*/\}",
    r"      {/* GIVE TO AI CONSENT MODAL */}",
    content,
    flags=re.DOTALL
)

# Change "Berikan ke AI" to "Tanya AI" in button text
content = content.replace(
    r"(lang === 'id' ? 'Berikan ke AI' : 'Give to AI')",
    r"(lang === 'id' ? 'Tanya AI' : 'Ask AI')"
)

with open('src/screens/NoteEditorScreen.tsx', 'w') as f:
    f.write(content)
