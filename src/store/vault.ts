import { create } from 'zustand';
import { Project, Secret, ServiceToken } from '@shared/types';
import { deriveKey } from '@/lib/crypto';
interface VaultState {
  isUnlocked: boolean;
  masterKey: CryptoKey | null;
  projects: Project[];
  secrets: Secret[];
  tokens: ServiceToken[];
  // Actions
  unlock: (password: string) => Promise<void>;
  lock: () => void;
  setSecrets: (secrets: Secret[]) => void;
  addSecret: (secret: Secret) => void;
  removeSecret: (id: string) => void;
}
export const useVaultStore = create<VaultState>((set) => ({
  isUnlocked: false,
  masterKey: null,
  projects: [
    { id: 'p1', name: 'Acme Cloud', createdAt: Date.now() }
  ],
  secrets: [],
  tokens: [],
  unlock: async (password: string) => {
    // In a real app, we'd fetch a user-specific salt from the server first
    const salt = "vaultsync-default-salt-v1"; 
    const key = await deriveKey(password, salt);
    // Simulate initial secrets load (mock encrypted data)
    const mockSecrets: Secret[] = [
      {
        id: 's1',
        projectId: 'p1',
        key: 'DATABASE_URL',
        environment: 'prod',
        updatedAt: Date.now(),
        encryptedValue: {
          ciphertext: 'h6V8X/8Bsh7L4P0=', // Placeholder
          iv: 'YmFzZTY0aXY='
        }
      }
    ];
    set({ isUnlocked: true, masterKey: key, secrets: mockSecrets });
  },
  lock: () => set({ isUnlocked: false, masterKey: null, secrets: [], tokens: [] }),
  setSecrets: (secrets) => set({ secrets }),
  addSecret: (secret) => set((state) => ({ secrets: [secret, ...state.secrets] })),
  removeSecret: (id) => set((state) => ({ secrets: state.secrets.filter(s => s.id !== id) })),
}));