import { Briefcase, CalendarDays, Clock, MapPin } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { IApplicationDto } from '@/types/interfaces/application.interface';

interface CandidateOverviewTabProps {
    application: IApplicationDto;
}

const LOCATION_LABELS: Record<string, string> = {
    onsite: 'Tại văn phòng',
    remote: 'Từ xa',
    hybrid: 'Hybrid',
};

function getScoreColor(score: number): string {
    if (score >= 90) return '#34C759';
    if (score >= 75) return '#0071E3';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
}

export function CandidateOverviewTab({ application }: CandidateOverviewTabProps) {
    const screening = application.screening;
    const skillsScore = screening?.skillsScore || 0;
    const experienceScore = screening?.experienceScore || 0;
    const educationScore = screening?.educationScore || 0;
    const overallScore = screening?.overallScore || 0;
    const recommendation = screening?.aiRecommendation;
    const aiReasoning = screening?.aiReasoning;

    let matchedHardSkills: string[] = [];
    let matchedNiceToHaveSkills: string[] = [];
    if (screening?.matchedSkills) {
        let parsedMatch = screening.matchedSkills;
        if (typeof parsedMatch === 'string') {
            try { parsedMatch = JSON.parse(parsedMatch); } catch (e) {}
        }
        if (Array.isArray(parsedMatch)) {
            matchedHardSkills = parsedMatch;
        } else if (parsedMatch && typeof parsedMatch === 'object') {
            matchedHardSkills = (parsedMatch as any).hardSkills || [];
            matchedNiceToHaveSkills = (parsedMatch as any).niceToHaveSkills || [];
        }
    }

    let missingSkillsList: string[] = [];
    if (screening?.missingSkills) {
        let parsedMiss = screening.missingSkills;
        if (typeof parsedMiss === 'string') {
            try { parsedMiss = JSON.parse(parsedMiss); } catch (e) {}
        }
        if (Array.isArray(parsedMiss)) {
            missingSkillsList = parsedMiss;
        }
    }

    const recLabel = recommendation === 'hire' ? 'Nên tuyển' : recommendation === 'interview' ? 'Nên phỏng vấn' : recommendation === 'reject' ? 'Không phù hợp' : 'Chưa đánh giá';
    const screeningStatus = screening?.status || 'pending';

    console.log(application)
    console.log(screening)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Main info */}
            <div className="lg:col-span-2 space-y-5">
                {/* Application info */}
                <div className="bg-white rounded-2xl border border-[#F2F2F7] p-6">
                    <h2 className="text-[16px] text-[#1D1D1F] mb-4" style={{ fontFamily: SF, fontWeight: 600 }}>Thông tin ứng tuyển</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <InfoItem icon={Briefcase} label="Vị trí" value={application.jobPosting?.title || 'N/A'} />
                        <InfoItem icon={MapPin} label="Hình thức" value={LOCATION_LABELS[application.jobPosting?.locationType || 'N/A'] || 'N/A'} />
                        <InfoItem icon={CalendarDays} label="Ngày nộp" value={application.appliedAt ? new Date(application.appliedAt).toLocaleDateString('vi-VN') : 'N/A'} />
                        <InfoItem icon={Clock} label="Trạng thái sàng lọc" value={screeningStatus === 'completed' ? 'Hoàn tất' : 'Đang chờ'} />
                    </div>
                </div>

                {screeningStatus === 'completed' ? (
                    <>
                        {/* Recommendation Card */}
                        <div className="bg-white rounded-2xl border border-[#F2F2F7] p-6">
                            <h2 className="text-[16px] text-[#1D1D1F] mb-4" style={{ fontFamily: SF, fontWeight: 600 }}>Đề xuất AI</h2>
                            <div className="p-4 rounded-xl bg-[#F5F5F7] mb-4">
                                <p className="text-[14px] text-[#1D1D1F] leading-relaxed" style={{ fontFamily: SFT }}>
                                    Ứng viên có hồ sơ {overallScore >= 85 ? 'phù hợp cao' : overallScore >= 70 ? 'tương đối phù hợp' : 'cần xem xét thêm'} với
                                    vị trí <span style={{ fontWeight: 600 }}>{application.jobPosting?.title}</span>.
                                    {recommendation === 'hire' && ' Đề xuất tiến hành tuyển dụng.'}
                                    {recommendation === 'interview' && ' Nên sắp xếp phỏng vấn để đánh giá chi tiết hơn.'}
                                    {recommendation === 'reject' && ' Hồ sơ chưa đáp ứng đủ yêu cầu cho vị trí này.'}
                                </p>
                            </div>
                            {aiReasoning && (
                                <div className="p-4 rounded-xl border border-[#E5E5EA] bg-white">
                                    <h3 className="text-[13px] text-[#6E6E73] mb-2" style={{ fontWeight: 600, textTransform: 'uppercase' }}>Lý do từ AI:</h3>
                                    <p className="text-[14px] text-[#1D1D1F] leading-relaxed whitespace-pre-wrap" style={{ fontFamily: SFT }}>
                                        {aiReasoning}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Score breakdown */}
                        <div className="bg-white rounded-2xl border border-[#F2F2F7] p-6">
                            <h2 className="text-[16px] text-[#1D1D1F] mb-4" style={{ fontFamily: SF, fontWeight: 600 }}>Chi tiết đánh giá</h2>
                            <div className="space-y-4">
                                <ScoreBar label="Kỹ năng" score={skillsScore} />
                                <ScoreBar label="Kinh nghiệm" score={experienceScore} />
                                <ScoreBar label="Học vấn" score={educationScore} />
                            </div>
                            <p className="text-[11px] text-[#AEAEB2] mt-4">
                                * Điểm chi tiết sẽ được cập nhật khi nối API screening.
                            </p>
                        </div>
                    </>
                ) : (
                    <div className="bg-white rounded-2xl border border-[#F2F2F7] p-10 text-center">
                        <p className="text-[16px] text-[#6E6E73]" style={{ fontWeight: 500 }}>
                            {screeningStatus === 'processing' ? 'Đang sàng lọc CV...' : 'Chưa bắt đầu sàng lọc'}
                        </p>
                        <p className="text-[13px] text-[#AEAEB2] mt-2">Kết quả đánh giá AI sẽ hiển thị khi quá trình sàng lọc hoàn tất.</p>
                    </div>
                )}
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
                {/* AI Score Overview Circle */}
                {screeningStatus === 'completed' && (
                    <div className="bg-white rounded-2xl border border-[#F2F2F7] p-6 text-center">
                        <h2 className="text-[15px] text-[#1D1D1F] mb-4" style={{ fontFamily: SF, fontWeight: 600 }}>Điểm tổng AI</h2>
                        <div className="relative inline-flex items-center justify-center w-36 h-36">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="52" fill="none" stroke="#F2F2F7" strokeWidth="8" />
                                <circle cx="60" cy="60" r="52" fill="none" stroke={getScoreColor(overallScore)} strokeWidth="8"
                                    strokeDasharray={`${(overallScore / 100) * 327} 327`} strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-[32px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 700 }}>{overallScore}</span>
                                <span className="text-[11px] text-[#AEAEB2]">/100</span>
                            </div>
                        </div>
                        <p className="mt-4 text-[14px]" style={{ fontWeight: 600, color: getScoreColor(overallScore) }}>{recLabel}</p>
                    </div>
                )}

                {/* Department info */}
                <div className="bg-white rounded-2xl border border-[#F2F2F7] p-6">
                    <h2 className="text-[15px] text-[#1D1D1F] mb-4" style={{ fontFamily: SF, fontWeight: 600 }}>Phòng ban</h2>
                    <p className="text-[14px] text-[#1D1D1F]">{application.jobPosting?.department?.name || 'N/A'}</p>
                </div>

                {/* Skills Match */}
                {screeningStatus === 'completed' && (matchedHardSkills.length > 0 || matchedNiceToHaveSkills.length > 0 || missingSkillsList.length > 0) && (
                    <div className="bg-white rounded-2xl border border-[#F2F2F7] p-6">
                        <h2 className="text-[15px] text-[#1D1D1F] mb-4" style={{ fontFamily: SF, fontWeight: 600 }}>Kỹ năng đối chiếu</h2>
                        
                        {matchedHardSkills.length > 0 && (
                            <div className="mb-4">
                                <p className="text-[12px] text-[#34C759] mb-2" style={{ fontWeight: 600, textTransform: 'uppercase' }}>Đáp ứng (Bắt buộc)</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {matchedHardSkills.map((skill, idx) => (
                                        <span key={idx} className="text-[12px] bg-[#F0FDF4] border border-[#34C759]/20 text-[#34C759] px-2.5 py-1 rounded-full">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {matchedNiceToHaveSkills.length > 0 && (
                            <div className="mb-4">
                                <p className="text-[12px] text-[#0071E3] mb-2" style={{ fontWeight: 600, textTransform: 'uppercase' }}>Điểm cộng (Nice to have)</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {matchedNiceToHaveSkills.map((skill, idx) => (
                                        <span key={idx} className="text-[12px] bg-[#EBF3FD] border border-[#0071E3]/20 text-[#0071E3] px-2.5 py-1 rounded-full">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {missingSkillsList.length > 0 && (
                            <>
                                {(matchedHardSkills.length > 0 || matchedNiceToHaveSkills.length > 0) && <div className="border-t border-[#F2F2F7] my-4" />}
                                <div>
                                    <p className="text-[12px] text-[#EF4444] mb-2" style={{ fontWeight: 600, textTransform: 'uppercase' }}>Thiếu sót</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {missingSkillsList.map((skill, idx) => (
                                            <span key={idx} className="text-[12px] bg-[#FEF2F2] border border-[#EF4444]/20 text-[#EF4444] px-2.5 py-1 rounded-full">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoItem({ icon: Icon, label, value }: { icon: typeof Briefcase; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#F5F5F7] flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-[#AEAEB2]" />
            </div>
            <div>
                <p className="text-[11px] text-[#AEAEB2] uppercase tracking-wide" style={{ fontWeight: 500 }}>{label}</p>
                <p className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>{value}</p>
            </div>
        </div>
    );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>{label}</span>
                <span className="text-[13px]" style={{ fontWeight: 600, color: getScoreColor(score) }}>{score}</span>
            </div>
            <div className="h-2 bg-[#F2F2F7] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: getScoreColor(score) }} />
            </div>
        </div>
    );
}
