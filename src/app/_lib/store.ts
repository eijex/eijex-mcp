import fs from 'fs/promises';
import path from 'path';
import YAML from 'yaml';
import { isGitHubConfigured, readFileContent, commitFile } from './github';

const DATA_DIR = path.join(process.cwd(), 'src/app/_lib/data');
// Path relative to repo root for GitHub API
const DATA_GITHUB_PATH = 'web/instructions-lib/src/app/_lib/data';

const isVercel = !!process.env.VERCEL;

// ── JSON (snapshots, session-logs, model-guide) ────────────────────────

export async function readJson<T>(filename: string): Promise<T | null> {
  // Production on Vercel: read from GitHub (filesystem writes don't persist)
  if (isVercel && isGitHubConfigured()) {
    const content = await readFileContent(`${DATA_GITHUB_PATH}/${filename}`);
    if (content) {
      try { return JSON.parse(content) as T; } catch { return null; }
    }
    return null;
  }
  // Local development: read from filesystem
  try {
    const filePath = path.join(DATA_DIR, filename);
    const contents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(contents) as T;
  } catch {
    return null;
  }
}

export async function writeJson(filename: string, data: unknown): Promise<boolean> {
  const content = JSON.stringify(data, null, 2);
  // Production on Vercel: commit to GitHub
  if (isVercel && isGitHubConfigured()) {
    const result = await commitFile(
      `${DATA_GITHUB_PATH}/${filename}`,
      content,
      `chore: update ${filename}`,
    );
    return result.success;
  }
  // Local development: write to filesystem
  try {
    const filePath = path.join(DATA_DIR, filename);
    await fs.writeFile(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    return false;
  }
}

// ── YAML (agents, skills, workflows) ──────────────────────────────────

export async function readYaml<T>(filename: string): Promise<T | null> {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const fileContents = await fs.readFile(filePath, 'utf8');
    return YAML.parse(fileContents) as T;
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return null;
  }
}

export async function writeYaml(filename: string, data: unknown): Promise<boolean> {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const yamlString = YAML.stringify(data);
    await fs.writeFile(filePath, yamlString, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    return false;
  }
}
