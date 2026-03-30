import { IndexedEntity } from "./core-utils";
import type { Project, Secret, ServiceToken } from "@shared/types";
export class ProjectEntity extends IndexedEntity<Project> {
  static readonly entityName = "project";
  static readonly indexName = "projects";
  static readonly initialState: Project = { id: "", name: "", createdAt: 0 };
}
export class SecretEntity extends IndexedEntity<Secret> {
  static readonly entityName = "secret";
  static readonly indexName = "secrets";
  static readonly initialState: Secret = {
    id: "",
    projectId: "",
    key: "",
    encryptedValue: { ciphertext: "", iv: "" },
    environment: "dev",
    updatedAt: 0
  };
  static async listByProject(env: any, projectId: string): Promise<Secret[]> {
    const { items } = await this.list(env, null, 1000);
    return items.filter(s => s.projectId === projectId);
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
    encryptedProjectKey: { ciphertext: "", iv: "" },
    createdAt: 0
  };
  static async findByPrefix(env: any, prefix: string): Promise<ServiceToken | null> {
    const { items } = await this.list(env, null, 1000);
    return items.find(t => t.tokenPrefix === prefix) || null;
  }
}