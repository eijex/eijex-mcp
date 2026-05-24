
export interface WorkflowMetadata {
  title: string;
  description: string;
  why: string;
  icon?: string; // Lucide icon name
}

export const WORKFLOW_METADATA: Record<string, WorkflowMetadata> = {
  // Universal
  'WF-RESEARCH': {
    title: 'Deep Research Framework',
    description: 'Autonomous multi-step research on complex topics.',
    why: 'Provides comprehensive insights by analyzing multiple sources and synthesizing them.',
    icon: 'Search',
  },
  'WF-AGENT-HANDOFF': {
    title: 'AI Team Handoff',
    description: 'Protocol for passing context between specialized agents.',
    why: 'Ensures no information is lost when tasks move from research to code to validation.',
    icon: 'Users',
  },
  'WF-DAILY-BRIEF': {
    title: 'Daily Intelligence Brief',
    description: '매일 아침 소스를 스캔해 업데이트·기회를 발굴하고 파이프라인으로 연결한다.',
    why: 'Bio·Cyber·AI 도메인에서 빠르게 변하는 연구·규제 동향을 놓치지 않기 위해 존재한다.',
    icon: 'Search',
  },
  'WF-MEETINGLOG': {
    title: 'Meeting Intelligence',
    description: 'Turns raw transcripts into structured decisions and action items.',
    why: 'Captures critical decisions and assigns ownership so nothing falls through the cracks.',
    icon: 'Mic',
  },
  'WF-PRE-GATE': {
    title: 'Quality Gatekeeper',
    description: 'Validates changes for value, risk, and standard compliance.',
    why: 'Stops low-quality or risky changes before they even reach the code review stage.',
    icon: 'ShieldCheck',
  },
  'WF-TECHSPEC': {
    title: 'Technical Architect',
    description: 'Generates detailed technical specifications from requirements.',
    why: 'Forces clear thinking and problem-solving before a single line of code is written.',
    icon: 'FileText',
  },

  'WF-BIO-RESEARCH-PIPELINE': {
    title: 'Bio Research Pipeline',
    description: '논문 발굴부터 엔진 배포까지 6단계 자동화 파이프라인.',
    why: '최신 바이오 연구를 FactorForge·YieldPredict 엔진에 빠르고 안전하게 반영하기 위해 존재한다.',
    icon: 'Cpu',
  },

  'WF-FACTORFORGE-RESEARCH-TO-ENGINE': {
    title: 'Engine Optimization Loop',
    description: 'Specialized pipeline for FactorForge engine updates.',
    why: 'Optimizes the core bioinformatics engine with the latest research findings.',
    icon: 'Zap',
  },
  'research-paper-analysis': { // Legacy ID kept for compatibility
    title: 'Bioinformatics Research',
    description: 'Analyzes papers specifically for codon optimization.',
    why: 'Keeps the engine at the cutting edge of bioinformatics science.',
    icon: 'BookOpen',
  },
  'WF-LIBRARY-REPLACE': {
    title: 'Dependency Modernizer',
    description: 'Safely upgrades or replaces core libraries.',
    why: 'Reduces technical debt by keeping the stack modern and secure.',
    icon: 'RefreshCw',
  },
  'WF-PAPER-TO-CODE': {
    title: 'Paper Implementation',
    description: 'Implements algorithms directly from academic papers.',
    why: 'Directly translates state-of-the-art research into usable code.',
    icon: 'Code',
  },
  'WF-REGULATION-UPDATE': {
    title: 'Compliance Updater',
    description: 'Updates code logic to match new regulations.',
    why: 'Automates the tedious task of keeping software legally compliant.',
    icon: 'Scale',
  },
  'WF-REGWATCH-CHANGE-DETECT': {
    title: 'Regulatory Watchdog',
    description: 'Monitors external sources for regulatory changes.',
    why: 'Provides early warning of necessary compliance updates.',
    icon: 'Eye',
  },
  'WF-YOUTUBE-IDEA': {
    title: 'Trend Hunter',
    description: 'Extracts innovative ideas from multimedia content.',
    why: 'Fuels the creative pipeline with fresh, trend-aware concepts.',
    icon: 'Youtube',
  },
};

export const AGENT_METADATA: Record<string, WorkflowMetadata> = {
  // Universal Agents
  'research-agent': {
    title: 'Lead Researcher',
    description: 'Expert in information retrieval and synthesis.',
    why: 'Acts as the "Brain", gathering the necessary context for all other agents.',
    icon: 'Search',
  },
  'coder-agent': {
    title: 'Senior Engineer',
    description: 'Specialist in writing clean, efficient code.',
    why: 'Ensures implementation quality and adherence to engineering standards.',
    icon: 'Terminal',
  },
  'validator-agent': {
    title: 'QA Engineer',
    description: 'Rigourous tester and quality gatekeeper.',
    why: 'Provides confidence that changes are safe and work as expected.',
    icon: 'Activity',
  },
  'reviewer-agent': {
    title: 'Code Reviewer',
    description: 'Critical eye for architecture and security.',
    why: 'Catches subtle issues and ensures long-term maintainability.',
    icon: 'Eye',
  },
  'paper-analyst': {
    title: 'Paper Analyst',
    description: 'Deep technical reader for academic PDFs.',
    why: 'Understands complex methodology that general agents might miss.',
    icon: 'BookOpen',
  },
  
  // Legacy mappings
  'research-assistant': { title: 'Lead Researcher', description: 'Expert in information retrieval.', why: 'Legacy ID mapping.', icon: 'Search' },
};

export const SKILL_METADATA: Record<string, WorkflowMetadata> = {
  // Universal Skills
  'web-search': {
    title: 'Global Web Search',
    description: 'Access to real-time information from the web.',
    why: 'Grounds the AI in current reality, beyond its training data.',
    icon: 'Globe',
  },
  'git-push': {
    title: 'Save & Sync',
    description: 'Safely commits and pushes changes to Git.',
    why: 'Ensures work is versioned and backed up immediately.',
    icon: 'Save',
  },
  'security-audit': {
    title: 'Security Scanner',
    description: 'Automated vulnerability detection.',
    why: 'Proactively fixes security holes before they can be exploited.',
    icon: 'Lock',
  },
  'workflow-handoff': {
    title: 'Context Handoff',
    description: 'Securely passes data between agents.',
    why: 'Prevents "hallucination" by providing perfect context to the next agent.',
    icon: 'Share2',
  },
  'pdf-reader': {
    title: 'Document Reader',
    description: 'Extracts text and structure from PDFs.',
    why: 'Unlocks knowledge trapped in document formats.',
    icon: 'FileText',
  },

  // Legacy mappings
  'web_search': { title: 'Global Web Search', description: 'Access to real-time information.', why: 'Legacy ID mapping.', icon: 'Globe' },
  'read_pdf': { title: 'Document Reader', description: 'Extracts text from PDFs.', why: 'Legacy ID mapping.', icon: 'FileText' },
};

export const getWorkflowMetadata = (id: string): WorkflowMetadata => {
  return WORKFLOW_METADATA[id] || {
    title: id,
    description: 'No description available.',
    why: 'Standard operational procedure.',
    icon: 'Workflow',
  };
};

export const getAgentMetadata = (id: string): WorkflowMetadata => {
  return AGENT_METADATA[id] || {
    title: id,
    description: 'AI Agent',
    why: 'Executes specialized tasks.',
    icon: 'Bot',
  };
};

export const getSkillMetadata = (id: string): WorkflowMetadata => {
  return SKILL_METADATA[id] || {
    title: id,
    description: 'Executable Tool',
    why: 'Automates specific actions.',
    icon: 'Wrench',
  };
};
