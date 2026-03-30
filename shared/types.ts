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
export interface Secret {
  id: string;
  projectId: string;
  key: string;
  encryptedValue: EncryptedPayload;
  environment: Environment;
  updatedAt: number;
}
export interface ServiceToken {
  id: string;
  projectId: string;
  name: string;
  tokenPrefix: string; // First 8 chars for identification
  encryptedProjectKey: EncryptedPayload; // Project Key encrypted by the Token Key
  createdAt: number;
  expiresAt?: number;
}
export interface InjectionRequest {
  projectId: string;
  tokenKey: string; // The high-entropy part of the service token
}
export interface InjectionResponse {
  secrets: Record<string, string>;
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