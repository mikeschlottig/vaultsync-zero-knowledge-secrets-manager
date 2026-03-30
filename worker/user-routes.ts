import { Hono } from "hono";
import type { Env } from './core-utils';
import { ProjectEntity, SecretEntity, TokenEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
async function hashToken(tokenKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(tokenKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // PUBLIC INJECTION API (Zero-Knowledge)
  app.get('/api/v1/fetch', async (c) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return bad(c, 'Missing or invalid Authorization header');
    }
    const fullToken = authHeader.split(' ')[1];
    if (!fullToken.startsWith('vs_live_')) {
      return bad(c, 'Invalid token format');
    }
    // Prefix is vs_live_ + first 3 chars of entropy (total 11)
    const prefix = fullToken.slice(0, 11);
    const tokenKeyRaw = fullToken.slice(11); // The secret part
    const token = await TokenEntity.findByPrefix(c.env, prefix);
    if (!token) {
      return notFound(c, 'Token not found or revoked');
    }
    // Secure Hash Validation
    const providedHash = await hashToken(tokenKeyRaw);
    if (providedHash !== token.tokenHash) {
      return c.json({ success: false, error: 'Unauthorized: Invalid token key' }, 401);
    }
    if (token.expiresAt && Date.now() > token.expiresAt) {
      return bad(c, 'Token expired');
    }
    const secrets = await SecretEntity.listByProject(c.env, token.projectId);
    const envFilter = c.req.query('env');
    const filteredSecrets = envFilter
      ? secrets.filter(s => s.environment === envFilter)
      : secrets;
    return ok(c, {
      projectId: token.projectId,
      encryptedProjectKey: token.encryptedProjectKey,
      secrets: filteredSecrets.map(s => ({
        key: s.key,
        environment: s.environment,
        encryptedValue: s.encryptedValue
      }))
    });
  });
  // PROJECTS
  app.get('/api/projects', async (c) => {
    const page = await ProjectEntity.list(c.env);
    return ok(c, page.items);
  });
  app.post('/api/projects', async (c) => {
    const body = await c.req.json();
    if (!body.name) return bad(c, 'name required');
    const project = await ProjectEntity.create(c.env, {
      id: crypto.randomUUID(),
      name: body.name,
      createdAt: Date.now()
    });
    return ok(c, project);
  });
  app.delete('/api/projects/:id', async (c) => {
    const projectId = c.req.param('id');
    const secrets = await SecretEntity.listByProject(c.env, projectId);
    if (secrets.length > 0) {
      await SecretEntity.deleteMany(c.env, secrets.map(s => s.id));
    }
    const tokens = await TokenEntity.listByProject(c.env, projectId);
    if (tokens.length > 0) {
      await TokenEntity.deleteMany(c.env, tokens.map(t => t.id));
    }
    const deleted = await ProjectEntity.delete(c.env, projectId);
    return ok(c, { deleted });
  });
  // SECRETS
  app.get('/api/secrets', async (c) => {
    const projectId = c.req.query('projectId');
    if (!projectId) return bad(c, 'projectId required');
    const secrets = await SecretEntity.listByProject(c.env, projectId);
    return ok(c, secrets);
  });
  app.post('/api/secrets', async (c) => {
    const body = await c.req.json();
    const secret = await SecretEntity.create(c.env, {
      ...body,
      id: crypto.randomUUID(),
      updatedAt: Date.now()
    });
    return ok(c, secret);
  });
  app.delete('/api/secrets/:id', async (c) => {
    const deleted = await SecretEntity.delete(c.env, c.req.param('id'));
    return ok(c, { deleted });
  });
  // TOKENS
  app.get('/api/tokens', async (c) => {
    const projectId = c.req.query('projectId');
    if (projectId) {
      const tokens = await TokenEntity.listByProject(c.env, projectId);
      return ok(c, tokens);
    }
    const page = await TokenEntity.list(c.env);
    return ok(c, page.items);
  });
  app.post('/api/tokens', async (c) => {
    const body = await c.req.json();
    const token = await TokenEntity.create(c.env, {
      ...body,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    });
    return ok(c, token);
  });
  app.delete('/api/tokens/:id', async (c) => {
    const deleted = await TokenEntity.delete(c.env, c.req.param('id'));
    return ok(c, { deleted });
  });
}