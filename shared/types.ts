export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export type Environment = 'dev' | 'staging' | 'prod' | 'all';
export interface EncryptedPayload {
  ciphertext: string; // Base64
  iv: string;         // Base64
}
export interface Project {
  id: string;
  name: string;
  createdAt: number;
}
export interface SecretVersion {
  id: string;
  secretId: string;
  encryptedValue: EncryptedPayload;
  createdAt: number;
  note?: string;
}
export interface Secret {
  id: string;
  projectId: string;
  key: string;
  encryptedValue: EncryptedPayload; // Denormalized latest value
  currentVersionId: string;
  environment: Environment;
  updatedAt: number;
}
export interface ServiceToken {
  id: string;
  projectId: string;
  name: string;
  tokenPrefix: string;
  tokenHash: string;
  encryptedProjectKey: EncryptedPayload;
  createdAt: number;
  expiresAt?: number;
}
export interface InjectionRequest {
  projectId: string;
  tokenKey: string;
}
export interface InjectionResponse {
  projectId: string;
  encryptedProjectKey: EncryptedPayload;
  secrets: {
    key: string;
    environment: Environment;
    encryptedValue: EncryptedPayload;
  }[];
}
export interface User {
  id: string;
  name: string;
}
export interface Chat {
  id: string;
  title: string;
}
export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  ts: number;
}