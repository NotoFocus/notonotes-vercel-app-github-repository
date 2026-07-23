const fs = require('fs');
let code = fs.readFileSync('src/translations.ts', 'utf8');

const regexID = /appUpdateBody: 'Peningkatan besar pada sistem dengan hadirnya Noto AI! Fitur Asisten Cerdas Privacy-First yang hanya berjalan dengan API Key lokal Anda \(BYOK\)\. Analisis mood, tugas, dan keuangan Anda tanpa database cloud backend\. Optimalisasi tema dan performa aplikasi\.', dan akan berfungsi normal sepenuhnya di versi aplikasi mendatang\.',/;
code = code.replace(regexID, "appUpdateBody: 'Peningkatan besar pada sistem dengan hadirnya Noto AI! Fitur Asisten Cerdas Privacy-First yang hanya berjalan dengan API Key lokal Anda (BYOK). Analisis mood, tugas, dan keuangan Anda tanpa database cloud backend. Optimalisasi tema dan performa aplikasi. Catatan: Untuk notifikasi latar belakang penuh saat ini sedang kami kembangkan lebih lanjut.',");

const regexEN = /appUpdateBody: 'Major leap forward with the introduction of Noto AI! A Privacy-First Smart Assistant that runs securely with your local API Key \(BYOK\)\. Analyze your mood, tasks, and finances statelessly without any backend cloud database\. Plus, general performance and theme optimizations\.', and will be fully supported in a future version\.',/;
code = code.replace(regexEN, "appUpdateBody: 'Major leap forward with the introduction of Noto AI! A Privacy-First Smart Assistant that runs securely with your local API Key (BYOK). Analyze your mood, tasks, and finances statelessly without any backend cloud database. Plus, general performance and theme optimizations. Note: Full background notifications are currently being further developed.',");

fs.writeFileSync('src/translations.ts', code);
