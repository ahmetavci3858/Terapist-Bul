import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { blogPosts } from '../data/blogPosts';
import { ArrowLeft, Calendar, User, Share2, Bookmark, Clock, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const BlogPost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const post = blogPosts.find(p => p.id === id);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!post) {
      navigate('/blog');
    }
  }, [post, navigate]);

  if (!post) return null;

  // Calculate reading time (roughly 200 words per minute)
  const wordCount = post.content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  // Suggest related posts (same category, different id)
  const relatedPosts = blogPosts
    .filter(p => p.category === post.category && p.id !== post.id)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-stone-400 mb-8">
          <Link to="/" className="hover:text-stone-900 transition-colors">Ana Sayfa</Link>
          <ChevronRight size={14} />
          <Link to="/blog" className="hover:text-stone-900 transition-colors">Blog</Link>
          <ChevronRight size={14} />
          <span className="text-stone-900 font-medium truncate">{post.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-sky-50 text-sky-700 text-xs font-bold rounded-full">
              {post.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-stone-400">
              <Clock size={14} /> {readingTime} dk okuma
            </span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-bold text-stone-900 leading-tight mb-6">
            {post.title}
          </h1>

          <div className="flex items-center justify-between py-6 border-y border-stone-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 font-bold">
                TB
              </div>
              <div>
                <p className="text-stone-900 font-bold text-sm">{post.author}</p>
                <p className="text-stone-400 text-xs">{new Date(post.date).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-stone-50 rounded-full transition-colors text-stone-400 hover:text-stone-900">
                <Share2 size={20} />
              </button>
              <button className="p-2 hover:bg-stone-50 rounded-full transition-colors text-stone-400 hover:text-stone-900">
                <Bookmark size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        <div className="rounded-3xl overflow-hidden mb-12 shadow-lg aspect-video">
          <img 
            src={post.image} 
            alt={post.title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Content */}
        <article className="prose prose-stone prose-lg max-w-none mb-20">
          <div className="markdown-body">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
        </article>

        {/* Footer / Call to Action */}
        <div className="bg-stone-900 rounded-3xl p-8 md:p-12 text-white mb-20 relative overflow-hidden">
          <div className="relative z-10 max-w-lg">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Bu konuda desteğe mi ihtiyacınız var?</h3>
            <p className="text-stone-400 mb-8">
              {post.category} alanında uzmanlarımızla hemen iletişime geçebilir, size en uygun terapi planını oluşturabilirsiniz.
            </p>
            <Link 
              to={`/create-request?specialty=${post.category}`}
              className="inline-flex items-center gap-2 bg-white text-stone-900 px-8 py-4 rounded-2xl font-bold hover:bg-sky-50 transition-all"
            >
              Hemen Talep Oluştur
            </Link>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-600/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section>
            <h3 className="text-2xl font-bold text-stone-900 mb-8">İlginizi Çekebilir</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosts.map((relatedPost) => (
                <Link 
                  key={relatedPost.id} 
                  to={`/blog/${relatedPost.id}`}
                  className="group block"
                >
                  <div className="aspect-video rounded-2xl overflow-hidden mb-4">
                    <img 
                      src={relatedPost.image} 
                      alt={relatedPost.title} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h4 className="font-bold text-stone-900 group-hover:text-sky-600 transition-colors line-clamp-2">
                    {relatedPost.title}
                  </h4>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-16 pt-8 border-t border-stone-100">
          <Link 
            to="/blog" 
            className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 font-bold transition-colors"
          >
            <ArrowLeft size={20} /> Tüm Yazılara Dön
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;
