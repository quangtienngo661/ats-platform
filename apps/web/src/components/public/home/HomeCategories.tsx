import Link from 'next/link';
import { ChevronRight, Tag } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { IJobCategoryDto } from '@/types/interfaces/job-category.interface';

const PALETTE = ['#0071E3', '#34C759', '#FF9500', '#6366F1', '#AF52DE', '#FF3B30', '#00BCD4', '#FF6B6B'];

interface HomeCategoriesProps {
    categories: IJobCategoryDto[];
}

export function HomeCategories({ categories }: HomeCategoriesProps) {
    if (categories.length === 0) return null;

    return (
        <section className="py-14">
            <div className="max-w-[1200px] mx-auto px-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-[26px] text-[#1D1D1F] tracking-[-0.02em]" style={{ fontFamily: SF, fontWeight: 700 }}>
                            Ngành nghề nổi bật
                        </h2>
                        <p className="text-[14px] text-[#6E6E73] mt-1" style={{ fontFamily: SFT }}>
                            Khám phá cơ hội theo lĩnh vực
                        </p>
                    </div>
                    <Link
                        href="/jobs"
                        className="hidden sm:flex items-center gap-1 text-[13px] text-[#0071E3] hover:underline"
                        style={{ fontFamily: SFT, fontWeight: 500 }}
                    >
                        Xem tất cả <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {categories.slice(0, 8).map((cat, idx) => {
                        const color = PALETTE[idx % PALETTE.length];
                        return (
                            <Link
                                key={cat.categoryId}
                                href={`/jobs?categoryId=${cat.categoryId}`}
                                className="group flex flex-col gap-3 p-5 bg-white rounded-2xl border border-[#E5E5EA] hover:border-[#0071E3]/30 hover:shadow-lg hover:shadow-black/5 transition-all"
                            >
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ background: `${color}18` }}
                                >
                                    <Tag className="w-5 h-5" style={{ color }} />
                                </div>
                                <div>
                                    <p className="text-[14px] text-[#1D1D1F] group-hover:text-[#0071E3] transition-colors" style={{ fontFamily: SF, fontWeight: 600 }}>
                                        {cat.name}
                                    </p>
                                    {/* {cat.description && (
                                        <p className="text-[12px] text-[#AEAEB2] mt-0.5 line-clamp-1" style={{ fontFamily: SFT }}>
                                            {cat.description}
                                        </p>
                                    )} */}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
