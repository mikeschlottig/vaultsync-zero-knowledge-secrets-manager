import { Hono } from "hono";
import type { Env } from './core-utils';
import { ProjectEntity, SecretEntity, TokenEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // PROJECTS
  app.get('/api/projects', async (c) => {
    const page = await ProjectEntity.list(c.env);
    return ok(c, page.items);
  });
  app.post('/api/projects', async (c) => {
    const body = await c.req.json();
    const project = await ProjectEntity.create(c.env, {
      id: crypto.randomUUID(),
      name: body.name,
      createdAt: Date.now()
    });
    return ok(c, project);
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