import React, { useState, useMemo, useEffect } from 'react';
import { useVaultStore } from '@/store/vault';
import { encryptValue, exportKeyRaw } from '@/lib/crypto';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Plus, ShieldAlert, Trash2, Box, Info, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
export function TokenManager() {
  const tokens = useVaultStore(s => s.tokens);
  const projects = useVaultStore(s => s.projects);
  const activeProjectId = useVaultStore(s => s.activeProjectId);
  const masterKey = useVaultStore(s => s.masterKey);
  const createToken = useVaultStore(s => s.createToken);
  const revokeToken = useVaultStore(s => s.revokeToken);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(activeProjectId || '');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  useEffect(() => {
    if (activeProjectId && !selectedProjectId) {
      setSelectedProjectId(activeProjectId);
    }
  }, [activeProjectId, selectedProjectId]);
  const activeProject = useMemo(() =>
    projects.find(p => p.id === activeProjectId),
    [projects, activeProjectId]
  );
  const handleGenerate = async () => {
    if (!newTokenName || !selectedProjectId) {
      toast.error("Please fill in all fields");
      return;
    }
    const isValidProject = projects.some(p => p.id === selectedProjectId);
    if (!isValidProject) {
      toast.error("Invalid project selected");
      return;
    }
    if (!masterKey) {
      toast.error("Vault must be unlocked to generate tokens");
      return;
    }
    try {
      const tokenKeyRaw = crypto.randomUUID().replace(/-/g, '');
      const fullToken = `vs_live_${tokenKeyRaw}`;
      const encoder = new TextEncoder();
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoder.encode(tokenKeyRaw));
      const tokenHash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      const rawMasterKey = await exportKeyRaw(masterKey);
      const cryptoTokenKey = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(tokenKeyRaw),
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );
      const encryptedProjectKey = await encryptValue(cryptoTokenKey, rawMasterKey);
      await createToken({
        projectId: selectedProjectId,
        name: newTokenName,
        tokenPrefix: fullToken.slice(0, 11),
        tokenHash,
        encryptedProjectKey,
      });
      setGeneratedToken(fullToken);
      toast.success("Token created successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate token");
    }
  };
  const handleRevoke = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this token?")) return;
    try {
      await revokeToken(id);
      toast.success("Token revoked");
    } catch (e) {
      toast.error("Revocation failed");
    }
  };
  const navigateToDocs = () => {
    window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'docs' }));
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
            <Box className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">{activeProject?.name || 'Loading project...'}</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Service Tokens</h1>
          <p className="text-zinc-400">Tokens for programmatically fetching secrets via API.</p>
        </div>
        <Dialog open={isGenerating} onOpenChange={(open) => {
          setIsGenerating(open);
          if (!open) { 
            setGeneratedToken(null); 
            setNewTokenName(''); 
            setSelectedProjectId(activeProjectId || ''); 
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 shadow-lg shadow-emerald-900/20">
              <Plus className="w-4 h-4" /> Generate Token
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Generate Service Token</DialogTitle>
              <DialogDescription className='text-sm text-zinc-500 -mt-1'>
                This token will grant read-only access to secrets via the API.
              </DialogDescription>
            </DialogHeader>
            {!generatedToken ? (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Token Name</Label>
                  <Input
                    placeholder="e.g. GitHub Actions CI"
                    className="bg-zinc-950 border-zinc-800 focus:ring-emerald-500"
                    value={newTokenName}
                    onChange={(e) => setNewTokenName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Project Access</Label>
                  <Select onValueChange={setSelectedProjectId} value={selectedProjectId}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-800">
                      <SelectValue placeholder="Select Project" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                    {projects.length === 0 ? (
                      <SelectItem value='none' disabled>No projects available</SelectItem>
                    ) : (
                      projects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))
                    )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-start gap-2 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 text-xs text-zinc-400 leading-relaxed">
                  <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p>Service tokens are cryptographically derived. Only the entropy part (shown after generation) can decrypt your secrets.</p>
                </div>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-500" onClick={handleGenerate}>
                  Generate
                </Button>
              </div>
            ) : (
              <div className="space-y-6 py-4">
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex gap-3">
                  <ShieldAlert className="w-5 h-5 text-emerald-500 shrink-0" />
                  <p className="text-sm text-emerald-200">
                    <strong>Zero-Knowledge Security:</strong> Copy this token now. It contains the decryption entropy and will <strong>never</strong> be shown again.
                  </p>
                </div>
                <div className="relative group">
                  <Input
                    readOnly
                    value={generatedToken}
                    className="bg-zinc-950 border-zinc-800 pr-12 font-mono text-sm text-emerald-500"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-1 top-1 text-zinc-500 hover:text-white"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedToken);
                      toast.success("Token copied");
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-col gap-2">
                  <Button className="w-full bg-zinc-800 hover:bg-zinc-700" onClick={() => setIsGenerating(false)}>
                    I've saved it safely
                  </Button>
                  <p className="text-[10px] text-zinc-500 text-center uppercase tracking-widest font-bold mt-2">
                    Next step: Setup your CI/CD integration
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
      <div className="border border-zinc-800 rounded-xl bg-zinc-900/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-900">
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Name</TableHead>
              <TableHead className="text-zinc-400">Identity (Prefix)</TableHead>
              <TableHead className="text-zinc-400">Created</TableHead>
              <TableHead className="text-zinc-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-zinc-500">
                  <div className="flex flex-col items-center gap-2">
                    <span>No active service tokens in this project</span>
                    <Button variant="link" className="text-emerald-500 text-xs gap-1" onClick={navigateToDocs}>
                      Learn how to use tokens <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              tokens.map((token) => (
                <TableRow key={token.id} className="border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                  <TableCell className="font-medium text-white">{token.name}</TableCell>
                  <TableCell><code className="bg-zinc-800 px-2 py-1 rounded text-zinc-400 text-xs font-mono">{token.tokenPrefix}***</code></TableCell>
                  <TableCell className="text-zinc-500 text-sm">{new Date(token.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-zinc-500 hover:text-red-400 transition-colors"
                      onClick={() => handleRevoke(token.id)}
                    >
                      Revoke
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