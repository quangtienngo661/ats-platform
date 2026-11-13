'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import {
    ApplicationActionState,
    withdrawApplicationFormAction,
} from '@/servers/applications/applications.action';
import { Button, Dialog } from '@/components/ui';
import { toast } from '@/lib/toast';

interface WithdrawApplicationFormProps {
    applicationId: string;
    onSuccess: (applicationId: string) => void;
}

const initialState: ApplicationActionState = {
    success: false,
    message: '',
};

/** "Rút đơn" asks for confirmation in a dialog before it calls the withdraw action. */
export function WithdrawApplicationForm({
    applicationId,
    onSuccess,
}: WithdrawApplicationFormProps) {
    const [open, setOpen] = useState(false);
    const [state, formAction, isPending] = useActionState(withdrawApplicationFormAction, initialState);
    const handledMessage = useRef<string>('');
    const formId = `withdraw-${applicationId}`;

    useEffect(() => {
        if (!state.message || handledMessage.current === state.message) return;
        handledMessage.current = state.message;

        if (state.success) {
            onSuccess(applicationId);
            toast.success('Đơn ứng tuyển', state.message);
        } else {
            toast.error('Đơn ứng tuyển', state.message);
        }
        setOpen(false);
    }, [state, applicationId, onSuccess]);

    return (
        <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
                Rút đơn
            </Button>
            <Dialog
                open={open}
                onOpenChange={(next) => {
                    if (!isPending) setOpen(next);
                }}
                title="Rút đơn ứng tuyển?"
                description="Đơn sẽ chuyển sang Đã rút. Bạn có thể ứng tuyển lại vào tin này sau."
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
                            Giữ đơn
                        </Button>
                        <Button type="submit" form={formId} variant="danger" loading={isPending}>
                            Rút đơn
                        </Button>
                    </>
                }
            >
                <form id={formId} action={formAction}>
                    <input type="hidden" name="applicationId" value={applicationId} />
                </form>
            </Dialog>
        </>
    );
}
