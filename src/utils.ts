export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch(e) {}
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export async function hashPin(pin: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    let hash = 0;
    for (let i = 0; i < pin.length; i++) {
      const char = pin.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function encryptData(data: string, password: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    return btoa(unescape(encodeURIComponent(data)));
  }
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    enc.encode(data)
  );
  
  const encryptedArray = Array.from(new Uint8Array(encrypted));
  const encryptedHex = encryptedArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return JSON.stringify({ v: 1, s: saltHex, i: ivHex, d: encryptedHex });
}

export async function decryptData(encryptedStr: string, password: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    try {
      if (encryptedStr.startsWith('{')) throw new Error("Fallback cannot decrypt true secure data");
      return decodeURIComponent(escape(atob(encryptedStr)));
    } catch(e) {
      return encryptedStr;
    }
  }
  const enc = new TextEncoder();
  const parsed = JSON.parse(encryptedStr);
  if (parsed.v !== 1) throw new Error("Unsupported version");
  
  const salt = new Uint8Array(parsed.s.match(/.{1,2}/g)!.map((byte: string) => parseInt(byte, 16)));
  const iv = new Uint8Array(parsed.i.match(/.{1,2}/g)!.map((byte: string) => parseInt(byte, 16)));
  const encryptedData = new Uint8Array(parsed.d.match(/.{1,2}/g)!.map((byte: string) => parseInt(byte, 16)));
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encryptedData
  );
  
  return new TextDecoder().decode(decrypted);
}

export function formatReminderDate(isoString: string | undefined, lang: 'id' | 'en'): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isSameDay = (d1: Date, d2: Date) => 
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
      
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    
    if (isSameDay(d, today)) {
      return lang === 'id' ? `Hari ini, ${timeStr}` : `Today, ${timeStr}`;
    } else if (isSameDay(d, tomorrow)) {
      return lang === 'id' ? `Besok, ${timeStr}` : `Tomorrow, ${timeStr}`;
    } else {
      const day = d.getDate();
      const monthNamesID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const monthNamesEN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = lang === 'id' ? monthNamesID[d.getMonth()] : monthNamesEN[d.getMonth()];
      return `${day} ${monthName} ${d.getFullYear()}, ${timeStr}`;
    }
  } catch (e) {
    return isoString;
  }
}

