'use client'
import { useCvStore } from "@/stores/useCvStore";
import { ICvDto } from "@/types/interfaces/cv.interface";
import { useEffect, useRef } from "react";

export function CvsHydrator({ initialCvs }: { initialCvs: ICvDto[] }) {
    const setCvs = useCvStore(s => s.setCvs);

    const isHydrated = useRef(false);
    if (!isHydrated.current) {
        setCvs(initialCvs)
        isHydrated.current = true
    }

    useEffect(() => {
        setCvs(initialCvs);
    }, [initialCvs, setCvs]);

    return null;
}