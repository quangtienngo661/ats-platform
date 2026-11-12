'use client'

import { Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { SF } from "@/types/fonts/fonts";
import Link from "next/link";

export default function Logo() {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-8"
        >
            <Link href="/" className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-[11px] bg-[#0071E3] flex items-center justify-center shadow-lg shadow-[#0071E3]/20">
                    <Sparkles className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="text-[19px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 600 }}>TalentAI</span>
            </Link>
        </motion.div>
    );
}