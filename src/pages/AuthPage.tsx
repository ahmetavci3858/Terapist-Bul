import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { LogIn, UserPlus, ShieldCheck, ArrowRight, AlertCircle, Phone } from 'lucide-react';

const AuthPage: React.FC = () => {
  const [role, setRole] = useState<'seeker' | 'provider' | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      // Add custom parameters to force account selection if needed
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        // If it's a new user via Google, we need a role
        if (!role) {
          setIsLogin(false);
          setError('Yeni kullanıcı kaydı için lütfen önce rolünüzü seçin ve tekrar Google ile devam edin.');
          setLoading(false);
          return;
        }

        // Enforce phone number for providers
        if (role === 'provider' && !phoneNumber) {
          setError('Hizmet veren kaydı için telefon numarası zorunludur.');
          setLoading(false);
          return;
        }

        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          role: role,
          phoneNumber: role === 'provider' ? phoneNumber : '',
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
          rating: 0,
          reviewCount: 0,
          setupComplete: false,
          status: role === 'provider' ? 'pending' : 'approved',
          isVerified: role === 'seeker'
        });
      }

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      let message = 'Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.';
      
      if (error.code === 'auth/cancelled-popup-request') {
        message = 'Giriş penceresi kapatıldı veya başka bir işlem başlatıldı.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        message = 'Giriş penceresi kapatıldı. Lütfen tekrar deneyin.';
      } else if (error.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        const appUrl = 'ais-dev-2he3n4zrm4jebotnapjh3n-44433785094.europe-west2.run.app';
        const sharedUrl = 'ais-pre-2he3n4zrm4jebotnapjh3n-44433785094.europe-west2.run.app';
        message = `Bu alan adı (${currentDomain}) Firebase konsolunda yetkilendirilmemiş. Lütfen Firebase konsolundan Authentication > Settings > Authorized Domains kısmına hem "${appUrl}" hem de "${sharedUrl}" adreslerini ekleyin.`;
      } else if (error.code === 'auth/operation-not-allowed') {
        message = 'Google ile giriş yöntemi Firebase konsolunda (Authentication > Sign-in method) henüz etkinleştirilmemiş.';
      } else if (error.code === 'auth/popup-blocked') {
        message = 'Giriş penceresi tarayıcı tarafından engellendi. Lütfen adres çubuğundaki pop-up engelleyiciyi kapatıp tekrar deneyin.';
      } else if (error.code === 'auth/internal-error') {
        message = `Bir iç hata oluştu (${error.code}). Lütfen tarayıcınızı yenileyip tekrar deneyin.`;
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Ağ bağlantısı hatası. İnternet bağlantınızı veya Firebase bağlantı izinlerini kontrol edin.';
      } else {
        message = `Giriş hatası (${error.code || 'Bilinmeyen'}): ${error.message || 'Lütfen tekrar deneyin.'}`;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setError('Lütfen geçerli bir e-posta adresi girin.');
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, password);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Email login error:', error);
      let message = 'Giriş yapılırken bir hata oluştu.';
      
      if (error.code === 'auth/invalid-credential') {
        message = 'E-posta adresi veya şifre hatalı. Eğer daha önce Google ile kayıt olduysanız lütfen Google butonunu kullanın.';
      } else if (error.code === 'auth/user-not-found') {
        message = 'Bu e-posta adresi ile kayıtlı bir kullanıcı bulunamadı.';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Girdiğiniz şifre hatalı.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Geçersiz bir e-posta adresi girdiniz.';
      } else if (error.code === 'auth/user-disabled') {
        message = 'Bu hesap devre dışı bırakılmış.';
      } else if (error.code === 'auth/operation-not-allowed' || (error.message && error.message.includes('operation-not-allowed'))) {
        message = 'E-posta/Şifre girişi bu projede henüz etkinleştirilmemiş. Lütfen Google ile giriş yapmayı deneyin veya Firebase konsolundan E-posta/Şifre yöntemini etkinleştirin.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Çok fazla hatalı giriş denemesi yaptınız. Lütfen bir süre sonra tekrar deneyin.';
      } else {
        message = `Giriş hatası: ${error.message}`;
      }
      
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pt-12 space-y-8 px-4 pb-24">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-stone-900">
          {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
        </h1>
        <p className="text-stone-600">
          {isLogin 
            ? 'Hesabınıza erişmek için bilgilerinizi girin.' 
            : 'Devam etmek için lütfen rolünüzü seçin.'}
        </p>
        
        {/* Prominent Warning for Firebase Setup */}
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-sm text-amber-800 flex items-start gap-3 text-left">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="block">Önemli Not:</strong>
            <p>E-posta/Şifre yöntemi Firebase konsolunda henüz etkinleştirilmemiş olabilir. Hızlı ve sorunsuz bir deneyim için <strong>Google ile Giriş</strong> yapmanızı öneririz.</p>
          </div>
        </div>
      </div>

      {!isLogin && (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setRole('seeker')}
            className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 ${
              role === 'seeker' ? 'border-sky-600 bg-sky-50' : 'border-stone-200 bg-white hover:border-stone-300'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${role === 'seeker' ? 'bg-sky-600 text-white' : 'bg-stone-100 text-stone-400'}`}>
              <UserPlus size={24} />
            </div>
            <span className="font-bold">Hizmet Alan</span>
          </button>

          <button
            onClick={() => setRole('provider')}
            className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 ${
              role === 'provider' ? 'border-sky-600 bg-sky-50' : 'border-stone-200 bg-white hover:border-stone-300'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${role === 'provider' ? 'bg-sky-600 text-white' : 'bg-stone-100 text-stone-400'}`}>
              <ShieldCheck size={24} />
            </div>
            <span className="font-bold">Hizmet Veren</span>
          </button>
        </div>
      )}

      {!isLogin && role === 'provider' && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <label className="text-sm font-bold text-stone-700 flex items-center gap-2">
            <Phone size={16} /> Telefon Numarası (Zorunlu)
          </label>
          <input
            type="tel"
            required
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none transition-all"
            placeholder="05xx xxx xx xx"
          />
          <p className="text-[10px] text-stone-400 font-medium px-2">
            * Hizmet veren kaydı için telefon numarası gereklidir.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium border border-red-100 animate-shake">
          {error}
        </div>
      )}

      {isLogin ? (
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-stone-700">E-posta</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none transition-all"
              placeholder="ornek@mail.com"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-stone-700">Şifre</label>
              <button
                type="button"
                onClick={async () => {
                  if (!email) {
                    setError('Şifre sıfırlama bağlantısı için lütfen e-posta adresinizi girin.');
                    return;
                  }
                  try {
                    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
                    alert('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
                  } catch (err: any) {
                    setError('Şifre sıfırlama e-postası gönderilirken bir hata oluştu.');
                  }
                }}
                className="text-xs text-sky-600 font-bold hover:underline"
              >
                Şifremi Unuttum
              </button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 text-white p-4 rounded-2xl font-bold hover:bg-sky-700 transition-all shadow-lg shadow-sky-100 disabled:opacity-50"
          >
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </motion.button>
        </form>
      ) : (
        <div className="space-y-4">
          <Link
            to={role === 'seeker' ? '/register/seeker' : role === 'provider' ? '/register/provider' : '#'}
            onClick={(e) => {
              if (!role) {
                e.preventDefault();
                alert('Lütfen bir rol seçin.');
              }
            }}
            className="w-full bg-sky-600 text-white p-4 rounded-2xl font-bold hover:bg-sky-700 transition-all shadow-lg shadow-sky-100 flex items-center justify-center gap-2"
          >
            E-posta ile Kayıt Ol <ArrowRight size={20} />
          </Link>
        </div>
      )}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-stone-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-stone-50 text-stone-500">Veya</span>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={loading || (!isLogin && !role) || (!isLogin && role === 'provider' && !phoneNumber)}
        onClick={handleGoogleLogin}
        className="w-full bg-white border-2 border-stone-200 p-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-stone-700 hover:bg-stone-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
        {loading ? 'İşlem Yapılıyor...' : `Google ile ${isLogin ? 'Giriş Yap' : 'Devam Et'}`}
      </motion.button>

      <div className="text-center">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-sky-600 font-bold hover:underline"
        >
          {isLogin ? 'Hesabınız yok mu? Kayıt Olun' : 'Zaten hesabınız var mı? Giriş Yapın'}
        </button>
      </div>

      <div className="text-center text-xs text-stone-400">
        Devam ederek kullanım koşullarımızı ve gizlilik politikamızı kabul etmiş olursunuz.
      </div>
    </div>
  );
};

export default AuthPage;
