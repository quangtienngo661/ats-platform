import { statusTone, type StatusKind } from '@/lib/status-tones';
import { Badge } from './Badge';

export function StatusChip({ kind, value, className }: { kind: StatusKind; value: string; className?: string }) {
    const { tone, label } = statusTone(kind, value);
    return (
        <Badge tone={tone} className={className}>
            {label}
        </Badge>
    );
}
