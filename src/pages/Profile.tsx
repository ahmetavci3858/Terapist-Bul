import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { motion } from 'motion/react';
import { User, Star, MapPin, Award, ShieldCheck, FileText } from 'lucide-react';

const Profile: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    const fetchProfile = async () => {
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (userSnap.exists()) {
        setProfile(userSnap.data());
      }

      const reviewsQuery = query(collection(db, 'reviews'), where('toId', '==', uid));
      const reviewsSnap = await getDocs(reviewsQuery);
      setReviews(reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      setLoading(false);
    };

    fetchProfile();
  }, [uid]);

  if (loading) return <div className="flex items-center justify-center h-screen">Yükleniyor...</div>;
  if (!profile) return <div className="text-center py-24">Kullanıcı bulunamadı.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      {/* Header Card */}
      <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl overflow-hidden">
        <div className="h-32 bg-sky-600"></div>
        <div className="px-8 pb-8 -mt-16 flex flex-col md:flex-row gap-8 items-end">
          <div className="relative">
            {profile.photoURL ? (
              <img src={profile.photoURL} alt={profile.displayName} className="w-32 h-32 rounded-3xl border-4 border-white shadow-lg object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-32 h-32 bg-stone-100 rounded-3xl border-4 border-white shadow-lg flex items-center justify-center text-stone-400">
                <User size={48} />
              </div>
            )}
            {profile.role === 'provider' && (
              <div className="absolute -bottom-2 -right-2 bg-sky-500 text-white p-1.5 rounded-xl border-2 border-white shadow-sm">
                <ShieldCheck size={16} />
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <h1 className="text-3xl font-bold text-stone-900">{profile.displayName}</h1>
            <div className="flex flex-wrap gap-4 text-stone-500 text-sm font-medium">
              <span className="flex items-center gap-1"><MapPin size={16} className="text-sky-600" /> {profile.city}</span>
              <span className="flex items-center gap-1"><Star size={16} className="text-yellow-400 fill-yellow-400" /> {profile.rating?.toFixed(1)} ({profile.reviewCount} Değerlendirme)</span>
              <span className="capitalize px-3 py-0.5 bg-stone-100 rounded-full text-stone-600">
                {profile.role === 'admin' ? 'Yönetici' : (profile.role === 'provider' ? 'Hizmet Veren' : 'Hizmet Alan')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="space-y-6">
          {profile.role === 'provider' && (
            <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-4">
              <h3 className="font-bold text-stone-900 flex items-center gap-2">
                <Award size={20} className="text-sky-600" /> Uzmanlıklar
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.specialties?.map((spec: string) => (
                  <span key={spec} className="px-3 py-1 bg-sky-50 text-sky-600 text-xs font-bold rounded-full">
                    {spec}
                  </span>
                ))}
                {profile.subSpecialties?.map((sub: string) => (
                  <span key={sub} className="px-3 py-1 bg-stone-100 text-stone-600 text-[10px] font-bold rounded-full">
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-4">
            <h3 className="font-bold text-stone-900 flex items-center gap-2">
              <FileText size={20} className="text-sky-600" /> Belgeler
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl text-sm">
                <span>Diploma</span>
                {profile.diplomaURL ? <ShieldCheck size={18} className="text-sky-600" /> : <span className="text-stone-400">Yok</span>}
              </div>
              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl text-sm">
                <span>Adli Sicil</span>
                {profile.criminalRecordURL ? <ShieldCheck size={18} className="text-sky-600" /> : <span className="text-stone-400">Yok</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm space-y-4">
            <h3 className="text-xl font-bold text-stone-900">Hakkında</h3>
            <p className="text-stone-600 leading-relaxed whitespace-pre-wrap">
              {profile.bio || 'Henüz bir açıklama eklenmemiş.'}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-stone-900 px-4">Değerlendirmeler ({reviews.length})</h3>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-yellow-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={14} fill={review.rating >= s ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                    <span className="text-xs text-stone-400">{new Date(review.createdAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <p className="text-stone-600 text-sm italic">"{review.comment}"</p>
                </div>
              ))}
              {reviews.length === 0 && (
                <div className="text-center py-12 text-stone-400 bg-white rounded-3xl border border-dashed border-stone-200">
                  Henüz değerlendirme yapılmamış.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
