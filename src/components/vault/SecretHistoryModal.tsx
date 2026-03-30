import React, { useState, useEffect } from 'react';
import { useVaultStore } from '@/store/vault';
import { decryptValue } from '@/lib/crypto';
import { Secret, SecretVersion } from '@shared/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, RotateCcw, Eye, Copy, Loader2, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
interface Props {
  secret: Secret | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export function SecretHistoryModal({ secret, open, onOpenChange }: Props) {
  const masterKey = useVaultStore(s => s.masterKey);
  const fetchSecretVersions = useVaultStore(s => s.fetchSecretVersions);
  const rollbackSecret = useVaultStore(s => s.rollbackSecret);
  const [versions, setVersions] = useState<SecretVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [rollingBack, setRollingBack] = useState<string | null>(null);
  useEffect(() => {
    if (open && secret) {
      loadVersions();
    }
  }, [open, secret]);
  const loadVersions = async () => {
    if (!secret) return;
    setLoading(true);
    try {
      const data = await fetchSecretVersions(secret.id);
      setVersions(data);
    } catch (e) {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };
  const handleReveal = async (version: SecretVersion) => {
    if (revealed[version.id]) {
      const next = { ...revealed };
      delete next[version.id];
      setRevealed(next);
      return;
    }
    if (!masterKey) return;
    try {
      const val = await decryptValue(masterKey, version.encryptedValue.ciphertext, version.encryptedValue.iv);
      setRevealed(prev => ({ ...prev, [version.id]: val }));
    } catch (e) {
      toast.error("Decryption failed");
    }
  };
  const handleRollback = async (version: SecretVersion) => {
    if (!secret || !confirm("Rollback to this version? This will create a new audit entry.")) return;
    setRollingBack(version.id);
    try {
      await rollbackSecret(secret.id, version.id);
      toast.success("Rolled back successfully");
      onOpenChange(false);
    } catch (e) {
      toast.error("Rollback failed");
    } finally {
      setRollingBack(null);
    }
  };
  const handleCopy = async (version: SecretVersion) => {
    if (!masterKey) return;
    try {
      const val = revealed[version.id] || await decryptValue(masterKey, version.encryptedValue.ciphertext, version.encryptedValue.iv);
      await navigator.clipboard.writeText(val);
      toast.success("Copied to clipboard");
    } catch (e) {
      toast.error("Copy failed");
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-500" />
            Secret History: <span className="font-mono text-emerald-400">{secret?.key}</span>
          </DialogTitle>
          <DialogDescription className="text-zinc-500">
            Audit trail and version management for this secret.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 mt-4 pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-20 text-zinc-500">No history found.</div>
          ) : (
            <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-zinc-800">
              {versions.map((version, idx) => (
                <div key={version.id} className="relative">
                  <div className={`absolute -left-[23px] top-1 w-4 h-4 rounded-full border-4 border-zinc-900 ${
                    idx === 0 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-zinc-700'
                  }`} />
                  <div className={`p-4 rounded-xl border transition-all ${
                    idx === 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-zinc-800/30 border-zinc-800'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex flex-col">
                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(version.createdAt, 'MMM d, yyyy HH:mm:ss')}
                        </span>
                        {idx === 0 && <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mt-0.5">Current Version</span>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400" onClick={() => handleReveal(version)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400" onClick={() => handleCopy(version)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        {idx !== 0 && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-emerald-500 hover:bg-emerald-500/10"
                            onClick={() => handleRollback(version)}
                            disabled={rollingBack === version.id}
                          >
                            {rollingBack === version.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                          </Button>
                        )}
                      </div>
                    </div>
                    {version.note && (
                      <div className="flex items-start gap-2 mb-3 text-xs text-zinc-400 italic">
                        <FileText className="w-3 h-3 shrink-0 mt-0.5" />
                        {version.note}
                      </div>
                    )}
                    <div className="bg-black/40 rounded-lg p-3 font-mono text-sm">
                      {revealed[version.id] ? (
                        <span className="text-zinc-200 break-all">{revealed[version.id]}</span>
                      ) : (
                        <span className="text-zinc-600">••••••••••••••••</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}