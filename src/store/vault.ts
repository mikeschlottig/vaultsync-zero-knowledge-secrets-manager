import { create } from 'zustand';
import { Project, Secret, ServiceToken, EncryptedPayload } from '@shared/types';
import { deriveKey } from '@/lib/crypto';
import { api } from '@/lib/api-client';
interface VaultState {
  isUnlocked: boolean;
  masterKey: CryptoKey | null;
  projects: Project[];
  secrets: Secret[];
  tokens: ServiceToken[];
  isLoading: boolean;
  unlock: (password: string) => Promise<void>;
  lock: () => void;
  fetchData: () => Promise<void>;
  addSecret: (secret: Omit<Secret, 'id' | 'updatedAt'>) => Promise<void>;
  removeSecret: (id: string) => Promise<void>;
  createToken: (token: Omit<ServiceToken, 'id' | 'createdAt'>) => Promise<void>;
  revokeToken: (id: string) => Promise<void>;
}
export const useVaultStore = create<VaultState>((set, get) => ({
  isUnlocked: false,
  masterKey: null,
  projects: [],
  secrets: [],
  tokens: [],
  isLoading: false,
  unlock: async (password: string) => {
    set({ isLoading: true });
    try {
      const salt = "vaultsync-v1-static-salt"; 
      const key = await deriveKey(password, salt);
      set({ masterKey: key, isUnlocked: true });
      await get().fetchData();
    } finally {
      set({ isLoading: false });
    }
  },
  lock: () => set({ isUnlocked: false, masterKey: null, secrets: [], tokens: [], projects: [] }),
  fetchData: async () => {
    try {
      const [projects, secrets, tokens] = await Promise.all([
        api<Project[]>('/api/projects'),
        api<Secret[]>('/api/secrets?projectId=all'), // Heuristic for demo
        api<ServiceToken[]>('/api/tokens')
      ]);
      set({ projects, secrets, tokens });
    } catch (e) {
      console.error("Failed to fetch vault data", e);
    }
  },
  addSecret: async (secretData) => {
    const newSecret = await api<Secret>('/api/secrets', {
      method: 'POST',
      body: JSON.stringify(secretData)
    });
    set(state => ({ secrets: [newSecret, ...state.secrets] }));
  },
  removeSecret: async (id) => {
    await api(`/api/secrets/${id}`, { method: 'DELETE' });
    set(state => ({ secrets: state.secrets.filter(s => s.id !== id) }));
  },
  createToken: async (tokenData) => {
    const newToken = await api<ServiceToken>('/api/tokens', {
      method: 'POST',
      body: JSON.stringify(tokenData)
    });
    set(state => ({ tokens: [newToken, ...state.tokens] }));
  },
  revokeToken: async (id) => {
    await api(`/api/tokens/${id}`, { method: 'DELETE' });
    set(state => ({ tokens: state.tokens.filter(t => t.id !== id) }));
  },
}));