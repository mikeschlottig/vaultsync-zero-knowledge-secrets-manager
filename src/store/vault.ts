import { create } from 'zustand';
import { Project, Secret, ServiceToken } from '@shared/types';
import { deriveKey } from '@/lib/crypto';
import { api } from '@/lib/api-client';
interface VaultState {
  isUnlocked: boolean;
  masterKey: CryptoKey | null;
  projects: Project[];
  activeProjectId: string | null;
  secrets: Secret[];
  tokens: ServiceToken[];
  isLoading: boolean;
  unlock: (password: string) => Promise<void>;
  lock: () => void;
  setActiveProjectId: (id: string | null) => void;
  fetchData: () => Promise<void>;
  addProject: (name: string) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  addSecret: (secret: Omit<Secret, 'id' | 'updatedAt'>) => Promise<void>;
  removeSecret: (id: string) => Promise<void>;
  createToken: (token: Omit<ServiceToken, 'id' | 'createdAt'>) => Promise<void>;
  revokeToken: (id: string) => Promise<void>;
}
export const useVaultStore = create<VaultState>((set, get) => ({
  isUnlocked: false,
  masterKey: null,
  projects: [],
  activeProjectId: null,
  secrets: [],
  tokens: [],
  isLoading: false,
  unlock: async (password: string) => {
    set({ isLoading: true });
    try {
      const salt = "vaultsync-v1-static-salt";
      const key = await deriveKey(password, salt);
      set({ masterKey: key, isUnlocked: true });
      // Initial fetch to check projects
      let projects = await api<Project[]>('/api/projects');
      if (projects.length === 0) {
        // Create Default Project for new users
        await api<Project>('/api/projects', {
          method: 'POST',
          body: JSON.stringify({ name: 'Default Project' })
        });
        projects = await api<Project[]>('/api/projects');
      }
      const firstId = projects[0]?.id || null;
      set({ projects, activeProjectId: firstId });
      if (firstId) {
        await get().fetchData();
      }
    } finally {
      set({ isLoading: false });
    }
  },
  lock: () => set({ 
    isUnlocked: false, 
    masterKey: null, 
    secrets: [], 
    tokens: [], 
    projects: [], 
    activeProjectId: null 
  }),
  setActiveProjectId: (id) => {
    set({ activeProjectId: id });
    get().fetchData();
  },
  fetchData: async () => {
    const activeId = get().activeProjectId;
    if (!activeId) return;
    set({ isLoading: true });
    try {
      const [secrets, tokens] = await Promise.all([
        api<Secret[]>(`/api/secrets?projectId=${activeId}`),
        api<ServiceToken[]>(`/api/tokens?projectId=${activeId}`)
      ]);
      set({ secrets, tokens });
    } catch (e) {
      console.error("Failed to fetch vault data", e);
    } finally {
      set({ isLoading: false });
    }
  },
  addProject: async (name: string) => {
    const newProject = await api<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
    set(state => ({ 
      projects: [...state.projects, newProject],
      activeProjectId: state.activeProjectId ?? newProject.id
    }));
    if (get().activeProjectId === newProject.id) {
        await get().fetchData();
    }
  },
  removeProject: async (id: string) => {
    await api(`/api/projects/${id}`, { method: 'DELETE' });
    const currentActive = get().activeProjectId;
    const remaining = get().projects.filter(p => p.id !== id);
    let nextActive = currentActive;
    if (currentActive === id) {
      nextActive = remaining.length > 0 ? remaining[0].id : null;
    }
    set({ projects: remaining, activeProjectId: nextActive });
    if (nextActive) {
      await get().fetchData();
    } else {
      set({ secrets: [], tokens: [] });
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