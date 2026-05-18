import { ICvDto } from "@/types/interfaces/cv.interface";
import { create } from "zustand";

interface CvState {
    cvs: ICvDto[];
    cv: ICvDto;
    cvId: string;

    setCvs: (cvs: ICvDto[]) => void;
    addCv: (cv: ICvDto) => void;
    updateCv: (cvId: string, updatedCv: ICvDto) => void;
    removeCv: (cvId: string) => void;
}

export const useCvStore = create<CvState>((set, get) => ({
    cvs: [],
    cv: {} as ICvDto,
    cvId: "",

    setCvs: (cvs: ICvDto[]) => {
        set({ cvs });
    },

    addCv: (cv: ICvDto) => {
        const { cvs } = get();
        const exists = cvs.some((item) => item.cvId === cv.cvId);
        if (exists) {
            set({
                cvs: cvs.map((item) => item.cvId === cv.cvId ? { ...item, ...cv } : item),
            });
            return;
        }

        set({ cvs: [cv, ...cvs] });
    },

    updateCv: (cvId: string, updatedCv: ICvDto) => {
        const { cvs } = get();
        const exists = cvs.some((cv) => cv.cvId === cvId);
        const newCvs = exists
            ? cvs.map((cv) => cv.cvId === cvId ? { ...cv, ...updatedCv } : cv)
            : [updatedCv, ...cvs];
        set({ cvs: newCvs });
    },

    removeCv: (cvId: string) => {
        const { cvs } = get();
        set({ cvs: cvs.filter((cv) => cv.cvId !== cvId) });
    },
}));
