export interface BlogPost {
  id: string;
  title: string;
  category: 'Fizyoterapist' | 'Diyetisyen' | 'Psikolog' | 'Ergoterapist' | 'Dil ve Konuşma Terapisti';
  summary: string;
  content: string;
  image: string;
  date: string;
  author: string;
}

export const blogPosts: BlogPost[] = [
  // Fizyoterapist
  {
    id: 'bel-fitigi-ve-fizik-tedavi',
    title: 'Bel Fıtığı ve Fizik Tedavi: Ameliyatsız Çözümler',
    category: 'Fizyoterapist',
    summary: 'Bel fıtığı tedavisinde fizik tedavinin rolü ve uygulanan modern yöntemler.',
    content: `
      Bel fıtığı, günümüzde en sık karşılaşılan sağlık sorunlarından biridir. Hareketsiz yaşam, yanlış duruş ve ağır kaldırma gibi faktörler bu sorunu tetikleyebilir. 
      
      Fizik tedavi, bel fıtığı yönetiminde cerrahi dışı en etkili yöntemlerden biridir. Uyguladığımız yöntemler arasında:
      - **Manuel Terapi:** Eklemlerin ve yumuşak dokuların elle mobilize edilmesi.
      - **Klinik Pilates:** Omurga sağlığını destekleyen özel egzersizler.
      - **Elektroterapi:** Ağrıyı azaltmak ve doku iyileşmesini hızlandırmak için kullanılan akımlar.
      - **Kişiye Özel Egzersiz Programları:** Kas dengesizliklerini gidermeye yönelik planlar.
      
      Erken dönemde başlanan fizik tedavi ile hastaların büyük bir çoğunluğu ameliyata gerek kalmadan sağlığına kavuşabilmektedir.
    `,
    image: 'https://picsum.photos/seed/backpain/800/600',
    date: '2026-03-27',
    author: 'Terapist Bul Ekibi'
  },
  {
    id: 'boyun-agrisi-ve-ergonomi',
    title: 'Boyun Ağrısı ve Masa Başı Çalışanlar İçin Ergonomi',
    category: 'Fizyoterapist',
    summary: 'Masa başı çalışanlarda sık görülen boyun ağrılarını önleme yolları.',
    content: `
      Uzun süre bilgisayar başında çalışmak, boyun ve omuz bölgesinde ciddi gerginliklere yol açar. 'Text Neck' olarak adlandırılan bu durum, boyun düzleşmesine kadar gidebilir.
      
      Fizyoterapistlerimiz bu konuda şu yaklaşımları öneriyor:
      - **Duruş Analizi:** Çalışma ortamınızın vücut yapınıza göre düzenlenmesi.
      - **Germe Egzersizleri:** Gün içinde yapılabilecek kısa ve etkili hareketler.
      - **Kuru İğneleme:** Kaslardaki tetik noktaların (kulunç) gevşetilmesi.
      
      Küçük ergonomik değişiklikler ve düzenli hareket, kronik boyun ağrılarından kurtulmanın anahtarıdır.
    `,
    image: 'https://picsum.photos/seed/neckpain/800/600',
    date: '2026-03-26',
    author: 'Terapist Bul Ekibi'
  },
  {
    id: 'spor-yaralanmalari-rehabilitasyonu',
    title: 'Spor Yaralanmaları: Sahaya Dönüş Süreci',
    category: 'Fizyoterapist',
    summary: 'Spor yaralanmaları sonrası uygulanan rehabilitasyon süreçleri.',
    content: `
      Ön çapraz bağ yaralanmaları, menisküs yırtıkları veya ayak bileği burkulmaları... Sporcular için bu süreçler sadece fiziksel değil, psikolojik olarak da zorlayıcıdır.
      
      Rehabilitasyon sürecimiz şu aşamalardan oluşur:
      1. **Akut Dönem:** Ödem ve ağrı kontrolü.
      2. **Fonksiyonel Dönem:** Eklem hareket açıklığının geri kazanılması ve güçlendirme.
      3. **Sahaya Dönüş:** Spora özgü teknik hareketlerin ve dengenin test edilmesi.
      
      Doğru bir rehabilitasyon, tekrar yaralanma riskini minimize eder.
    `,
    image: 'https://picsum.photos/seed/sportsinjury/800/600',
    date: '2026-03-25',
    author: 'Terapist Bul Ekibi'
  },

  // Diyetisyen
  {
    id: 'insulin-direnci-ve-beslenme',
    title: 'İnsülin Direnciyle Savaşta Beslenme Stratejileri',
    category: 'Diyetisyen',
    summary: 'İnsülin direncini kırmak için beslenmede nelere dikkat edilmeli?',
    content: `
      Sürekli tatlı isteği, yemek sonrası uyku hali ve göbek çevresinde yağlanma... Bunlar insülin direncinin belirtileri olabilir.
      
      Diyetisyenlerimizin önerdiği temel stratejiler:
      - **Glisemik İndeks Kontrolü:** Kan şekerini hızlı yükseltmeyen karbonhidrat seçimi.
      - **Lifli Beslenme:** Sebze ve tam tahılların öğünlerdeki ağırlığının artırılması.
      - **Öğün Düzeni:** Kişiye özel aralıklı oruç veya az az sık sık beslenme modelleri.
      
      İnsülin direnci bir kader değil, doğru beslenme ile yönetilebilir bir durumdur.
    `,
    image: 'https://picsum.photos/seed/nutrition/800/600',
    date: '2026-03-27',
    author: 'Terapist Bul Ekibi'
  },
  {
    id: 'detoks-mitleri-ve-gercekler',
    title: 'Detoks Mitleri: Vücudunuzu Gerçekten Nasıl Temizlersiniz?',
    category: 'Diyetisyen',
    summary: 'Popüler detoks sularından ziyade bilimsel detoks yaklaşımları.',
    content: `
      Sadece sıvı ile beslenmek veya mucizevi karışımlar içmek vücudu temizlemez. Vücudumuzun zaten harika bir detoks sistemi vardır: Karaciğer ve böbrekler.
      
      Gerçek detoks için:
      - **Yeterli Su Tüketimi:** Toksinlerin atılması için en temel ihtiyaç.
      - **Antioksidan Zenginliği:** Renkli sebze ve meyveler.
      - **İşlenmiş Gıdalardan Uzak Durmak:** Karaciğerin yükünü azaltmak.
      
      Sürdürülebilir bir beslenme tarzı, en iyi detokstur.
    `,
    image: 'https://picsum.photos/seed/detox/800/600',
    date: '2026-03-24',
    author: 'Terapist Bul Ekibi'
  },
  {
    id: 'cocukluk-cagi-obezitesi',
    title: 'Çocukluk Çağı Obezitesi: Ailelere Öneriler',
    category: 'Diyetisyen',
    summary: 'Çocuklarda sağlıklı beslenme alışkanlığı nasıl kazandırılır?',
    content: `
      Çocukluk döneminde kazanılan beslenme alışkanlıkları, yetişkinlikteki sağlık durumunun temelini oluşturur.
      
      Aileler için ipuçları:
      - **Rol Model Olun:** Siz ne yerseniz çocuğunuz da onu merak eder.
      - **Mutfakta Katılım:** Çocuğunuzun yemek hazırlama sürecine dahil olması besinleri tanımasını sağlar.
      - **Yasaklamak Yerine Eğitmek:** Gıdaların vücudumuza faydalarını anlatmak.
      
      Baskıcı değil, destekleyici bir yaklaşım başarıyı getirir.
    `,
    image: 'https://picsum.photos/seed/childnutrition/800/600',
    date: '2026-03-23',
    author: 'Terapist Bul Ekibi'
  },

  // Psikolog
  {
    id: 'kaygi-bozuklugu-ve-bdt',
    title: 'Kaygı Bozukluğu (Anksiyete) ve Bilişsel Davranışçı Terapi',
    category: 'Psikolog',
    summary: 'Sürekli endişe haliyle başa çıkmada BDT yöntemleri.',
    content: `
      Gelecek hakkında sürekli kötü senaryolar kurmak, fiziksel çarpıntı ve huzursuzluk... Kaygı bozukluğu yaşam kalitesini ciddi oranda düşürür.
      
      Psikologlarımızın uyguladığı Bilişsel Davranışçı Terapi (BDT) şunları hedefler:
      - **Düşünce Hatalarını Fark Etme:** 'Ya şöyle olursa' gibi felaketleştirme düşüncelerini sorgulama.
      - **Maruz Bırakma:** Korkulan durumlara kademeli ve güvenli bir şekilde yaklaşma.
      - **Gevşeme Teknikleri:** Nefes ve kas gevşetme egzersizleri ile bedensel uyarımı düşürme.
      
      Kaygı, kaçtıkça büyür; anladıkça ve üzerine gittikçe küçülür.
    `,
    image: 'https://picsum.photos/seed/anxiety/800/600',
    date: '2026-03-27',
    author: 'Terapist Bul Ekibi'
  },
  {
    id: 'emdr-terapisi-nedir',
    title: 'EMDR Terapisi: Travmaların İzini Silmek',
    category: 'Psikolog',
    summary: 'Göz hareketleriyle duyarsızlaştırma ve yeniden işleme terapisi.',
    content: `
      Geçmişte yaşanan olumsuz bir olayın etkisi hala bugün devam ediyorsa, EMDR etkili bir çözüm olabilir.
      
      EMDR süreci:
      - **Çift Yönlü Uyarım:** Göz hareketleri veya sesli uyarımlar ile beynin her iki yarım küresinin aktif edilmesi.
      - **Anıların İşlenmesi:** Travmatik anının beyindeki kilitli kaldığı yerden çıkarılıp sağlıklı bir şekilde depolanması.
      
      EMDR, sadece büyük travmalar için değil, özgüven sorunları ve performans kaygısı için de kullanılmaktadır.
    `,
    image: 'https://picsum.photos/seed/emdr/800/600',
    date: '2026-03-22',
    author: 'Terapist Bul Ekibi'
  },
  {
    id: 'tukenmislik-sendromu',
    title: 'Tükenmişlik Sendromu: İş Hayatında Ruh Sağlığı',
    category: 'Psikolog',
    summary: 'İş stresinin kronikleşmesi ve duygusal tükenme ile başa çıkma.',
    content: `
      Sabahları işe gitmekte zorlanıyor, kendinizi sürekli yorgun ve sinirli mi hissediyorsunuz? Tükenmişlik sendromu yaşıyor olabilirsiniz.
      
      Başa çıkma yolları:
      - **Sınır Koymak:** İş ve özel yaşam arasındaki çizgiyi netleştirmek.
      - **Öz Şefkat:** Kendinize karşı eleştirel değil, anlayışlı olmak.
      - **Destek Almak:** Duygularınızı paylaşmak ve profesyonel rehberlik.
      
      Dinlenmek bir lüks değil, bir ihtiyaçtır.
    `,
    image: 'https://picsum.photos/seed/burnout/800/600',
    date: '2026-03-21',
    author: 'Terapist Bul Ekibi'
  },

  // Ergoterapist
  {
    id: 'duyu-butunleme-bozuklugu',
    title: 'Duyu Bütünleme Bozukluğu: Belirtiler ve Terapi',
    category: 'Ergoterapist',
    summary: 'Çocuklarda duyusal hassasiyetler ve ergoterapi desteği.',
    content: `
      Bazı çocuklar yüksek sesten çok rahatsız olur, bazıları ise sürekli hareket etme ihtiyacı duyar. Bu durum duyu bütünleme bozukluğuna işaret edebilir.
      
      Ergoterapi yaklaşımlarımız:
      - **Duyusal Diyet:** Çocuğun ihtiyacı olan duyusal girdilerin gün içine yayılması.
      - **Oyun Odaklı Terapi:** Salıncaklar, dokulu materyaller ve denge parkurları ile beynin duyuları işlemesini geliştirme.
      
      Duyu bütünleme, çocuğun öğrenme ve sosyal becerilerini doğrudan etkiler.
    `,
    image: 'https://picsum.photos/seed/sensory/800/600',
    date: '2026-03-27',
    author: 'Terapist Bul Ekibi'
  },
  {
    id: 'otizmde-ergoterapi',
    title: 'Otizm Spektrum Bozukluğunda Ergoterapinin Rolü',
    category: 'Ergoterapist',
    summary: 'Otizmli bireylerde bağımsız yaşam becerileri geliştirme.',
    content: `
      Otizm tanısı alan bireylerde ergoterapi, günlük yaşam aktivitelerinde bağımsızlığı hedefler.
      
      Çalışma alanları:
      - **Öz Bakım Becerileri:** Yemek yeme, giyinme, tuvalet eğitimi.
      - **İnce Motor Beceriler:** Yazı yazma, makas kullanma, düğme ilikleme.
      - **Sosyal Katılım:** Akranlarıyla oyun oynama ve etkileşim kurma.
      
      Her birey özeldir ve terapi planı kişiye özgü ihtiyaçlara göre şekillenir.
    `,
    image: 'https://picsum.photos/seed/autism/800/600',
    date: '2026-03-20',
    author: 'Terapist Bul Ekibi'
  },
  {
    id: 'dikkat-eksikligi-ergoterapi',
    title: 'DEHB ve Ergoterapi: Odaklanmayı Artırmak',
    category: 'Ergoterapist',
    summary: 'Dikkat eksikliği ve hiperaktivite bozukluğunda yapılandırılmış yaklaşımlar.',
    content: `
      Dikkat eksikliği yaşayan çocuklar için çevre düzenlemesi ve strateji geliştirme çok önemlidir.
      
      Ergoterapistlerimiz şunları uygular:
      - **Yönetici İşlevlerin Geliştirilmesi:** Planlama, organize olma ve zaman yönetimi.
      - **Çevresel Düzenleme:** Çalışma masasının dikkat dağıtıcı unsurlardan arındırılması.
      - **Bilişsel Stratejiler:** Görevleri küçük parçalara bölme teknikleri.
      
      Hareket ihtiyacını doğru kanallara yönlendirmek, odaklanmayı kolaylaştırır.
    `,
    image: 'https://picsum.photos/seed/adhd/800/600',
    date: '2026-03-19',
    author: 'Terapist Bul Ekibi'
  },

  // Dil ve Konuşma Terapisti
  {
    id: 'gecikmis-konusma-belirtileri',
    title: 'Gecikmiş Konuşma: Ne Zaman Endişelenmeli?',
    category: 'Dil ve Konuşma Terapisti',
    summary: 'Çocuklarda dil gelişimi basamakları ve gecikme belirtileri.',
    content: `
      '2 yaşında ama hala kelimesi yok' veya 'Söylenenleri anlıyor ama konuşmuyor'... Bu durumlar aileleri endişelendirebilir.
      
      Dil ve Konuşma Terapistlerimizin önerileri:
      - **Erken Müdahale:** Dil gelişimi beklemekle değil, doğru uyaranla gelişir.
      - **Etkileşimli Oyun:** Ekran süresini azaltıp karşılıklı iletişimi artırmak.
      - **Dil Stratejileri:** Çocuğun çıkardığı sesleri genişletmek ve model olmak.
      
      Konuşma sadece bir sonuçtur; temelinde dil ve iletişim becerileri yatar.
    `,
    image: 'https://picsum.photos/seed/speech/800/600',
    date: '2026-03-27',
    author: 'Terapist Bul Ekibi'
  },
  {
    id: 'kekemelik-ve-terapi-sureci',
    title: 'Kekemelik: Akıcı Konuşma Stratejileri',
    category: 'Dil ve Konuşma Terapisti',
    summary: 'Kekemelikle barışmak ve konuşma akıcılığını yönetmek.',
    content: `
      Kekemelik bir hastalık değil, bir konuşma bozukluğudur. Terapi süreci hem teknik hem de psikolojik boyutlar içerir.
      
      Uygulanan yöntemler:
      - **Akıcılık Şekillendirme:** Nefes kontrolü ve yumuşak başlangıçlar.
      - **Kekemelik Modifikasyonu:** Kekemelik anındaki gerginliği azaltma teknikleri.
      - **Duyarsızlaştırma:** Konuşma kaygısını azaltmaya yönelik çalışmalar.
      
      Hedef, 'hiç kekelememek' değil, 'iletişimden kaçmamak' ve 'rahat kekelemek'tir.
    `,
    image: 'https://picsum.photos/seed/stuttering/800/600',
    date: '2026-03-18',
    author: 'Terapist Bul Ekibi'
  },
  {
    id: 'artikulasyon-bozuklugu',
    title: 'Artikülasyon Bozukluğu: Sesleri Doğru Çıkarmak',
    category: 'Dil ve Konuşma Terapisti',
    summary: 'Harfleri yanlış söyleme (pelteklik vb.) ve düzeltme yolları.',
    content: `
      'R' yerine 'Y' demek veya 'S' seslerini sızdırarak çıkarmak artikülasyon bozukluğudur.
      
      Terapi süreci:
      - **İşitsel Ayırt Etme:** Doğru ve yanlış sesi duyarak fark etme.
      - **Üretim:** Dil ve dudak pozisyonlarını öğrenerek sesi tek başına çıkarma.
      - **Genelleme:** Sesi kelime, cümle ve günlük konuşma içine yerleştirme.
      
      Doğru egzersizlerle bu alışkanlıklar kalıcı olarak düzeltilebilir.
    `,
    image: 'https://picsum.photos/seed/articulation/800/600',
    date: '2026-03-17',
    author: 'Terapist Bul Ekibi'
  }
];
