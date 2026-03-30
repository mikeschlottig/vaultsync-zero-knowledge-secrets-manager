import React from 'react';
import { useVaultStore } from '@/store/vault';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Key, Shield, LogOut, Code, Box } from 'lucide-react';
import { cn } from '@/lib/utils';
interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: 'secrets' | 'tokens';
  onTabChange: (tab: 'secrets' | 'tokens') => void;
}
export function DashboardLayout({ children, activeTab, onTabChange }: DashboardLayoutProps) {
  const lock = useVaultStore(s => s.lock);
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-zinc-950 text-white">
        <Sidebar className="border-r border-zinc-800 bg-zinc-900">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">VaultSync</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-4 py-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeTab === 'secrets'} 
                  onClick={() => onTabChange('secrets')}
                  className={cn(
                    "w-full justify-start gap-3 h-10 px-3 rounded-md transition-colors",
                    activeTab === 'secrets' ? "bg-emerald-500/10 text-emerald-500" : "hover:bg-zinc-800 text-zinc-400"
                  )}
                >
                  <Key className="w-4 h-4" />
                  <span>Secrets</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeTab === 'tokens'} 
                  onClick={() => onTabChange('tokens')}
                  className={cn(
                    "w-full justify-start gap-3 h-10 px-3 rounded-md transition-colors",
                    activeTab === 'tokens' ? "bg-emerald-500/10 text-emerald-500" : "hover:bg-zinc-800 text-zinc-400"
                  )}
                >
                  <Code className="w-4 h-4" />
                  <span>Service Tokens</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-zinc-800">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={lock}
                  className="w-full justify-start gap-3 h-10 px-3 rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Lock Vault</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 relative overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}