import { create } from 'zustand';
import { TestStage, TestMetrics } from '@/workers/speedTestWorker';

interface AppState {
  metrics: TestMetrics;
  resultId: string | null;
  serverInfo: {
    ip: string;
    isp: string;
    city: string;
    country: string;
    server: string;
  } | null;
  setMetrics: (metrics: Partial<TestMetrics>) => void;
  setStage: (stage: TestStage) => void;
  setResultId: (id: string | null) => void;
  setServerInfo: (info: any) => void;
  reset: () => void;
}

const defaultMetrics: TestMetrics = {
  ping: 0,
  jitter: 0,
  packetLoss: 0,
  download: 0,
  upload: 0,
  progress: 0,
  stage: 'idle'
};

export const useAppStore = create<AppState>((set) => ({
  metrics: { ...defaultMetrics },
  resultId: null,
  serverInfo: null,
  setMetrics: (newMetrics) => set((state) => ({ metrics: { ...state.metrics, ...newMetrics } })),
  setStage: (stage) => set((state) => ({ metrics: { ...state.metrics, stage } })),
  setResultId: (id) => set({ resultId: id }),
  setServerInfo: (info) => set({ serverInfo: info }),
  reset: () => set({ metrics: { ...defaultMetrics }, resultId: null })
}));
