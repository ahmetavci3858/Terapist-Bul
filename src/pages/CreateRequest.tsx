import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Target, 
  Users, 
  Calendar, 
  Phone, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2,
  Home,
  Building2,
  Globe,
  Info,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  setDoc,
  serverTimestamp, 
  runTransaction, 
  doc, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { TURKISH_LOCATIONS } from '../data/locations';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const SERVICE_GOALS: Record<string, string[]> = {
// ... existing goals ...
  'Fizyoterapist': [
    'Ağrıları azaltma', 
    'Rahatlama', 
    'Hareketliliği artırma', 
    'Ameliyat sonrası rehabilitasyon', 
    'Sporcu sağlığı / Performans',
    'Duruş bozukluğu düzeltme',
    'Nörolojik rehabilitasyon'
  ],
  'Diyetisyen': [
    'Kilo verme', 
    'Kilo alma', 
    'Sağlıklı beslenme alışkanlığı', 
    'Hastalıklarda beslenme yönetimi', 
    'Sporcu beslenmesi',
    'Hamilelik/Emzirme dönemi beslenmesi',
    'Yeme bozukluğu desteği'
  ],
  'Psikolog': [
    'Stres ve kaygı yönetimi', 
    'Depresyon desteği', 
    'İlişki ve aile sorunları', 
    'Özgüven ve kişisel gelişim', 
    'Travma sonrası destek',
    'Panik atak yönetimi',
    'Fobi/Korku üzerine çalışma'
  ],
  'Ergoterapist': [
    'Günlük yaşam becerilerini geliştirme', 
    'Duyu bütünleme desteği', 
    'İnce ve kaba motor beceriler', 
    'El rehabilitasyonu', 
    'Dikkat ve odaklanma artırma',
    'Sosyal beceri geliştirme'
  ],
  'Dil ve Konuşma Terapisti': [
    'Konuşma bozukluğu (Artikülasyon)', 
    'Kekemelik ve akıcılık', 
    'Gecikmiş dil ve konuşma', 
    'Yutma bozuklukları', 
    'Ses terapisi', 
    'Afazi (İnme sonrası konuşma)'
  ]
};

const CreateRequest: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const selectedServices = searchParams.getAll('specialty');
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [requestId, setRequestId] = useState('');
  const [numericId, setNumericId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    locationType: '', // home_office, clinic, online
    goals: [] as string[],
    userGender: '',
    preferredProviderGender: '',
    city: profile?.city || '',
    district: '',
    neighborhood: '',
    startDate: '',
    duration: '',
    phoneNumber: profile?.phoneNumber || '',
    description: ''
  });

  useEffect(() => {
    if (selectedServices.length === 0) {
      console.warn('No services selected, redirecting to home');
      navigate('/');
    }
  }, [selectedServices, navigate]);

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: user?.uid,
        email: user?.email,
        emailVerified: user?.emailVerified,
        isAnonymous: user?.isAnonymous,
        tenantId: user?.tenantId,
        providerInfo: user?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      },
      operationType,
      path
    }
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };

const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. İşlem: Numeric ID Alımı
      const newNumericId = await runTransaction(db, async (transaction) => {
        const counterRef = doc(db, 'counters', 'requests');
        let counterSnap = await transaction.get(counterRef);
        
        let newCount = 1;
        if (counterSnap.exists()) {
          newCount = counterSnap.data().count + 1;
          transaction.update(counterRef, { count: newCount });
        } else {
          transaction.set(counterRef, { count: 1 });
        }
        return newCount;
      });

      // 2. İşlem: Firestore Kaydı
      const requestRef = doc(db, 'requests', `TALEP-${newNumericId}`);
      await setDoc(requestRef, {
        ...formData,
        numericId: newNumericId,
        serviceTypes: selectedServices,
        seekerId: user.uid,
        seekerName: profile?.displayName || user.displayName || 'İsimsiz Kullanıcı',
        seekerEmail: user.email,
        status: 'open',
        createdAt: serverTimestamp(),
      });
      
      setNumericId(newNumericId);
      setRequestId(requestRef.id);
      setSuccess(true);

      // 3. İşlem: Bildirimler ve Mail Kayıtları
      const providersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'provider'),
        where('status', '==', 'approved'),
        where('specialties', 'array-contains-any', selectedServices)
      );
      
      const providersSnap = await getDocs(providersQuery);
      
      const notificationPromises = providersSnap.docs.map(providerDoc => {
        return addDoc(collection(db, 'notifications'), {
          userId: providerDoc.id,
          title: 'Yeni Hizmet Talebi',
          message: `${selectedServices.join(', ')} alanında yeni bir talep oluşturuldu.`,
          type: 'new_request',
          link: `/request/${requestRef.id}`,
          isRead: false,
          createdAt: serverTimestamp()
        });
      });

      const mailPromises = providersSnap.docs.map(providerDoc => {
        const providerData = providerDoc.data();
        return addDoc(collection(db, 'mail'), {
          to: providerData.email,
          message: {
            subject: `Yeni Talep: ${selectedServices.join(', ')}`,
            text: `Yeni talep var. Detaylar için uygulamayı ziyaret edin.`,
            html: `<p><strong>${selectedServices.join(', ')}</strong> alanında yeni bir talep var.</p>`
          }
        });
      });

      await Promise.all([...notificationPromises, ...mailPromises]);

      // 4. İşlem: Resend API üzerinden gerçek mail gönderimi
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isim: profile?.displayName || user.displayName || 'İsimsiz Kullanıcı',
            telefon: formData.phoneNumber,
            brans: selectedServices.join(', '),
            mesaj: `Talep No: #${newNumericId}\nKonum: ${formData.city}/${formData.district}\nDetay: ${formData.description}`
          }),
        });
      } catch (e) {
        console.error('Email API hatası:', e);
      }

      setTimeout(() => {
        navigate('/');
      }, 10000);

    } catch (error) {
      console.error('Error creating request:', error);
      alert('Talep oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };
  
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-stone-900">Nerede hizmet almak istersiniz?</h2>
              <p className="text-stone-500">Size en uygun uzmanları bulmamız için konum tercihinizi belirtin.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: 'home_office', label: 'Ev / Ofis', icon: Home },
                { id: 'clinic', label: 'Klinik', icon: Building2 },
                { id: 'online', label: 'Online', icon: Globe },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setFormData({ ...formData, locationType: item.id });
                    nextStep();
                  }}
                  className={`p-8 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 ${
                    formData.locationType === item.id 
                      ? 'border-sky-600 bg-sky-50 text-sky-700' 
                      : 'border-stone-100 hover:border-stone-200 bg-white text-stone-600'
                  }`}
                >
                  <item.icon size={40} />
                  <span className="font-bold text-lg">{item.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        );

      case 2:
        const allGoals = selectedServices.flatMap(s => SERVICE_GOALS[s] || []);
        const uniqueGoals = Array.from(new Set(allGoals));

        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-stone-900">Hizmet alma amacınız nedir?</h2>
              <p className="text-stone-500">İhtiyaçlarınıza en uygun programı oluşturmamıza yardımcı olun.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {uniqueGoals.map((goal) => (
                <button
                  key={goal}
                  onClick={() => {
                    const newGoals = formData.goals.includes(goal)
                      ? formData.goals.filter(g => g !== goal)
                      : [...formData.goals, goal];
                   setFormData({ ...formData, goals: newGoals });
                      })
                    }}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      formData.goals.includes(goal)
                        ? 'border-sky-600 bg-sky-50 text-sky-700'
                        : 'border-stone-100 hover:border-stone-200 bg-white text-stone-600'
                    }`}
                  >
                    <Target size={24} />
                    <span className="font-semibold text-sm">{goal}</span>
                  </button>
                ))
              }
            </div>
            <div className="flex gap-4 pt-4">
              <button
                onClick={prevStep}
                className="flex-1 px-6 py-3 border-2 border-stone-200 rounded-lg hover:bg-stone-50 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <ArrowLeft size={20} />
                Geri
              </button>
              <button
                onClick={nextStep}
                className="flex-1 px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                İleri
                <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-stone-900">Demografik Bilgiler</h2>
              <p className="text-stone-500">Uzmanın sizin için en uygun şekilde hazırlanması için bilgiler gerekli.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Cinsiyetiniz</label>
                <select
                  value={formData.userGender}
                  onChange={(e) => setFormData({ ...formData, userGender: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:outline-none focus:border-sky-600 font-medium"
                >
                  <option value="">Seçin</option>
                  <option value="male">Erkek</option>
                  <option value="female">Kadın</option>
                  <option value="other">Diğer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Tercih Ettiğiniz Uzman Cinsiyeti</label>
                <select
                  value={formData.preferredProviderGender}
                  onChange={(e) => setFormData({ ...formData, preferredProviderGender: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:outline-none focus:border-sky-600 font-medium"
                >
                  <option value="">Fark Etmez</option>
                  <option value="male">Erkek Uzman</option>
                  <option value="female">Kadın Uzman</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={prevStep}
                className="flex-1 px-6 py-3 border-2 border-stone-200 rounded-lg hover:bg-stone-50 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <ArrowLeft size={20} />
                Geri
              </button>
              <button
                onClick={nextStep}
                className="flex-1 px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                İleri
                <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        );

      case 4:
        const cities = TURKISH_LOCATIONS.map(loc => loc.city);
        const uniqueCities = Array.from(new Set(cities));
        const selectedCity = formData.city;
        const districts = selectedCity 
          ? TURKISH_LOCATIONS.find(loc => loc.city === selectedCity)?.districts || []
          : [];

        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-stone-900">Konum Bilgileri</h2>
              <p className="text-stone-500">Hizmet alacağınız bölgeyi belirtin.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Şehir / İl</label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value, district: '' })}
                  className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:outline-none focus:border-sky-600 font-medium"
                >
                  <option value="">Şehir Seçin</option>
                  {uniqueCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {districts.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">İlçe / Bölge</label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:outline-none focus:border-sky-600 font-medium"
                  >
                    <option value="">İlçe Seçin</option>
                    {districts.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Mahalle / Cadde (İsteğe Bağlı)</label>
                <input
                  type="text"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  placeholder="Örn: Kadıköy, Bağdat Caddesi"
                  className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:outline-none focus:border-sky-600 font-medium"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={prevStep}
                className="flex-1 px-6 py-3 border-2 border-stone-200 rounded-lg hover:bg-stone-50 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <ArrowLeft size={20} />
                Geri
              </button>
              <button
                onClick={nextStep}
                className="flex-1 px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                İleri
                <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-stone-900">Hizmet Detayları</h2>
              <p className="text-stone-500">Hizmet almak istediğiniz zaman ve diğer detayları belirtin.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Başlama Tarihi</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:outline-none focus:border-sky-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Süre (Hafta)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="Örn: 4"
                  className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:outline-none focus:border-sky-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Telefon Numarası</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="+90 5XX XXX XX XX"
                  className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:outline-none focus:border-sky-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">İsteğiniz Hakkında Detay</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Örn: Haftada 2 gün, akşam saatleri tercih ediyorum..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:outline-none focus:border-sky-600 font-medium"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={prevStep}
                className="flex-1 px-6 py-3 border-2 border-stone-200 rounded-lg hover:bg-stone-50 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <ArrowLeft size={20} />
                Geri
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Gönderiliyor...' : 'Gönder'}
                <CheckCircle2 size={20} />
              </button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white p-6">
      <div className="max-w-2xl mx-auto">
        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4 py-12"
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-3xl font-bold text-stone-900">Talebiniz Başarıyla Gönderildi!</h2>
            <p className="text-stone-600 text-lg">
              Talep No: <span className="font-bold text-sky-600">#{numericId}</span>
            </p>
            <p className="text-stone-500">
              Uzmanlar talebinizi inceleyecek ve en kısa sürede sizinle iletişime geçecekler.
            </p>
            <p className="text-sm text-stone-400 pt-4">
              5 saniye içinde ana sayfaya yönlendirileceksiniz...
            </p>
          </motion.div>
        ) : (
          <>
            <div className="mb-8">
              <div className="flex justify-between mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    className={`flex-1 h-2 mx-1 rounded-full transition-colors ${
                      s <= step ? 'bg-sky-600' : 'bg-stone-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-stone-600 text-center">
                Adım {step} / 5
              </p>
            </div>

            <AnimatePresence mode="wait">
              <div key={step}>
                {renderStep()}
              </div>
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
};

export default CreateRequest;

