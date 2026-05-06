import { StageConfig } from '@/types/interfaces/kanban.interface';

export const SF = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif";
export const SFT = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', system-ui, sans-serif";
export const DRAG_TYPE = 'CARD';

export const sourceBadge: Record<string, { bg: string; text: string }> = {
  LinkedIn: { bg: '#EFF6FF', text: '#1D4ED8' },
  Referral: { bg: '#F5F3FF', text: '#6D28D9' },
  Website: { bg: '#ECFDF5', text: '#15803D' },
  Indeed: { bg: '#F0F9FF', text: '#0369A1' },
  AngelList: { bg: '#FDF4FF', text: '#9333EA' },
};

export const stages: StageConfig[] = [
  { id: 'applied', label: 'Ứng tuyển', color: '#64748B', light: '#F8FAFC', border: '#CBD5E1', text: '#475569' },
  { id: 'screening', label: 'Sàng lọc', color: '#3B82F6', light: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' },
  { id: 'interview', label: 'Phỏng vấn', color: '#6366F1', light: '#F5F3FF', border: '#DDD6FE', text: '#4F46E5' },
  { id: 'offer', label: 'Offer', color: '#34C759', light: '#F0FDF4', border: '#BBF7D0', text: '#15803D' },
  { id: 'hired', label: 'Đã tuyển', color: '#0071E3', light: '#EBF3FD', border: '#BFDBFE', text: '#0055B3' },
  { id: 'rejected', label: 'Từ chối', color: '#EF4444', light: '#FEF2F2', border: '#FECACA', text: '#B91C1C' },
];
