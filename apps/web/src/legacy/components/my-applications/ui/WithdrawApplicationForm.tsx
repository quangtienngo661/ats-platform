'use client';

import { useActionState, useEffect, useRef } from 'react';
import { XCircle } from 'lucide-react';
import {
    ApplicationActionState,
    withdrawApplicationFormAction,
} from '@/servers/applications/applications.action';
import { toast } from '@/lib/toast';

interface WithdrawApplicationFormProps {
    applicationId: string;
    onSuccess: (applicationId: string) => void;
}

const initialState: ApplicationActionState = {
    success: false,
    message: '',
};

export function WithdrawApplicationForm({
    applicationId,
    onSuccess,
}: WithdrawApplicationFormProps) {
    const [state, formAction, isPending] = useActionState(withdrawApplicationFormAction, initialState);
    const handledMessage = useRef<string>('');

    useEffect(() => {
        if (!state.message || handledMessage.current === state.message) return;
        handledMessage.current = state.message;

        if (state.success) {
            onSuccess(applicationId);
            toast.success('Đơn ứng tuyển', state.message);
        } else {
            toast.error('Đơn ứng tuyển', state.message);
        }
    }, [state, applicationId, onSuccess]);

    return (
        <form action={formAction}>
            <input type="hidden" name="applicationId" value={applicationId} />
            <button
                type="submit"
                disabled={isPending}
                className="p-2 rounded-lg text-[#FF3B30] hover:bg-[#FFE5E5] transition-colors opacity-0 group-hover:opacity-100 w-full h-full flex items-center justify-center disabled:opacity-50"
                title="Rút đơn"
            >
                {isPending ? (
                    <span className="w-4 h-4 border-2 border-[#FF3B30]/30 border-t-[#FF3B30] rounded-full animate-spin" />
                ) : (
                    <XCircle className="w-4 h-4" />
                )}
            </button>
        </form>
    );
}
