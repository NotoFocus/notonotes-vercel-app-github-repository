import re

with open('src/screens/AICompanionScreen.tsx', 'r') as f:
    content = f.read()

# Replace executeChatCall to use functional setMessages
new_execute = """  const executeChatCall = async (fullPrompt: string, userFacingPrompt?: string) => {
    setIsLoading(true);
    setErrorMsg(null);

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: userFacingPrompt || fullPrompt,
      timestamp: Date.now()
    };

    // Use functional state update to ensure we never use a stale `messages` closure
    let currentHistory: ChatMessage[] = [];
    setMessages(prev => {
      currentHistory = [...prev, userMsg];
      return currentHistory;
    });
    setInputText('');

    try {
      // Map historical messages from the LATEST state
      const messagesPayload = currentHistory.slice(-8).map((m, idx, arr) => {
        const isLatestUser = idx === arr.length - 1;
        return {
          role: m.role === 'model' ? 'model' : 'user',
          content: isLatestUser ? fullPrompt : m.content
        };
      });

      const requestUrl = `${window.location.origin}/api/ai/chat`;
      const res = await fetch(requestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesPayload,
          lang,
          customApiKey: geminiApiKey ? geminiApiKey.trim() : undefined
        })
      });

      if (!res.ok) {
        const responseBodyText = await res.text().catch(() => "");
        let errorData: any = {};
        try {
          errorData = JSON.parse(responseBodyText);
        } catch (_) {}

        let errMsg = errorData?.error || `API Error (${res.status})`;
        
        if (res.status === 404 && !errorData?.error) {
          errMsg = lang === 'id'
            ? `Error 404: Endpoint API atau Model tidak ditemukan.`
            : `Error 404: API Endpoint or Model not found.`;
        } else if (errMsg === 'missing_api_key') {
          errMsg = lang === 'id'
            ? "API Key Gemini belum dikonfigurasi di server ataupun aplikasi."
            : "Gemini API Key is not configured on the server or app.";
        }
        throw new Error(errMsg);
      }

      const data = await res.json();
      const replyText = data?.reply || "No response received";

      const modelMsg: ChatMessage = {
        id: generateId(),
        role: 'model',
        content: replyText,
        timestamp: Date.now()
      };

      setMessages(prev => {
        const finalHistory = [...prev, modelMsg];
        saveChatHistory(finalHistory);
        return finalHistory;
      });

      updateCredits(Math.max(0, creditsLeft - 1));

    } catch (err: any) {
      console.error(err);
      setErrorMsg(lang === 'id'
        ? `Gagal terhubung dengan Noto AI: ${err.message || 'Kesalahan koneksi'}`
        : `Failed to connect with Noto AI: ${err.message || 'Connection error'}`);
    } finally {
      setIsLoading(false);
    }
  };"""

content = re.sub(
    r"  const executeChatCall = async \(fullPrompt: string, userFacingPrompt\?: string\) => \{.*?    \} finally \{\n      setIsLoading\(false\);\n    \}\n  \};\n",
    new_execute + "\n",
    content,
    flags=re.DOTALL
)

with open('src/screens/AICompanionScreen.tsx', 'w') as f:
    f.write(content)
