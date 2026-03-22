import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Info, 
  User, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  ExternalLink, 
  X, 
  Star, 
  ShieldCheck,
  Trash2,
  LayoutGrid,
  ClipboardList,
  List
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [seekers, setSeekers] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'requests' | 'providers'>('stats');
  const [subTab, setSubTab] = useState<'requests' | 'seekers'>('requests');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const isAdmin = user?.email === 'ahmetavci3858@gmail.com';

  useEffect(() => {
    if (!isAdmin) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        setSeekers(allUsers.filter((u: any) => u.role === 'seeker'));
        setProviders(allUsers.filter((u: any) => u.role === 'provider'));

        // Fetch Requests with offer counts
        const requestsSnapshot = await getDocs(collection(db, 'requests'));
        const requestsData = await Promise.all(requestsSnapshot.docs.map(async (requestDoc) => {
          const offersSnapshot = await getDocs(collection(db, 'requests', requestDoc.id, 'offers'));
          return { 
            id: requestDoc.id, 
            ...requestDoc.data(),
            offerCount: offersSnapshot.size
          };
        }));
        setRequests(requestsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  const handleDelete = async (collectionName: string, id: string) => {
    if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
      if (collectionName === 'users') {
        setSeekers(seekers.filter(s => s.id !== id));
        setProviders(providers.filter(p => p.id !== id));
      } else {
        setRequests(requests.filter(r => r.id !== id));
      }
      alert('Kayıt başarıyla silindi.');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Silme işlemi sırasında bir hata oluştu.');
    }
  };

  const handleStatusUpdate = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'users', userId), { 
        status,
        isVerified: status === 'approved'
      });
      const updateList = (list: any[]) => list.map(u => u.id === userId ? { ...u, status, isVerified: status === 'approved' } : u);
      setSeekers(updateList(seekers));
      setProviders(updateList(providers));
      alert(`Kullanıcı durumu '${status === 'approved' ? 'Onaylandı' : 'Reddedildi'}' olarak güncellendi.`);
    } catch (error) {
      console.error('Status update error:', error);
      alert('Güncelleme sırasında bir hata oluştu.');
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    if (typeof date === 'string') return date;
    if (date.toDate && typeof date.toDate === 'function') {
      return date.toDate().toLocaleString('tr-TR');
    }
    if (date instanceof Date) {
      return date.toLocaleString('tr-TR');
    }
    return String(date);
  };

  const exportToCSV = (type: 'seekers' | 'providers' | 'requests') => {
    let dataToExport: any[] = [];
    let filename = '';

    if (type === 'seekers') {
      dataToExport = seekers;
      filename = 'hizmet_alanlar.csv';
    } else if (type === 'providers') {
      dataToExport = providers;
      filename = 'hizmet_verenler.csv';
    } else if (type === 'requests') {
      dataToExport = requests;
      filename = 'talepler.csv';
    }

    if (dataToExport.length === 0) {
      alert('Dışa aktarılacak veri bulunamadı.');
      return;
    }

    // Define headers based on type
    let headers: string[] = [];
    if (type === 'seekers' || type === 'providers') {
      headers = ['ID', 'Ad Soyad', 'Email', 'Telefon', 'Şehir', 'Yaş', 'Cinsiyet', 'Boy', 'Kilo', 'Rol', 'Durum', 'Kayıt Tarihi'];
    } else {
      headers = ['ID', 'Hizmet Alan', 'Hizmet Alan ID', 'Email', 'Telefon', 'Hizmet Türü', 'Şehir', 'İlçe', 'Açıklama', 'Durum', 'Tarih'];
    }

    const csvRows = [];
    csvRows.push(headers.join(';')); // Using semicolon for better Excel compatibility in many regions

    for (const row of dataToExport) {
      let values: any[] = [];
      if (type === 'seekers' || type === 'providers') {
        values = [
          row.uid || row.id,
          row.displayName || '',
          row.email || '',
          row.phoneNumber || '',
          row.city || '',
          row.age || '',
          row.gender || '',
          row.height || '',
          row.weight || '',
          row.role || '',
          row.status || '',
          formatDate(row.createdAt)
        ];
      } else {
        values = [
          row.id,
          row.seekerName || '',
          row.seekerId || '',
          row.seekerEmail || '',
          row.phoneNumber || '',
          row.serviceType || '',
          row.city || '',
          row.district || '',
          (row.description || '').replace(/[\r\n]+/g, ' '),
          row.status || '',
          formatDate(row.createdAt)
        ];
      }
      
      // Escape semicolons and wrap in quotes if necessary
      const escapedValues = values.map(v => {
        const str = String(v).replace(/"/g, '""');
        return `"${str}"`;
      });
      
      csvRows.push(escapedValues.join(';'));
    }

    const csvString = csvRows.join('\n');
    // Add UTF-8 BOM for Excel recognition
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getFilteredData = () => {
    let data = [];
    if (activeTab === 'requests') {
      data = subTab === 'requests' ? requests : seekers;
    }
    else if (activeTab === 'providers') data = providers;
    else return [];

    return data.filter(item => 
      item.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.seekerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.numericId?.toString().includes(searchTerm) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredItems = getFilteredData();

  return (
    <div className="min-h-screen bg-stone-50/50 py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-stone-900 tracking-tight flex items-center gap-3">
              <ShieldCheck className="text-sky-600" size={40} />
              Yönetim Paneli
            </h1>
            <p className="text-stone-500 font-medium">Sistemdeki tüm verileri buradan inceleyebilir ve yönetebilirsiniz.</p>
          </div>

          <div className="flex bg-white p-1.5 rounded-2xl border border-stone-200 shadow-sm overflow-x-auto">
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'stats' ? 'bg-sky-600 text-white shadow-lg shadow-sky-100' : 'text-stone-500 hover:bg-stone-50'
              }`}
            >
              <LayoutGrid size={18} /> İstatistikler
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'requests' ? 'bg-sky-600 text-white shadow-lg shadow-sky-100' : 'text-stone-500 hover:bg-stone-50'
              }`}
            >
              <ClipboardList size={18} /> Talepler ({requests.length})
            </button>
            <button
              onClick={() => setActiveTab('providers')}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'providers' ? 'bg-sky-600 text-white shadow-lg shadow-sky-100' : 'text-stone-500 hover:bg-stone-50'
              }`}
            >
              <Users size={18} /> Hizmet Verenler ({providers.length})
            </button>
          </div>
        </div>

        {/* Search & Sub-tabs */}
        {activeTab !== 'stats' && (
          <div className="space-y-4">
            {activeTab === 'requests' && (
              <div className="flex gap-4">
                <button
                  onClick={() => setSubTab('requests')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    subTab === 'requests' ? 'bg-stone-900 text-white' : 'bg-white text-stone-500 hover:bg-stone-50'
                  }`}
                >
                  Tüm Talepler
                </button>
                <button
                  onClick={() => setSubTab('seekers')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    subTab === 'seekers' ? 'bg-stone-900 text-white' : 'bg-white text-stone-500 hover:bg-stone-50'
                  }`}
                >
                  Tüm Danışanlar
                </button>
              </div>
            )}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400" size={22} />
                <input
                  type="text"
                  placeholder="İsim, e-posta, şehir veya ID ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 rounded-3xl border border-stone-200 focus:border-sky-600 outline-none transition-all bg-white shadow-sm text-lg"
                />
              </div>
              <div className="flex bg-white p-1.5 rounded-2xl border border-stone-200 shadow-sm self-start md:self-center">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-400 hover:bg-stone-50'}`}
                  title="Kart Görünümü"
                >
                  <LayoutGrid size={20} />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-3 rounded-xl transition-all ${viewMode === 'table' ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-400 hover:bg-stone-50'}`}
                  title="Liste Görünümü"
                >
                  <List size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {activeTab === 'stats' ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-600">
                    <Users size={24} />
                  </div>
                  <button 
                    onClick={() => exportToCSV('seekers')}
                    className="text-xs font-bold text-sky-600 hover:underline"
                  >
                    Excel İndir
                  </button>
                </div>
                <div>
                  <p className="text-stone-500 text-sm font-bold uppercase tracking-widest">Toplam Kullanıcı</p>
                  <h3 className="text-4xl font-black text-stone-900">{seekers.length + providers.length}</h3>
                </div>
                <div className="flex gap-3 text-xs font-bold">
                  <span className="text-sky-600">{seekers.length} Alan</span>
                  <span className="text-emerald-600">{providers.length} Veren</span>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                    <ClipboardList size={24} />
                  </div>
                  <button 
                    onClick={() => exportToCSV('requests')}
                    className="text-xs font-bold text-emerald-600 hover:underline"
                  >
                    Excel İndir
                  </button>
                </div>
                <div>
                  <p className="text-stone-500 text-sm font-bold uppercase tracking-widest">Toplam Talep</p>
                  <h3 className="text-4xl font-black text-stone-900">{requests.length}</h3>
                </div>
                <div className="flex gap-3 text-xs font-bold">
                  <span className="text-emerald-600">{requests.filter(r => r.status === 'open').length} Açık</span>
                  <span className="text-blue-600">{requests.filter(r => r.status === 'agreed').length} Anlaşıldı</span>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                    <Clock size={24} />
                  </div>
                  <button 
                    onClick={() => exportToCSV('providers')}
                    className="text-xs font-bold text-amber-600 hover:underline"
                  >
                    Excel İndir
                  </button>
                </div>
                <div>
                  <p className="text-stone-500 text-sm font-bold uppercase tracking-widest">Onay Bekleyen</p>
                  <h3 className="text-4xl font-black text-amber-600">{providers.filter(p => p.status === 'pending').length}</h3>
                </div>
                <p className="text-xs text-stone-400 font-medium">İncelenmesi gereken uzman profilleri.</p>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm space-y-4">
                <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-600">
                  <MapPin size={24} />
                </div>
                <div>
                  <p className="text-stone-500 text-sm font-bold uppercase tracking-widest">Şehir Sayısı</p>
                  <h3 className="text-4xl font-black text-stone-900">{new Set([...seekers, ...providers].map(u => u.city)).size}</h3>
                </div>
                <p className="text-xs text-stone-400 font-medium">Hizmet verilen toplam şehir sayısı.</p>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-sky-600"></div>
            <p className="text-stone-500 font-bold">Veriler yükleniyor...</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden"
              >
                {/* Role Badge */}
                <div className="absolute top-0 right-0 px-6 py-2 bg-stone-50 text-stone-400 text-[10px] font-black uppercase tracking-widest rounded-bl-2xl">
                  {activeTab === 'requests' ? (subTab === 'requests' ? 'TALEP' : 'DANIŞAN') : item.role === 'provider' ? 'UZMAN' : 'DANIŞAN'}
                </div>

                <div className="flex items-start gap-5 mb-6">
                  <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-400 group-hover:bg-sky-50 group-hover:text-sky-600 transition-colors shrink-0">
                    {activeTab === 'requests' && subTab === 'requests' ? <ClipboardList size={32} /> : <User size={32} />}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-xl font-bold text-stone-900 truncate">
                      {activeTab === 'requests' && subTab === 'requests' ? `Talep #${item.numericId}` : item.displayName}
                    </h3>
                    <p className="text-stone-500 text-sm truncate flex items-center gap-1.5">
                      <Mail size={14} /> {activeTab === 'requests' && subTab === 'requests' ? item.seekerName : item.email}
                    </p>
                    {item.phoneNumber && (
                      <p className="text-sky-600 text-xs font-bold flex items-center gap-1.5">
                        <Phone size={12} /> {item.phoneNumber}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-stone-600">
                      <MapPin size={16} className="text-stone-400" />
                      <span className="truncate">{item.city || 'Belirtilmemiş'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-stone-600">
                      {activeTab === 'requests' && subTab === 'requests' ? <Clock size={16} className="text-stone-400" /> : <Calendar size={16} className="text-stone-400" />}
                      <span>{activeTab === 'requests' && subTab === 'requests' ? item.locationType : `Yaş: ${item.age || 'N/A'}`}</span>
                    </div>
                  </div>

                  {activeTab === 'requests' && subTab === 'requests' ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1.5">
                        {item.serviceTypes?.map((s: string) => (
                          <span key={s} className="px-3 py-1 bg-sky-50 text-sky-600 rounded-lg text-[10px] font-black uppercase">
                            {s}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-stone-400">
                        <Star size={14} /> {item.offerCount || 0} Teklif Verildi
                      </div>
                    </div>
                  ) : item.role === 'provider' && (
                    <div className="flex flex-wrap gap-1.5">
                      {item.specialties?.slice(0, 3).map((s: string) => (
                        <span key={s} className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-6 border-t border-stone-50 flex items-center justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="p-3 bg-stone-100 text-stone-600 rounded-xl hover:bg-sky-600 hover:text-white transition-all shadow-sm"
                        title="İncele"
                      >
                        <Info size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(activeTab === 'requests' ? 'requests' : 'users', item.id)}
                        className="p-3 bg-stone-100 text-stone-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                        title="Sil"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>

                    <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                      item.status === 'approved' || item.status === 'open' ? 'bg-emerald-50 text-emerald-600' : 
                      item.status === 'pending' ? 'bg-amber-50 text-amber-600' : 
                      item.status === 'rejected' ? 'bg-red-50 text-red-600' : 
                      'bg-stone-100 text-stone-400'
                    }`}>
                      {item.status === 'open' ? 'AÇIK' : 
                       item.status === 'agreed' ? 'ANLAŞILDI' : 
                       item.status === 'approved' ? 'ONAYLI' : 
                       item.status === 'pending' ? 'BEKLEMEDE' : 
                       item.status === 'rejected' ? 'REDDEDİLDİ' : item.status}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-100">
                    <th className="px-6 py-4 text-stone-500 text-[10px] font-black uppercase tracking-widest">ID</th>
                    <th className="px-6 py-4 text-stone-500 text-[10px] font-black uppercase tracking-widest">İsim / Başlık</th>
                    <th className="px-6 py-4 text-stone-500 text-[10px] font-black uppercase tracking-widest">Email / Bilgi</th>
                    <th className="px-6 py-4 text-stone-500 text-[10px] font-black uppercase tracking-widest">Şehir</th>
                    <th className="px-6 py-4 text-stone-500 text-[10px] font-black uppercase tracking-widest">Durum</th>
                    <th className="px-6 py-4 text-stone-500 text-[10px] font-black uppercase tracking-widest">Tarih</th>
                    <th className="px-6 py-4 text-stone-500 text-[10px] font-black uppercase tracking-widest text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-4 text-stone-400 text-xs font-mono">
                        {activeTab === 'requests' && subTab === 'requests' ? `#${item.numericId}` : item.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-stone-900">
                          {activeTab === 'requests' && subTab === 'requests' ? (item.serviceTypes?.[0] || 'Hizmet Talebi') : item.displayName}
                        </div>
                        {activeTab === 'requests' && subTab === 'requests' && (
                          <div className="text-xs text-stone-400">{item.seekerName}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-stone-600">{activeTab === 'requests' && subTab === 'requests' ? item.seekerEmail : item.email}</div>
                        {item.phoneNumber && (
                          <div className="text-xs text-sky-600 font-bold">{item.phoneNumber}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-600">
                        {item.city} {item.district ? `/ ${item.district}` : ''}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          item.status === 'approved' || item.status === 'open' ? 'bg-emerald-50 text-emerald-600' : 
                          item.status === 'pending' ? 'bg-amber-50 text-amber-600' : 
                          item.status === 'rejected' ? 'bg-red-50 text-red-600' : 
                          'bg-stone-100 text-stone-400'
                        }`}>
                          {item.status === 'open' ? 'AÇIK' : 
                           item.status === 'agreed' ? 'ANLAŞILDI' : 
                           item.status === 'approved' ? 'ONAYLI' : 
                           item.status === 'pending' ? 'BEKLEMEDE' : 
                           item.status === 'rejected' ? 'REDDEDİLDİ' : item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-stone-400">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="p-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-sky-600 hover:text-white transition-all shadow-sm"
                            title="İncele"
                          >
                            <Info size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(activeTab === 'requests' ? 'requests' : 'users', item.id)}
                            className="p-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
                            title="Sil"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && filteredItems.length === 0 && activeTab !== 'stats' && (
          <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-stone-200">
            <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center text-stone-300 mx-auto mb-6">
              <Search size={40} />
            </div>
            <h3 className="text-xl font-bold text-stone-900">Sonuç Bulunamadı</h3>
            <p className="text-stone-400 mt-2">Aradığınız kriterlere uygun herhangi bir kayıt bulunmuyor.</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-sky-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-100">
                    {activeTab === 'requests' ? <ClipboardList size={24} /> : <User size={24} />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-stone-900 tracking-tight">Kayıt Detayları</h2>
                    <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">{activeTab === 'requests' ? `TALEP #${selectedItem.numericId}` : selectedItem.role === 'provider' ? 'UZMAN PROFİLİ' : 'DANIŞAN PROFİLİ'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="p-3 hover:bg-stone-200 rounded-2xl transition-colors text-stone-400"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-10">
                {/* Profile Section */}
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="w-32 h-32 bg-stone-100 rounded-[2rem] flex items-center justify-center text-stone-300 overflow-hidden border-4 border-white shadow-xl shrink-0">
                    {selectedItem.photoURL ? (
                      <img src={selectedItem.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User size={64} />
                    )}
                  </div>
                  <div className="space-y-4 flex-1">
                    <div>
                      <h3 className="text-3xl font-black text-stone-900">{activeTab === 'requests' ? selectedItem.seekerName : selectedItem.displayName}</h3>
                      <p className="text-stone-500 font-medium flex items-center gap-2 mt-1">
                        <Mail size={18} className="text-sky-600" /> {activeTab === 'requests' ? selectedItem.seekerEmail : selectedItem.email}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2 px-4 py-2 bg-stone-100 rounded-xl text-stone-600 text-sm font-bold">
                        <MapPin size={16} /> {selectedItem.city || 'Belirtilmemiş'}
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-stone-100 rounded-xl text-stone-600 text-sm font-bold">
                        <Phone size={16} /> {selectedItem.phoneNumber || 'Belirtilmemiş'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] border-b border-stone-100 pb-2">Temel Bilgiler</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-stone-400 text-sm font-bold">Kayıt Tarihi</span>
                        <span className="text-stone-900 font-bold">{formatDate(selectedItem.createdAt)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-stone-400 text-sm font-bold">Durum</span>
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          selectedItem.status === 'approved' || selectedItem.status === 'open' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {selectedItem.status}
                        </span>
                      </div>
                      {activeTab !== 'requests' && (
                        <>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-stone-400 text-sm font-bold">Yaş</span>
                            <span className="text-stone-900 font-bold">{selectedItem.age || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-stone-400 text-sm font-bold">Cinsiyet</span>
                            <span className="text-stone-900 font-bold">{selectedItem.gender || 'N/A'}</span>
                          </div>
                          {selectedItem.role === 'seeker' && (
                            <>
                              <div className="flex justify-between items-center py-1">
                                <span className="text-stone-400 text-sm font-bold">Boy</span>
                                <span className="text-stone-900 font-bold">{selectedItem.height || 'N/A'} cm</span>
                              </div>
                              <div className="flex justify-between items-center py-1">
                                <span className="text-stone-400 text-sm font-bold">Kilo</span>
                                <span className="text-stone-900 font-bold">{selectedItem.weight || 'N/A'} kg</span>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] border-b border-stone-100 pb-2">Performans & Veri</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-stone-400 text-sm font-bold">Puanlama</span>
                        <div className="flex items-center gap-1 text-yellow-500 font-black">
                          <Star size={16} fill="currentColor" /> {selectedItem.rating || 0}
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-stone-400 text-sm font-bold">Yorum Sayısı</span>
                        <span className="text-stone-900 font-bold">{selectedItem.reviewCount || 0}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-stone-400 text-sm font-bold">Telefon Onayı</span>
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          selectedItem.isPhoneVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {selectedItem.isPhoneVerified ? 'EVET' : 'HAYIR'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description / Bio */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] border-b border-stone-100 pb-2">Açıklama / Hakkında</h4>
                  <p className="text-stone-600 bg-stone-50 p-6 rounded-3xl text-sm leading-relaxed italic border border-stone-100">
                    {activeTab === 'requests' ? selectedItem.description : selectedItem.bio || 'Açıklama bulunmuyor.'}
                  </p>
                </div>

                {/* Specialties / Service Types */}
                {(selectedItem.specialties || selectedItem.serviceTypes) && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] border-b border-stone-100 pb-2">Uzmanlık & Hizmetler</h4>
                    <div className="flex flex-wrap gap-2">
                      {(selectedItem.specialties || selectedItem.serviceTypes).map((s: string) => (
                        <span key={s} className="px-4 py-2 bg-sky-50 text-sky-600 rounded-xl text-xs font-black uppercase tracking-wider border border-sky-100">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents */}
                {selectedItem.role === 'provider' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] border-b border-stone-100 pb-2">Yüklenen Belgeler</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedItem.diplomaURL ? (
                        <a 
                          href={selectedItem.diplomaURL} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-5 bg-white border-2 border-stone-100 rounded-2xl hover:border-sky-600 transition-all group shadow-sm"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center text-stone-400 group-hover:text-sky-600 transition-colors">
                              <FileText size={20} />
                            </div>
                            <span className="text-sm font-black text-stone-700">Diploma</span>
                          </div>
                          <ExternalLink size={18} className="text-stone-300" />
                        </a>
                      ) : (
                        <div className="p-5 bg-stone-50 rounded-2xl text-xs text-stone-400 border-2 border-dashed border-stone-100 flex items-center justify-center">
                          Diploma yüklenmemiş
                        </div>
                      )}

                      {selectedItem.criminalRecordURL ? (
                        <a 
                          href={selectedItem.criminalRecordURL} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-5 bg-white border-2 border-stone-100 rounded-2xl hover:border-sky-600 transition-all group shadow-sm"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center text-stone-400 group-hover:text-sky-600 transition-colors">
                              <ShieldCheck size={20} />
                            </div>
                            <span className="text-sm font-black text-stone-700">Adli Sicil</span>
                          </div>
                          <ExternalLink size={18} className="text-stone-300" />
                        </a>
                      ) : (
                        <div className="p-5 bg-stone-50 rounded-2xl text-xs text-stone-400 border-2 border-dashed border-stone-100 flex items-center justify-center">
                          Adli sicil yüklenmemiş
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-stone-100 bg-stone-50/50 flex gap-4">
                {selectedItem.role === 'provider' && selectedItem.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => {
                        handleStatusUpdate(selectedItem.id, 'approved');
                        setSelectedItem(null);
                      }}
                      className="flex-1 bg-emerald-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3"
                    >
                      <CheckCircle2 size={24} /> Onayla
                    </button>
                    <button
                      onClick={() => {
                        handleStatusUpdate(selectedItem.id, 'rejected');
                        setSelectedItem(null);
                      }}
                      className="flex-1 bg-white border-2 border-red-100 text-red-600 py-5 rounded-2xl font-black text-lg hover:bg-red-50 transition-all flex items-center justify-center gap-3"
                    >
                      <XCircle size={24} /> Reddet
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="w-full bg-stone-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-stone-800 transition-all shadow-xl shadow-stone-200"
                  >
                    Kapat
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
