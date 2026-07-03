'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, type ShortVideoProject } from '@/lib/api-client';

type ProjectContextValue = {
  project: ShortVideoProject;
  updateProject: (project: ShortVideoProject) => void;
  refreshProject: () => Promise<void>;
};

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  const [project, setProject] = useState<ShortVideoProject | null>(null);

  const refreshProject = useCallback(async () => {
    const data = await api.getShortVideoProject(projectId);
    setProject(data);
  }, [projectId]);

  useEffect(() => {
    refreshProject().catch(() => undefined);
  }, [refreshProject]);

  if (!project) {
    return <div className="text-on-surface-variant">加载项目…</div>;
  }

  return (
    <ProjectContext.Provider
      value={{ project, updateProject: setProject, refreshProject }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}
