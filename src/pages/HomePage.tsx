import React, { useState } from 'react';
import { useVaultStore } from '@/store/vault';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SecretsManager } from '@/components/vault/SecretsManager';
import { TokenManager } from '@/components/vault/TokenManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'sonner';
function UnlockScreen() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const unlock = useVaultStore(s => s.unlock);
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    try {
      await unlock(password);
      toast.success("Vault unlocked");
    } catch (err) {
      toast.error("Failed to derive keys");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)]">
            <Shield className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">VaultSync</h1>
          <p className="text-zinc-400">Enter your master password to unlock secrets</p>
        </div>
        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-emerald-500 transition-colors">
              <Lock className="w-4 h-4" />
            </div>
            <Input
              type="password"
              placeholder="Master Password"
              className="pl-10 h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:ring-emerald-500/50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all active:scale-[0.98]"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <span className="flex items-center gap-2">
                Unlock Vault <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </form>
        <p className="mt-8 text-center text-xs text-zinc-500">
          Zero-knowledge architecture. Your password never leaves your browser.
        </p>
      </motion.div>
    </div>
  );
}
export function HomePage() {
  const isUnlocked = useVaultStore(s => s.isUnlocked);
  const [activeTab, setActiveTab] = useState<'secrets' | 'tokens'>('secrets');
  if (!isUnlocked) return <UnlockScreen />;
  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <AnimatePresence mode="wait">
            {activeTab === 'secrets' ? (
              <motion.div
                key="secrets"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <SecretsManager />
              </motion.div>
            ) : (
              <motion.div
                key="tokens"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <TokenManager />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <Toaster theme="dark" position="bottom-right" richColors />
    </DashboardLayout>
  );
}