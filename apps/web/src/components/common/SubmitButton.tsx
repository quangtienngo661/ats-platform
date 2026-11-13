"use client"; // Hook useFormStatus bắt buộc chạy ở Client

import { useFormStatus } from "react-dom";
import { ArrowRight } from "lucide-react";

type SubmitButtonProps = {
    content: string;
}

export default function SubmitButton({ content }: SubmitButtonProps) {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-card bg-accent py-3 font-sans text-body-sm font-medium text-surface transition hover:bg-accent/90 active:bg-accent/80 disabled:opacity-60"
        >
            {pending ? (
                <div className="w-4 h-4 flex items-center justify-between border-2 border-surface/10 border-t-surface rounded-full animate-spin" />
            ) : (
                <>{content} <ArrowRight className="w-4 h-4" /></>
            )}
        </button>
    );
}