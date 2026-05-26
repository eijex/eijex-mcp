/**
 * Build-time data generator for eijex-mcp web UI.
 * Reads YAML/MD files from the repository and generates a JSON file
 * that can be imported at build time instead of reading filesystem at runtime.
 * Supports Global + Project-level hierarchy.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..', '..');
const OUTPUT = path.resolve(__dirname, '..', 'src', 'app', '_lib', 'data', 'generated.json');

function readDir(dirPath) {
  try {
    return fs.readdirSync(dirPath);
  } catch {
    console.warn(`  [warn] Directory not found: ${dirPath}`);
    return [];
  }
}

function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

function getFileMeta(dirPath, fileName) {
  const fullPath = path.join(dirPath, fileName);
  try {
    const stats = fs.statSync(fullPath);
    return {
      name: fileName,
      size: stats.size,
      mtime: stats.mtime.toISOString(),
    };
  } catch {
    return { name: fileName, size: 0, mtime: new Date().toISOString() };
  }
}

function extractMdTitle(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function extractFrontMatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  match[1].split('\n').forEach(line => {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) {
      fm[key.trim()] = rest.join(':').trim();
    }
  });
  return fm;
}

function countYamlIds(content) {
  return (content.match(/^\s*-\s+id:/gm) || []).length;
}

function scanWorkflows(dir, scope, projectId) {
  const files = readDir(dir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
  return files.map(f => {
    const meta = getFileMeta(dir, f);
    const content = readFileContent(path.join(dir, f));
    return { ...meta, content, scope, projectId: projectId || null };
  });
}

console.log('[generate-data] Starting build-time data generation...');
console.log(`[generate-data] Repository root: ${ROOT}`);

// 1. Universal Workflows
const universalWorkflowsDir = path.join(ROOT, 'universal', 'workflows');
const universalWorkflows = scanWorkflows(universalWorkflowsDir, 'universal', null);
console.log(`[generate-data] Workflows: ${universalWorkflows.length}`);

// 2. Universal Agents & Skills
const universalAgentsPath = path.join(ROOT, 'universal', 'agents.yaml');
const universalSkillsPath = path.join(ROOT, 'universal', 'skills.yaml');
const universalAgentsContent = readFileContent(universalAgentsPath);
const universalSkillsContent = readFileContent(universalSkillsPath);
const universalAgentCount = countYamlIds(universalAgentsContent);
const universalSkillCount = countYamlIds(universalSkillsContent);

// 3. Project-level data
const projectsDir = path.join(ROOT, 'projects');
const projectDirNames = readDir(projectsDir).filter(name => {
  try {
    return fs.statSync(path.join(projectsDir, name)).isDirectory();
  } catch { return false; }
});

const projectData = projectDirNames.map(projectId => {
  const projectPath = path.join(projectsDir, projectId);
  const wfDir = path.join(projectPath, 'workflows');
  const agentsFile = path.join(projectPath, 'agents.yaml');
  const skillsFile = path.join(projectPath, 'skills.yaml');

  const workflows = scanWorkflows(wfDir, 'project', projectId);
  const agentsContent = readFileContent(agentsFile);
  const skillsContent = readFileContent(skillsFile);

  return {
    projectId,
    workflows,
    agentCount: countYamlIds(agentsContent),
    skillCount: countYamlIds(skillsContent),
    agentsContent,
    skillsContent,
  };
});

if (projectDirNames.length > 0) {
  console.log(`[generate-data] Projects: ${projectDirNames.join(', ')}`);
}

// 4. Instructions
const instructionsDir = path.join(ROOT, 'instructions');
const instructionFiles = readDir(instructionsDir).filter(f => f.endsWith('.md'));
const instructions = instructionFiles.map(f => {
  const meta = getFileMeta(instructionsDir, f);
  const content = readFileContent(path.join(instructionsDir, f));
  const fm = extractFrontMatter(content);
  const title = extractMdTitle(content);
  return { ...meta, title, id: fm.id || null, status: fm.status || null };
});
console.log(`[generate-data] Instructions: ${instructions.length}`);

// 5. Specs
const specsDir = path.join(ROOT, 'specs');
const specFiles = readDir(specsDir).filter(f => f.endsWith('.md'));
const specs = specFiles.map(f => {
  const meta = getFileMeta(specsDir, f);
  const content = readFileContent(path.join(specsDir, f));
  const fm = extractFrontMatter(content);
  const title = extractMdTitle(content);
  return { ...meta, title, id: fm.id || null, status: fm.status || null };
});
console.log(`[generate-data] Specs: ${specs.length}`);

// Totals
const totalAgents = universalAgentCount + projectData.reduce((s, p) => s + p.agentCount, 0);
const totalSkills = universalSkillCount + projectData.reduce((s, p) => s + p.skillCount, 0);
const allWorkflows = [...universalWorkflows, ...projectData.flatMap(p => p.workflows)];
console.log(`[generate-data] Agents: ${totalAgents} (universal: ${universalAgentCount})`);
console.log(`[generate-data] Skills: ${totalSkills} (universal: ${universalSkillCount})`);

// Generate output
const data = {
  generatedAt: new Date().toISOString(),
  counts: {
    workflows: allWorkflows.length,
    instructions: instructions.length,
    specs: specs.length,
    agents: totalAgents,
    skills: totalSkills,
    universalWorkflows: universalWorkflows.length,
    universalAgents: universalAgentCount,
    universalSkills: universalSkillCount,
  },
  // Universal scope
  universalWorkflows,
  universalAgentsContent,
  universalSkillsContent,
  // Per-project data
  projects: projectData,
  // Flat array (backward compat)
  workflows: allWorkflows,
  instructions,
  specs,
};

fs.writeFileSync(OUTPUT, JSON.stringify(data, null, 2), 'utf-8');
console.log(`[generate-data] Output written to: ${OUTPUT}`);

// Copy briefing-history.json into the bundle
const BRIEFING_SRC = path.resolve(ROOT, 'data', 'briefing-history.json');
const BRIEFING_DST = path.resolve(__dirname, '..', 'src', 'app', '_lib', 'data', 'briefing-history.json');
try {
  fs.copyFileSync(BRIEFING_SRC, BRIEFING_DST);
  const briefing = JSON.parse(fs.readFileSync(BRIEFING_DST, 'utf-8'));
  const itemsWithTitle = Object.values(briefing.items ?? {}).filter(i => i.title?.trim()).length;
  console.log(`[generate-data] briefing-history.json copied (last_run: ${briefing.last_run ?? 'N/A'}, items with title: ${itemsWithTitle})`);
} catch (e) {
  console.warn(`  [warn] Could not copy briefing-history.json: ${e.message}`);
}

console.log('[generate-data] Done!');
