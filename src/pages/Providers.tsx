import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Star, Filter, User, MessageSquare, ArrowRight, CheckCircle } from 'lucide-react';
import { CORE_PROFESSIONS } from '../constants/specialties';

interface Provider {
  id: string;
  role: string;
  status: string;
  displayName?: string;
  bio?: string;
  city?: string;
  photoURL?: string;
  specialties?: string[];
  rating?: number;
}

const Providers: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(
    searchParams.getAll('specialty')
  );

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      try {
        let q = query(
          collection(db, 'users'),
          where('role', '==', 'provider'),
          where('status', '==', 'approved')
        );

        const snapshot = await getDocs(q);
        let docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Provider[];

        // Filter by specialty client-side
        if (selectedSpecialties.length > 0) {
          docs = docs.filter(provider => 
            provider.specialties?.some((s: string) => selectedSpecialties.includes(s))
          );
        }

        // Filter by search term
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          docs = docs.filter(provider => 
            provider.displayName?.toLowerCase().includes(term) ||
            provider.bio?.toLowerCase().includes(term) ||
            provider.city?.toLowerCase().includes(term)
          );
        }

        setProviders(docs);
      } catch (error) {
        console.error('Error fetching providers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [selectedSpecialties, searchTerm]);

  const toggleSpecialty = (specialty: string) => {
    const newSpecialties = selectedSpecialties.includes(specialty)
      ? selectedSpecialties.filter(s => s !== specialty)
      : [...selectedSpecialties, specialty];
    
    setSelectedSpecialties(newSpecialties);
    
    // Update URL params
    const params = new URLSearchParams();
    newSpecialties.forEach(s => params.append('specialty', s));
    setSearchParams(params);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-stone-900 tracking-tight">Uzmanlarımızı Keşfedin</h1>
        <p className="text-stone-500 max-w-2xl">
          Alanında uzman fizyoterapist, diyetisyen, psikolog, ergoterapist ve dil terapistleri ile tanışın.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 space-y-8 shrink-0">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
              <Filter size={16} /> Uzmanlık Alanı
            </h3>
            <div className="flex flex-wrap lg:flex-col gap-2">
              {CORE_PROFESSIONS.map((specialty) => (
                <button
                  key={specialty}
                  onClick={() => toggleSpecialty(specialty)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all text-left border ${
                    selectedSpecialties.includes(specialty)
                      ? 'bg-sky-600 border-sky-600 text-white'
                      : 'bg-white border-stone-100 text-stone-600 hover:border-stone-200'
                  }`}
                >
                  {specialty}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 space-y-8">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
            <input
              type="text"
              placeholder="İsim, şehir veya uzmanlık ara..."
              className="w-full bg-white border border-stone-100 rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:border-sky-600 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white h-64 rounded-3xl animate-pulse border border-stone-100" />
              ))}
            </div>
          ) : providers.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-stone-200 text-center space-y-4">
              <div className="w-16 h-16 bg-stone-50 text-stone-300 rounded-full flex items-center justify-center mx-auto">
                <User size={32} />
              </div>
              <h3 className="text-xl font-bold text-stone-900">Uzman bulunamadı</h3>
              <p className="text-stone-500">Seçtiğiniz kriterlere uygun uzmanımız şu an bulunmuyor.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {providers.map((provider) => (
                  <motion.div
                    key={provider.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-xl transition-all group"
                  >
                    <div className="flex gap-6">
                      <div className="w-24 h-24 rounded-2xl bg-stone-100 overflow-hidden shrink-0">
                        {provider.photoURL ? (
                          <img 
                            src={provider.photoURL} 
                            alt={provider.displayName} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300">
                            <User size={40} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-stone-900 group-hover:text-sky-600 transition-colors">
                            {provider.displayName}
                          </h3>
                          <div className="flex items-center gap-1 text-amber-500 font-bold">
                            <Star size={16} fill="currentColor" />
                            <span>{provider.rating || 'Yeni'}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {provider.specialties?.map((s: string) => (
                            <span key={s} className="px-2 py-0.5 bg-sky-50 text-sky-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
                              {s}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-stone-500 text-sm">
                          <MapPin size={14} className="text-sky-600" />
                          <span>{provider.city}</span>
                        </div>
                      </div>
                    </div>

                    <p className="mt-6 text-stone-600 text-sm line-clamp-2 leading-relaxed">
                      {provider.bio || 'Henüz bir biyografi eklenmemiş.'}
                    </p>

                    <div className="mt-6 pt-6 border-t border-stone-50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-stone-400 text-xs">
                        <CheckCircle size={14} className="text-emerald-500" />
                        <span>Doğrulanmış Uzman</span>
                      </div>
                      <Link
                        to={`/profile/${provider.id}`}
                        className="flex items-center gap-2 text-sky-600 font-bold text-sm hover:gap-3 transition-all"
                      >
                        Profili İncele <ArrowRight size={16} />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Providers;
