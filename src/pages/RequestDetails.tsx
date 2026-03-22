import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { 
  doc, onSnapshot, collection, query, orderBy, addDoc, updateDoc, 
  setDoc, getDoc, where, getDocs 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Phone, MapPin, Calendar, Clock, MessageSquare, MessageCircle,
  CheckCircle, User, Star, ShieldCheck, CreditCard, X, DollarSign 
} from 'lucide-react';

const CONTACT_ACCESS_FEE = 50;

const RequestDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [request, setRequest] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [offerMessage, setOfferMessage] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [offerDuration, setOfferDuration] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [agreement, setAgreement] = useState<any>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user || !profile || !request) return;

    const toId = profile.role === 'seeker' ? agreement.providerId : agreement.seekerId;

    try {
      await addDoc(collection(db, 'reviews'), {
        fromId: user.uid,
        toId,
        requestId: id,
        rating,
        comment,
        createdAt: new Date().toISOString(),
      });

      // Update user rating (average)
      const userRef = doc(db, 'users', toId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const newReviewCount = (userData.reviewCount || 0) + 1;
        const newRating = ((userData.rating || 0) * (userData.reviewCount || 0) + rating) / newReviewCount;
        await updateDoc(userRef, {
          rating: newRating,
          reviewCount: newReviewCount,
        });
      }

      setShowReviewForm(false);
      alert('Değerlendirmeniz için teşekkürler!');
    } catch (error) {
      console.error('Review error:', error);
    }
  };

  useEffect(() => {
    if (!id || !user) return;

    const unsubscribeRequest = onSnapshot(doc(db, 'requests', id), (snapshot) => {
      if (snapshot.exists()) {
        setRequest({ id: snapshot.id, ...snapshot.data() });
      } else {
        navigate('/dashboard');
      }
      setLoading(false);
    }, (error) => {
      console.error('Request fetch error:', error);
      setLoading(false);
    });

    const offersQuery = (profile?.role === 'seeker' || profile?.role === 'admin')
      ? collection(db, 'requests', id, 'offers')
      : query(collection(db, 'requests', id, 'offers'), where('providerId', '==', user.uid));

    const unsubscribeOffers = onSnapshot(offersQuery, (snapshot) => {
      setOffers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error('Offers fetch error:', error);
    });

    const unsubscribeMessages = onSnapshot(
      query(collection(db, 'requests', id, 'messages'), orderBy('createdAt', 'asc')),
      (snapshot) => {
        setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        console.error('Messages fetch error:', error);
      }
    );

    const agreementQuery = (profile?.role === 'seeker' || profile?.role === 'admin')
      ? query(collection(db, 'agreements'), where('requestId', '==', id))
      : query(collection(db, 'agreements'), where('requestId', '==', id), where('providerId', '==', user.uid));

    const unsubscribeAgreement = onSnapshot(
      agreementQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          setAgreement({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
        }
      },
      (error) => {
        console.error('Agreement fetch error:', error);
      }
    );

    return () => {
      unsubscribeRequest();
      unsubscribeOffers();
      unsubscribeMessages();
      unsubscribeAgreement();
    };
  }, [id, user, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !id) return;

    try {
      await addDoc(collection(db, 'requests', id, 'messages'), {
        text: newMessage,
        senderId: user.uid,
        senderName: profile?.displayName || user.displayName,
        createdAt: new Date().toISOString(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Message error:', error);
    }
  };

  const handleMakeOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !profile || !offerMessage.trim()) return;
    try {
      await setDoc(doc(db, 'requests', id, 'offers', user.uid), {
        requestId: id,
        providerId: user.uid,
        providerName: profile.displayName,
        message: offerMessage,
        price: offerPrice,
        duration: offerDuration,
        isPaid: false,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      setOfferMessage('');
      setOfferPrice('');
      setOfferDuration('');
      setShowOfferForm(false);
    } catch (error) {
      console.error('Offer error:', error);
    }
  };

  const handlePayForContact = async (offerId: string) => {
    if (!id) return;
    // Simulate payment
    try {
      await updateDoc(doc(db, 'requests', id, 'offers', offerId), {
        isPaid: true,
      });
      alert('Ödeme başarılı! İletişim bilgileri açıldı.');
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  const handleConfirmAgreement = async () => {
    if (!id || !user || !profile) return;

    const isProvider = profile.role === 'provider';
    const agreementData = {
      requestId: id,
      providerId: isProvider ? user.uid : (offers.find(o => o.status === 'accepted')?.providerId || ''),
      seekerId: isProvider ? request.seekerId : user.uid,
      [isProvider ? 'providerConfirmed' : 'seekerConfirmed']: true,
      agreedAt: new Date().toISOString(),
    };

    try {
      if (agreement) {
        await updateDoc(doc(db, 'agreements', agreement.id), {
          [isProvider ? 'providerConfirmed' : 'seekerConfirmed']: true,
        });
        if ((isProvider && agreement.seekerConfirmed) || (!isProvider && agreement.providerConfirmed)) {
          await updateDoc(doc(db, 'requests', id), { status: 'agreed' });
        }
      } else {
        await addDoc(collection(db, 'agreements'), agreementData);
      }
      alert('Anlaşma onaylandı!');
    } catch (error) {
      console.error('Agreement error:', error);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Yükleniyor...</div>;

  const myOffer = offers.find(o => o.providerId === user?.uid);
  const isAgreed = request.status === 'agreed';
  const isAdmin = profile?.role === 'admin';
  const isSeeker = profile?.role === 'seeker';
  const isOwner = request.seekerId === user?.uid;
  
  // Name masking: Only Admin and the Owner see the full name. 
  // Providers see it only after paying for contact.
  const showFullName = isAdmin || isOwner || (myOffer && myOffer.isPaid);
  
  // Phone visibility: Only Admin sees it
  const canSeePhone = isAdmin;

  return (
    <div className={`max-w-6xl mx-auto grid grid-cols-1 ${profile?.role === 'provider' ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-8`}>
      {/* Left Column: Request Details & Offers */}
      <div className={profile?.role === 'provider' ? 'lg:col-span-1' : 'lg:col-span-2'}>
        <div className="space-y-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-xl space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <span className="px-4 py-1 bg-sky-50 text-sky-600 text-sm font-bold rounded-full uppercase tracking-wider">
                {request.serviceType === 'physiotherapist' ? 'Fizyoterapist' : 
                 request.serviceType === 'dietitian' ? 'Diyetisyen' : 
                 request.serviceType === 'psychologist' ? 'Psikolog' :
                 request.serviceType === 'occupational_therapist' ? 'Ergoterapist' :
                 request.serviceType === 'speech_therapist' ? 'Dil ve Konuşma Terapisti' :
                 request.serviceType}
              </span>
              <h1 className="text-3xl font-bold text-stone-900">
                {showFullName ? request.seekerName : `${request.seekerName.substring(0, 2)}***`}
              </h1>
            </div>
            {canSeePhone && request.phoneNumber && (
              <div className="flex items-center gap-2 text-sky-600 bg-sky-50 px-4 py-2 rounded-2xl font-bold">
                <Phone size={20} />
                {request.phoneNumber}
              </div>
            )}
          </div>

          <p className="text-stone-600 text-lg leading-relaxed whitespace-pre-wrap">
            {request.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-stone-50">
            <div className="flex items-center gap-3 text-stone-600">
              <div className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center text-sky-600">
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase">Konum</p>
                <p className="font-semibold">{request.city}, {request.district}{request.neighborhood ? ` (${request.neighborhood})` : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-stone-600">
              <div className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center text-sky-600">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase">Sıklık & Süre</p>
                <p className="font-semibold">{request.frequency} • {request.duration || 'Belirtilmemiş'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-stone-600">
              <div className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center text-sky-600">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase">Yer & Başlangıç</p>
                <p className="font-semibold capitalize">{request.locationType} • {request.startDate || 'Hemen'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-stone-600">
              <div className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center text-sky-600">
                <User size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase">Tercih Edilen Uzman</p>
                <p className="font-semibold">{request.preferredProviderGender || 'Farketmez'}</p>
              </div>
            </div>
          </div>

          {request.goals && request.goals.length > 0 && (
            <div className="pt-6 border-t border-stone-50">
              <p className="text-xs font-bold text-stone-400 uppercase mb-3">Hedefler</p>
              <div className="flex flex-wrap gap-2">
                {request.goals.map((goal: string, idx: number) => (
                  <span key={idx} className="px-3 py-1 bg-stone-100 text-stone-600 text-xs font-medium rounded-lg">
                    {goal}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile?.role === 'provider' && (
            <div className="space-y-4">
              <div className="bg-sky-50 border border-sky-100 p-6 rounded-3xl flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-sky-600 shadow-sm">
                  <MessageCircle size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-stone-900">Bu Talep İçin WhatsApp'tan Ulaşın</h3>
                  <p className="text-stone-500 text-sm">
                    Bu hizmet talebiyle ilgileniyorsanız, detayları görüşmek için yöneticiye WhatsApp üzerinden mesaj atabilirsiniz.
                  </p>
                </div>
                <a
                  href={`https://wa.me/905452050458?text=${encodeURIComponent(`Merhaba, ${request.id} numaralı ${request.serviceTypes?.join(', ') || request.serviceType} talebi hakkında bilgi almak istiyorum.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366] text-white p-5 rounded-2xl font-bold text-lg hover:bg-[#128C7E] transition-all shadow-xl shadow-green-100 flex items-center justify-center gap-2"
                >
                  <MessageCircle size={24} />
                  WhatsApp ile İletişime Geç
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Offers Section - Only visible to Admin and Seeker */}
        {(isAdmin || isSeeker) && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2 px-4">
              <Star className="text-sky-600" /> Teklifler ({offers.length})
            </h2>
          <div className="space-y-4">
            {offers.map((offer, index) => {
              const isMyOffer = offer.providerId === user?.uid;
              const canSeeOfferDetails = isAdmin || isSeeker || isMyOffer;

              return (
                <div key={offer.id} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-400">
                        <User size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-stone-900">
                          {canSeeOfferDetails ? offer.providerName : `${index + 1}. Uzman Teklif Verdi`}
                        </h4>
                        <p className="text-xs text-stone-400">{new Date(offer.createdAt).toLocaleDateString('tr-TR')}</p>
                      </div>
                    </div>
                    {profile?.role === 'provider' && isMyOffer && !offer.isPaid && (
                      <button
                        onClick={() => handlePayForContact(offer.id)}
                        className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-sky-700 transition-all shadow-lg shadow-sky-100"
                      >
                        <CreditCard size={16} /> Bilgileri Gör ({CONTACT_ACCESS_FEE} TL)
                      </button>
                    )}
                  </div>
                  {canSeeOfferDetails ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-4 text-xs font-bold text-sky-600">
                        {offer.price && (
                          <div className="flex items-center gap-1 bg-sky-50 px-2 py-1 rounded-lg">
                            <DollarSign size={14} /> {offer.price} TL
                          </div>
                        )}
                        {offer.duration && (
                          <div className="flex items-center gap-1 bg-sky-50 px-2 py-1 rounded-lg">
                            <Clock size={14} /> {offer.duration}
                          </div>
                        )}
                      </div>
                      <p className="text-stone-600 text-sm leading-relaxed">{offer.message}</p>
                    </div>
                  ) : (
                    <div className="bg-stone-50 p-4 rounded-xl text-stone-400 text-xs italic">
                      Teklif içeriği sadece hizmet alan tarafından görülebilir.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        )}
      </div>
    </div>

      {/* Right Column: Chat & Agreement - Only visible to Admin and Seeker */}
      {(isAdmin || isSeeker) && (
        <div className="space-y-8">
        {/* Agreement Status */}
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <ShieldCheck className="text-sky-600" /> Anlaşma Durumu
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl">
              <span className="text-sm font-medium">Hizmet Alan Onayı</span>
              {agreement?.seekerConfirmed ? (
                <CheckCircle size={20} className="text-sky-600" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-stone-200" />
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl">
              <span className="text-sm font-medium">Hizmet Veren Onayı</span>
              {agreement?.providerConfirmed ? (
                <CheckCircle size={20} className="text-sky-600" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-stone-200" />
              )}
            </div>
          </div>
          {!isAgreed && (
            <button
              onClick={handleConfirmAgreement}
              disabled={profile?.role === 'provider' ? agreement?.providerConfirmed : agreement?.seekerConfirmed}
              className="w-full bg-stone-900 text-white p-4 rounded-2xl font-bold hover:bg-stone-800 transition-all disabled:opacity-50"
            >
              {(profile?.role === 'provider' ? agreement?.providerConfirmed : agreement?.seekerConfirmed) ? 'Onaylandı' : 'Anlaştık'}
            </button>
          )}
          {isAgreed && (
            <div className="space-y-4">
              <div className="bg-sky-50 text-sky-700 p-4 rounded-2xl text-center font-bold flex items-center justify-center gap-2">
                <CheckCircle size={20} /> Anlaşma Sağlandı!
              </div>
              <button
                onClick={() => setShowReviewForm(true)}
                className="w-full bg-white border-2 border-sky-600 text-sky-600 p-4 rounded-2xl font-bold hover:bg-sky-50 transition-all"
              >
                Hizmeti Değerlendir
              </button>
            </div>
          )}
        </div>

        {/* Review Form Modal */}
        <AnimatePresence>
          {showReviewForm && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white w-full max-w-md rounded-[2.5rem] p-8 space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-stone-900">Değerlendir</h2>
                  <button onClick={() => setShowReviewForm(false)} className="text-stone-400 hover:text-stone-600">
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={handleReviewSubmit} className="space-y-6">
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`p-2 transition-all ${rating >= star ? 'text-yellow-400 scale-110' : 'text-stone-200'}`}
                      >
                        <Star size={32} fill={rating >= star ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Deneyiminizi paylaşın..."
                    className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none h-32"
                  />
                  <button
                    type="submit"
                    className="w-full bg-sky-600 text-white p-5 rounded-2xl font-bold text-lg hover:bg-sky-700 transition-all shadow-xl shadow-sky-100"
                  >
                    Gönder
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Chat Section */}
        <div className="bg-white h-[500px] flex flex-col rounded-[2.5rem] border border-stone-100 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-stone-50 bg-stone-50/50">
            <h3 className="font-bold text-stone-900 flex items-center gap-2">
              <MessageSquare size={20} className="text-sky-600" /> Mesajlar
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.senderId === user?.uid ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                    msg.senderId === user?.uid
                      ? 'bg-sky-600 text-white rounded-tr-none'
                      : 'bg-stone-100 text-stone-800 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-stone-400 mt-1">
                  {msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-stone-50 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Mesajınızı yazın..."
              className="flex-1 p-4 rounded-2xl bg-stone-50 border-none focus:ring-2 focus:ring-sky-100 outline-none transition-all text-sm"
            />
            <button
              type="submit"
              className="p-4 bg-sky-600 text-white rounded-2xl hover:bg-sky-700 transition-all shadow-lg shadow-sky-100"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
      )}

      {/* Offer Form Modal */}
      <AnimatePresence>
        {showOfferForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-stone-900">Teklif Ver</h2>
                <button onClick={() => setShowOfferForm(false)} className="text-stone-400 hover:text-stone-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleMakeOffer} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-400 uppercase">Teklif Tutarı (TL)</label>
                    <input
                      type="number"
                      required
                      placeholder="Örn: 500"
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                      className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-400 uppercase">Tahmini Süre</label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: 10 Seans"
                      value={offerDuration}
                      onChange={(e) => setOfferDuration(e.target.value)}
                      className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-400 uppercase">Teklif Mesajı</label>
                  <textarea
                    required
                    placeholder="Örn: Merhaba, bu alanda 5 yıllık tecrübem var..."
                    value={offerMessage}
                    onChange={(e) => setOfferMessage(e.target.value)}
                    className="w-full p-4 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none h-40"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-sky-600 text-white p-5 rounded-2xl font-bold text-lg hover:bg-sky-700 transition-all shadow-xl shadow-sky-100"
                >
                  Teklifi Gönder
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RequestDetails;
