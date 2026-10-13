import { IParsedJobPostingDto } from "@/types/interfaces/job-posting.interface";
import { create } from "zustand";

interface JobPostingState {
    parsedData: IParsedJobPostingDto | null;
    setParsedData: (parsedData: IParsedJobPostingDto | null) => void;
}

export const useJobPostingStore = create<JobPostingState>((set, get) => ({
    parsedData: null,
    setParsedData: (parsedData: IParsedJobPostingDto | null) => set({ parsedData })
}))