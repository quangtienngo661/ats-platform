'use client';

import { Button, Dialog } from '@/components/ui';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    isConfirming?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * Asks before an action that cannot be undone. Every caller today confirms a destructive action
 * (delete a topic, abandon a session), so the confirm button is always `danger`.
 * While `isConfirming`, both buttons are disabled and Esc / outside click do not close it.
 */
export function ConfirmModal({
    isOpen,
    title,
    description,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    isConfirming = false,
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open && !isConfirming) onCancel();
            }}
            title={title}
            description={description}
            size="sm"
            footer={
                <>
                    <Button variant="secondary" onClick={onCancel} disabled={isConfirming}>
                        {cancelText}
                    </Button>
                    <Button variant="danger" onClick={onConfirm} loading={isConfirming}>
                        {confirmText}
                    </Button>
                </>
            }
        >
            {null}
        </Dialog>
    );
}
