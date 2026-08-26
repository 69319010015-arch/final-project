import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Search, BookOpen, Calendar, Eye, HelpCircle, X, ArrowUpRight } from 'lucide-react';

export const KnowledgeBasePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeArticle, setActiveArticle] = useState(null);

  // Live query articles with filters
  const articles = useLiveQuery(async () => {
    const all = await db.articles.toArray();
    
    return all.filter(art => {
      const matchSearch =
        art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        art.content.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchCat = activeCategory === 'all' || art.category === activeCategory;
      
      return matchSearch && matchCat;
    });
  }, [searchTerm, activeCategory]);

  const handleOpenArticle = async (article) => {
    // Increment views count in IndexedDB
    await db.articles.update(article.id, { views: (article.views || 0) + 1 });
    
    // Display article in modal
    setActiveArticle({
      ...article,
      views: (article.views || 0) + 1
    });
  };

  const categories = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'Hardware', label: 'Hardware' },
    { id: 'Software', label: 'Software' },
    { id: 'Network', label: 'Network' },
    { id: 'Account & Security', label: 'Security' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 text-white p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-indigo-500/10 blur-2xl"></div>
        <div className="relative z-10 space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold backdrop-blur-md">
            <BookOpen className="w-3.5 h-3.5" />
            Knowledge Base
          </span>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight font-display">
            คลังบทความความรู้และ FAQ ไอทีเบื้องต้น
          </h2>
          <p className="text-xs md:text-sm text-slate-400 max-w-xl leading-relaxed">
            ค้นหาคู่มือ ขั้นตอนตรวจสอบอุปกรณ์ และวิธีแก้ไขจุดขัดข้องเบื้องต้นด้วยตัวเองอย่างสะดวกรวดเร็ว
          </p>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors focus:outline-none ${
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="relative w-full md:w-80 shrink-0">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="ค้นหาบทความช่วยเหลือ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs dark:border-slate-800 dark:bg-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Articles Cards Grid */}
      {!articles ? (
        <div className="flex h-44 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 py-16 text-center text-slate-400">
          <HelpCircle className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-semibold">ไม่พบเอกสารบทความช่วยเหลือตามที่คุณค้นหา</p>
          <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหาหลัก หรือเปลี่ยนหมวดหมู่ตัวกรองดูครับ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((art) => (
            <div
              key={art.id}
              onClick={() => handleOpenArticle(art)}
              className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col group"
            >
              <div className="flex items-center justify-between mb-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>{art.category}</span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {art.views || 0} อ่าน
                </span>
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 leading-snug">
                {art.title}
              </h4>
              <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed flex-1">
                {art.content.replace(/[#*`\[\]]/g, '')} {/* Simple strip markdown for preview */}
              </p>
              
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-450 font-semibold">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  {new Date(art.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                  อ่านเพิ่มเติม
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Article Detail Full Overlay Modal */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-250">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-850 flex justify-between items-start bg-slate-50 dark:bg-slate-950/40 rounded-t-3xl">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{activeArticle.category}</span>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mt-1 leading-snug">
                  {activeArticle.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveArticle(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-650"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed prose dark:prose-invert max-w-none">
              
              {/* Render content split by lines for basic list rendering or code representation */}
              {activeArticle.content.split('\n').map((line, i) => {
                // Check if heading
                if (line.startsWith('###')) {
                  return <h4 key={i} className="font-bold text-slate-850 dark:text-white mt-4 mb-2 text-sm md:text-base">{line.replace('###', '')}</h4>;
                }
                if (line.startsWith('##')) {
                  return <h3 key={i} className="font-bold text-slate-850 dark:text-white mt-5 mb-2 text-base md:text-lg">{line.replace('##', '')}</h3>;
                }
                // Check if list item
                if (line.startsWith('*') || line.startsWith('-')) {
                  return <li key={i} className="ml-4 list-disc text-slate-600 dark:text-slate-350">{line.substring(1).trim()}</li>;
                }
                // Check if numeric list item
                if (/^\d+\./.test(line)) {
                  return <div key={i} className="ml-4 text-slate-600 dark:text-slate-350 my-1 font-medium">{line}</div>;
                }
                // Check if bold/code
                if (line.trim().startsWith('`') || line.trim().endsWith('`')) {
                  return (
                    <pre key={i} className="bg-slate-100 dark:bg-slate-950 p-3 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-200 dark:border-slate-850 my-3 text-slate-800 dark:text-slate-300 leading-tight">
                      {line.replace(/`/g, '')}
                    </pre>
                  );
                }
                
                return <p key={i} className="my-2 whitespace-pre-wrap">{line}</p>;
              })}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-850 flex justify-between items-center text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-950/40 rounded-b-3xl">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                บทความเผยแพร่เมื่อ: {new Date(activeArticle.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1 font-bold">
                <Eye className="w-3.5 h-3.5 text-indigo-500" />
                อ่านแล้ว {activeArticle.views} ครั้ง
              </span>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
