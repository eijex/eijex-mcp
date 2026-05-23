import Link from 'next/link';
import type { McpToolDefinition } from '../_lib/mcp-tools';

export default function McpToolCard({ tool }: { tool: McpToolDefinition }) {
  return (
    <Link
      href={`/${tool.name}`}
      className="group block rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 hover:border-zinc-600 hover:bg-zinc-900 transition-all duration-150"
    >
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl leading-none mt-0.5">{tool.icon}</span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold font-mono text-zinc-100 group-hover:text-white transition-colors truncate">
            {tool.displayName}
          </h2>
          <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
            {tool.description}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {tool.tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700"
          >
            {tag}
          </span>
        ))}
        {tool.parameters.length === 0 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800/50 text-zinc-500 border border-zinc-700/50">
            No params
          </span>
        )}
      </div>
    </Link>
  );
}
