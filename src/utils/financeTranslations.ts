export const translateCategory = (cat: string, lang: 'id' | 'en') => {
  if (lang === 'en') return cat;
  const map: Record<string, string> = {
    'Food': 'Makan',
    'Transport': 'Transportasi',
    'Bills': 'Tagihan',
    'Investment': 'Investasi',
    'Health': 'Kesehatan',
    'Education': 'Pendidikan',
    'Entertainment': 'Hiburan',
    'Salary': 'Gaji',
    'Freelance': 'Sambilan',
    'Gift': 'Hadiah',
    'Other': 'Lainnya'
  };
  return map[cat] || cat;
};
