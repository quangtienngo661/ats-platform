"use client"; // Hook useFormStatus bắt buộc chạy ở Client

import { useFormStatus } from "react-dom";
import { ArrowRight } from "lucide-react";
import { SFT } from "@/types/fonts/fonts";

export default function SubmitButton({ content }: { content: string }) {
    const { pending } = useFormStatus(); // Tự động biết form đang submit hay không

    return (
        <button
            type="submit"
            disabled={pending}
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#0071E3] hover:bg-[#0077ED] active:bg-[#006FD6] text-white rounded-xl text-[14px] transition-all shadow-sm shadow-[#0071E3]/20 disabled:opacity-60 mt-1"
            style={{ fontFamily: SFT, fontWeight: 500 }}
        >
            {pending ? (
                <div className="w-4 h-4 border-2 flex py-2 justify-between items-center border-white/10 border-t-white rounded-full animate-spin" />
            ) : (
                <>{content} <ArrowRight className="w-4 h-4" /></>
            )}
        </button>
    );
}