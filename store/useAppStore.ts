// store/useAppStore.ts
"use client";
import { create } from "zustand";
import type { Student, SchoolStats, StreamKey } from "@/types";

interface AppState {
  // Parsed data
  students:    Student[];
  school_name: string;
  stats:       SchoolStats | null;
  warnings:    string[];

  // UI state
  loading:     boolean;
  loadingMsg:  string;

  // Actions
  setParseResult: (students: Student[], school: string, stats: SchoolStats, warnings: string[]) => void;
  updateStudent:  (idx: number, patch: Partial<Student>) => void;
  setLoading:     (val: boolean, msg?: string) => void;
  reset:          () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  students:    [],
  school_name: "",
  stats:       null,
  warnings:    [],
  loading:     false,
  loadingMsg:  "",

  setParseResult: (students, school_name, stats, warnings) =>
    set({ students, school_name, stats, warnings }),

  updateStudent: (idx, patch) => {
    const students = [...get().students];
    students[idx]  = { ...students[idx], ...patch };
    set({ students });
  },

  setLoading: (loading, loadingMsg = "") => set({ loading, loadingMsg }),

  reset: () => set({ students:[], school_name:"", stats:null, warnings:[], loading:false }),
}));
