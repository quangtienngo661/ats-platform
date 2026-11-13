'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { FileText, FileUp, X } from 'lucide-react';
import { Button, Dialog, Field, Input } from '@/components/ui';
import { cn } from '@/components/ui/cn';
import { CvActionState, uploadCvAction } from '@/servers/cvs/cvs.action';
import { toast } from '@/lib/toast';
import { useCvStore } from '@/stores/useCvStore';

interface UploadCvModalProps {
    onClose: () => void;
}

const initialState: CvActionState = { success: false, message: '' };
const NOT_PDF_MESSAGE = 'Không tải được tệp. Chỉ nhận tệp PDF.';

function isPdf(file: File): boolean {
    return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function SubmitButton({ disabled }: { disabled: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={disabled} loading={pending}>
            Tải lên
        </Button>
    );
}

export function UploadCvModal({ onClose }: UploadCvModalProps) {
    const [state, formAction] = useActionState(uploadCvAction, initialState);
    const [file, setFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState('');
    const [dragging, setDragging] = useState(false);
    // dragenter/dragleave fire for every child crossed; count them instead of trusting a single leave.
    const dragDepth = useRef(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const addCv = useCvStore((store) => store.addCv);
    const handledCvId = useRef<string | null>(null);

    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (state.success) {
            if (state.data && handledCvId.current !== state.data.cvId) {
                handledCvId.current = state.data.cvId;
                addCv(state.data);
            }
            toast.success(state.message)
            onCloseRef.current();
        } else if (!state.success && state.message) {
            toast.error("Upload CV thất bại", state.message);
        }
    }, [state, addCv])

    const clearInput = () => {
        // Reset the file input so the same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const acceptFile = (selected: File | undefined) => {
        if (!selected) return;
        if (!isPdf(selected)) {
            setFile(null);
            setFileError(NOT_PDF_MESSAGE);
            clearInput();
            return;
        }
        setFileError('');
        setFile(selected);
    };

    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        acceptFile(event.target.files?.[0]);
    };

    // A file dropped anywhere else would make the browser open it and leave the page.
    useEffect(() => {
        const stop = (event: DragEvent) => event.preventDefault();
        window.addEventListener('dragover', stop);
        window.addEventListener('drop', stop);
        return () => {
            window.removeEventListener('dragover', stop);
            window.removeEventListener('drop', stop);
        };
    }, []);

    const handleDragEnter = (event: React.DragEvent<HTMLElement>) => {
        event.preventDefault();
        dragDepth.current += 1;
        setDragging(true);
    };

    const handleDragLeave = () => {
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setDragging(false);
    };

    const handleDrop = (event: React.DragEvent<HTMLElement>) => {
        event.preventDefault();
        dragDepth.current = 0;
        setDragging(false);
        const dropped = event.dataTransfer.files?.[0];
        if (!dropped) return;
        // The form posts the input's own files, so hand the dropped file to it.
        try {
            if (fileInputRef.current) fileInputRef.current.files = event.dataTransfer.files;
        } catch {
            /* acceptFile still validates; the picker remains the fallback */
        }
        acceptFile(dropped);
    };

    const handleRemoveFile = () => {
        setFile(null);
        setFileError('');
        clearInput();
    };

    const defaultFileName = file ? file.name.replace(/\.pdf$/i, '') : '';
    const errorMessage = fileError || (!state.success ? state.message : '');

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }} title="Tải CV lên">
            <form
                action={formAction}
                className="flex flex-col gap-4"
                onDragEnter={handleDragEnter}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    name="file"
                    accept=".pdf"
                    id="cv-upload-input"
                    aria-label="Chọn tệp CV"
                    onChange={handleFileSelected}
                    className="sr-only"
                />

                {file === null ? (
                    <div
                        className={cn(
                            'flex flex-col items-center rounded-card border-2 border-dashed px-4 py-8 text-center',
                            'transition duration-hover ease-out-expo',
                            dragging ? 'border-accent bg-accent-soft/40' : 'border-line-strong',
                        )}
                    >
                        <FileUp size={24} strokeWidth={1.75} aria-hidden="true" className="text-ink-3" />
                        <p className="mt-3 text-body-sm font-medium text-ink">Kéo thả tệp PDF vào đây</p>
                        <p className="mt-1 text-caption text-ink-3">PDF, tối đa 5 MB</p>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="mt-4"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Chọn tệp
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 rounded-card bg-surface-2 p-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-card bg-surface text-ink-2">
                                <FileText size={20} strokeWidth={1.75} aria-hidden="true" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-body-sm font-medium text-ink" title={file.name}>
                                    {file.name}
                                </p>
                                <p className="text-caption tabular-nums text-ink-3">{formatFileSize(file.size)}</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleRemoveFile}
                                aria-label="Bỏ tệp đã chọn"
                                className="flex size-8 shrink-0 items-center justify-center rounded-ctl text-ink-3 transition duration-press ease-out-expo hover:bg-ink/5 hover:text-ink active:scale-[.97]"
                            >
                                <X size={16} strokeWidth={1.75} aria-hidden="true" />
                            </button>
                        </div>
                        <Field label="Tên CV" required>
                            {(control) => (
                                <Input
                                    {...control}
                                    key={file.name}
                                    type="text"
                                    name="fileName"
                                    defaultValue={defaultFileName}
                                    placeholder="Nhập tên CV"
                                    minLength={3}
                                />
                            )}
                        </Field>
                    </>
                )}

                {errorMessage && (
                    <p role="alert" className="rounded-ctl bg-danger-soft px-3 py-2 text-body-sm text-danger">
                        {errorMessage}
                    </p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={onClose}>
                        Hủy
                    </Button>
                    <SubmitButton disabled={file === null} />
                </div>
            </form>
        </Dialog>
    );
}
