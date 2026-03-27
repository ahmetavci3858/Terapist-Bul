import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { blogPosts, BlogPost } from '../data/blogPosts';
import { Search, Filter, Calendar, User, ArrowRight } from 'lucide-react';

const Blog: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');

  const categories = ['Tümü', 'Fizyoterapist', 'Diyetisyen', 'Psikolog', 'Ergoterapist', 'Dil ve Konuşma Terapisti'];

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          post.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Tümü' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-stone-50 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-stone-900 mb-4"
          >
            Blog & Sağlık Rehberi
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-stone-600 max-w-2xl mx-auto"
          >
            Uzmanlarımızdan sağlık, terapi ve beslenme üzerine güncel bilgiler, ipuçları ve rehber yazılar.
          </motion.p>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
            <input 
              type="text" 
              placeholder="Yazılarda ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-stone-200 focus:border-sky-600 outline-none bg-white shadow-sm transition-all"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto no-scrollbar">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category 
                    ? 'bg-stone-900 text-white shadow-md' 
                    : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Blog Grid */}
        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-stone-100 flex flex-col h-full"
              >
                <Link to={`/blog/${post.id}`} className="block overflow-hidden aspect-video relative">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-stone-900 text-xs font-bold rounded-full shadow-sm">
                      {post.category}
                    </span>
                  </div>
                </Link>
                
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-4 text-xs text-stone-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} /> {new Date(post.date).toLocaleDateString('tr-TR')}
                    </span>
                    <span className="flex items-center gap-1">
                      <User size={14} /> {post.author}
                    </span>
                  </div>
                  
                  <Link to={`/blog/${post.id}`}>
                    <h2 className="text-xl font-bold text-stone-900 mb-3 group-hover:text-sky-600 transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                  </Link>
                  
                  <p className="text-stone-600 text-sm mb-6 line-clamp-3 flex-1">
                    {post.summary}
                  </p>
                  
                  <Link 
                    to={`/blog/${post.id}`}
                    className="inline-flex items-center gap-2 text-stone-900 font-bold text-sm hover:gap-3 transition-all"
                  >
                    Devamını Oku <ArrowRight size={18} />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-stone-300">
            <p className="text-stone-500 text-lg">Aradığınız kriterlere uygun yazı bulunamadı.</p>
            <button 
              onClick={() => { setSearchTerm(''); setSelectedCategory('Tümü'); }}
              className="mt-4 text-sky-600 font-bold hover:underline"
            >
              Filtreleri Temizle
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
