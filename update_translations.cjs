const fs = require('fs');
let code = fs.readFileSync('src/translations.ts', 'utf8');

// Update ID
code = code.replace(
  /appUpdateTitle: 'Pembaruan Noto v3\.0',/,
  "appUpdateTitle: 'Pembaruan Noto v4.0 (Update AI)',"
);
code = code.replace(
  /appUpdateBody: 'Peningkatan besar pada sistem penyegaran dan performa aplikasi, perbaikan bug wallpaper, serta optimalisasi tema.*?\,/,
  "appUpdateBody: 'Peningkatan besar pada sistem dengan hadirnya Noto AI! Fitur Asisten Cerdas Privacy-First yang hanya berjalan dengan API Key lokal Anda (BYOK). Analisis mood, tugas, dan keuangan Anda tanpa database cloud backend. Optimalisasi tema dan performa aplikasi.',"
);

// Add aboutAppFeat12 for AI
code = code.replace(
  /aboutAppFeat11Desc: 'Sistem komprehensif untuk mencapai target jangka panjang, dilengkapi Kontrak Komitmen \(Hadiah & Konsekuensi\), Catatan Perjalanan harian, dan fitur foto Transformasi Visual\.',/,
  "aboutAppFeat11Desc: 'Sistem komprehensif untuk mencapai target jangka panjang, dilengkapi Kontrak Komitmen (Hadiah & Konsekuensi), Catatan Perjalanan harian, dan fitur foto Transformasi Visual.',\n    aboutAppFeat12: '🤖 Noto AI (Asisten Privacy-First):',\n    aboutAppFeat12Desc: 'Integrasi AI cerdas dengan API Key milik Anda sendiri (BYOK). Noto AI beroperasi tanpa database backend, merangkum data Anda di perangkat, dan menjaga privasi mutlak Anda.',"
);

// Update EN
code = code.replace(
  /appUpdateTitle: 'Noto v3\.0 Update',/,
  "appUpdateTitle: 'Noto v4.0 Update (AI Edition)',"
);
code = code.replace(
  /appUpdateBody: 'Major improvements on app performance and refresh rates, wallpaper bugs fixed, and theme optimizations.*?\,/,
  "appUpdateBody: 'Major leap forward with the introduction of Noto AI! A Privacy-First Smart Assistant that runs securely with your local API Key (BYOK). Analyze your mood, tasks, and finances statelessly without any backend cloud database. Plus, general performance and theme optimizations.',"
);

// Add aboutAppFeat12 for AI (EN)
code = code.replace(
  /aboutAppFeat11Desc: 'A comprehensive system to achieve long-term goals, featuring Commitment Contracts \(Rewards & Punishments\), daily Journey Notes, and a Visual Transformation photo gallery\.',/,
  "aboutAppFeat11Desc: 'A comprehensive system to achieve long-term goals, featuring Commitment Contracts (Rewards & Punishments), daily Journey Notes, and a Visual Transformation photo gallery.',\n    aboutAppFeat12: '🤖 Noto AI (Privacy-First Assistant):',\n    aboutAppFeat12Desc: 'Smart AI integration powered by your own API Key (BYOK). Noto AI operates statelessly without a backend database, summarizing data strictly on-device to guarantee absolute privacy.',"
);

fs.writeFileSync('src/translations.ts', code);
