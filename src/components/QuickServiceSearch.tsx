import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Check, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ServiceRecommendation {
  id: string;
  name: string;
  description: string;
}

const SERVICE_MAPPINGS: Record<string, string[]> = {
  'yeme bozukluğu': ['Diyetisyen', 'Psikolog'],
  'anoreksiya': ['Diyetisyen', 'Psikolog'],
  'bulimia': ['Diyetisyen', 'Psikolog'],
  'kilo vermek': ['Diyetisyen'],
  'zayıflama': ['Diyetisyen'],
  'kilo almak': ['Diyetisyen'],
  'diyet': ['Diyetisyen'],
  'bel fıtığı': ['Fizyoterapist'],
  'boyun fıtığı': ['Fizyoterapist'],
  'manuel terapi': ['Fizyoterapist'],
  'eklem ağrısı': ['Fizyoterapist'],
  'felç': ['Fizyoterapist', 'Ergoterapist'],
  'inme': ['Fizyoterapist', 'Ergoterapist'],
  'stres': ['Psikolog'],
  'depresyon': ['Psikolog'],
  'kaygı': ['Psikolog'],
  'anksiyete': ['Psikolog'],
  'panik atak': ['Psikolog'],
  'otizm': ['Ergoterapist', 'Dil ve Konuşma Terapisti', 'Psikolog'],
  'dehb': ['Ergoterapist', 'Psikolog'],
  'dikkat eksikliği': ['Ergoterapist', 'Psikolog'],
  'konuşma bozukluğu': ['Dil ve Konuşma Terapisti'],
  'kekemelik': ['Dil ve Konuşma Terapisti'],
  'yutma bozukluğu': ['Dil ve Konuşma Terapisti'],
  'duyu bütünleme': ['Ergoterapist'],
  'el rehabilitasyonu': ['Ergoterapist', 'Fizyoterapist'],
  'günlük yaşam': ['Ergoterapist'],
};

const ALL_SERVICES = [
  'Fizyoterapist',
  'Diyetisyen',
  'Psikolog',
  'Ergoterapist',
  'Dil ve Konuşma Terapisti'
];

interface QuickServiceSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const QuickServiceSearch: React.FC<QuickServiceSearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.length < 2) {
      setRecommendations([]);
      return;
    }

    const normalizedQuery = query.toLowerCase().trim();
    const matches = new Set<string>();

    // Check direct mappings
    Object.entries(SERVICE_MAPPINGS).forEach(([keyword, services]) => {
      if (normalizedQuery.includes(keyword) || keyword.includes(normalizedQuery)) {
        services.forEach(s => matches.add(s));
      }
    });

    // Check direct service names
    ALL_SERVICES.forEach(service => {
      if (service.toLowerCase().includes(normalizedQuery)) {
        matches.add(service);
      }
    });

    setRecommendations(Array.from(matches));
  }, [query]);

  const toggleService = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service) 
        : [...prev, service]
    );
  };

  const handleContinue = () => {
    if (selectedServices.length === 0) return;
    // For now, navigate to providers with selected filters
    // We can pass these as state or query params
    const searchParams = new URLSearchParams();
    selectedServices.forEach(s => searchParams.append('specialty', s));
    navigate(`/create-request?${searchParams.toString()}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-stone-100 rounded-full transition-colors"
        >
          <X size={24} className="text-stone-400" />
        </button>

        <div className="p-8 md:p-12 space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-stone-900 flex items-center gap-3">
              <Sparkles className="text-sky-600" />
              Size Nasıl Yardımcı Olabiliriz?
            </h2>
            <p className="text-stone-500">
              Şikayetinizi veya almak istediğiniz hizmeti yazın, size en uygun uzmanları önerelim.
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-400" size={24} />
            <input
              autoFocus
              type="text"
              placeholder="Örn: Yeme bozukluğu, manuel terapi, bel fıtığı..."
              className="w-full bg-stone-50 border-2 border-stone-100 rounded-2xl py-5 pl-16 pr-6 text-lg focus:border-sky-600 focus:ring-0 transition-all outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="min-h-[200px] space-y-6">
            <AnimatePresence mode="wait">
              {recommendations.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest">Önerilen Hizmetler</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {recommendations.map((service) => (
                      <button
                        key={service}
                        onClick={() => toggleService(service)}
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
                          selectedServices.includes(service)
                            ? 'border-sky-600 bg-sky-50 text-sky-700'
                            : 'border-stone-100 hover:border-stone-200 text-stone-700'
                        }`}
                      >
                        <span className="font-semibold">{service}</span>
                        {selectedServices.includes(service) && <Check size={20} />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : query.length >= 2 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 space-y-2"
                >
                  <p className="text-stone-500">Eşleşen bir hizmet bulamadık.</p>
                  <p className="text-sm text-stone-400">Lütfen farklı kelimelerle deneyin veya tüm uzmanlarımıza göz atın.</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                >
                  {ALL_SERVICES.map(s => (
                    <button
                      key={s}
                      onClick={() => toggleService(s)}
                      className={`p-3 rounded-xl text-sm font-medium border transition-all ${
                        selectedServices.includes(s)
                          ? 'bg-sky-600 border-sky-600 text-white'
                          : 'bg-stone-50 border-stone-100 text-stone-600 hover:border-stone-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="pt-4 flex items-center justify-between gap-4">
            <button
              onClick={onClose}
              className="px-6 py-3 text-stone-500 font-semibold hover:text-stone-700 transition-colors"
            >
              Vazgeç
            </button>
            <button
              disabled={selectedServices.length === 0}
              onClick={handleContinue}
              className="flex-1 bg-stone-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              Devam Et ({selectedServices.length})
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default QuickServiceSearch;
