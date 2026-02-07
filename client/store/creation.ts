import { create } from "zustand";

export type UploadedImage = {
    id: string;
    storagePath: string;
    previewUrl: string;
};

export type StyleConfig = {
    id: string;
    key: string;
    name: string;
    baseModel?: string | null;
    promptPrefix?: string | null;
    promptSuffix?: string | null;
};

export type GenerationState = {
    status: "idle" | "uploading" | "processing" | "completed" | "failed";
    progress?: number;
    resultUrl?: string | null;
    jobId?: string | null;
    error?: string | null;
};

type CreationStore = {
    step: number;
    inputImage: UploadedImage | null;
    selectedStyle: StyleConfig | null;
    prompt: string;
    generation: GenerationState;

    setStep: (step: number) => void;
    setInputImage: (image: UploadedImage | null) => void;
    setSelectedStyle: (style: StyleConfig | null) => void;
    setPrompt: (prompt: string) => void;
    setGeneration: (state: Partial<GenerationState>) => void;
    reset: () => void;
};

export const useCreationStore = create<CreationStore>((set) => ({
    step: 1,
    inputImage: null,
    selectedStyle: null,
    prompt: "",
    generation: { status: "idle" },

    setStep: (step) => set({ step }),
    setInputImage: (inputImage) => set({ inputImage }),
    setSelectedStyle: (selectedStyle) => set({ selectedStyle }),
    setPrompt: (prompt) => set({ prompt }),
    setGeneration: (update) =>
        set((state) => ({ generation: { ...state.generation, ...update } })),
    reset: () =>
        set({
            step: 1,
            inputImage: null,
            selectedStyle: null,
            prompt: "",
            generation: { status: "idle" }
        })
}));
