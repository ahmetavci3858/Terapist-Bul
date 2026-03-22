export const CORE_PROFESSIONS = [
  'Diyetisyen',
  'Psikolog',
  'Fizyoterapist',
  'Ergoterapist',
  'Dil ve Konuşma Terapisti'
] as const;

export type Profession = typeof CORE_PROFESSIONS[number];

export const SUB_SPECIALTIES: Record<Profession, string[]> = {
  'Diyetisyen': [
    'Online Diyetisyen',
    'Çocuk Diyetisyeni',
    'Polikistik Over Diyetisyeni',
    'Hamile Diyetisyeni',
    'Sporcu Diyetisyeni',
    'Kilo Almak İçin Diyetisyen',
    'Diyabet Diyetisyeni',
    'Kilo Verme Diyetisyeni',
    'Onkoloji Diyetisyeni',
    'Bariatrik Cerrahi Diyetisyeni'
  ],
  'Psikolog': [
    'Bireysel Terapi',
    'Çift ve Aile Terapisi',
    'Çocuk ve Ergen Psikolojisi',
    'Kaygı Bozuklukları',
    'Depresyon',
    'Travma Sonrası Stres Bozukluğu',
    'Bağımlılık Terapisi',
    'Cinsel Terapi',
    'Yeme Bozuklukları',
    'Panik Atak'
  ],
  'Fizyoterapist': [
    'Ortopedik Rehabilitasyon',
    'Nörolojik Rehabilitasyon',
    'Sporcu Sağlığı',
    'Pediatrik Rehabilitasyon',
    'Manuel Terapi',
    'Geriatrik Rehabilitasyon',
    'Kadın Sağlığı Fizyoterapisi',
    'Kardiyopulmoner Rehabilitasyon',
    'Lenfödem Terapisi',
    'Pilates Temelli Fizyoterapi'
  ],
  'Ergoterapist': [
    'Pediatrik Ergoterapi',
    'Nörolojik Ergoterapi',
    'Geriatrik Ergoterapi',
    'Psikiyatrik Ergoterapi',
    'El Rehabilitasyonu',
    'Duyu Bütünleme Terapisi',
    'Kognitif Rehabilitasyon',
    'Onkolojik Ergoterapi',
    'Mesleki Rehabilitasyon',
    'Ev ve Çevre Düzenleme'
  ],
  'Dil ve Konuşma Terapisti': [
    'Artikülasyon Bozuklukları',
    'Gecikmiş Dil ve Konuşma',
    'Kekemelik (Akıcılık Bozuklukları)',
    'Ses Bozuklukları',
    'Yutma Bozuklukları',
    'Afazi (İnme Sonrası Dil Kaybı)',
    'Otizm Spektrum Bozukluğu Dil Terapisi',
    'Dudak Damak Yarıkları Konuşma Terapisi',
    'Motor Konuşma Bozuklukları (Dizartri/Apraksi)',
    'İşitme Engelli Çocuklarda Dil Terapisi'
  ]
};
