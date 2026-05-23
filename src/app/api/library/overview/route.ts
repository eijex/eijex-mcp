import { NextResponse } from 'next/server';
import YAML from 'yaml';
import generatedData from '../../../_lib/data/generated.json';

interface RawWorkflow {
  name: string;
  content: string;
  scope: string;
  projectId: string | null;
}

interface RawProject {
  projectId: string;
  workflows: RawWorkflow[];
  agentsContent: string;
  skillsContent: string;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  model: string;
  status: string;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  command: string;
  tags: string[];
}


function parseAgents(yaml: string): Agent[] {
  try {
    const parsed = YAML.parse(yaml) as { agents: Agent[] };
    return parsed?.agents || [];
  } catch {
    return [];
  }
}

function parseSkills(yaml: string): Skill[] {
  try {
    const parsed = YAML.parse(yaml) as { skills: Skill[] };
    return parsed?.skills || [];
  } catch {
    return [];
  }
}

function mapWorkflow(wf: RawWorkflow) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let steps: any[] = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = YAML.parse(wf.content) as { steps: any[] };
    steps = parsed.steps || [];
  } catch {}

  const usedAgents = new Set<string>();
  const usedSkills = new Set<string>();

  steps.forEach((step) => {
    if (step.agent) usedAgents.add(step.agent);
    if (Array.isArray(step.skills)) {
      step.skills.forEach((s: string) => usedSkills.add(s));
    }
  });

  return {
    id: wf.name.replace('.yaml', ''),
    purpose: wf.content.match(/purpose:\s*(.+)/)?.[1]?.trim() || '',
    status: wf.content.match(/^status:\s*(\S+)/m)?.[1] || 'unknown',
    dependencies: {
      agents: Array.from(usedAgents),
      skills: Array.from(usedSkills),
    },
  };
}

export async function GET() {
  const data = generatedData as {
    universalWorkflows: RawWorkflow[];
    universalAgentsContent: string;
    universalSkillsContent: string;
    projects: RawProject[];
  };

  const universalAgents = parseAgents(data.universalAgentsContent);

  const universal = {
    workflows: data.universalWorkflows.map(mapWorkflow),
    agents: universalAgents,
    skills: parseSkills(data.universalSkillsContent),
  };

  const projects = data.projects.map((p) => ({
    id: p.projectId,
    workflows: p.workflows.map(mapWorkflow),
    agents: parseAgents(p.agentsContent),
    skills: parseSkills(p.skillsContent),
  }));

  return NextResponse.json({ universal, projects });
}
