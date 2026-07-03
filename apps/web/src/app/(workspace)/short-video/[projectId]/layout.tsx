'use client';

import { useParams } from 'next/navigation';
import { ProjectShell } from '@/components/project-shell';
import { ProjectProvider, useProject } from './project-context';

function ProjectLayoutInner({ children }: { children: React.ReactNode }) {
  const params = useParams<{ projectId: string }>();
  const { project } = useProject();

  return (
    <ProjectShell projectId={params.projectId} title={project.title}>
      {children}
    </ProjectShell>
  );
}

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ projectId: string }>();

  return (
    <ProjectProvider projectId={params.projectId}>
      <ProjectLayoutInner>{children}</ProjectLayoutInner>
    </ProjectProvider>
  );
}
