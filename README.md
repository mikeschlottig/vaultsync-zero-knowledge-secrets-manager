# VaultSync

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=${repositoryUrl})  
[cloudflarebutton]

A modern full-stack starter template for Cloudflare Workers. Build scalable, real-time applications with React frontend, Hono backend, and Durable Objects for stateful data storage. Includes users, chat boards, and extensible entity system.

## ✨ Features

- **Full-Stack TypeScript**: Shared types between frontend and backend
- **Durable Objects**: Per-entity storage with automatic indexing and pagination
- **Real-Time Chat Demo**: Users, chat boards, and messages with seamless mutations
- **Modern UI**: shadcn/ui components, Tailwind CSS, dark mode, responsive design
- **Data Fetching**: TanStack Query for optimistic updates and caching
- **Routing**: React Router with error boundaries
- **API Layer**: Hono with CORS, logging, and structured responses
- **Development Tools**: Vite hot reload, Bun scripts, ESLint, TypeScript strict mode
- **Production-Ready**: Error reporting, health checks, SPA handling
- **Extensible**: Add new entities in `worker/entities.ts` and routes in `worker/user-routes.ts`

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, React Router, Lucide Icons, Framer Motion, Sonner (toasts)
- **Backend**: Cloudflare Workers, Hono, Durable Objects (GlobalDurableObject pattern)
- **Data**: SQLite-backed Durable Objects, indexed listing, CAS concurrency control
- **Tools**: Bun (package manager), Wrangler, ESLint, TypeScript 5
- **Libraries**: Zod (validation-ready), Immer (state), UUID, Date-fns

## 🚀 Quick Start

1. **Clone & Install**:
   ```bash
   git clone <your-repo-url>
   cd vaultsync-ercpha37p8kvaufuhpjce
   bun install
   ```

2. **Run Locally** (Frontend preview):
   ```bash
   bun run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

3. **Full-Stack Local Dev** (with Durable Objects):
   ```bash
   bun run build
   wrangler dev
   ```
   Open [http://localhost:8787](http://localhost:8787)

4. **Type Generation** (after `wrangler dev` or deploy):
   ```bash
   bun run cf-typegen
   ```

## 📚 Usage

### Frontend Development
- Replace `src/pages/HomePage.tsx` with your app
- Use `src/lib/api-client.ts` for type-safe API calls:
  ```ts
  import { api } from '@/lib/api-client'
  const users = await api<User[]>('/api/users')
  ```
- Add routes in `src/main.tsx`
- Components in `src/components/ui/` (shadcn pre-installed)

### Backend Development
- **Entities**: Extend `IndexedEntity` in `worker/entities.ts`
  ```ts
  export class NewEntity extends IndexedEntity<NewState> {
    static readonly entityName = "new";
    static readonly indexName = "news";
    static readonly initialState = { id: "", ... };
  }
  ```
- **Routes**: Add in `worker/user-routes.ts` using `UserEntity`, etc.
  ```ts
  app.get('/api/news', async (c) => {
    const page = await NewEntity.list(c.env, cursor, limit);
    return ok(c, page);
  });
  ```
- Core utils handle CRUD, listing, seeding automatically

### API Endpoints (Demo)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users (paginated) |
| POST | `/api/users` | Create user |
| GET | `/api/chats` | List chats |
| POST | `/api/chats` | Create chat |
| GET | `/api/chats/:id/messages` | List messages |
| POST | `/api/chats/:id/messages` | Send message |
| DELETE | `/api/users/:id` | Delete user |

Responses: `{ success: true, data: ... }`

## 🔧 Development Workflow

- **Hot Reload**: `bun run dev` for UI, `wrangler dev` for full stack
- **Linting**: `bun run lint`
- **Build**: `bun run build`
- **Preview**: `bun run preview`
- **Seed Data**: Automatic via `ensureSeed()` on first list
- **Custom Entities**: See `worker/entities.ts` examples
- **Error Handling**: Client errors POST to `/api/client-errors`

## ☁️ Deployment

1. **Build Assets**:
   ```bash
   bun run build
   ```

2. **Deploy to Cloudflare**:
   ```bash
   bun run deploy
   ```
   Or use Wrangler directly:
   ```bash
   wrangler deploy
   ```

3. **One-Click Deploy**:
   [cloudflarebutton]

**Notes**:
- Configured for Cloudflare Pages + Workers (SPA fallback)
- Durable Objects auto-migrate via `wrangler.jsonc`
- Custom domain: `wrangler deploy --name your-name`
- Observability enabled

## 📁 Project Structure

```
├── src/                 # React app (Vite)
│   ├── components/      # UI (shadcn/ui + custom)
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utils, API client
│   └── pages/           # Routes
├── worker/              # Cloudflare Worker (Hono + DOs)
│   ├── core-utils.ts    # Entity base (DO NOT MODIFY)
│   ├── entities.ts      # Your entities (User, ChatBoard)
│   └── user-routes.ts   # Your API routes
├── shared/              # Shared types
└── ...                  # Config (tsconfig, tailwind, wrangler)
```

## 🤝 Contributing

1. Fork & clone
2. `bun install`
3. Make changes
4. `bun run lint`
5. `bun run build`
6. PR with description

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

## 🙌 Support

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [shadcn/ui](https://ui.shadcn.com/)
- Issues: [GitHub Issues](https://github.com/your-org/vaultsync-ercpha37p8kvaufuhpjce/issues)

Built with ❤️ for Cloudflare developers.