import React, { useState, useEffect } from 'react';
import { useVaultStore } from '@/store/vault';
import { encryptValue } from '@/lib/crypto';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Environment } from '@shared/types';
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export function CreateSecretModal({ open, onOpenChange }: Props) {
  const masterKey = useVaultStore(s => s.masterKey);
  const addSecret = useVaultStore(s => s.addSecret);
  const projects = useVaultStore(s => s.projects);
  const activeProjectId = useVaultStore(s => s.activeProjectId);
  const [loading, setLoading] = useState(false);
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [env, setEnv] = useState<Environment>('dev');
  const [projectId, setProjectId] = useState(activeProjectId || '');
  // Keep modal in sync with active project if it changes or when opening
  useEffect(() => {
    if (open && activeProjectId) {
      setProjectId(activeProjectId);
    }
  }, [open, activeProjectId]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterKey || !key || !value || !projectId) {
        toast.error("Please fill in all fields");
        return;
    }
    setLoading(true);
    try {
      const encryptedValue = await encryptValue(masterKey, value);
      await addSecret({
        projectId,
        key,
        encryptedValue,
        environment: env
      });
      toast.success("Secret created");
      onOpenChange(false);
      setKey('');
      setValue('');
    } catch (err) {
      toast.error("Encryption or save failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>Add New Secret</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-zinc-400">Project Workspace</Label>
            <Select onValueChange={setProjectId} value={projectId}>
              <SelectTrigger className="bg-zinc-950 border-zinc-800">
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400">Secret Key</Label>
            <Input
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="e.g. STRIPE_API_KEY"
              className="bg-zinc-950 border-zinc-800 font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400">Secret Value</Label>
            <Input
              type="password"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="Enter sensitive value"
              className="bg-zinc-950 border-zinc-800"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400">Environment</Label>
            <Select onValueChange={(v) => setEnv(v as Environment)} value={env}>
              <SelectTrigger className="bg-zinc-950 border-zinc-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="dev">Development</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
                <SelectItem value="prod">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 w-full mt-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Secret"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}