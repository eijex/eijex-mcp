import Image from 'next/image';
import { ALL_TOOLS } from './_lib/mcp-tools';
import McpToolCard from './_components/McpToolCard';

const MCP_URL = 'https://mcp.eijex.com/api/mcp';

const CONNECTION_SNIPPET = `{
  "mcpServers": {
    "eijex": {
      "type": "http",
      "url": "${MCP_URL}"
    }
  }
}`;

const SECTIONS = [
  {
    key: 'agent' as const,
    label: 'Agents',
    description: 'Execute design tasks — call external engines and return validated artifacts.',
  },
  {
    key: 'skill' as const,
    label: 'Skills',
    description: 'Query biomedical databases — literature, structures, pathways, and trials.',
  },
  {
    key: 'workflow' as const,
    label: 'Workflows',
    description: 'Multi-step research protocols — structured pipelines with decision gates.',
  },
] as const;

export default function Home() {
  const toolsByGroup = {
    agent: ALL_TOOLS.filter((t) => t.group === 'agent'),
    skill: ALL_TOOLS.filter((t) => t.group === 'skill'),
    workflow: ALL_TOOLS.filter((t) => t.group === 'workflow'),
  };

  return (
    <div className="min-h-screen py-12 px-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">BioDesign Execution Layer</span>
        </div>
        <div className="flex items-center gap-4 mb-2">
          <Image
            src="/logo.jpg"
            alt="Eijex"
            width={48}
            height={48}
            className="rounded-xl"
            priority
          />
          <h1 className="text-3xl font-bold text-zinc-100">
            Eijex MCP
          </h1>
        </div>
        <p className="text-zinc-400 text-base mb-8">
          Turns scientific context into validated CDS and construct design artifacts
        </p>

        {/* Connection snippet */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
            <span className="text-xs font-mono text-zinc-500">Connection — .mcp.json / Claude Code settings</span>
            <span className="text-xs text-zinc-600">JSON</span>
          </div>
          <pre className="px-4 py-3 text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed">
            {CONNECTION_SNIPPET}
          </pre>
        </div>
      </div>

      {/* Tool sections */}
      <div className="max-w-4xl mx-auto space-y-12">
        {SECTIONS.map(({ key, label, description }) => {
          const tools = toolsByGroup[key];
          if (tools.length === 0) return null;
          return (
            <section key={key}>
              <div className="flex items-baseline gap-3 mb-1">
                <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                  {label}
                </h2>
                <span className="text-xs text-zinc-600 font-mono">{tools.length}</span>
              </div>
              <p className="text-xs text-zinc-500 mb-5">{description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tools.map((tool) => (
                  <McpToolCard key={tool.name} tool={tool} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto mt-12 pt-6 border-t border-zinc-900 flex flex-col items-center gap-1.5">
        <p className="text-xs text-zinc-600 font-mono">{MCP_URL}</p>
        <div className="flex items-center gap-3 text-xs text-zinc-700">
          <span>© 2026 Eijex</span>
          <span>·</span>
          <a
            href="https://opensource.org/license/mit/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-500 transition-colors"
          >
            MIT License
          </a>
          <span>·</span>
          <a
            href="https://github.com/eijex/eijex-mcp"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-500 transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
