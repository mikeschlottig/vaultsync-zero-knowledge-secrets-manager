import { Hono } from "hono";
import type { Env } from './core-utils';
import { ProjectEntity, SecretEntity, TokenEntity, VersionEntity } from "./entities";
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
    const prefix = fullToken.slice(0, 11);
    const tokenKeyRaw = fullToken.slice(11);
    const token = await TokenEntity.findByPrefix(c.env, prefix);
    if (!token) return notFound(c, 'Token not found or revoked');
    const providedHash = await hashToken(tokenKeyRaw);
    if (providedHash !== token.tokenHash) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    let secrets = await SecretEntity.listByProject(c.env, token.projectId);
    const pathParam = c.req.query('path');
    if (pathParam) {
      const cleanPath = pathParam.startsWith('/') ? pathParam.slice(1) : pathParam;
      const parts = cleanPath.split('/');
      if (parts.length === 2) {
        const [env, key] = parts;
        secrets = secrets.filter(s => s.environment === env && s.key === key);
      }
    } else {
      const envFilter = c.req.query('env');
      if (envFilter) secrets = secrets.filter(s => s.environment === envFilter);
    }
    return ok(c, {
      projectId: token.projectId,
      encryptedProjectKey: token.encryptedProjectKey,
      secrets: secrets.map(s => ({
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
    const deleted = await ProjectEntity.delete(c.env, projectId);
    return ok(c, { deleted });
  });
  // SECRETS (Upsert Logic)
  app.get('/api/secrets', async (c) => {
    const projectId = c.req.query('projectId');
    if (!projectId) return bad(c, 'projectId required');
    const secrets = await SecretEntity.listByProject(c.env, projectId);
    return ok(c, secrets);
  });
  app.post('/api/secrets', async (c) => {
    const body = await c.req.json();
    const { projectId, key, environment, encryptedValue, note } = body;
    // Find existing secret to handle versioning
    let existing = await SecretEntity.findExisting(c.env, projectId, environment, key);
    let secretId = existing ? existing.id : crypto.randomUUID();
    const versionId = crypto.randomUUID();
    await VersionEntity.create(c.env, {
      id: versionId,
      secretId,
      encryptedValue,
      createdAt: Date.now(),
      note: note || (existing ? 'Update' : 'Initial Creation')
    });
    const secretData = {
      id: secretId,
      projectId,
      key,
      environment,
      encryptedValue,
      currentVersionId: versionId,
      updatedAt: Date.now()
    };
    if (existing) {
      const inst = new SecretEntity(c.env, secretId);
      await inst.save(secretData);
    } else {
      await SecretEntity.create(c.env, secretData);
    }
    return ok(c, secretData);
  });
  app.get('/api/secrets/:id/versions', async (c) => {
    const versions = await VersionEntity.listBySecret(c.env, c.req.param('id'));
    return ok(c, versions);
  });
  app.post('/api/secrets/:id/rollback', async (c) => {
    const secretId = c.req.param('id');
    const { versionId } = await c.req.json();
    const inst = new SecretEntity(c.env, secretId);
    const current = await inst.getState();
    if (!current.id) return notFound(c, 'Secret not found');
    const vInst = new VersionEntity(c.env, versionId);
    const version = await vInst.getState();
    if (!version.id) return notFound(c, 'Version not found');
    // Create a NEW version entry for the rollback event to maintain audit log
    const newVersionId = crypto.randomUUID();
    await VersionEntity.create(c.env, {
      id: newVersionId,
      secretId,
      encryptedValue: version.encryptedValue,
      createdAt: Date.now(),
      note: `Rollback to ${new Date(version.createdAt).toLocaleString()}`
    });
    const updated = {
      ...current,
      encryptedValue: version.encryptedValue,
      currentVersionId: newVersionId,
      updatedAt: Date.now()
    };
    await inst.save(updated);
    return ok(c, updated);
  });
  app.delete('/api/secrets/:id', async (c) => {
    const deleted = await SecretEntity.delete(c.env, c.req.param('id'));
    return ok(c, { deleted });
  });
  // TOKENS
  app.get('/api/tokens', async (c) => {
    const projectId = c.req.query('projectId');
    const tokens = projectId 
      ? await TokenEntity.listByProject(c.env, projectId) 
      : (await TokenEntity.list(c.env)).items;
    return ok(c, tokens);
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