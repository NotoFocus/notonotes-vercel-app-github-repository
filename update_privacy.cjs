const fs = require('fs');
let code = fs.readFileSync('src/translations.ts', 'utf8');

// Update ID
code = code.replace(
  /privacyPolicy1: 'Laporan Keamanan & Privasi \(Update v2\.0\)',/,
  "privacyPolicy1: 'Laporan Keamanan & Privasi (Update Noto AI)',"
);
code = code.replace(
  /privacyPolicy4: 'Semua data Anda \(catatan, tugas, keuangan, mood\) hanya disimpan di dalam memori internal browser perangkat Anda\. Aplikasi ini tidak memiliki database eksternal dan tidak memiliki server backend\.',/,
  "privacyPolicy4: 'Semua data Anda (catatan, tugas, keuangan, mood) disimpan murni di memori internal browser perangkat Anda (Local Storage & IndexedDB). Noto tidak memiliki database eksternal (kecuali yang dihosting langsung di dalam infrastruktur Cloud Run Google AI Studio ini) dan tidak pernah mentransfer data tanpa izin eksplisit Anda.',"
);
code = code.replace(
  /privacyPolicy5: 'Hosting Aman via GitHub & Vercel',/,
  "privacyPolicy5: 'Keamanan Transmisi Noto AI',"
);
code = code.replace(
  /privacyPolicy6: 'Aplikasi ini hanya menggunakan GitHub sebagai repositori kode dasar dan Vercel sebagai penyedia layanan hosting antarmuka \(UI\)\. Vercel hanya mengantarkan aplikasi ke layar Anda, namun tidak pernah membaca, memproses, atau menyimpan data personal Anda\.',/,
  "privacyPolicy6: 'Saat menggunakan Noto AI, aplikasi menggunakan pendekatan \"Stateless\". Data Anda akan dirangkum di perangkat lokal Anda terlebih dahulu, kemudian hanya akan dikirimkan HANYA JIKA Anda menekan tombol setuju. Segera setelah permintaan AI selesai, data tersebut otomatis dibuang oleh server perantara kami dan tidak ada database backend yang menyimpan percakapan atau riwayat Anda. Anda mengatur API Key Anda sendiri (BYOK).',"
);

// Update EN
code = code.replace(
  /privacyPolicy1: 'Security & Privacy Report \(Update v2\.0\)',/,
  "privacyPolicy1: 'Security & Privacy Report (Noto AI Update)',"
);
code = code.replace(
  /privacyPolicy4: 'All your data \(notes, tasks, finances, moods\) is only stored within your device\\'s internal browser memory\. This application has no external database and no backend servers\.',/,
  "privacyPolicy4: 'All your data (notes, tasks, finances, moods) is purely stored within your device\\'s internal browser memory (Local Storage & IndexedDB). Noto has no external database mapping (except the secure Cloud Run instance hosted by Google AI Studio) and never transfers data without your explicit permission.',"
);
code = code.replace(
  /privacyPolicy5: 'Secure Hosting via GitHub & Vercel',/,
  "privacyPolicy5: 'Noto AI Transmission Security',"
);
code = code.replace(
  /privacyPolicy6: 'This app only uses GitHub as the base code repository and Vercel as the user interface \(UI\) hosting provider\. Vercel only delivers the app to your screen, but never reads, processes, or stores your personal data\.',/,
  "privacyPolicy6: 'When using Noto AI, the app uses a \"Stateless\" approach. Your data is aggregated locally on your device first, and is ONLY transmitted IF you hit the consent button. The moment the AI request is complete, the data is dropped by our proxy server. There is no backend database tracking your conversations. You use your own API Key (BYOK).',"
);

fs.writeFileSync('src/translations.ts', code);
