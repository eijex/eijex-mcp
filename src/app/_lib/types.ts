export type RunStatus = "PASS" | "FAIL" | "WARN" | "RUNNING" | "PENDING";

export interface LibrarySummary {
  healthy: boolean;
  counts: {
    workflows: number;
    instructions: number;
    specs: number;
    agents: number;
    skills: number;
    projects: number;
  };
  lastCheck: string;
}

export interface ProjectDefinition {
  id: string;
  name: string;
  path: string;
  description: string;
  status: string;
  health: string;
  referencesDomain?: string;
}

export type IdeTarget = 'claude-code' | 'vscode' | 'cursor' | 'other';
export type TokenLevel = 'low' | 'medium' | 'high';

export interface ProjectSnapshot {
  id: string;
  projectId: string;
  agents: string[];
  skills: string[];
  instructions: string[];
  ide: IdeTarget;
  updatedAt: string;
  notes: string;
}

export interface ModelRecommendation {
  id: string;
  taskType: string;
  model: string;
  ide: string;
  tokenLevel: TokenLevel;
  notes: string;
  projectId?: string;
}

export interface SessionLog {
  id: string;
  projectId: string;
  taskType: string;
  model: string;
  ide: string;
  tokenUsed?: number;
  date: string;
  notes: string;
}
