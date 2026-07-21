import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

handle_str = """  const handleKeyPress = async (key: string) => {
    if (key === 'backspace') {
      setInput(prev => prev.slice(0, -1));
      setError(false);
      return;
    }
    
    if (input.length >= 4) return;
    
    const newVal = input + key;
    setInput(newVal);
    setError(false);
    
    if (newVal.length === 4) {
      const { hashPin } = await import('./utils');
      const hashed = await hashPin(newVal);
      if (hashed === correctPin || newVal === correctPin) {
        if (newVal === correctPin && newVal !== hashed) {
          await recordPinChange(hashed);
        }
        setTimeout(onUnlock, 150);
      } else {
        setError(true);
        setTimeout(() => {
          setInput('');
          setError(false);
        }, 800);
      }
    }
  };

  const getThemeClass = () => {"""

content = content.replace("  const getThemeClass = () => {", handle_str, 1)

with open('src/App.tsx', 'w') as f:
    f.write(content)
