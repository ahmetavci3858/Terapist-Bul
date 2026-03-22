import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, collectionGroup } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, MapPin, Calendar, Clock, MessageSquare, MessageCircle, CheckCircle, ChevronRight, ShieldCheck, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import QuickServiceSearch from '../components/QuickServiceSearch';

const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminView, setAdminView] = useState<'seeker' | 'provider'>('seeker');
  const [providerTab, setProviderTab] = useState<'requests' | 'offers'>('requests');

  const effectiveRole = profile?.role === 'admin' ? adminView : profile?.role;

  // Seeker: View their own requests
  // Provider: View open requests or their own offers
  // Admin: View all requests or all providers in the selected view
  useEffect(() => {
    if (!user || !profile) return;

    let q;
    if (profile.role === 'admin') {
      if (adminView === 'seeker') {
        // Admins see all requests
        q = query(
          collection(db, 'requests')
        );
      } else {
        // Admins see all providers
        q = query(
          collection(db, 'users'),
          where('role', '==', 'provider')
        );
      }
    } else if (profile.role === 'seeker') {
      // Seekers only see their own requests
      q = query(
        collection(db, 'requests'),
        where('seekerId', '==', user.uid)
      );
    } else {
      // Providers
      if (providerTab === 'requests') {
        // Providers see all open requests
        q = query(
          collection(db, 'requests'),
          where('status', '==', 'open')
        );
      } else {
        // Providers see their own offers across all requests
        q = query(
          collectionGroup(db, 'offers'),
          where('providerId', '==', user.uid)
        );
      }
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort in memory to avoid index issues
      docs.sort((a: any, b: any) => {
        const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
        const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
      
      if (profile.role === 'provider' && providerTab === 'offers') {
        setOffers(docs);
      } else {
        setRequests(docs);
      }
      
      // Add sample data for demo if empty and not admin provider view
      if (docs.length === 0 && !(profile.role === 'admin' && adminView === 'provider')) {
        if (profile.role === 'provider' && providerTab === 'offers') {
           // No sample offers for now
           setOffers([]);
        } else {
          const sampleRequests = [
            {
              id: 'sample-1',
              title: 'Fizik Tedavi İhtiyacı',
              description: 'Bel fıtığı nedeniyle evde fizik tedavi hizmeti almak istiyorum. Haftada 2 gün uygunum.',
              serviceTypes: ['Fizyoterapist'],
              city: profile?.city || 'İstanbul',
              district: 'Beşiktaş',
              status: 'open',
              createdAt: new Date().toISOString(),
              seekerName: 'Örnek Kullanıcı',
              duration: 'Haftada 2',
              locationType: 'home_office',
              isSample: true
            },
            {
              id: 'sample-2',
              title: 'Beslenme Danışmanlığı',
              description: 'Kilo kontrolü ve sağlıklı beslenme için online veya yüz yüze diyetisyen desteği arıyorum.',
              serviceTypes: ['Diyetisyen'],
              city: profile?.city || 'İstanbul',
              district: 'Kadıköy',
              status: 'open',
              createdAt: new Date().toISOString(),
              seekerName: 'Ayşe Yılmaz',
              duration: 'Haftada 1',
              locationType: 'online',
              isSample: true
            }
          ];
          setRequests(sampleRequests);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error('Fetch error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, profile, adminView, providerTab]);

  return (
    <div className="space-y-8">
      {profile?.role === 'provider' && profile?.status === 'pending' && (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl flex items-center gap-4 text-amber-800 shadow-sm">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
            <Clock size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg">Profiliniz Onay Bekliyor</h3>
            <p className="text-sm opacity-90">
              Başvurunuz incelenmektedir. Bu süreçte yeni talepleri görebilirsiniz ancak tüm özelliklere erişiminiz kısıtlı olabilir.
            </p>
          </div>
        </div>
      )}

      {profile?.role === 'admin' && (
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-100">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Yönetici Görünümü</h3>
              <p className="text-xs text-stone-500">Hangi paneli kontrol etmek istediğinizi seçin.</p>
            </div>
          </div>
          <div className="flex bg-stone-100 p-1 rounded-xl">
            <button
              onClick={() => setAdminView('seeker')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                adminView === 'seeker' ? 'bg-white text-sky-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              Talepler
            </button>
            <button
              onClick={() => setAdminView('provider')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                adminView === 'provider' ? 'bg-white text-sky-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              Hizmet Veren
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-stone-900">
            {profile?.role === 'admin' 
              ? `Yönetici Paneli (${adminView === 'seeker' ? 'Talepler' : 'Hizmet Verenler'} Görünümü)` 
              : (effectiveRole === 'seeker' 
                ? 'Taleplerim' 
                : (providerTab === 'requests' ? 'Yeni İş Fırsatları' : 'Gönderdiğim Teklifler'))}
          </h1>
          <p className="text-stone-500">
            {profile?.role === 'admin'
              ? 'Sistemdeki tüm talepleri ve süreçleri bu görünüm üzerinden takip edebilirsiniz.'
              : (effectiveRole === 'seeker' 
                ? 'Oluşturduğunuz hizmet taleplerini buradan takip edebilirsiniz.' 
                : 'Sistemdeki tüm yeni talepleri inceleyin. İlgilendiğiniz talepler için yönetici ile WhatsApp üzerinden iletişime geçebilirsiniz.')}
          </p>
        </div>

        {effectiveRole === 'provider' && (
          <div className="flex bg-stone-100 p-1 rounded-xl shrink-0">
            <button
              className="px-4 py-2 rounded-lg text-xs font-bold bg-white text-sky-600 shadow-sm"
            >
              Yeni Talepler
            </button>
          </div>
        )}

        {effectiveRole === 'seeker' && (
          <button
            onClick={() => setIsSearchOpen(true)}
            className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2 active:scale-95"
          >
            <Plus size={20} /> Yeni Talep Oluştur
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
        </div>
      ) : (effectiveRole === 'provider' && providerTab === 'offers' ? offers : requests).length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-stone-200 text-center space-y-4">
          <div className="w-16 h-16 bg-stone-50 text-stone-300 rounded-full flex items-center justify-center mx-auto">
            <Search size={32} />
          </div>
          <h3 className="text-xl font-bold text-stone-900">Henüz bir kayıt bulunamadı</h3>
          <p className="text-stone-500 max-w-sm mx-auto">
            {effectiveRole === 'seeker' 
              ? 'Hemen ilk talebinizi oluşturun ve uzmanlardan teklif almaya başlayın.' 
              : (providerTab === 'requests' 
                ? 'Şu an yeni bir talep bulunmuyor. Profilinizi güncel tutarak daha fazla kişiye ulaşabilirsiniz.'
                : 'Henüz bir teklif göndermediniz. Yeni talepleri inceleyerek teklif vermeye başlayabilirsiniz.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(effectiveRole === 'provider' && providerTab === 'offers' ? offers : requests).map((item) => {
            const isAdminProviderView = profile?.role === 'admin' && adminView === 'provider';
            
            if (isAdminProviderView) {
              return (
                <Link key={item.id} to={`/provider/${item.id}`}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-xl transition-all group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-sky-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                            Hizmet Veren
                          </span>
                          {(item.specialties || []).map((spec: string) => (
                            <span key={spec} className="px-3 py-1 bg-sky-50 text-sky-600 text-xs font-bold rounded-full uppercase tracking-wider">
                              {spec}
                            </span>
                          ))}
                          {item.status === 'pending' && (
                            <span className="px-3 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-full uppercase tracking-wider">
                              Onay Bekliyor
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-stone-900 group-hover:text-sky-600 transition-colors">
                          {item.displayName}
                        </h3>
                      </div>
                      <div className="text-stone-400 group-hover:text-sky-600 transition-colors">
                        <ChevronRight size={24} />
                      </div>
                    </div>
                    <p className="text-stone-600 line-clamp-2 mb-6 text-sm leading-relaxed">
                      {item.bio || 'Uzman hakkında detaylı bilgi bulunmuyor.'}
                    </p>
                    <div className="flex items-center gap-2 text-stone-500 text-sm pt-4 border-t border-stone-50">
                      <MapPin size={16} className="text-sky-600" />
                      <span>{item.city || 'Belirtilmemiş'}</span>
                    </div>
                  </motion.div>
                </Link>
              );
            }

            if (effectiveRole === 'provider' && providerTab === 'offers') {
              const offer = item;
              return (
                <Link key={offer.id} to={`/request/${offer.requestId}`}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-xl transition-all group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                            offer.status === 'accepted' ? 'bg-emerald-50 text-emerald-600' :
                            offer.status === 'rejected' ? 'bg-red-50 text-red-600' :
                            'bg-amber-50 text-amber-600'
                          }`}>
                            {offer.status === 'accepted' ? 'Kabul Edildi' :
                             offer.status === 'rejected' ? 'Reddedildi' :
                             'Beklemede'}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-stone-900 group-hover:text-sky-600 transition-colors">
                          Talep #{offer.requestId.substring(0, 8)}
                        </h3>
                      </div>
                      <div className="text-stone-400 group-hover:text-sky-600 transition-colors">
                        <ChevronRight size={24} />
                      </div>
                    </div>
                    <p className="text-stone-600 line-clamp-2 mb-6 text-sm leading-relaxed">
                      {offer.message || 'Teklif mesajı bulunmuyor.'}
                    </p>
                    <div className="flex items-center gap-2 text-stone-500 text-sm pt-4 border-t border-stone-50">
                      <Clock size={16} className="text-sky-600" />
                      <span>{new Date(offer.createdAt).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </motion.div>
                </Link>
              );
            }

            const request = item;
            return (
              <Link key={request.id} to={`/request/${request.id}`}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-xl transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-2">
                        {(request.serviceTypes || [request.serviceType]).map((type: string) => (
                          <span key={type} className="px-3 py-1 bg-sky-50 text-sky-600 text-xs font-bold rounded-full uppercase tracking-wider">
                            {type === 'physiotherapist' ? 'Fizyoterapist' : 
                             type === 'dietitian' ? 'Diyetisyen' : 
                             type === 'psychologist' ? 'Psikolog' :
                             type === 'occupational_therapist' ? 'Ergoterapist' :
                             type === 'speech_therapist' ? 'Dil ve Konuşma Terapisti' :
                             type}
                          </span>
                        ))}
                        {request.status === 'agreed' && (
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle size={12} /> Anlaşıldı
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-stone-900 group-hover:text-sky-600 transition-colors">
                        {profile?.role === 'admin' 
                          ? request.seekerName 
                          : (effectiveRole === 'provider' 
                            ? `${request.seekerName?.substring(0, 2) || 'Ku'}***` 
                            : (request.goals?.length > 0 ? request.goals.join(', ') : 'Hizmet Talebi'))}
                      </h3>
                      {profile?.role === 'admin' && request.phoneNumber && (
                        <p className="text-sky-600 font-bold text-sm flex items-center gap-1">
                          <Phone size={14} /> {request.phoneNumber}
                        </p>
                      )}
                    </div>
                    <div className="text-stone-400 group-hover:text-sky-600 transition-colors">
                      <ChevronRight size={24} />
                    </div>
                  </div>

                  <p className="text-stone-600 line-clamp-2 mb-6 text-sm leading-relaxed">
                    {request.description || (request.goals?.length > 0 ? `${request.goals.join(', ')} için hizmet talebi.` : 'Detaylı bilgi için tıklayın.')}
                  </p>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-50">
                    <div className="flex items-center gap-2 text-stone-500 text-sm">
                      <MapPin size={16} className="text-sky-600" />
                      <span>{request.city}{request.district ? `, ${request.district}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-2 text-stone-500 text-sm">
                      <Calendar size={16} className="text-sky-600" />
                      <span>{request.duration || request.frequency}</span>
                    </div>
                    <div className="flex items-center gap-2 text-stone-500 text-sm">
                      <Clock size={16} className="text-sky-600" />
                      <span>
                        {request.locationType === 'online' ? 'Online' : 
                         request.locationType === 'clinic' ? 'Klinik' : 
                         request.locationType === 'home_office' ? 'Ev / Ofis' : 'Evde'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-stone-500 text-sm">
                      <MessageSquare size={16} className="text-sky-600" />
                      <span>Teklifler</span>
                    </div>
                  </div>

                  {effectiveRole === 'provider' && (
                    <div className="pt-4">
                      <a 
                        href={`https://wa.me/905452050458?text=${encodeURIComponent(`Merhaba, ${request.id} numaralı ${request.serviceTypes?.join(', ') || request.serviceType} talebi hakkında bilgi almak istiyorum.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-[#25D366] text-white py-3 rounded-xl font-bold hover:bg-[#128C7E] transition-all shadow-lg flex items-center justify-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MessageCircle size={18} />
                        WhatsApp ile İletişime Geç
                      </a>
                    </div>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      )}

      {/* System Information - Data Storage Info */}
      <section className="bg-stone-900 text-white p-8 rounded-[2.5rem] space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Sistem ve Veri Depolama Bilgisi</h2>
            <p className="text-stone-400 text-sm">Uygulama verilerinin nerede ve nasıl saklandığına dair özet.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Kullanıcı Verileri', path: '/users/{uid}', desc: 'Profil bilgileri, uzmanlıklar ve iletişim detayları.' },
            { title: 'Hizmet Talepleri', path: '/requests/{requestId}', desc: 'Oluşturulan tüm talepler ve durumları.' },
            { title: 'Bildirimler', path: '/notifications/{id}', desc: 'Uzmanlara gönderilen anlık uygulama içi uyarılar.' },
            { title: 'E-Posta Kuyruğu', path: '/mail/{id}', desc: 'Hizmet verenlere gönderilen simüle edilmiş e-postalar.' },
            { title: 'Sistem Sayaçları', path: '/counters/requests', desc: 'Sıralı talep numaraları için kullanılan sayaç.' },
          ].map((item, i) => (
            <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
              <h3 className="font-bold text-sky-400 text-sm">{item.title}</h3>
              <code className="block text-[10px] bg-black/30 p-2 rounded-lg text-stone-300 font-mono">
                Firestore: {item.path}
              </code>
              <p className="text-xs text-stone-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-white/10">
          <p className="text-xs text-stone-500">
            * Tüm veriler Google Cloud Firestore (NoSQL) veritabanında güvenli bir şekilde saklanmaktadır. 
            Talep numaraları, sistem kimlikleri ile eşleştirilerek takip edilebilirliği artırılmıştır.
          </p>
        </div>
      </section>

      {/* Quick Service Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <QuickServiceSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
