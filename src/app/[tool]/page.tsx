import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ALL_TOOLS, TOOL_MAP } from '../_lib/mcp-tools';
import McpToolCard from '../_components/McpToolCard';

const MCP_URL = 'https://mcp.eijex.com/api/mcp';

export function generateStaticParams() {
  return ALL_TOOLS.map((t) => ({ tool: t.name }));
}

export async function generateMetadata({ params }: { params: Promise<{ tool: string }> }) {
  const { tool: toolName } = await params;
  const tool = TOOL_MAP[toolName];
  if (!tool) return {};
  return {
    title: `${tool.displayName} — Eijex MCP`,
    description: tool.description,
  };
}

export default async function ToolPage({ params }: { params: Promise<{ tool: string }> }) {
  const { tool: toolName } = await params;
  const tool = TOOL_MAP[toolName];

  if (!tool) notFound();

  const relatedTools = tool.relatedTools
    .map((name) => TOOL_MAP[name])
    .filter(Boolean)
    .slice(0, 3);

  const connectionSnippet = `{
  "mcpServers": {
    "eijex": {
      "type": "http",
      "url": "${MCP_URL}"
    }
  }
}`;

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-8 font-mono">
          <Link href="/" className="hover:text-zinc-300 transition-colors">
            Home
          </Link>
          <span>›</span>
          <span className="text-zinc-400">{tool.displayName}</span>
        </nav>

        {/* Title block */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">{tool.icon}</span>
            <h1 className="text-2xl font-bold font-mono text-zinc-100">
              {tool.displayName}
            </h1>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-wide border ${
              tool.group === 'agent'    ? 'bg-violet-950 text-violet-400 border-violet-800' :
              tool.group === 'workflow' ? 'bg-blue-950 text-blue-400 border-blue-800' :
                                         'bg-zinc-900 text-zinc-400 border-zinc-700'
            }`}>
              {tool.group}
            </span>
            <span className="text-xs text-zinc-600">by Eijex</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tool.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="text-zinc-300 text-sm leading-relaxed">
            {tool.longDescription}
          </p>
        </div>

        {/* Key Features */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            Key Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tool.keyFeatures.map((feature, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3"
              >
                <span className="text-xs font-mono text-zinc-600 mt-0.5 shrink-0 w-4">
                  {i + 1}.
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed">{feature}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Use Cases */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            Use Cases
          </h2>
          <ol className="space-y-2">
            {tool.useCases.map((useCase, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                <span className="text-xs font-mono text-zinc-600 mt-0.5 shrink-0 w-4">
                  {i + 1}.
                </span>
                {useCase}
              </li>
            ))}
          </ol>
        </section>

        {/* Parameters */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            Parameters
          </h2>
          {tool.parameters.length === 0 ? (
            <p className="text-sm text-zinc-500 italic">파라미터 없음 — 인수 없이 호출 가능합니다.</p>
          ) : (
            <div className="rounded-xl border border-zinc-800 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/80">
                    <th className="text-left px-4 py-2.5 text-zinc-500 font-medium">Name</th>
                    <th className="text-left px-4 py-2.5 text-zinc-500 font-medium">Type</th>
                    <th className="text-left px-4 py-2.5 text-zinc-500 font-medium">Required</th>
                    <th className="text-left px-4 py-2.5 text-zinc-500 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {tool.parameters.map((param) => (
                    <tr key={param.name} className="bg-zinc-950/40 hover:bg-zinc-900/40 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-zinc-300">{param.name}</td>
                      <td className="px-4 py-2.5 font-mono text-violet-400">{param.type}</td>
                      <td className="px-4 py-2.5">
                        {param.required ? (
                          <span className="text-amber-400 font-medium">required</span>
                        ) : (
                          <span className="text-zinc-600">optional</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-400 leading-relaxed">{param.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Connection */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            Connection
          </h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
              <span className="text-xs font-mono text-zinc-500">.mcp.json / Claude Code settings</span>
              <span className="text-xs text-zinc-600">JSON</span>
            </div>
            <pre className="px-4 py-3 text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed">
              {connectionSnippet}
            </pre>
          </div>
        </section>

        {/* Related Tools */}
        {relatedTools.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
              Related Tools
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {relatedTools.map((related) => (
                <McpToolCard key={related.name} tool={related} />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
