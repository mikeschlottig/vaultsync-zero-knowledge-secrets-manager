import { create } from 'zustand';
import { Project, Secret, SecretVersion, ServiceToken } from '@shared/types';
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
  addSecret: (secret: Omit<Secret, 'id' | 'updatedAt' | 'currentVersionId'> & { note?: string }) => Promise<void>;
  removeSecret: (id: string) => Promise<void>;
  fetchSecretVersions: (id: string) => Promise<SecretVersion[]>;
  rollbackSecret: (secretId: string, versionId: string) => Promise<void>;
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
      let projects = await api<Project[]>('/api/projects');
      if (projects.length === 0) {
        await api<Project>('/api/projects', {
          method: 'POST',
          body: JSON.stringify({ name: 'Default Project' })
        });
        projects = await api<Project[]>('/api/projects');
      }
      const firstId = projects[0]?.id || null;
      set({ projects, activeProjectId: firstId });
      if (firstId) await get().fetchData();
    } finally {
      set({ isLoading: false });
    }
  },
  lock: () => set({ isUnlocked: false, masterKey: null, secrets: [], tokens: [], projects: [], activeProjectId: null }),
  setActiveProjectId: (id) => {
    if (get().activeProjectId === id) return;
    set({ activeProjectId: id });
    get().fetchData();
  },
  fetchData: async () => {
    const activeId = get().activeProjectId;
    if (!activeId || get().isLoading) return;
    set({ isLoading: true });
    try {
      const [secrets, tokens] = await Promise.all([
        api<Secret[]>(`/api/secrets?projectId=${activeId}`),
        api<ServiceToken[]>(`/api/tokens?projectId=${activeId}`)
      ]);
      set({ secrets, tokens });
    } finally {
      set({ isLoading: false });
    }
  },
  addProject: async (name: string) => {
    const newProject = await api<Project>('/api/projects', { method: 'POST', body: JSON.stringify({ name }) });
    set(state => ({ projects: [...state.projects, newProject] }));
    if (!get().activeProjectId) get().setActiveProjectId(newProject.id);
  },
  removeProject: async (id: string) => {
    await api(`/api/projects/${id}`, { method: 'DELETE' });
    const currentActive = get().activeProjectId;
    const remaining = get().projects.filter(p => p.id !== id);
    let nextActive = currentActive === id ? (remaining[0]?.id || null) : currentActive;
    set({ projects: remaining, activeProjectId: nextActive });
    if (nextActive) await get().fetchData();
    else set({ secrets: [], tokens: [] });
  },
  addSecret: async (secretData) => {
    const updatedSecret = await api<Secret>('/api/secrets', { method: 'POST', body: JSON.stringify(secretData) });
    set(state => {
      const idx = state.secrets.findIndex(s => s.id === updatedSecret.id);
      if (idx !== -1) {
        const next = [...state.secrets];
        next[idx] = updatedSecret;
        return { secrets: next };
      }
      return { secrets: [updatedSecret, ...state.secrets] };
    });
  },
  removeSecret: async (id) => {
    await api(`/api/secrets/${id}`, { method: 'DELETE' });
    set(state => ({ secrets: state.secrets.filter(s => s.id !== id) }));
  },
  fetchSecretVersions: async (id: string) => {
    return api<SecretVersion[]>(`/api/secrets/${id}/versions`);
  },
  rollbackSecret: async (secretId: string, versionId: string) => {
    const updated = await api<Secret>(`/api/secrets/${secretId}/rollback`, {
      method: 'POST',
      body: JSON.stringify({ versionId })
    });
    set(state => ({
      secrets: state.secrets.map(s => s.id === secretId ? updated : s)
    }));
  },
  createToken: async (tokenData) => {
    const newToken = await api<ServiceToken>('/api/tokens', { method: 'POST', body: JSON.stringify(tokenData) });
    set(state => ({ tokens: [newToken, ...state.tokens] }));
  },
  revokeToken: async (id) => {
    await api(`/api/tokens/${id}`, { method: 'DELETE' });
    set(state => ({ tokens: state.tokens.filter(t => t.id !== id) }));
  },
}));