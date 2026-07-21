import re

with open('server.ts', 'r') as f:
    content = f.read()

content = content.replace("async function testApiKeyWithProvider(apiKey: string, provider: string, lang: string): Promise<void> {", "async function testApiKeyWithProvider(apiKey: string, provider: string, lang: string): Promise<{ provider: string, model: string }> {")
content = content.replace(
"""        config: { maxOutputTokens: 5 }
      });
    } else if (provider === 'openai') {""",
"""        config: { maxOutputTokens: 5 }
      });
      return { provider: "Gemini", model: "gemini-2.5-flash / gemini-2.0-flash" };
    } else if (provider === 'openai') {""")

content = content.replace(
"""        const err: any = new Error(errMsg); err.status = res.status; throw err;
      }
    } else if (provider === 'anthropic') {""",
"""        const err: any = new Error(errMsg); err.status = res.status; throw err;
      }
      return { provider: "OpenAI", model: "gpt-4o-mini" };
    } else if (provider === 'anthropic') {""")

content = content.replace(
"""        const err: any = new Error(errMsg); err.status = res.status; throw err;
      }
    } else if (provider === 'groq') {""",
"""        const err: any = new Error(errMsg); err.status = res.status; throw err;
      }
      return { provider: "Anthropic", model: "claude-3-5-haiku-latest" };
    } else if (provider === 'groq') {""")

content = content.replace(
"""        const err: any = new Error(errMsg); err.status = res.status; throw err;
      }
    } else if (provider === 'openrouter') {""",
"""        const err: any = new Error(errMsg); err.status = res.status; throw err;
      }
      return { provider: "Groq", model: "llama-3.1-8b-instant" };
    } else if (provider === 'openrouter') {""")

content = content.replace(
"""        const err: any = new Error(errMsg); err.status = res.status; throw err;
      }
    }
  }""",
"""        const err: any = new Error(errMsg); err.status = res.status; throw err;
      }
      return { provider: "OpenRouter", model: "google/gemini-2.5-flash" };
    }
    return { provider: "Unknown", model: "unknown" };
  }""")

content = content.replace(
"""      await testApiKeyWithProvider(testKey, provider, lang);
      res.json({ status: "ok" });""",
"""      const info = await testApiKeyWithProvider(testKey, provider, lang);
      res.json({ status: "ok", provider: info.provider, model: info.model });""")

with open('server.ts', 'w') as f:
    f.write(content)
