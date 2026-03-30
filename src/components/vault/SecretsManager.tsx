import React, { useState, useMemo } from 'react';
import { useVaultStore } from '@/store/vault';
import { decryptValue } from '@/lib/crypto';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, EyeOff, Copy, Plus, Trash2, Loader2, Box } from 'lucide-react';
import { toast } from 'sonner';
import { CreateSecretModal } from './CreateSecretModal';
export function SecretsManager() {
  const secrets = useVaultStore(s => s.secrets);
  const projects = useVaultStore(s => s.projects);
  const activeProjectId = useVaultStore(s => s.activeProjectId);
  const masterKey = useVaultStore(s => s.masterKey);
  const removeSecret = useVaultStore(s => s.removeSecret);
  const isLoading = useVaultStore(s => s.isLoading);
  const [search, setSearch] = useState('');
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [filterEnv, setFilterEnv] = useState<'all' | 'dev' | 'staging' | 'prod'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const activeProject = useMemo(() =>
    projects.find(p => p.id === activeProjectId),
    [projects, activeProjectId]
  );
  const filteredSecrets = useMemo(() => {
    return secrets.filter(s => {
      const matchesSearch = s.key.toLowerCase().includes(search.toLowerCase());
      const matchesEnv = filterEnv === 'all' || s.environment === filterEnv;
      return matchesSearch && matchesEnv;
    });
  }, [secrets, search, filterEnv]);
  const handleReveal = async (secretId: string) => {
    if (revealed[secretId]) {
      const newRevealed = { ...revealed };
      delete newRevealed[secretId];
      setRevealed(newRevealed);
      return;
    }
    if (!masterKey) return;
    const secret = secrets.find(s => s.id === secretId);
    if (!secret) return;
    try {
      const plain = await decryptValue(masterKey, secret.encryptedValue.ciphertext, secret.encryptedValue.iv);
      setRevealed(prev => ({ ...prev, [secretId]: plain }));
    } catch (err) {
      toast.error("Decryption failed");
    }
  };
  const handleCopy = async (secretId: string) => {
    if (!masterKey) return;
    const secret = secrets.find(s => s.id === secretId);
    if (!secret) return;
    try {
      const val = revealed[secretId] || await decryptValue(masterKey, secret.encryptedValue.ciphertext, secret.encryptedValue.iv);
      await navigator.clipboard.writeText(val);
      toast.success("Copied to clipboard (clearing in 30s)");
      // Auto-clear clipboard after 30 seconds
      setTimeout(async () => {
        try {
          const currentContent = await navigator.clipboard.readText();
          if (currentContent === val) {
            await navigator.clipboard.writeText('');
            toast.info("Clipboard cleared for security");
          }
        } catch (e) {
          // If permission denied or other error, fallback to just clearing
          await navigator.clipboard.writeText('');
        }
      }, 30000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this secret?")) return;
    try {
      await removeSecret(id);
      toast.success("Secret deleted");
    } catch (e) {
      toast.error("Delete failed");
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
            <Box className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">{activeProject?.name || 'Loading project...'}</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Secrets</h1>
          <p className="text-zinc-400">Securely store and manage environment variables.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
          <Plus className="w-4 h-4" /> New Secret
        </Button>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search secrets..."
            className="pl-10 bg-zinc-900 border-zinc-800 text-white focus:ring-emerald-500/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 p-1 bg-zinc-900 rounded-lg border border-zinc-800">
          {(['all', 'dev', 'staging', 'prod'] as const).map(env => (
            <button
              key={env}
              onClick={() => setFilterEnv(env)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                filterEnv === env ? 'bg-zinc-800 text-emerald-500 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {env}
            </button>
          ))}
        </div>
      </div>
      <div className="border border-zinc-800 rounded-xl bg-zinc-900/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-900">
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Key</TableHead>
              <TableHead className="text-zinc-400">Environment</TableHead>
              <TableHead className="text-zinc-400">Value</TableHead>
              <TableHead className="text-zinc-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500" />
                </TableCell>
              </TableRow>
            ) : filteredSecrets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-zinc-500">
                  No secrets found in this project
                </TableCell>
              </TableRow>
            ) : (
              filteredSecrets.map((secret) => (
                <TableRow key={secret.id} className="border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                  <TableCell className="font-mono text-emerald-500">{secret.key}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize bg-zinc-800 border-zinc-700 text-zinc-300">
                      {secret.environment}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-zinc-400">
                    {revealed[secret.id] ? (
                      <span className="text-zinc-100">{revealed[secret.id]}</span>
                    ) : (
                      '••••••••••••••••'
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-white h-8 w-8"
                      onClick={() => handleReveal(secret.id)}
                    >
                      {revealed[secret.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-white h-8 w-8"
                      onClick={() => handleCopy(secret.id)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-red-400 h-8 w-8"
                      onClick={() => handleDelete(secret.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <CreateSecretModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}