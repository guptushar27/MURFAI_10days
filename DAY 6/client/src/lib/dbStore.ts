import { create } from 'zustand';
import type { FraudCase } from '@shared/schema';

interface DBState {
  cases: Record<string, FraudCase>;
  isLoading: boolean;
  fetchCases: () => Promise<void>;
  updateCaseStatus: (id: string, status: FraudCase['status']) => Promise<void>;
}

export const useDBStore = create<DBState>((set, get) => ({
  cases: {},
  isLoading: false,

  fetchCases: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/fraud-cases');
      if (!response.ok) throw new Error('Failed to fetch fraud cases');
      
      const casesArray: FraudCase[] = await response.json();
      const casesMap = casesArray.reduce((acc, fraudCase) => {
        acc[fraudCase.userName] = fraudCase;
        return acc;
      }, {} as Record<string, FraudCase>);
      
      set({ cases: casesMap, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch fraud cases:', error);
      set({ isLoading: false });
    }
  },

  updateCaseStatus: async (id: string, status: FraudCase['status']) => {
    try {
      const response = await fetch(`/api/fraud-cases/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) throw new Error('Failed to update case status');
      
      const updatedCase: FraudCase = await response.json();
      
      set((state) => ({
        cases: {
          ...state.cases,
          [updatedCase.userName]: updatedCase
        }
      }));

      console.log(`[DB API] Updated case ${id} to ${status}`);
    } catch (error) {
      console.error('Failed to update fraud case:', error);
    }
  }
}));

export type { FraudCase };
