import React, { useState } from 'react';
import { useVaultStore } from '@/store/vault';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Box, Trash2, ArrowUpRight, Clock } from 'lucide-react';
import { toast } from 'sonner';
interface ProjectManagerProps {
  onSwitch: () => void;
}
export function ProjectManager({ onSwitch }: ProjectManagerProps) {
  const projects = useVaultStore(s => s.projects);
  const activeProjectId = useVaultStore(s => s.activeProjectId);
  const setActiveProjectId = useVaultStore(s => s.setActiveProjectId);
  const addProject = useVaultStore(s => s.addProject);
  const removeProject = useVaultStore(s => s.removeProject);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const handleCreate = async () => {
    if (!newProjectName.trim()) return;
    try {
      await addProject(newProjectName.trim());
      setNewProjectName('');
      setIsModalOpen(false);
      toast.success("Project created");
    } catch (e) {
      toast.error("Failed to create project");
    }
  };
  const handleDelete = async (id: string) => {
    try {
      await removeProject(id);
      toast.success("Project and all associated data deleted");
    } catch (e) {
      toast.error("Failed to delete project");
    }
  };
  const handleSwitch = (id: string) => {
    setActiveProjectId(id);
    onSwitch();
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Projects</h1>
          <p className="text-zinc-400">Organize your secrets into logical workspace containers.</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
              <Plus className="w-4 h-4" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm text-zinc-400">Project Name</label>
                <Input
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  placeholder="e.g. Mobile App API"
                  className="bg-zinc-950 border-zinc-800 text-white"
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-500 w-full">
                Create Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div 
            key={project.id} 
            className={`p-6 rounded-xl border transition-all duration-200 group ${
              activeProjectId === project.id 
                ? 'bg-emerald-500/5 border-emerald-500/30' 
                : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2 rounded-lg ${
                activeProjectId === project.id ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}>
                <Box className="w-5 h-5" />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-zinc-500 hover:text-white"
                  onClick={() => handleSwitch(project.id)}
                  title="Switch to this project"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription className="text-zinc-400">
                        This will permanently delete the project <span className="font-bold text-white">"{project.name}"</span> and all its associated secrets and tokens. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(project.id)} className="bg-red-600 hover:bg-red-500">
                        Delete Project
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">{project.name}</h3>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Clock className="w-3 h-3" />
              <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
            {activeProjectId === project.id && (
              <div className="mt-4 flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-emerald-500">Active Workspace</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}