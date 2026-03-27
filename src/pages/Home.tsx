import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Stethoscope, 
  Apple, 
  Brain, 
  ShieldCheck, 
  Star, 
  ArrowRight, 
  User, 
  MessageSquare,
  MessageCircle,
  ClipboardList,
  MapPin,
  Calendar as CalendarIcon,
  Clock
} from 'lucide-react';
import QuickServiceSearch from '../components/QuickServiceSearch';
import TalepForm from '../components/TalepForm';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { blogPosts } from '../data/blogPosts';

interface ServiceRequest {
  id: string;
  numericId: number;
  seekerName: string;
  serviceTypes: string[];
  city: string;
  district: string;
  createdAt: any;
  status: string;
  description: string;
}

const Home: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, profile } = useAuth();
  const [relevantRequests, setRelevantRequests] = useState<ServiceRequest[]>([]);

  useEffect(() => {
    if (profile?.role === 'provider') {
      const sampleRequests: ServiceRequest[] = [
        {
          id: 'DEMO-1',
          numericId: 1001,
          seekerName: 'Örnek Kullanıcı',
          serviceTypes: ['Fizyoterapist'],
          city: 'İstanbul',
          district: 'Beşiktaş',
          createdAt: { toDate: () => new Date() },
          status: 'open',
          description: 'Bel fıtığı şikayeti için evde fizik tedavi seansı arıyorum.'
        },
        {
          id: 'DEMO-2',
          numericId: 1002,
          seekerName: 'Örnek Kullanıcı',
          serviceTypes: ['Diyetisyen'],
          city: 'Ankara',
          district: 'Çankaya',
          createdAt: { toDate: () => new Date() },
          status: 'open',
          description: 'Kilo verme ve sağlıklı beslenme programı için destek arıyorum.'
        }
      ];

      let q = query(
        collection(db, 'requests'),
        where('status', '==', 'open'),
        limit(20)
      );

      // Only filter by specialties if they exist
      if (profile.specialties && profile.specialties.length > 0) {
        q = query(
          collection(db, 'requests'),
          where('serviceTypes', 'array-contains-any', profile.specialties),
          where('status', '==', 'open'),
          limit(20)
        );
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        let reqs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ServiceRequest[];

        // Sort in memory to avoid index issues
        reqs.sort((a: any, b: any) => {
          const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
          const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
          return dateB - dateA;
        });

        const finalReqs = reqs.length > 0 ? reqs.slice(0, 10) : sampleRequests;
        setRelevantRequests(finalReqs);
      }, (error) => {
        console.error('Home relevant requests error:', error);
        setRelevantRequests(sampleRequests);
      });

      return () => unsubscribe();
    }
  }, [profile]);

  return (
    <div className="space-y-24 pb-24">
      {/* Hero Section - Only show for non-providers or logged out users */}
      {profile?.role !== 'provider' && (
        <section className="relative overflow-hidden pt-12">
          <div className="max-w-4xl mx-auto text-center space-y-8 px-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-7xl font-bold text-stone-900 tracking-tight leading-tight"
            >
              Sağlık Hizmetlerine <span className="text-sky-600">Güvenle</span> Ulaşın
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-stone-600 max-w-2xl mx-auto"
            >
              Fizyoterapist, diyetisyen, psikolog, ergoterapist ve dil terapistleriyle doğrudan bağlantı kurun. Profesyonel hizmet, şeffaf süreç.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <button
                onClick={() => setIsSearchOpen(true)}
                className="w-full sm:w-auto bg-sky-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-sky-700 transition-all shadow-xl shadow-sky-100 active:scale-95 flex items-center justify-center gap-2"
              >
                Hemen Hizmet Al <ArrowRight size={20} />
              </button>
              {!user && (
                <a
                  href={`https://wa.me/905452050458?text=${encodeURIComponent('Merhaba, hizmet veren olarak kayıt olmak istiyorum.')}`}
                  className="w-full sm:w-auto bg-white text-stone-900 border-2 border-stone-200 px-8 py-4 rounded-2xl font-semibold text-lg hover:border-sky-600 hover:text-sky-600 transition-all active:scale-95 flex items-center justify-center"
                >
                  Hizmet Veren Ol
                </a>
              )}
            </motion.div>
          </div>
        </section>
      )}

      {/* Provider Hero Section - Specific for providers */}
      {profile?.role === 'provider' && (
        <section className="bg-sky-600 text-white pt-16 pb-24 -mt-8 rounded-b-[4rem] shadow-2xl shadow-sky-100/50">
          <div className="max-w-6xl mx-auto px-4 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-4xl md:text-5xl font-bold tracking-tight"
                >
                  Hoş Geldiniz, {profile.displayName.split(' ')[0]}!
                </motion.h1>
                <p className="text-sky-100 text-lg max-w-xl">
                  Bugün size uygun yeni iş fırsatlarını aşağıda görebilirsiniz. Profilinizi güncel tutarak daha fazla talep alabilirsiniz.
                </p>
              </div>
              <div className="flex gap-3">
                <Link 
                  to="/dashboard" 
                  className="bg-white text-sky-600 px-6 py-3 rounded-2xl font-bold hover:bg-sky-50 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                >
                  <ClipboardList size={20} /> Panele Git
                </Link>
                <Link 
                  to="/profile" 
                  className="bg-sky-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-sky-400 transition-all border border-sky-400 active:scale-95"
                >
                  Profili Düzenle
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <AnimatePresence>
        {isSearchOpen && (
          <QuickServiceSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        )}
      </AnimatePresence>

      {/* Provider Requests Section */}
      {profile?.role === 'provider' && (
        <section className="max-w-6xl mx-auto px-4 space-y-8 -mt-12">
          <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-stone-100 shadow-xl space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold text-stone-900 flex items-center gap-3">
                  <ClipboardList className="text-sky-600" />
                  Size Uygun Yeni Talepler
                </h2>
                <p className="text-stone-500">Uzmanlık alanlarınıza göre filtrelenmiş en güncel iş fırsatları.</p>
              </div>
              <Link to="/dashboard" className="text-sky-600 font-bold hover:underline flex items-center gap-1">
                Tümünü Gör <ArrowRight size={16} />
              </Link>
            </div>

            {relevantRequests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relevantRequests.map((req) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -5 }}
                    className="bg-stone-50 p-6 rounded-[2rem] border border-stone-100 hover:bg-white hover:shadow-xl transition-all space-y-4 group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Talep #{req.numericId}
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono">{req.id.substring(0, 8)}...</span>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-bold text-stone-900 group-hover:text-sky-600 transition-colors line-clamp-1">
                        {(req.serviceTypes || ['Hizmet']).join(', ')}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-stone-500">
                        <MapPin size={14} className="text-sky-600" />
                        <span>{req.city}, {req.district}</span>
                      </div>
                    </div>

                    <p className="text-sm text-stone-600 line-clamp-2 italic bg-white/50 p-3 rounded-xl border border-stone-100">
                      "{req.description || 'Detay belirtilmemiş.'}"
                    </p>

                    <div className="pt-4 flex items-center justify-between border-t border-stone-200/50">
                      <div className="flex items-center gap-2 text-xs text-stone-400">
                        <Clock size={12} />
                        <span>{req.createdAt?.toDate().toLocaleDateString('tr-TR')}</span>
                      </div>
                      <a 
                        href={`https://wa.me/905452050458?text=${encodeURIComponent(`Merhaba, ${req.id} numaralı ${(req.serviceTypes || ['Hizmet']).join(', ')} talebi hakkında bilgi almak istiyorum.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#25D366] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#128C7E] transition-all shadow-lg active:scale-95 flex items-center gap-1"
                      >
                        <MessageCircle size={14} />
                        WhatsApp
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-stone-50 rounded-[2rem] p-16 text-center space-y-6 border-2 border-dashed border-stone-200">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto text-stone-300 shadow-sm">
                  <ClipboardList size={40} />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-bold text-stone-900">Şu an uygun talep bulunmuyor.</p>
                  <p className="text-stone-500 max-w-md mx-auto">
                    Uzmanlık alanlarınıza uygun yeni talepler geldiğinde burada anlık olarak görünecektir.
                  </p>
                </div>
                <Link 
                  to="/profile" 
                  className="inline-block text-sky-600 font-bold hover:underline"
                >
                  Uzmanlık Alanlarını Güncelle
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Services Section */}
      <section className="max-w-6xl mx-auto px-4 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold text-stone-900">Hizmet Alanlarımız</h2>
          <p className="text-stone-600 max-w-2xl mx-auto">
            Fiziksel toparlanma, ağrı yönetimi ve sağlıklı yaşam için uzman desteği.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-12">
          {[
            { 
              icon: <Stethoscope size={32} />, 
              title: '1. Fizyoterapist (Fizik Tedavi ve Rehabilitasyon)', 
              desc: 'Fizyoterapide seanslar genellikle uygulama alanına ve hastanın hareket kabiliyetine göre şekillenir.',
              items: [
                { label: 'Ortopedik Rehabilitasyon', content: 'Bel ve boyun fıtığı, eklem ağrıları, kırık sonrası iyileşme süreçleri.', sub: 'İçerik: Manuel terapi, kinezyolojik bantlama, kişiye özel egzersiz reçetesi.' },
                { label: 'Nörolojik Rehabilitasyon (Yüksek Uzmanlık)', content: 'Felç (İnme), MS, Parkinson gibi sinir sistemi kaynaklı hastalıklar.', sub: 'İçerik: Nörofasilitasyon teknikleri, denge ve koordinasyon eğitimi.' },
                { label: 'Pediatrik Rehabilitasyon', content: 'Serebral Palsi, tortikolis gibi çocukluk dönemi hareket bozuklukları.', sub: 'İçerik: Oyun temelli rehabilitasyon, gelişimsel takip.' },
                { label: 'Sporcu Sağlığı ve Sakatlıkları', content: 'Menisküs, ön çapraz bağ yaralanmaları sonrası sahaya dönüş.', sub: 'İçerik: Fonksiyonel antrenman, sakatlık önleyici protokoller.' },
                { label: 'Evde Fizik Tedavi (Premium Hizmet)', content: 'Kliniğe gidemeyen hastalar için uzmanın ekipmanıyla eve gitmesi.', sub: '' }
              ]
            },
            { 
              icon: <Apple size={32} />, 
              title: '2. Diyetisyen (Beslenme ve Diyetik)', 
              desc: 'Diyetisyen seansları genellikle hedef odaklıdır ve ölçüm/takip üzerine kuruludur.',
              items: [
                { label: 'Sürdürülebilir Kilo Yönetimi', content: 'Kilo alma veya verme süreçleri.', sub: 'İçerik: Vücut analizi yorumlama, kişiye özel beslenme listesi, porsiyon kontrolü eğitimi.' },
                { label: 'Hastalıklarda Beslenme Tedavisi', content: 'Diyabet (Şeker), insülin direnci, tansiyon veya kolesterol yönetimi.', sub: 'İçerik: Tıbbi beslenme tedavisi, kan tahlili takibi.' },
                { label: 'Sporcu Beslenmesi', content: 'Profesyonel veya amatör sporcular için performans odaklı planlama.', sub: 'İçerik: Makro/mikro besin hesaplaması, antrenman öncesi-sonrası beslenme.' },
                { label: 'Anne - Çocuk Beslenmesi', content: 'Gebelik dönemi, emzirme süreci ve ek gıdaya geçiş aşamaları.', sub: 'İçerik: Sağlıklı büyüme takibi, iştahsız çocuklarda beslenme stratejileri.' },
                { label: 'Eliminasyon Diyeti ve Gıda İntoleransı', content: 'IBS (Huzursuz bağırsak), gluten duyarlılığı gibi durumlar.', sub: 'İçerik: Bağırsak sağlığı protokolleri, yasaklı/serbest gıda takibi.' }
              ]
            },
            { 
              icon: <Brain size={32} />, 
              title: '3. Psikolog (Ruh Sağlığı ve Terapi)', 
              desc: 'Psikolojide seanslar kullanılan ekole (yönteme) ve hedef kitleye göre ayrılır.',
              items: [
                { label: 'Bireysel Psikoterapi (BDT)', content: 'Kaygı, depresyon, stres yönetimi.', sub: 'İçerik: Düşünce ve davranış kalıplarını fark etme, baş etme mekanizmaları geliştirme.' },
                { label: 'EMDR Terapisi (Travma Odaklı)', content: 'Göz hareketleriyle duyarsızlaştırma.', sub: 'İçerik: Geçmiş travmaların, fobi veya yas süreçlerinin işlenmesi.' },
                { label: 'Çift ve Aile Terapisi', content: 'İlişki problemleri, iletişim kazaları, boşanma süreçleri.', sub: 'İçerik: Çatışma çözme teknikleri, sağlıklı iletişim kurma.' },
                { label: 'Çocuk ve Ergen Terapisi (Oyun Terapisi)', content: 'Okul problemleri, sınav kaygısı, gelişimsel krizler.', sub: 'İçerik: Oyun yoluyla duygu dışavurumu, ebeveyn danışmanlığı.' },
                { label: 'Cinsel Terapi', content: 'Vajinismus, erken boşalma gibi cinsel işlev bozuklukları.', sub: 'İçerik: Bilgilendirme (psiko-eğitim) ve ev ödevleri odaklı süreçler.' }
              ]
            },
            { 
              icon: <User size={32} />, 
              title: '4. Ergoterapist (İş ve Uğraşı Terapisi)', 
              desc: 'Ergoterapi, bireylerin günlük yaşam aktivitelerine katılımını artırmayı hedefler.',
              items: [
                { label: 'Duyu Bütünleme Terapisi', content: 'Duyusal hassasiyetler ve işlemleme bozuklukları.', sub: 'İçerik: Duyusal profil analizi, adaptif yanıt geliştirme.' },
                { label: 'Günlük Yaşam Aktiviteleri (GYA)', content: 'Öz bakım, yemek yeme, giyinme gibi temel beceriler.', sub: 'İçerik: Bağımsızlık eğitimi, yardımcı cihaz kullanımı.' },
                { label: 'Pediatrik Ergoterapi', content: 'Otizm, DEHB, gelişimsel gecikmeler.', sub: 'İçerik: İnce/kaba motor beceriler, sosyal katılım.' },
                { label: 'El Rehabilitasyonu', content: 'Yaralanma veya cerrahi sonrası el fonksiyonlarının geri kazanımı.', sub: 'İçerik: Splintleme, kuvvetlendirme egzersizleri.' },
                { label: 'Bilişsel Rehabilitasyon', content: 'Hafıza, dikkat ve planlama becerilerinin geliştirilmesi.', sub: 'İçerik: Zihinsel stratejiler, çevresel düzenlemeler.' }
              ]
            },
            { 
              icon: <MessageSquare size={32} />, 
              title: '5. Dil ve Konuşma Terapisti', 
              desc: 'Dil ve konuşma terapisi, iletişim ve yutma bozukluklarının tedavisine odaklanır.',
              items: [
                { label: 'Artikülasyon ve Fonolojik Bozukluklar', content: 'Seslerin yanlış üretilmesi veya karıştırılması.', sub: 'İçerik: Ses üretim çalışmaları, işitsel ayırt etme.' },
                { label: 'Gecikmiş Dil ve Konuşma', content: 'Yaşıtlarına göre dil gelişimi geride olan çocuklar.', sub: 'İçerik: Dil girdi artırma, oyun temelli dil terapisi.' },
                { label: 'Kekemelik ve Akıcılık Bozuklukları', content: 'Konuşmada takılmalar, bloklar veya tekrarlar.', sub: 'İçerik: Akıcılık şekillendirme, duyarsızlaştırma teknikleri.' },
                { label: 'Ses Bozuklukları', content: 'Nodül, polip veya yanlış ses kullanımı kaynaklı kısıklık.', sub: 'İçerik: Ses hijyeni eğitimi, vokal egzersizler.' },
                { label: 'Yutma Bozuklukları (Disfaji)', content: 'Yemek yeme veya içme sırasında yaşanan zorluklar.', sub: 'İçerik: Yutma manevraları, diyet modifikasyonu.' }
              ]
            },
          ].map((service, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 md:p-12 rounded-[3rem] border border-stone-100 shadow-sm hover:shadow-xl transition-all"
            >
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-20 h-20 bg-sky-50 text-sky-600 rounded-[2rem] flex items-center justify-center shrink-0">
                  {service.icon}
                </div>
                <div className="space-y-6 flex-1">
                  <div>
                    <h3 className="text-3xl font-bold text-stone-900 mb-2">{service.title}</h3>
                    <p className="text-stone-600 text-lg">{service.desc}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 pt-8 border-t border-stone-50">
                    {service.items.map((item, j) => (
                      <div key={j} className="space-y-2">
                        <h4 className="font-bold text-stone-900 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-sky-600 rounded-full" />
                          {item.label}
                        </h4>
                        <p className="text-stone-600 text-sm leading-relaxed">{item.content}</p>
                        {item.sub && (
                          <p className="text-sky-600 text-xs font-bold uppercase tracking-wider">{item.sub}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-stone-900 text-white py-24 rounded-[3rem] mx-4 px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Neden Terapist Bul?</h2>
            <div className="space-y-6">
              {[
                { icon: <ShieldCheck className="text-sky-400" />, title: 'Doğrulanmış Profiller', desc: 'Diploma ve adli sicil kaydı kontrolü ile güvenli hizmet.' },
                { icon: <Star className="text-sky-400" />, title: 'Şeffaf Değerlendirme', desc: 'Gerçek kullanıcı yorumları ve puanlama sistemi.' },
                { icon: <ArrowRight className="text-sky-400" />, title: 'Doğrudan İletişim', desc: 'Hizmet verenle doğrudan anlaşın, ek ücret ödemeyin.' },
              ].map((feature, i) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-1">{feature.icon}</div>
                  <div>
                    <h4 className="text-xl font-bold">{feature.title}</h4>
                    <p className="text-stone-400">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square bg-sky-600/20 rounded-full blur-3xl absolute -inset-4"></div>
            <img
              src="https://picsum.photos/seed/health/800/800"
              alt="Health Professional"
              className="relative rounded-[2rem] shadow-2xl border border-white/10"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="max-w-6xl mx-auto px-4 space-y-12">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-4xl font-bold text-stone-900">Blog & Sağlık Rehberi</h2>
            <p className="text-stone-600">Uzmanlarımızdan güncel sağlık ve terapi yazıları.</p>
          </div>
          <Link to="/blog" className="text-sky-600 font-bold hover:underline flex items-center gap-1">
            Tümünü Gör <ArrowRight size={18} />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {blogPosts.slice(0, 3).map((post, i) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-stone-100 flex flex-col"
            >
              <Link to={`/blog/${post.id}`} className="block overflow-hidden aspect-video relative">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-stone-900 text-xs font-bold rounded-full shadow-sm">
                    {post.category}
                  </span>
                </div>
              </Link>
              
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-4 text-xs text-stone-400 mb-3">
                  <span className="flex items-center gap-1">
                    <CalendarIcon size={14} /> {new Date(post.date).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                
                <Link to={`/blog/${post.id}`}>
                  <h3 className="text-xl font-bold text-stone-900 mb-3 group-hover:text-sky-600 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                </Link>
                
                <p className="text-stone-600 text-sm mb-6 line-clamp-2 flex-1">
                  {post.summary}
                </p>
                
                <Link 
                  to={`/blog/${post.id}`}
                  className="inline-flex items-center gap-2 text-stone-900 font-bold text-sm hover:gap-3 transition-all"
                >
                  Devamını Oku <ArrowRight size={18} />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Uzman Talep Formu Section */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl font-bold text-stone-900">Hızlı Uzman Talebi</h2>
          <p className="text-stone-600">Aradığınız hizmeti bulamadınız mı? Formu doldurun, biz size en uygun uzmanı bulalım.</p>
        </div>
        <TalepForm />
      </section>
    </div>
  );
};

export default Home;
