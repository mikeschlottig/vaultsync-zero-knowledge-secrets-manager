import React, { useState, useMemo } from 'react';
import { useVaultStore } from '@/store/vault';
import { decryptValue } from '@/lib/crypto';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, EyeOff, Copy, Plus, Filter } from 'lucide-react';
import { toast } from 'sonner';
export function SecretsManager() {
  const secrets = useVaultStore(s => s.secrets);
  const masterKey = useVaultStore(s => s.masterKey);
  const [search, setSearch] = useState('');
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [filterEnv, setFilterEnv] = useState<'all' | 'dev' | 'staging' | 'prod'>('all');
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
      toast.success("Copied to clipboard", { description: "Clipboard will clear in 30s" });
      // Auto-clear logic
      setTimeout(async () => {
        const current = await navigator.clipboard.readText();
        if (current === val) {
          await navigator.clipboard.writeText("");
          toast.info("Clipboard cleared for security");
        }
      }, 30000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Secrets</h1>
          <p className="text-zinc-400">Securely store and manage environment variables.</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
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
            {filteredSecrets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-zinc-500">
                  No secrets found
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
                    {revealed[secret.id] ? revealed[secret.id] : '••••••••••••••••'}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-zinc-400 hover:text-white"
                      onClick={() => handleReveal(secret.id)}
                    >
                      {revealed[secret.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-zinc-400 hover:text-white"
                      onClick={() => handleCopy(secret.id)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}