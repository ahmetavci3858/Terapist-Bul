import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const VerificationPending: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white p-12 rounded-[3rem] border border-stone-100 shadow-2xl text-center space-y-8"
      >
        <div className="relative inline-block">
          <div className="w-24 h-24 bg-sky-50 rounded-3xl flex items-center justify-center text-sky-600 mx-auto">
            <ShieldCheck size={48} />
          </div>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-sky-500"
          >
            <Clock size={16} />
          </motion.div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-stone-900 tracking-tight">Kayıt İşleminiz Alındı</h1>
          <p className="text-xl text-stone-600 leading-relaxed">
            Başvurunuz başarıyla tarafımıza ulaştı. Güvenli bir platform sağlamak adına bilgileriniz ekibimiz tarafından incelenmektedir.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
          <div className="space-y-2">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle size={24} />
            </div>
            <p className="text-sm font-bold text-stone-900">Bilgiler Alındı</p>
          </div>
          <div className="space-y-2">
            <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto">
              <Clock size={24} />
            </div>
            <p className="text-sm font-bold text-stone-900">İnceleme Süreci</p>
          </div>
          <div className="space-y-2">
            <div className="w-12 h-12 bg-stone-50 text-stone-400 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldCheck size={24} />
            </div>
            <p className="text-sm font-bold text-stone-900">Onay ve Başlangıç</p>
          </div>
        </div>

        <div className="bg-stone-50 p-6 rounded-2xl text-left space-y-3">
          <h4 className="font-bold text-stone-900">Süreç Hakkında Bilgilendirme:</h4>
          <ul className="text-sm text-stone-600 space-y-2 list-disc pl-4">
            <li>İnceleme süreci genellikle 24-48 saat içerisinde tamamlanmaktadır.</li>
            <li>Onaylandığında e-posta adresinize bilgilendirme gönderilecektir.</li>
            <li>Eksik belge durumunda sizinle iletişime geçilecektir.</li>
          </ul>
        </div>

        <div className="pt-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sky-600 font-bold hover:gap-3 transition-all"
          >
            Anasayfaya Dön <ArrowRight size={20} />
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default VerificationPending;
