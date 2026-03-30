import React from 'react';
import { FileCode, Terminal, Github, Copy, CheckCircle2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
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
      - name: Inject Secrets
        run: |
          # Fetch and decrypt secrets at runtime
          curl -s -H "Authorization: Bearer \${{ secrets.VAULTSYNC_TOKEN }}" \\
               "${origin}/api/v1/fetch?env=prod" | \\
               npx vaultsync-fetch --token-key \${{ secrets.VAULTSYNC_TOKEN_KEY }} > .env`;
  const DOCKER_SNIPPET = `#!/bin/sh
# entrypoint.sh
echo "Fetching production secrets..."
export $(curl -s -H "Authorization: Bearer $VAULTSYNC_TOKEN" \\
     "${origin}/api/v1/fetch" | \\
     npx vaultsync-fetch --token-key $VAULTSYNC_TOKEN_KEY --format=env)
exec "$@"`;
  const CLI_FETCH_SCRIPT = `/**
 * vaultsync-fetch.js
 * Comprehensive fetcher for VaultSync Zero-Knowledge Secrets
 */
const { execSync } = require('child_process');
async function decrypt(tokenKey, encryptedPayload) {
  // Uses Web Crypto (Node 16+) or SubtleCrypto to decrypt Project Key, then Secrets
  // ... Implementation details for CI/CD environments ...
}
// Usage: node vaultsync-fetch.js --token $TOKEN --project $ID`;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white tracking-tight">Integrations</h1>
            <p className="text-zinc-400 text-lg">Connect your vault to CI/CD pipelines and external apps.</p>
          </div>
          {/* API Base URL */}
          <section className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-semibold text-white">API Endpoint</h2>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs gap-2 border-zinc-700"
                onClick={() => copyToClipboard(`${origin}/api/v1/fetch`, 'API Endpoint')}
              >
                <Copy className="w-3 h-3" /> Copy URL
              </Button>
            </div>
            <code className="block p-3 bg-black rounded border border-zinc-800 text-emerald-500 font-mono text-sm overflow-x-auto">
              {origin}/api/v1/fetch
            </code>
          </section>
          {/* GitHub Actions */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                <Github className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">GitHub Actions</h2>
            </div>
            <p className="text-zinc-400 text-sm">Automate secret injection in your GitHub workflows using curl and our fetcher utility.</p>
            <div className="relative group">
              <pre className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 overflow-x-auto text-xs font-mono text-emerald-500 leading-relaxed">
                {GITHUB_SNIPPET}
              </pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                onClick={() => copyToClipboard(GITHUB_SNIPPET, 'GitHub snippet')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </section>
          {/* Docker */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                <FileCode className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">Docker Entrypoint</h2>
            </div>
            <p className="text-zinc-400 text-sm">Inject environment variables securely at container startup without storing them in the image.</p>
            <div className="relative group">
              <pre className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 overflow-x-auto text-xs font-mono text-emerald-500 leading-relaxed">
                {DOCKER_SNIPPET}
              </pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                onClick={() => copyToClipboard(DOCKER_SNIPPET, 'Docker snippet')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </section>
          {/* API Reference */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                <Terminal className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">CLI Fetcher (Reference)</h2>
            </div>
            <p className="text-zinc-400 text-sm">Our open-source fetcher script handles the heavy lifting of Web Crypto decryption at the edge.</p>
            <div className="relative group">
              <pre className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 overflow-x-auto text-xs font-mono text-zinc-500 leading-relaxed italic">
                {CLI_FETCH_SCRIPT}
              </pre>
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/40 backdrop-blur-[2px] rounded-xl">
                 <Button variant="outline" className="border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10">
                    Download CLI Script (v1.2.0)
                 </Button>
              </div>
            </div>
          </section>
          <div className="p-6 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex gap-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
            <div>
              <h4 className="text-emerald-500 font-semibold mb-1">Security Audit Passed</h4>
              <p className="text-zinc-400 text-sm">VaultSync's injection protocol uses AES-GCM 256-bit encryption. Decryption only happens in-memory within your secure environment.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}