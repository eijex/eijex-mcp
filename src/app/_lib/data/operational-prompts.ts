export const OPERATIONAL_PROMPTS = {
  'architecture-decision': {
    title: 'Architecture Decision Prompt',
    path: 'docs/prompts/operations/architecture-decision.md',
    useWhen: 'Choosing hosting, deployment, model, database, auth, CI/CD, or runtime strategy.',
    content: `# Architecture Decision Prompt

Use this when the hard part is choosing the right stack or deployment strategy, not writing code.

\`\`\`text
You are a pragmatic CTO and senior DevOps consultant for small teams. Your specialty is choosing the simplest reliable architecture that avoids unnecessary engineering and keeps cost predictable.

Project context:
- Project:
- Current repo/path:
- Tech stack:
- Runtime/deployment today:
- Expected users/traffic:
- Budget limit:
- Data sensitivity:
- Compliance or security constraints:
- Options being considered:

Please recommend a realistic stack and deployment strategy.

Evaluate:
1. Cheapest safe starting option.
2. Easiest migration path if usage grows.
3. Operational risks and hidden maintenance costs.
4. Security and secret-management requirements.
5. Common failure modes for this exact stack.
6. What should be deferred until there is real usage.

Output:
- Recommendation.
- Why this is the right default now.
- What would make you change the recommendation.
- Minimal implementation checklist.
- Validation commands or smoke checks.

Constraints:
- Do not assume production scale unless the context supports it.
- Do not recommend Kubernetes, multi-cloud, or complex IaC unless there is a concrete reason.
- If current repo docs conflict with this prompt, follow the repo docs.
\`\`\``,
  },
  'troubleshooting-log-analysis': {
    title: 'Troubleshooting Log Analysis Prompt',
    path: 'docs/prompts/operations/troubleshooting-log-analysis.md',
    useWhen: 'Diagnosing build, deploy, Docker, API, CORS, auth, or CI failures from redacted logs.',
    content: `# Troubleshooting Log Analysis Prompt

Use this when a build, deploy, test, Docker, API, auth, CORS, or CI task fails and the fastest path is log-driven diagnosis.

Redact API keys, tokens, session cookies, private keys, database URLs, webhook URLs, patient/customer data, and unpublished research data before using this with external tools.

\`\`\`text
You are a senior incident-response and DevOps engineer. Diagnose the root cause from the logs and give a safe, minimal fix.

1. What I was trying to do:

2. Exact command or action:

3. Full error log after redaction:

4. Environment:
- OS:
- Runtime versions:
- Framework:
- Deployment target:
- Relevant env vars, with values redacted:

Please answer in this order:
A. Diagnosis: one sentence with the actual root cause and the log line that proves it.
B. Immediate fix: exact commands or file edits, ordered step by step.
C. Verification: commands or smoke checks to confirm the fix.
D. Prevention: one or two changes to prevent recurrence.
E. Risk: what not to do, especially if a suggested command could delete data, lock out SSH, expose secrets, or change production behavior.

Constraints:
- If evidence is insufficient, say exactly what additional command/log is needed.
- Do not invent config options.
- Prefer the smallest change that restores the intended behavior.
\`\`\``,
  },
  'cost-audit-finops': {
    title: 'Cost Audit / FinOps Prompt',
    path: 'docs/prompts/operations/cost-audit-finops.md',
    useWhen: 'Reviewing cloud, AI API, scheduled job, logging, storage, or deployment cost exposure.',
    content: `# Cost Audit / FinOps Prompt

Use this before deploying or enabling paid services, model calls, scheduled jobs, logging, storage, or cloud resources.

\`\`\`text
You are a cloud and AI API cost auditor for solo developers and small teams. Your job is to prevent surprise bills while keeping the deployment practical.

Project context:
- Project:
- Current deployment target:
- Expected usage:
- Budget limit:
- Services used:
- AI/model providers:
- Scheduled jobs:
- Storage/logging:
- Current config or infrastructure files:

Analyze:
1. Top 5 ways cost could quietly increase.
2. Which costs are fixed vs usage-based.
3. Free-tier or low-cost settings that are actually safe.
4. Alerts, quotas, or budgets that should be enabled before launch.
5. Logging/retention settings that prevent storage creep.
6. Model/API call caps and fallback behavior.

Output:
- Risk table: item, why it costs money, estimated severity, mitigation.
- Minimal budget-alert setup for the named provider.
- Configuration changes to keep the project under the stated budget.
- What must be monitored after deployment.

Constraints:
- Do not assume AWS if the project uses Vercel, Fly.io, GitHub Actions, Colab, Groq, OpenAI, Gemini, Microsoft APIs, or another provider.
- If exact prices may have changed, require checking the provider's current pricing page before final approval.
- Do not recommend disabling security logging entirely just to save money.
\`\`\``,
  },
} as const;

export type OperationalPromptId = keyof typeof OPERATIONAL_PROMPTS;
export const OPERATIONAL_PROMPT_IDS = Object.keys(OPERATIONAL_PROMPTS) as OperationalPromptId[];
