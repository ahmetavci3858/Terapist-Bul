import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { UserPlus, Mail, Lock, User, MapPin, Calendar, ArrowRight, Save, CheckCircle, AlertCircle } from 'lucide-react';

const RegisterSeeker: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    city: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    bio: '',
    phoneNumber: '',
  });

  const cities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Şanlıurfa', 'Kocaeli'];

  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!formData.age) {
      alert('Lütfen yaşınızı girin.');
      return;
    }
    if (!formData.city) {
      alert('Lütfen bir şehir seçin.');
      return;
    }
    if (!formData.gender) {
      alert('Lütfen cinsiyet seçin.');
      return;
    }
    if (!formData.height || !formData.weight) {
      alert('Lütfen boy ve kilo bilgilerinizi girin.');
      return;
    }
    if (!formData.bio || formData.bio.length < 10) {
      alert('Lütfen kendiniz hakkında kısa bir bilgi verin.');
      return;
    }
    if (!isPhoneVerified) {
      alert('Lütfen önce telefon numaranızı doğrulayın.');
      return;
    }
    */
    if (!kvkkAccepted) {
      setError('Lütfen KVKK metnini onaylayın.');
      return;
    }
    setLoading(true);
    setError(null);

    if (!formData.email || !formData.email.includes('@') || !formData.email.includes('.')) {
      setError('Lütfen geçerli bir e-posta adresi girin.');
      setLoading(false);
      return;
    }

    try {
      console.log('Starting registration for seeker:', formData.email);
      const trimmedEmail = formData.email.trim().toLowerCase();
      const { user } = await createUserWithEmailAndPassword(auth, trimmedEmail, formData.password);
      console.log('User created in Auth:', user.uid);
      
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: trimmedEmail,
        displayName: formData.displayName || 'Yeni Kullanıcı',
        role: 'seeker',
        city: formData.city || 'İstanbul',
        age: parseInt(formData.age) || 25,
        gender: formData.gender || 'Belirtilmedi',
        height: parseFloat(formData.height) || 170,
        weight: parseFloat(formData.weight) || 70,
        bio: formData.bio || 'Merhaba, hizmet almak istiyorum.',
        phoneNumber: formData.phoneNumber || '',
        isPhoneVerified: true,
        status: 'approved',
        isVerified: true,
        createdAt: new Date().toISOString(),
        setupComplete: true,
        rating: 5.0,
        reviewCount: 0,
      });

      console.log('User document created in Firestore');

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
        <h1 className="text-4xl font-bold text-stone-900">Hizmet Alan Kaydı</h1>
        <p className="text-stone-600">Sağlık hedeflerinize ulaşmak için ilk adımı atın.</p>

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

        {/* Step 2: Personal Info */}
        <div className="space-y-8">
          <div className="flex items-center gap-4 border-b border-stone-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold">2</div>
            <h3 className="text-2xl font-bold text-stone-900">Kişisel Bilgiler</h3>
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700 flex items-center gap-2">
                <Calendar size={16} /> Yaş
              </label>
              <input
                type="number"
                required
                min="0"
                max="120"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none transition-all"
                placeholder="Yaşınız"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700">Cinsiyet</label>
              <select
                required
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none transition-all appearance-none bg-white"
              >
                <option value="">Seçiniz</option>
                <option value="Erkek">Erkek</option>
                <option value="Kadın">Kadın</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700">Boy (cm)</label>
              <input
                type="number"
                required
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none transition-all"
                placeholder="175"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700">Kilo (kg)</label>
              <input
                type="number"
                required
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none transition-all"
                placeholder="70"
              />
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-center gap-4 border-b border-stone-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold">3</div>
            <h3 className="text-2xl font-bold text-stone-900">İletişim ve Hakkında</h3>
          </div>
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="text-sm font-bold text-stone-700">Telefon Numarası</label>
              <input
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="05xx xxx xx xx"
                className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700">Hakkında / Hedefleriniz</label>
              <textarea
                required
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Sağlık hedeflerinizden ve geçmişinizden bahsedin..."
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
              <span className="font-bold text-stone-900">KVKK Metni Onayı:</span> Kişisel verilerimin işlenmesine ilişkin <button type="button" className="text-sky-600 hover:underline font-medium">Aydınlatma Metni</button>'ni okudum ve kabul ediyorum.
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
              setLoading(true);
              setError(null);
              try {
                const provider = new GoogleAuthProvider();
                const result = await signInWithPopup(auth, provider);
                const user = result.user;
                
                // Create seeker profile
                await setDoc(doc(db, 'users', user.uid), {
                  uid: user.uid,
                  email: user.email,
                  displayName: user.displayName,
                  role: 'seeker',
                  photoURL: user.photoURL,
                  createdAt: new Date().toISOString(),
                  setupComplete: false,
                  rating: 5.0,
                  reviewCount: 0,
                  status: 'approved',
                  isVerified: true,
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

export default RegisterSeeker;
