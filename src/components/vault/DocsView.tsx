import React from 'react';
import { FileCode, Terminal, Github, Copy, CheckCircle2, Globe, Box, Cpu, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {children}
    </span>
  )
}
export function DocsView() {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vaultsync.io';
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };
  const GITHUB_SNIPPET = `name: Deploy
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Inject VaultSync Secrets
        env:
          VS_TOKEN: \${{ secrets.VAULTSYNC_TOKEN }}
        run: |
          # The token contains the decryption key for your project
          curl -s -H "Authorization: Bearer $VS_TOKEN" \\
               "${origin}/api/v1/fetch?env=prod" | \\
               npx vaultsync-fetch --token $VS_TOKEN > .env
          # Secrets are now available in .env as plaintext
          source .env && npm run build`;
  const DOCKER_SNIPPET = `# entrypoint.sh
#!/bin/sh
set -e
echo "🔒 Fetching secure environment..."
# npx vaultsync-fetch decrypts the payload locally using your token key
export $(curl -s -H "Authorization: Bearer $VS_TOKEN" \\
     "${origin}/api/v1/fetch" | \\
     npx vaultsync-fetch --token $VS_TOKEN --format=env)
exec "$@"`;
  const DOCKER_COMPOSE = `services:
  api:
    image: my-app:latest
    environment:
      - VS_TOKEN=\${VAULTSYNC_TOKEN}
    entrypoint: /app/entrypoint.sh`;
  const NODE_DECRYPT_FLOW = `/**
 * Implementation of Zero-Knowledge Decryption
 * 1. Fetch encrypted project key + secrets from Worker
 * 2. Token key (client-side) decrypts the Project Key
 * 3. Project Key decrypts each individual secret
 */
const crypto = require('crypto').webcrypto;
async function vaultSyncFetch(token) {
  const tokenKeyPart = token.slice(11);
  const response = await fetch('${origin}/api/v1/fetch', {
    headers: { 'Authorization': \`Bearer \${token}\` }
  });
  const { data } = await response.json();
  // Decrypt Project Key using Token Key
  const tokenKey = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(tokenKeyPart),
    { name: 'AES-GCM' }, false, ['decrypt']
  );
  // ... continue decryption flow ...
}`;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-500">
              <Cpu className="w-5 h-5" />
              <span className="text-sm font-semibold uppercase tracking-widest">Automation First</span>
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Integrations Hub</h1>
            <p className="text-zinc-400 text-lg">Deploy secrets anywhere. Decryption happens only at the edge of your infrastructure.</p>
          </div>
          <section className="p-8 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Globe className="w-24 h-24 text-emerald-500" />
            </div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-emerald-500" />
                <h2 className="text-xl font-bold text-white">Dynamic Injection API</h2>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">v1.2.0 (Latest)</Badge>
            </div>
            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Endpoint URL</label>
                <div className="flex gap-2">
                  <code className="flex-1 p-3 bg-black/50 rounded-lg border border-zinc-800 text-emerald-500 font-mono text-sm overflow-x-auto">
                    {origin}/api/v1/fetch
                  </code>
                  <Button variant="secondary" size="sm" onClick={() => copyToClipboard(`${origin}/api/v1/fetch`, 'API URL')}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/50">
                  <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <Box className="w-4 h-4 text-emerald-500" /> Path Filtering
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Request specific keys using the <code className="text-emerald-400">?path=env/key</code> parameter.
                    Reduces payload size and improves performance.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/50">
                  <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-500" /> Env Filtering
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Filter by environment using <code className="text-emerald-400">?env=prod</code>.
                    Defaults to all project secrets if omitted.
                  </p>
                </div>
              </div>
            </div>
          </section>
          <Tabs defaultValue="github" className="w-full">
            <TabsList className="bg-zinc-900 border border-zinc-800 p-1 h-12 w-full justify-start gap-2 mb-6">
              <TabsTrigger value="github" className="gap-2 data-[state=active]:bg-zinc-800">
                <Github className="w-4 h-4" /> GitHub
              </TabsTrigger>
              <TabsTrigger value="docker" className="gap-2 data-[state=active]:bg-zinc-800">
                <HardDrive className="w-4 h-4" /> Docker
              </TabsTrigger>
              <TabsTrigger value="node" className="gap-2 data-[state=active]:bg-zinc-800">
                <FileCode className="w-4 h-4" /> Node.js
              </TabsTrigger>
            </TabsList>
            <TabsContent value="github" className="space-y-4">
              <div className="space-y-2 mb-4">
                <h3 className="text-lg font-semibold text-white">GitHub Actions Workflow</h3>
                <p className="text-sm text-zinc-400">Securely inject secrets into your CI/CD runners without persistent storage.</p>
              </div>
              <div className="relative group">
                <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 overflow-x-auto text-xs font-mono text-emerald-500 leading-relaxed">
                  {GITHUB_SNIPPET}
                </pre>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                  onClick={() => copyToClipboard(GITHUB_SNIPPET, 'GitHub YAML')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="docker" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">Docker Entrypoint Script</h3>
                  <p className="text-sm text-zinc-400">The safest way to run production containers. Secrets are never part of the image layers.</p>
                </div>
                <div className="relative group">
                  <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 overflow-x-auto text-xs font-mono text-emerald-500 leading-relaxed">
                    {DOCKER_SNIPPET}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                    onClick={() => copyToClipboard(DOCKER_SNIPPET, 'Docker script')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Docker Compose</h3>
                <div className="relative group">
                  <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 overflow-x-auto text-xs font-mono text-zinc-400 leading-relaxed">
                    {DOCKER_COMPOSE}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                    onClick={() => copyToClipboard(DOCKER_COMPOSE, 'Docker Compose')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="node" className="space-y-4">
              <div className="space-y-2 mb-4">
                <h3 className="text-lg font-semibold text-white">Zero-Knowledge Implementation</h3>
                <p className="text-sm text-zinc-400">Understand the underlying crypto used to decrypt your project secrets.</p>
              </div>
              <div className="relative group">
                <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 overflow-x-auto text-xs font-mono text-zinc-500 leading-relaxed">
                  {NODE_DECRYPT_FLOW}
                </pre>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                  onClick={() => copyToClipboard(NODE_DECRYPT_FLOW, 'Node.js snippet')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-blue-200 text-sm">
                <strong>Pro Tip:</strong> Use the <code className="bg-blue-500/20 px-1 rounded text-blue-100">vaultsync-fetch</code> CLI tool to handle this automatically in any CI environment.
              </div>
            </TabsContent>
          </Tabs>
          <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex gap-4 items-start shadow-inner">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h4 className="text-emerald-500 font-bold mb-1">Production Ready</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">
                VaultSync's injection protocol is verified for SOC2 compliance. Data is encrypted using AES-GCM 256-bit and
                decryption keys are never logged or stored on our servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}