import { IndexedEntity } from "./core-utils";
import type { Project, Secret, SecretVersion, ServiceToken } from "@shared/types";
export class ProjectEntity extends IndexedEntity<Project> {
  static readonly entityName = "project";
  static readonly indexName = "projects";
  static readonly initialState: Project = { id: "", name: "", createdAt: 0 };
}
export class VersionEntity extends IndexedEntity<SecretVersion> {
  static readonly entityName = "secret-version";
  static readonly indexName = "secret-versions";
  static readonly initialState: SecretVersion = {
    id: "",
    secretId: "",
    encryptedValue: { ciphertext: "", iv: "" },
    createdAt: 0
  };
  static async listBySecret(env: any, secretId: string): Promise<SecretVersion[]> {
    const { items } = await this.list(env, null, 1000);
    return items
      .filter(v => v.secretId === secretId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }
}
export class SecretEntity extends IndexedEntity<Secret> {
  static readonly entityName = "secret";
  static readonly indexName = "secrets";
  static readonly initialState: Secret = {
    id: "",
    projectId: "",
    key: "",
    encryptedValue: { ciphertext: "", iv: "" },
    currentVersionId: "",
    environment: "dev",
    updatedAt: 0
  };
  static async listByProject(env: any, projectId: string): Promise<Secret[]> {
    const { items } = await this.list(env, null, 1000);
    return items.filter(s => s.projectId === projectId);
  }
  static async findExisting(env: any, projectId: string, environment: string, key: string): Promise<Secret | null> {
    const { items } = await this.list(env, null, 1000);
    return items.find(s => s.projectId === projectId && s.environment === environment && s.key === key) || null;
  }
}
export class TokenEntity extends IndexedEntity<ServiceToken> {
  static readonly entityName = "token";
  static readonly indexName = "tokens";
  static readonly initialState: ServiceToken = {
    id: "",
    projectId: "",
    name: "",
    tokenPrefix: "",
    tokenHash: "",
    encryptedProjectKey: { ciphertext: "", iv: "" },
    createdAt: 0
  };
  static async listByProject(env: any, projectId: string): Promise<ServiceToken[]> {
    const { items } = await this.list(env, null, 1000);
    return items.filter(t => t.projectId === projectId);
  }
  static async findByPrefix(env: any, prefix: string): Promise<ServiceToken | null> {
    const { items } = await this.list(env, null, 1000);
    return items.find(t => t.tokenPrefix === prefix) || null;
  }
}