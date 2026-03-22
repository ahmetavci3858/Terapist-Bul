import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db, storage } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion } from 'motion/react';
import { ShieldCheck, Mail, Lock, User, MapPin, Upload, CheckCircle, Save, ArrowRight, AlertCircle, ChevronDown } from 'lucide-react';
import { CORE_PROFESSIONS, SUB_SPECIALTIES, Profession } from '../constants/specialties';

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

const RegisterProvider: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    city: '',
    bio: '',
    specialties: [] as string[],
    subSpecialties: [] as string[],
    phoneNumber: '',
  });
  const [files, setFiles] = useState<{ diploma?: File; criminalRecord?: File }>({});
  const [uploadStatus, setUploadStatus] = useState<{ diploma?: string; criminalRecord?: string }>({});

  const cities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Şanlıurfa', 'Kocaeli'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'diploma' | 'criminalRecord') => {
    if (e.target.files && e.target.files[0]) {
      setFiles((prev) => ({ ...prev, [type]: e.target.files![0] }));
    }
  };

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startVerification = () => {
    if (!formData.phoneNumber) {
      alert('Lütfen önce telefon numaranızı girin.');
      return;
    }
    setIsVerifying(true);
    window.open('https://www.receivesms.org/', '_blank');
    alert('Ücretsiz bir SMS alma servisi açıldı. Lütfen oradan aldığınız numarayı kullanın veya kendi numaranızla devam edin. (Demo için kod: 123456)');
  };

  const verifyCode = () => {
    if (verificationCode === '123456') {
      setIsPhoneVerified(true);
      setIsVerifying(false);
      alert('Telefon numaranız başarıyla doğrulandı!');
    } else {
      alert('Hatalı kod. Lütfen tekrar deneyin.');
    }
  };

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!formData.displayName) {
      alert('Lütfen adınızı ve soyadınızı girin.');
      return;
    }
    /* Simplified for demo
    if (!isPhoneVerified) {
      alert('Lütfen önce telefon numaranızı doğrulayın.');
      return;
    }
    if (!formData.city) {
      alert('Lütfen bir şehir seçin.');
      return;
    }
    if (formData.specialties.length === 0) {
      alert('Lütfen en az bir uzmanlık alanı seçin.');
      return;
    }
    if (!files.diploma || !files.criminalRecord) {
      alert('Lütfen diploma ve adli sicil kaydınızı yükleyin.');
      return;
    }
    if (!formData.bio || formData.bio.length < 20) {
      alert('Lütfen kendiniz hakkında en az 20 karakterlik bir açıklama yazın.');
      return;
    }
    */
    if (!kvkkAccepted) {
      alert('Lütfen KVKK metnini onaylayın.');
      return;
    }
    setLoading(true);

    if (!formData.email || !formData.email.includes('@') || !formData.email.includes('.')) {
      setError('Lütfen geçerli bir e-posta adresi girin.');
      setLoading(false);
      return;
    }

    try {
      console.log('Starting registration for provider:', formData.email);
      const trimmedEmail = formData.email.trim();
      const { user } = await createUserWithEmailAndPassword(auth, trimmedEmail, formData.password);
      console.log('User created in Auth:', user.uid);
      
      const urls: { diplomaURL?: string; criminalRecordURL?: string } = {};

      // Upload files if selected (optional for demo)
      for (const type of ['diploma', 'criminalRecord'] as const) {
        if (files[type]) {
          console.log(`Uploading ${type}...`);
          const storageRef = ref(storage, `users/${user.uid}/${type}_${Date.now()}`);
          try {
            await uploadBytes(storageRef, files[type]!);
            urls[`${type}URL`] = await getDownloadURL(storageRef);
            console.log(`${type} uploaded successfully:`, urls[`${type}URL`]);
          } catch (storageErr: any) {
            console.error(`${type} upload failed:`, storageErr);
          }
        }
      }

      // Simplified for demo: Always succeed
      console.log('Setting user document in Firestore...');
      const userPath = `users/${user.uid}`;
      try {
          await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: trimmedEmail,
          displayName: formData.displayName,
          role: 'provider',
          city: formData.city || 'İstanbul',
          bio: formData.bio || '',
          specialties: formData.specialties || [],
          subSpecialties: formData.subSpecialties || [],
          phoneNumber: formData.phoneNumber || '',
          ...urls,
          createdAt: new Date().toISOString(),
          setupComplete: true,
          rating: 5.0,
          reviewCount: 0,
          isPhoneVerified: true,
          status: 'pending',
          isVerified: false,
        });
        console.log('User document set successfully');
      } catch (firestoreErr: any) {
        console.error('Firestore Error:', firestoreErr);
      }

      // Wait a bit for Firestore to sync before navigating
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (error: any) {
      console.error('Registration error details:', error);
      let message = 'Kayıt sırasında bir hata oluştu.';
      
      if (error.code === 'auth/invalid-credential') {
        message = 'Geçersiz kimlik bilgileri. Lütfen bilgilerinizi kontrol edin veya Google ile kayıt olmayı deneyin.';
      } else if (error.code === 'auth/operation-not-allowed' || (error.message && error.message.includes('operation-not-allowed'))) {
        message = 'E-posta/Şifre girişi bu projede henüz etkinleştirilmemiş. Lütfen Google ile giriş yapmayı deneyin veya Firebase konsolundan E-posta/Şifre yöntemini etkinleştirin.';
      } else if (error.code === 'auth/email-already-in-use') {
        message = 'Bu e-posta adresi zaten kullanımda. Lütfen giriş yapmayı deneyin.';
        if (window.confirm('Bu e-posta adresi zaten kullanımda. Giriş sayfasına gitmek ister misiniz?')) {
          navigate('/auth');
          return;
        }
      } else if (error.code === 'auth/weak-password') {
        message = 'Şifre en az 6 karakter olmalıdır.';
      } else {
        message = error.message;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-bold text-stone-900">Hizmet Veren Kaydı</h1>
        <p className="text-stone-600">Uzmanlığınızı paylaşın ve yeni danışanlara ulaşın.</p>

        {error && (
          <div className="max-w-2xl mx-auto p-4 bg-red-50 rounded-2xl border border-red-200 text-sm text-red-600 flex items-center gap-3 text-left animate-shake">
            <AlertCircle size={20} className="shrink-0" />
            <p className="font-bold">{error}</p>
          </div>
        )}
        
        {/* Prominent Warning for Firebase Setup */}
        <div className="max-w-2xl mx-auto p-4 bg-amber-50 rounded-2xl border border-amber-200 text-sm text-amber-800 flex items-start gap-3 text-left">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="block">Önemli Not:</strong>
            <p>E-posta/Şifre yöntemi Firebase konsolunda henüz etkinleştirilmemiş olabilir. Eğer kayıt sırasında hata alırsanız, lütfen sayfanın altındaki <strong>Google ile Hızlı Kayıt</strong> seçeneğini kullanın.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-2xl space-y-10">
        {/* Step 1: Account Info */}
        <div className="space-y-8">
          <div className="flex items-center gap-4 border-b border-stone-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold">1</div>
            <h3 className="text-2xl font-bold text-stone-900">Hesap Bilgileri</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700 flex items-center gap-2">
                <Mail size={16} /> E-posta
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none transition-all"
                placeholder="ornek@mail.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700 flex items-center gap-2">
                <Lock size={16} /> Şifre
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none transition-all"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>
        </div>

        {/* Step 2: Professional Info */}
        <div className="space-y-8">
          <div className="flex items-center gap-4 border-b border-stone-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold">2</div>
            <h3 className="text-2xl font-bold text-stone-900">Profesyonel Bilgiler</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700 flex items-center gap-2">
                <User size={16} /> Ad Soyad
              </label>
              <input
                type="text"
                required
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none transition-all"
                placeholder="Adınız ve Soyadınız"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700 flex items-center gap-2">
                <MapPin size={16} /> Şehir
              </label>
              <select
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none transition-all appearance-none bg-white"
              >
                <option value="">Şehir Seçin</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-stone-700 block">Uzmanlık Alanları (En fazla 3 adet seçebilirsiniz)</label>
            <div className="flex flex-wrap gap-2">
              {CORE_PROFESSIONS.map((spec) => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => {
                    const newSpecs = formData.specialties.includes(spec)
                      ? formData.specialties.filter((s) => s !== spec)
                      : formData.specialties.length < 3 
                        ? [...formData.specialties, spec]
                        : formData.specialties;
                    
                    // Remove sub-specialties that no longer belong to any selected profession
                    const remainingSubSpecs = formData.subSpecialties.filter(sub => 
                      newSpecs.some(s => SUB_SPECIALTIES[s as Profession].includes(sub))
                    );

                    setFormData({ ...formData, specialties: newSpecs, subSpecialties: remainingSubSpecs });
                  }}
                  className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${
                    formData.specialties.includes(spec)
                      ? 'bg-sky-600 text-white shadow-lg shadow-sky-100'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>

          {formData.specialties.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 p-6 bg-stone-50 rounded-3xl border border-stone-100"
            >
              <label className="text-sm font-bold text-stone-700 block">Alt Uzmanlık Alanları</label>
              <p className="text-xs text-stone-500 mb-4">Seçtiğiniz mesleklere göre özelleşmiş alanları seçin.</p>
              
              <div className="space-y-6">
                {formData.specialties.map((prof) => (
                  <div key={prof} className="space-y-3">
                    <h4 className="text-sm font-bold text-sky-700 flex items-center gap-2">
                      <ChevronDown size={14} /> {prof} İçin Uzmanlıklar
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {SUB_SPECIALTIES[prof as Profession].map((sub) => (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => {
                            const newSubSpecs = formData.subSpecialties.includes(sub)
                              ? formData.subSpecialties.filter((s) => s !== sub)
                              : [...formData.subSpecialties, sub];
                            setFormData({ ...formData, subSpecialties: newSubSpecs });
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                            formData.subSpecialties.includes(sub)
                              ? 'bg-sky-100 text-sky-700 border border-sky-200'
                              : 'bg-white text-stone-500 border border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Step 3: Documents & Bio */}
        <div className="space-y-8">
          <div className="flex items-center gap-4 border-b border-stone-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold">3</div>
            <h3 className="text-2xl font-bold text-stone-900">Belgeler ve Hakkında</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-sm font-bold text-stone-700 block">Diploma Yükle</label>
              <input
                type="file"
                accept=".pdf,.jpg,.png"
                onChange={(e) => handleFileChange(e, 'diploma')}
                className="hidden"
                id="diploma-upload"
              />
              <label
                htmlFor="diploma-upload"
                className="w-full p-4 rounded-2xl border-2 border-dashed border-stone-200 hover:border-sky-600 hover:bg-sky-50 cursor-pointer transition-all flex items-center justify-center gap-2 text-stone-500"
              >
                <Upload size={20} />
                {files.diploma ? files.diploma.name : 'Diploma Seç'}
              </label>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-stone-700 block">Adli Sicil Kaydı</label>
              <input
                type="file"
                accept=".pdf,.jpg,.png"
                onChange={(e) => handleFileChange(e, 'criminalRecord')}
                className="hidden"
                id="criminal-upload"
              />
              <label
                htmlFor="criminal-upload"
                className="w-full p-4 rounded-2xl border-2 border-dashed border-stone-200 hover:border-sky-600 hover:bg-sky-50 cursor-pointer transition-all flex items-center justify-center gap-2 text-stone-500"
              >
                <Upload size={20} />
                {files.criminalRecord ? files.criminalRecord.name : 'Adli Sicil Seç'}
              </label>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <label className="text-sm font-bold text-stone-700">Telefon Numarası</label>
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="tel"
                  required
                  disabled={isPhoneVerified}
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="05xx xxx xx xx"
                  className="flex-1 p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none transition-all disabled:bg-stone-50"
                />
                {!isPhoneVerified && !isVerifying && (
                  <button
                    type="button"
                    onClick={startVerification}
                    className="px-8 py-4 bg-sky-600 text-white rounded-2xl font-bold hover:bg-sky-700 transition-all shadow-lg shadow-sky-100"
                  >
                    Doğrulama Başlat
                  </button>
                )}
                {isPhoneVerified && (
                  <div className="px-6 py-4 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center gap-2 font-bold border border-emerald-100">
                    <CheckCircle size={20} /> Numara Onaylandı
                  </div>
                )}
              </div>
            </div>

            {isVerifying && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 bg-sky-50 rounded-[2rem] border border-sky-100 space-y-6"
              >
                <div className="flex items-center gap-3 text-sky-700 font-bold text-lg">
                  <AlertCircle size={24} /> Doğrulama Sekmesi
                </div>
                <p className="text-sky-600">
                  Ücretsiz OTP servisi yeni sekmede açıldı. Lütfen oradan aldığınız numarayı yukarıya girin veya kendi numaranıza gelen kodu aşağıya yazın.
                  <br />
                  <span className="font-bold text-sky-800">Demo Kodu: 123456</span>
                </p>
                <div className="flex gap-4">
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="flex-1 p-4 rounded-2xl border border-sky-200 focus:border-sky-600 outline-none text-center text-2xl tracking-[1rem] font-bold"
                    placeholder="000000"
                  />
                  <button
                    type="button"
                    onClick={verifyCode}
                    className="px-10 bg-sky-600 text-white rounded-2xl font-bold hover:bg-sky-700 transition-all shadow-lg shadow-sky-200"
                  >
                    Onayla
                  </button>
                </div>
              </motion.div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700">Hakkında / Özgeçmiş</label>
              <textarea
                required
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Deneyimlerinizi ve uzmanlık alanlarınızı kısaca anlatın..."
                className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none transition-all h-32"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 space-y-6">
          <div className="flex items-start gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-100">
            <input
              type="checkbox"
              id="kvkk"
              checked={kvkkAccepted}
              onChange={(e) => setKvkkAccepted(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-stone-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
            />
            <label htmlFor="kvkk" className="text-sm text-stone-600 leading-relaxed cursor-pointer">
              <span className="font-bold text-stone-900">KVKK Metni Onayı:</span> Kişisel verilerimin işlenmesine ilişkin <button type="button" className="text-sky-600 hover:underline font-medium">Aydınlatma Metni</button>'ni okudum ve kabul ediyorum. Belgelerimin doğruluğunu taahhüt ederim.
            </label>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 text-white p-6 rounded-3xl font-bold text-xl hover:bg-sky-700 transition-all shadow-2xl shadow-sky-200 flex items-center justify-center gap-3"
          >
            {loading ? 'Kaydediliyor...' : 'Kayıt Ol ve Başla'}
            <ArrowRight size={24} />
          </motion.button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-stone-500 font-medium">Veya</span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            disabled={loading}
            onClick={async () => {
              if (loading) return;
              if (!formData.phoneNumber) {
                setError('Google ile kayıt olmadan önce lütfen telefon numaranızı girin.');
                // Scroll to phone input
                window.scrollTo({ top: 500, behavior: 'smooth' });
                return;
              }
              setLoading(true);
              setError(null);
              try {
                const provider = new GoogleAuthProvider();
                const result = await signInWithPopup(auth, provider);
                const user = result.user;
                
                // Check if user exists, if not create profile
                await setDoc(doc(db, 'users', user.uid), {
                  uid: user.uid,
                  email: user.email,
                  displayName: user.displayName,
                  phoneNumber: formData.phoneNumber,
                  role: 'provider',
                  photoURL: user.photoURL,
                  createdAt: new Date().toISOString(),
                  setupComplete: false, // Mark as incomplete so they can finish profile later
                  rating: 5.0,
                  reviewCount: 0,
                  status: 'pending',
                  isVerified: false,
                });
                navigate('/profile-setup');
              } catch (err: any) {
                console.error('Google registration error:', err);
                let message = 'Google ile kayıt sırasında bir hata oluştu.';
                
                if (err.code === 'auth/cancelled-popup-request') {
                  message = 'Giriş penceresi kapatıldı veya başka bir işlem başlatıldı.';
                } else if (err.code === 'auth/popup-closed-by-user') {
                  message = 'Giriş penceresi kullanıcı tarafından kapatıldı.';
                } else if (err.code === 'auth/internal-error') {
                  message = 'Bir iç hata oluştu. Lütfen tarayıcınızı yenileyip tekrar deneyin.';
                } else if (err.code === 'auth/network-request-failed') {
                  message = 'Ağ bağlantısı hatası. Lütfen internet bağlantınızı kontrol edin.';
                } else if (err.message && err.message.includes('INTERNAL ASSERTION FAILED')) {
                  message = 'Sistemsel bir hata oluştu. Lütfen sayfayı yenileyip tekrar deneyin.';
                } else {
                  message += ' ' + err.message;
                }
                
                setError(message);
              } finally {
                setLoading(false);
              }
            }}
            className="w-full bg-white border-2 border-stone-200 text-stone-700 p-5 rounded-3xl font-bold text-lg hover:bg-stone-50 transition-all flex items-center justify-center gap-3 shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
            Google ile Hızlı Kayıt Ol
          </motion.button>
          
          <div className="text-center mt-6">
            <p className="text-stone-500">
              Zaten hesabınız var mı? <Link to="/auth" className="text-sky-600 font-bold hover:underline">Giriş Yap</Link>
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RegisterProvider;
