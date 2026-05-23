import { ALL_TOOLS } from './_lib/mcp-tools';
import McpToolCard from './_components/McpToolCard';

const MCP_URL = 'https://eijex-mcp.vercel.app/api/mcp';

const CONNECTION_SNIPPET = `{
  "mcpServers": {
    "eijex": {
      "type": "http",
      "url": "${MCP_URL}"
    }
  }
}`;

export default function Home() {
  return (
    <div className="min-h-screen py-12 px-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            <span className="text-sm">⚡</span>
          </div>
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">BioDesign Execution Layer</span>
        </div>
        <h1 className="text-3xl font-bold text-zinc-100 mb-2">
          Eijex MCP
        </h1>
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

      {/* Tool grid */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            Available Tools
            <span className="ml-2 text-zinc-600 font-normal normal-case tracking-normal">
              {ALL_TOOLS.length} tools
            </span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_TOOLS.map((tool) => (
            <McpToolCard key={tool.name} tool={tool} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto mt-12 pt-6 border-t border-zinc-900">
        <p className="text-xs text-zinc-600 text-center font-mono">
          {MCP_URL}
        </p>
      </div>
    </div>
  );
}
