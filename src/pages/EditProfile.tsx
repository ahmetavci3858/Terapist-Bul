import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, auth } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { motion } from 'motion/react';
import { User, Lock, Save, AlertCircle, CheckCircle, ChevronDown, MapPin, FileText } from 'lucide-react';
import { CORE_PROFESSIONS, SUB_SPECIALTIES, Profession } from '../constants/specialties';

const EditProfile: React.FC = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    city: '',
    phoneNumber: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    role: '' as 'seeker' | 'provider' | 'admin',
    specialties: [] as string[],
    subSpecialties: [] as string[],
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const cities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Şanlıurfa', 'Kocaeli'];

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        bio: profile.bio || '',
        city: profile.city || '',
        phoneNumber: profile.phoneNumber || '',
        age: profile.age?.toString() || '',
        gender: profile.gender || '',
        height: profile.height?.toString() || '',
        weight: profile.weight?.toString() || '',
        role: profile.role || 'seeker',
        specialties: profile.specialties || [],
        subSpecialties: profile.subSpecialties || [],
      });
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setMessage(null);

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...formData,
        role: formData.role,
        age: parseInt(formData.age) || 0,
        height: parseFloat(formData.height) || 0,
        weight: parseFloat(formData.weight) || 0,
        updatedAt: new Date().toISOString(),
      });
      setMessage({ type: 'success', text: 'Profiliniz başarıyla güncellendi.' });
    } catch (error: any) {
      console.error('Profile update error:', error);
      setMessage({ type: 'error', text: 'Profil güncellenirken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;
    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'Yeni şifreler eşleşmiyor.' });
      return;
    }
    if (passwords.new.length < 6) {
      setMessage({ type: 'error', text: 'Yeni şifre en az 6 karakter olmalıdır.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const credential = EmailAuthProvider.credential(user.email, passwords.current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwords.new);
      setPasswords({ current: '', new: '', confirm: '' });
      setMessage({ type: 'success', text: 'Şifreniz başarıyla değiştirildi.' });
    } catch (error: any) {
      console.error('Password change error:', error);
      let msg = 'Şifre değiştirilirken bir hata oluştu.';
      if (error.code === 'auth/wrong-password') msg = 'Mevcut şifreniz hatalı.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return <div className="flex items-center justify-center h-screen">Yükleniyor...</div>;

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-12 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Profili Düzenle</h1>
          <p className="text-stone-500">Hesap bilgilerinizi ve uzmanlık alanlarınızı yönetin.</p>
        </div>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl flex items-center gap-3 ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
          }`}
        >
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{message.text}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar - Immutable Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 bg-stone-100 rounded-3xl flex items-center justify-center text-stone-400 border-4 border-white shadow-md overflow-hidden">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User size={40} />
                )}
              </div>
              <div>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full p-2 rounded-xl border border-stone-100 bg-stone-50 focus:bg-white focus:border-sky-600 outline-none text-sm transition-all font-bold text-center"
                  placeholder="Ad Soyad"
                />
                <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold mt-1">
                  {formData.role === 'admin' ? 'Yönetici' : formData.role === 'provider' ? 'Hizmet Veren' : 'Hizmet Alan'}
                </p>
              </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-stone-50">
              <div className="space-y-1">
                <p className="text-[10px] text-stone-400 uppercase font-bold">E-posta</p>
                <p className="text-sm text-stone-600 font-medium">{profile.email}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-[10px] text-amber-700 font-bold flex items-center gap-1 uppercase">
                  <AlertCircle size={10} /> Bilgi
                </p>
                <p className="text-[11px] text-amber-600 leading-tight mt-1">
                  Ad, soyad ve e-posta adresiniz güvenlik nedeniyle değiştirilemez.
                </p>
              </div>
            </div>
          </div>

          {/* Password Change Form */}
          <form onSubmit={handleChangePassword} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-4">
            <h3 className="font-bold text-stone-900 flex items-center gap-2">
              <Lock size={18} className="text-sky-600" /> Şifre Değiştir
            </h3>
            <div className="space-y-3">
              <input
                type="password"
                required
                placeholder="Mevcut Şifre"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                className="w-full p-3 rounded-xl border border-stone-100 bg-stone-50 focus:bg-white focus:border-sky-600 outline-none text-sm transition-all"
              />
              <input
                type="password"
                required
                placeholder="Yeni Şifre"
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                className="w-full p-3 rounded-xl border border-stone-100 bg-stone-50 focus:bg-white focus:border-sky-600 outline-none text-sm transition-all"
              />
              <input
                type="password"
                required
                placeholder="Yeni Şifre (Tekrar)"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                className="w-full p-3 rounded-xl border border-stone-100 bg-stone-50 focus:bg-white focus:border-sky-600 outline-none text-sm transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-800 transition-all disabled:opacity-50"
              >
                Şifreyi Güncelle
              </button>
            </div>
          </form>
        </div>

        {/* Main Form - Editable Info */}
        <div className="lg:col-span-2">
          <form onSubmit={handleUpdateProfile} className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-xl space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700 flex items-center gap-2">
                  <User size={16} /> Hesap Türü
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none transition-all appearance-none bg-white"
                  disabled={profile.role === 'admin'}
                >
                  <option value="seeker">Hizmet Alan (Danışan)</option>
                  <option value="provider">Hizmet Veren (Uzman)</option>
                  {profile.role === 'admin' && <option value="admin">Yönetici</option>}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700 flex items-center gap-2">
                  <User size={16} /> Ad Soyad
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none transition-all"
                  placeholder="Adınız Soyadınız"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700 flex items-center gap-2">
                  <MapPin size={16} /> Şehir
                </label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none transition-all appearance-none bg-white"
                >
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700 flex items-center gap-2">
                  <User size={16} /> Telefon
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none transition-all"
                  placeholder="05xx xxx xx xx"
                />
              </div>
            </div>

            {formData.role === 'seeker' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">Yaş</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none transition-all"
                    placeholder="Yaş"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">Cinsiyet</label>
                  <select
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
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none transition-all"
                    placeholder="Boy"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">Kilo (kg)</label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none transition-all"
                    placeholder="Kilo"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700 flex items-center gap-2">
                <FileText size={16} /> Hakkında
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none transition-all h-32"
                placeholder="Kendinizden bahsedin..."
              />
            </div>

            {formData.role === 'provider' && (
              <div className="space-y-8 pt-6 border-t border-stone-50">
                <div className="space-y-4">
                  <label className="text-sm font-bold text-stone-700 block">Uzmanlık Alanları (En fazla 3 adet)</label>
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
                  <div className="space-y-6 p-6 bg-stone-50 rounded-3xl border border-stone-100">
                    <label className="text-sm font-bold text-stone-700 block">Alt Uzmanlık Alanları</label>
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
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 text-white p-5 rounded-3xl font-bold text-lg hover:bg-sky-700 transition-all shadow-xl shadow-sky-100 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <Save size={20} />
              {loading ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
