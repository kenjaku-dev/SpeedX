import { create } from 'zustand';
import { TestStage, TestMetrics } from '@/workers/speedTestWorker';

interface AppState {
  metrics: TestMetrics;
  serverInfo: {
    ip: string;
    isp: string;
    city: string;
    country: string;
    server: string;
  } | null;
  setMetrics: (metrics: Partial<TestMetrics>) => void;
  setStage: (stage: TestStage) => void;
  setServerInfo: (info: any) => void;
  reset: () => void;
}

const defaultMetrics: TestMetrics = {
  ping: 0,
  jitter: 0,
  download: 0,
  upload: 0,
  progress: 0,
  stage: 'idle'
};

export const useAppStore = create<AppState>((set) => ({
  metrics: { ...defaultMetrics },
  serverInfo: null,
  setMetrics: (newMetrics) => set((state) => ({ metrics: { ...state.metrics, ...newMetrics } })),
  setStage: (stage) => set((state) => ({ metrics: { ...state.metrics, stage } })),
  setServerInfo: (info) => set({ serverInfo: info }),
  reset: () => set({ metrics: { ...defaultMetrics } })
}));
