import { ICvDto } from "@/types/interfaces/cv.interface";
import { ICvParsedData } from "@ats-platform/types";
import { create } from "zustand";

interface CvState {
    cvs: ICvDto[];
    cv: ICvDto;
    cvId: string;

    setCvs: (cvs: ICvDto[]) => void;
    updateCv: (cvId: string, updatedCv: ICvDto) => void;
}

export const useCvStore = create<CvState>((set, get) => ({
    cvs: [],
    cv: {} as ICvDto,
    cvId: "",

    setCvs: (cvs: ICvDto[]) => {
        set({ cvs });
    },

    updateCv: (cvId: string, updatedCv: ICvDto) => {
        const { cvs } = get();
        console.log(updatedCv)
        // console.log(cvs)
        const newCvs = cvs.map((cv) =>
            cv.cvId === cvId ? { ...updatedCv } : cv
        );
        set({ cvs: newCvs });
    }
}));