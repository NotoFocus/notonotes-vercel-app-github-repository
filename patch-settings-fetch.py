import re

with open('src/screens/SettingsScreen.tsx', 'r') as f:
    content = f.read()

content = content.replace(
"""                            if (response.ok) {
                              setConnectionStatus('connected');
                              showNotificationToast(lang === 'id' ? 'Koneksi Berhasil! API Key Anda valid.' : 'Connection Successful! Your API Key is valid.');
                            } else {""",
"""                            if (response.ok) {
                              const data = await response.json();
                              if (data.provider) setDetectedProvider(data.provider);
                              if (data.model) setDetectedModel(data.model);
                              setConnectionStatus('connected');
                              showNotificationToast(lang === 'id' ? `Koneksi Berhasil! (Penyedia: ${data.provider || 'Tidak diketahui'})` : `Connection Successful! (Provider: ${data.provider || 'Unknown'})`);
                            } else {""")

content = content.replace(
"""                            setTestApiKey(e.target.value);
                            setConnectionStatus('idle');
                            setConnectionError(null);""",
"""                            setTestApiKey(e.target.value);
                            setConnectionStatus('idle');
                            setConnectionError(null);
                            setDetectedProvider(null);
                            setDetectedModel(null);""")

content = content.replace(
"""                            setTestApiKey('');
                            setConnectionStatus('idle');
                            setConnectionError(null);""",
"""                            setTestApiKey('');
                            setConnectionStatus('idle');
                            setConnectionError(null);
                            setDetectedProvider(null);
                            setDetectedModel(null);""")

with open('src/screens/SettingsScreen.tsx', 'w') as f:
    f.write(content)
