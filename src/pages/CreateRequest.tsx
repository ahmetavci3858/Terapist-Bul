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
  };
}

const SERVICE_GOALS: Record<string, string[]> = {
  Fizyoterapist: [
    'Ağrıları azaltma',
    'Rahatlama',
    'Hareketliliği artırma',
    'Ameliyat sonrası rehabilitasyon',
    'Sporcu sağlığı / Performans',
    'Duruş bozukluğu düzeltme',
    'Nörolojik rehabilitasyon',
  ],
  Diyetisyen: [
    'Kilo verme',
    'Kilo alma',
    'Sağlıklı beslenme alışkanlığı',
    'Hastalıklarda beslenme yönetimi',
    'Sporcu beslenmesi',
    'Hamilelik/Emzirme dönemi beslenmesi',
    'Yeme bozukluğu desteği',
  ],
  Psikolog: [
    'Stres ve kaygı yönetimi',
    'Depresyon desteği',
    'İlişki ve aile sorunları',
    'Özgüven ve kişisel gelişim',
    'Travma sonrası destek',
    'Panik atak yönetimi',
    'Fobi/Korku üzerine çalışma',
  ],
  'Ergoterapist': [
    'Günlük yaşam becerilerini geliştirme',
    'Duyu bütünleme desteği',
    'İnce ve kaba motor beceriler',
    'El rehabilitasyonu',
    'Dikkat ve odaklanma artırma',
    'Sosyal beceri geliştirme',
  ],
  'Dil ve Konuşma Terapisti': [
    'Konuşma bozukluğu (Artikülasyon)',
    'Kekemelik ve akıcılık',
    'Gecikmiş dil ve konuşma',
    'Yutma bozuklukları',
    'Ses terapisi',
    'Afazi (İnme sonrası konuşma)',
  ],
};

const ALL_SERVICES = [
  'Fizyoterapist',
  'Diyetisyen',
  'Psikolog',
  'Ergoterapist',
  'Dil ve Konuşma Terapisti',
];

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
    serviceTypes: selectedServices,
    locationType: '',
    goals: [] as string[],
    userGender: '',
    preferredProviderGender: '',
    city: profile?.city ?? '',
    district: '',
    neighborhood: '',
    startDate: '',
    duration: '',
    phoneNumber: profile?.phoneNumber ?? '',
    description: '',
  });

  useEffect(() => {
    if (selectedServices.length === 0) {
      console.warn('No services selected, redirecting to home');
      navigate('/');
    }
  }, [selectedServices, navigate]);

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleFirestoreError = (
    error: unknown,
    operationType: OperationType,
    path: string | null
  ) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: user?.uid,
        email: user?.email,
        emailVerified: user?.emailVerified,
        isAnonymous: user?.isAnonymous,
        tenantId: user?.tenantId,
        providerInfo:
          user?.providerData.map((provider) => ({
            providerId: provider.providerId,
            displayName: provider.displayName ?? null,
            email: provider.email ?? null,
            photoUrl: provider.photoURL ?? null,
          })) ?? [],
      },
      operationType,
      path,
    };

    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // NUMERIC ID TRANSACTION
      const newNumericId = await runTransaction(db, async (transaction) => {
        const counterRef = doc(db, 'counters', 'requests');
        let counterSnap;

        try {
          counterSnap = await transaction.get(counterRef);
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'counters/requests');
          throw error;
        }

        let newCount = 1;

        if (counterSnap.exists()) {
          newCount = counterSnap.data().count + 1;
          transaction.update(counterRef, { count: newCount });
        } else {
          transaction.set(counterRef, { count: 1 });
        }

        return newCount;
      });

      const requestRef = doc(db, 'requests', `TALEP-${newNumericId}`);

      try {
        await setDoc(requestRef, {
          ...formData,
          numericId: newNumericId,
          serviceTypes: selectedServices,
          seekerId: user.uid,
          seekerName:
            profile?.displayName ??
            user.displayName ??
            'İsimsiz Kullanıcı',
          seekerEmail: user.email,
          status: 'open',
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.WRITE,
          `requests/TALEP-${newNumericId}`
        );
      }

      setNumericId(newNumericId);
      setRequestId(requestRef.id);

      setSuccess(true);

      // 1. GET PROVIDERS
      const providersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'provider'),
        where('status', '==', 'approved'),
        where('specialties', 'array-contains-any', selectedServices)
      );

      let providersSnap;

      try {
        providersSnap = await getDocs(providersQuery);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'users');
        throw error;
      }

      // 2. NOTIFICATIONS
      const notificationPromises = providersSnap.docs.map((providerDoc) => {
        return addDoc(collection(db, 'notifications'), {
          userId: providerDoc.id,
          title: 'Yeni Hizmet Talebi',
          message: `${selectedServices.join(', ')} alanında yeni bir talep oluşturuldu.`,
          type: 'new_request',
          link: `/request/${requestRef.id}`,
          isRead: false,
          createdAt: serverTimestamp(),
        }).catch((error) => {
          handleFirestoreError(error, OperationType.CREATE, 'notifications');
        });
      });

      // 3. MASKED NAME
      const maskName = (name: string) =>
        name
          .split(' ')
          .map((part) => part[0] + '*'.repeat(part.length - 1))
          .join(' ');

      const maskedSeekerName = maskName(
        profile?.displayName ?? user.displayName ?? 'İsimsiz Kullanıcı'
      );

      // 4. EMAILS (via Resend API)
      const mailPromises = providersSnap.docs.map((providerDoc) => {
        const providerData = providerDoc.data();

        return fetch('/api/send-mail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: [providerData.email],
            subject: `Yeni Talep: ${selectedServices.join(', ')}`,
            html: `
              <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                <h2>Sayın Uzman,</h2>
                <p><strong>${selectedServices.join(', ')}</strong> alanında yeni bir talep var.</p>
                <hr />
                <p><strong>Talep Sahibi:</strong> ${maskedSeekerName}</p>
                <p><strong>Konum:</strong> ${formData.city} / ${formData.district}</p>
                <p><strong>Hizmet Detayı:</strong> ${formData.description || 'Belirtilmedi'}</p>
                <hr />
                <p>Detaylar için uygulamayı ziyaret edin.</p>
              </div>
            `,
          }),
        }).catch((error) => {
          console.error('Mail API Error:', error);
        });
      });

      // 5. ADMIN COPY
      const adminMailPromise = fetch('/api/send-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isim: profile?.displayName ?? user.displayName ?? 'İsimsiz Kullanıcı',
          telefon: formData.phoneNumber,
          brans: selectedServices.join(', '),
          subject: `[YENİ TALEP KOPYASI] - ${selectedServices.join(', ')}`,
          html: `
            <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
              <h2 style="color: #2563eb;">Yeni Talep Detayları</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Ad Soyad:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${profile?.displayName ?? user.displayName ?? 'İsimsiz Kullanıcı'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Telefon:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${formData.phoneNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Hizmetler:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${selectedServices.join(', ')}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Konum:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${formData.city} / ${formData.district} / ${formData.neighborhood}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Başlangıç:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${formData.startDate} (${formData.duration})</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Hedefler:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${formData.goals.join(', ')}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Cinsiyet Tercihi:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${formData.preferredProviderGender || 'Farketmez'}</td>
                </tr>
              </table>
              <div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-radius: 8px;">
                <strong>Talep Ayrıntıları:</strong><br />
                ${(formData.description || 'Açıklama girilmedi').replace(/\n/g, '<br/>')}
              </div>
            </div>
          `,
        }),
      }).catch((error) => {
        console.error('Admin Mail API Error:', error);
      });

      await Promise.all([...notificationPromises, ...mailPromises, adminMailPromise]);

      // AUTO REDIRECT AFTER 10s
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

  // -------------------------
  //  COMPONENT RENDERING
  // -------------------------

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
              <h2 className="text-2xl font-bold text-stone-900">
                Nerede hizmet almak istersiniz?
              </h2>
              <p className="text-stone-500">
                Size en uygun uzmanları bulmamız için konum tercihinizi belirtin.
              </p>
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
        const allGoals = formData.serviceTypes.flatMap(
          (s) => SERVICE_GOALS[s] ?? []
        );
        const uniqueGoals = Array.from(new Set(allGoals));

        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-stone-900">
                Hizmet alma amacınız nedir?
              </h2>
              <p className="text-stone-500">
                İhtiyaçlarınıza en uygun programı oluşturmamıza yardımcı olun.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {uniqueGoals.map((goal) => (
                <button
                  key={goal}
                  onClick={() => {
                    const newGoals = formData.goals.includes(goal)
                      ? formData.goals.filter((g) => g !== goal)
                      : [...formData.goals, goal];

                    setFormData({ ...formData, goals: newGoals });
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between ${
                    formData.goals.includes(goal)
                      ? 'border-sky-600 bg-sky-50 text-sky-700'
                      : 'border-stone-100 hover:border-stone-200 bg-white text-stone-700'
                  }`}
                >
                  <span className="font-semibold">{goal}</span>
                  {formData.goals.includes(goal) && (
                    <CheckCircle2 size={20} className="text-sky-600" />
                  )}
                </button>
              ))}
            </div>
            <div className="flex justify-between pt-4">
              <button
                onClick={prevStep}
                className="flex items-center gap-2 text-stone-500 font-bold px-6 py-3"
              >
                <ArrowLeft size={20} /> Geri
              </button>
              <button
                disabled={formData.goals.length === 0}
                onClick={nextStep}
                className="bg-stone-900 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 disabled:opacity-50"
              >
                Devam Et <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-stone-900">
                Cinsiyet Tercihleri
              </h2>
              <p className="text-stone-500">
                Hizmet konforunuz için tercihlerinizi belirtin.
              </p>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-stone-400 uppercase tracking-widest">
                Sizin Cinsiyetiniz
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['Kadın', 'Erkek'].map((g) => (
                  <button
                    key={g}
                    onClick={() => setFormData({ ...formData, userGender: g })}
                    className={`p-4 rounded-2xl border-2 transition-all font-bold ${
                      formData.userGender === g
                        ? 'border-sky-600 bg-sky-50 text-sky-700'
                        : 'border-stone-100 bg-white text-stone-600'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-stone-400 uppercase tracking-widest">
                Uzman Cinsiyet Tercihi
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['Kadın', 'Erkek', 'Fark Etmez'].map((g) => (
                  <button
                    key={g}
                    onClick={() =>
                      setFormData({ ...formData, preferredProviderGender: g })
                    }
                    className={`p-4 rounded-2xl border-2 transition-all font-bold text-sm ${
                      formData.preferredProviderGender === g
                        ? 'border-sky-600 bg-sky-50 text-sky-700'
                        : 'border-stone-100 bg-white text-stone-600'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={prevStep}
                className="flex items-center gap-2 text-stone-500 font-bold px-6 py-3"
              >
                <ArrowLeft size={20} /> Geri
              </button>
              <button
                disabled={
                  !formData.userGender || !formData.preferredProviderGender
                }
                onClick={nextStep}
                className="bg-stone-900 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 disabled:opacity-50"
              >
                Devam Et <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        );

      case 4:
        const cities = Object.keys(TURKISH_LOCATIONS).sort();
        const districts = formData.city
          ? TURKISH_LOCATIONS[formData.city] ?? []
          : [];

        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-stone-900">
                Konum Bilgileri
              </h2>
              <p className="text-stone-500">
                Hizmetin verileceği adresi belirtin.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">
                    Şehir
                  </label>
                  <select
                    className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none bg-white"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        city: e.target.value,
                        district: '',
                      })
                    }
                  >
                    <option value="">Şehir Seçin</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">
                    İlçe
                  </label>
                  <select
                    className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none bg-white disabled:opacity-50"
                    value={formData.district}
                    disabled={!formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, district: e.target.value })
                    }
                  >
                    <option value="">İlçe Seçin</option>
                    {districts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700">
                  Mahalle
                </label>
                <input
                  type="text"
                  placeholder="Örn: Bebek Mah."
                  className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none"
                  value={formData.neighborhood}
                  onChange={(e) =>
                    setFormData({ ...formData, neighborhood: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={prevStep}
                className="flex items-center gap-2 text-stone-500 font-bold px-6 py-3"
              >
                <ArrowLeft size={20} /> Geri
              </button>
              <button
                disabled={
                  !formData.city || !formData.district || !formData.neighborhood
                }
                onClick={nextStep}
                className="bg-stone-900 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 disabled:opacity-50"
              >
                Devam Et <ArrowRight size={20} />
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
              <h2 className="text-2xl font-bold text-stone-900">Zamanlama</h2>
              <p className="text-stone-500">
                Hizmeti ne zaman ve ne kadar süreyle almak istersiniz?
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700">
                  Ne zaman başlamak istersiniz?
                </label>
                <input
                  type="text"
                  placeholder="Örn: Gelecek hafta başı, En kısa sürede..."
                  className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700">
                  Ne kadar süre/sıklıkla?
                </label>
                <input
                  type="text"
                  placeholder="Örn: 10 seans, Haftada 2 gün, 1 ay boyunca..."
                  className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700">
                  Ek Notlar (Opsiyonel)
                </label>
                <textarea
                  placeholder="Uzmanın bilmesini istediğiniz diğer detaylar..."
                  className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none h-24"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={prevStep}
                className="flex items-center gap-2 text-stone-500 font-bold px-6 py-3"
              >
                <ArrowLeft size={20} /> Geri
              </button>
              <button
                disabled={!formData.startDate || !formData.duration}
                onClick={nextStep}
                className="bg-stone-900 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 disabled:opacity-50"
              >
                Devam Et <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        );

      case 6:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-stone-900">
                İletişim ve Onay
              </h2>
              <p className="text-stone-500">
                Talebinizi tamamlamadan önce son bir adım.
              </p>
            </div>

            <div className="bg-stone-50 p-6 rounded-3xl space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm">
                  <Phone className="text-sky-600" size={24} />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-700">
                      Telefon Numaranız
                    </label>
                    <input
                      type="tel"
                      placeholder="05XX XXX XX XX"
                      className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none bg-white"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, phoneNumber: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex items-start gap-2 text-sm text-stone-500 bg-white/50 p-3 rounded-xl border border-stone-100">
                    <Info size={16} className="shrink-0 mt-0.5" />
                    <p>
                      Telefon numaranız sadece sistem yöneticisi tarafından
                      görülebilir ve sizinle iletişime geçmek için
                      kullanılabilir.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={prevStep}
                className="flex items-center gap-2 text-stone-500 font-bold px-6 py-3"
              >
                <ArrowLeft size={20} /> Geri
              </button>
              <button
                disabled={loading || !formData.phoneNumber}
                onClick={handleSubmit}
                className="flex-1 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50"
              >
                {loading ? 'Gönderiliyor...' : 'Talebi Gönder'}
                <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-xl bg-white rounded-[3rem] shadow-2xl p-12 text-center space-y-8 border border-stone-100"
        >
          <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={48} />
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-stone-900">
              Talebiniz oluşturuldu
            </h2>
            <p className="text-stone-500">
              Talebiniz başarıyla sisteme kaydedildi. Uzmanlar en kısa sürede
              sizinle iletişime geçecektir.
            </p>
          </div>

          <div className="bg-stone-50 p-6 rounded-3xl space-y-2">
            <p className="text-sm font-bold text-stone-400 uppercase tracking-widest">
              Talep Numarası
            </p>
            <p className="text-2xl font-mono font-bold text-stone-900">
              Talep #{numericId}
            </p>
            <p className="text-[10px] text-stone-400 truncate">
              Sistem Kimliği: {requestId}
            </p>
          </div>

          <div className="space-y-4">
            <Link
              to="/"
              className="block w-full bg-stone-900 text-white py-4 rounded-2xl font-bold hover:bg-stone-800 transition-all"
            >
              Ana sayfaya dön
            </Link>
            <p className="text-xs text-stone-400">
              10 saniye içinde otomatik olarak ana sayfaya yönlendirileceksiniz...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12">
      <div className="w-full max-w-3xl bg-white rounded-[3rem] shadow-2xl shadow-stone-200/50 overflow-hidden border border-stone-100">
        {/* Progress Bar */}
        <div className="h-2 bg-stone-50 w-full">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(step / 6) * 100}%` }}
            className="h-full bg-sky-600"
          />
        </div>

        <div className="p-8 md:p-12">{renderStep()}</div>
      </div>
    </div>
  );
};

export default CreateRequest;
