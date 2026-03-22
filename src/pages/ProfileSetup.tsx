import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion } from 'motion/react';
import { Upload, CheckCircle, AlertCircle, Save, ChevronDown, UserPlus, ShieldCheck } from 'lucide-react';
import { CORE_PROFESSIONS, SUB_SPECIALTIES, Profession } from '../constants/specialties';

const ProfileSetup: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    bio: '',
    city: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    specialties: [] as string[],
    subSpecialties: [] as string[],
    phoneNumber: '',
  });
  const [selectedRole, setSelectedRole] = useState<'seeker' | 'provider' | null>(null);
  const [files, setFiles] = useState<{ diploma?: File; criminalRecord?: File }>({});
  const [uploadStatus, setUploadStatus] = useState<{ diploma?: string; criminalRecord?: string }>({});

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        email: profile.email || '',
        bio: profile.bio || '',
        city: profile.city || '',
        age: profile.age || '',
        gender: profile.gender || '',
        height: profile.height || '',
        weight: profile.weight || '',
        specialties: profile.specialties || [],
        subSpecialties: profile.subSpecialties || [],
        phoneNumber: profile.phoneNumber || '',
      });
    }
  }, [profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'diploma' | 'criminalRecord') => {
    if (e.target.files && e.target.files[0]) {
      setFiles((prev) => ({ ...prev, [type]: e.target.files![0] }));
    }
  };

  const handleUpload = async (type: 'diploma' | 'criminalRecord') => {
    const file = files[type];
    if (!file || !user) return;

    setLoading(true);
    try {
      const storageRef = ref(storage, `users/${user.uid}/${type}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      await updateDoc(doc(db, 'users', user.uid), {
        [`${type}URL`]: url,
      });
      
      setUploadStatus((prev) => ({ ...prev, [type]: 'success' }));
      alert('Dosya başarıyla yüklendi.');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Yükleme sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      const updateData = {
        ...formData,
        uid: user.uid,
        email: user.email || formData.email,
        role: selectedRole || profile?.role,
        age: parseInt(formData.age as string) || 0,
        height: parseFloat(formData.height as string) || 0,
        weight: parseFloat(formData.weight as string) || 0,
        isPhoneVerified: true,
        setupComplete: true,
        updatedAt: new Date().toISOString(),
      };

      if (!userDoc.exists()) {
        if (!selectedRole) {
          alert('Lütfen devam etmek için bir rol seçin.');
          setLoading(false);
          return;
        }
        await setDoc(userRef, {
          ...updateData,
          role: selectedRole,
          createdAt: new Date().toISOString(),
          rating: 5.0,
          reviewCount: 0,
          status: selectedRole === 'provider' ? 'pending' : 'approved',
          isVerified: selectedRole === 'seeker',
        });
      } else {
        await updateDoc(userRef, updateData);
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Update error:', error);
      alert('Güncelleme sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const cities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Şanlıurfa', 'Kocaeli'];

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-12 px-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-stone-900">Profilini Tamamla</h1>
        <p className="text-stone-600">Seni daha iyi tanımamız ve hizmet vermeye başlaman için bu bilgileri doldurmalısın.</p>
      </div>

      {(!profile || !profile.role || profile.role === 'seeker' && !profile.setupComplete) && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-xl space-y-6">
          <h3 className="text-xl font-bold text-stone-900 text-center">Lütfen Rolünüzü Seçin</h3>
          <p className="text-center text-stone-500 text-sm -mt-4">Sistemde nasıl yer almak istediğinizi belirtin.</p>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSelectedRole('seeker')}
              className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 ${
                (selectedRole === 'seeker' || (!selectedRole && profile?.role === 'seeker')) ? 'border-sky-600 bg-sky-50' : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${(selectedRole === 'seeker' || (!selectedRole && profile?.role === 'seeker')) ? 'bg-sky-600 text-white' : 'bg-stone-100 text-stone-400'}`}>
                <UserPlus size={24} />
              </div>
              <span className="font-bold">Hizmet Alan</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('provider')}
              className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 ${
                (selectedRole === 'provider' || (!selectedRole && profile?.role === 'provider')) ? 'border-sky-600 bg-sky-50' : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${(selectedRole === 'provider' || (!selectedRole && profile?.role === 'provider')) ? 'bg-sky-600 text-white' : 'bg-stone-100 text-stone-400'}`}>
                <ShieldCheck size={24} />
              </div>
              <span className="font-bold">Hizmet Veren</span>
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-2xl space-y-10">
        {/* Step 1: Personal Info */}
        <div className="space-y-8">
          <div className="flex items-center gap-4 border-b border-stone-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold">1</div>
            <h3 className="text-2xl font-bold text-stone-900">Kişisel Bilgiler</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700">Ad Soyad</label>
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
              <label className="text-sm font-bold text-stone-700">Mail Adresi</label>
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
              <label className="text-sm font-bold text-stone-700">Şehir</label>
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

          {(profile?.role === 'seeker' || selectedRole === 'seeker') && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700">Yaş</label>
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
          )}
        </div>

        {/* Step 2: Phone Number */}
        <div className="space-y-8">
          <div className="flex items-center gap-4 border-b border-stone-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold">2</div>
            <h3 className="text-2xl font-bold text-stone-900">Telefon Numarası</h3>
          </div>

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
        </div>

        {/* Step 3: Bio & Documents */}
        <div className="space-y-8">
          <div className="flex items-center gap-4 border-b border-stone-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold">3</div>
            <h3 className="text-2xl font-bold text-stone-900">Hakkında ve Belgeler</h3>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-stone-700">Hakkında / Özgeçmiş</label>
            <textarea
              required
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder={(profile?.role === 'provider' || selectedRole === 'provider') ? "Deneyimlerinizi ve uzmanlık alanlarınızı kısaca anlatın..." : "Sağlık hedeflerinizden ve geçmişinizden bahsedin..."}
              className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none transition-all h-32"
            />
          </div>

          {(profile?.role === 'provider' || selectedRole === 'provider') && (
            <div className="space-y-8 pt-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-sm font-bold text-stone-700 block">Diploma Yükle</label>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.png"
                        onChange={(e) => handleFileChange(e, 'diploma')}
                        className="hidden"
                        id="diploma-upload"
                      />
                      <label
                        htmlFor="diploma-upload"
                        className="flex-1 p-4 rounded-2xl border-2 border-dashed border-stone-200 hover:border-sky-600 hover:bg-sky-50 cursor-pointer transition-all flex items-center justify-center gap-2 text-stone-500"
                      >
                        <Upload size={20} />
                        {files.diploma ? files.diploma.name : 'Diploma Seç'}
                      </label>
                      <button
                        type="button"
                        onClick={() => handleUpload('diploma')}
                        disabled={!files.diploma || loading}
                        className="p-4 bg-sky-600 text-white rounded-2xl hover:bg-sky-700 disabled:opacity-50 transition-all"
                      >
                        Yükle
                      </button>
                    </div>
                    {profile?.diplomaURL && (
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl flex items-center gap-2 text-xs font-bold border border-emerald-100">
                        <CheckCircle size={14} /> Diploma başarıyla yüklendi
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-stone-700 block">Adli Sicil Kaydı</label>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.png"
                        onChange={(e) => handleFileChange(e, 'criminalRecord')}
                        className="hidden"
                        id="criminal-upload"
                      />
                      <label
                        htmlFor="criminal-upload"
                        className="flex-1 p-4 rounded-2xl border-2 border-dashed border-stone-200 hover:border-sky-600 hover:bg-sky-50 cursor-pointer transition-all flex items-center justify-center gap-2 text-stone-500"
                      >
                        <Upload size={20} />
                        {files.criminalRecord ? files.criminalRecord.name : 'Adli Sicil Seç'}
                      </label>
                      <button
                        type="button"
                        onClick={() => handleUpload('criminalRecord')}
                        disabled={!files.criminalRecord || loading}
                        className="p-4 bg-sky-600 text-white rounded-2xl hover:bg-sky-700 disabled:opacity-50 transition-all"
                      >
                        Yükle
                      </button>
                    </div>
                    {profile?.criminalRecordURL && (
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl flex items-center gap-2 text-xs font-bold border border-emerald-100">
                        <CheckCircle size={14} /> Adli sicil kaydı başarıyla yüklendi
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full bg-sky-600 text-white p-6 rounded-3xl font-bold text-xl hover:bg-sky-700 transition-all shadow-2xl shadow-sky-200 flex items-center justify-center gap-3 mt-12"
        >
          <Save size={28} />
          {loading ? 'Kaydediliyor...' : 'Profilimi Kaydet ve Devam Et'}
        </motion.button>
      </form>
    </div>
  );
};

export default ProfileSetup;
