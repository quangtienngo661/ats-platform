'use client'

import { Sparkles } from "lucide-react";
import { motion } from "motion/react";
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
                <div className="flex size-9 items-center justify-center rounded-card bg-accent shadow-e3">
                    <Sparkles className="size-4 text-surface" />
                </div>
                <span className="font-sans text-title-sm text-ink">TalentAI</span>
            </Link>
        </motion.div>
    );
}