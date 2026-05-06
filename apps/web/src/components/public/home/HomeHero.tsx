'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { SF, SFT } from '@/types/fonts/fonts';

export function HomeHero() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [location, setLocation] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (location) params.set('location', location);
        router.push(`/jobs?${params.toString()}`);
    };

    return (
        <section className="bg-white border-b border-[#E5E5EA]">
            <div className="max-w-[1200px] mx-auto px-6 py-16 lg:py-24">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-[640px] mx-auto text-center"
                >
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-[#EBF3FD] text-[#0071E3] rounded-full px-4 py-1.5 text-[12px] mb-6" style={{ fontFamily: SFT, fontWeight: 500 }}>
                        <Sparkles className="w-3.5 h-3.5" />
                        AI-Powered Recruitment Platform
                    </div>

                    <h1 className="text-[38px] lg:text-[52px] text-[#1D1D1F] tracking-[-0.03em] leading-[1.15] mb-4" style={{ fontFamily: SF, fontWeight: 700 }}>
                        Tìm việc làm{' '}
                        <span className="text-[#0071E3]">phù hợp</span>{' '}
                        với bạn
                    </h1>
                    <p className="text-[17px] text-[#6E6E73] leading-[1.6] mb-10">
                        AI TalentAI phân tích hồ sơ của bạn và kết nối với hàng ngàn cơ hội nghề nghiệp phù hợp nhất.
                    </p>

                    {/* Search Form */}
                    <form onSubmit={handleSearch}>
                        <div className="bg-[#F5F5F7] rounded-2xl p-2 flex flex-col sm:flex-row gap-2">
                            <div className="flex items-center gap-2.5 bg-white rounded-xl px-4 py-3 flex-1 shadow-sm">
                                <Search className="w-4 h-4 text-[#AEAEB2] flex-shrink-0" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder="Tên vị trí, kỹ năng, công ty..."
                                    className="bg-transparent text-[14px] text-[#1D1D1F] placeholder-[#AEAEB2] outline-none flex-1"
                                    style={{ fontFamily: SFT }}
                                />
                            </div>
                            <div className="flex items-center gap-2.5 bg-white rounded-xl px-4 py-3 sm:w-[180px] shadow-sm">
                                <MapPin className="w-4 h-4 text-[#AEAEB2] flex-shrink-0" />
                                <input
                                    type="text"
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    placeholder="Địa điểm..."
                                    className="bg-transparent text-[14px] text-[#1D1D1F] placeholder-[#AEAEB2] outline-none flex-1"
                                    style={{ fontFamily: SFT }}
                                />
                            </div>
                            <button
                                type="submit"
                                className="flex items-center justify-center gap-2 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl px-6 py-3 text-[14px] transition-all shadow-sm shadow-[#0071E3]/20 flex-shrink-0"
                                style={{ fontFamily: SFT, fontWeight: 500 }}
                            >
                                <Search className="w-4 h-4" />
                                <span className="hidden sm:inline">Tìm kiếm</span>
                            </button>
                        </div>
                    </form>

                    {/* Popular searches */}
                    <div className="flex items-center justify-center flex-wrap gap-2 mt-5">
                        <span className="text-[12px] text-[#AEAEB2]">Tìm nhiều:</span>
                        {['Frontend Developer', 'Product Manager', 'Data Science', 'UX Designer'].map(term => (
                            <button
                                key={term}
                                onClick={() => router.push(`/jobs?q=${encodeURIComponent(term)}`)}
                                className="flex items-center gap-1 text-[12px] text-[#0071E3] bg-[#EBF3FD] hover:bg-[#D6E9FA] rounded-full px-3 py-1 transition-colors"
                                style={{ fontFamily: SFT }}
                            >
                                {term}
                                <ArrowRight className="w-3 h-3" />
                            </button>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
