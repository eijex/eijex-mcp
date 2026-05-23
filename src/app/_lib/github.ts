const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'munkyukim86';
const GITHUB_REPO = process.env.GITHUB_REPO || 'mcp-server';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

const BASE_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;

function getHeaders() {
  return {
    'Authorization': `Bearer ${GITHUB_TOKEN}`,
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

export function isGitHubConfigured(): boolean {
  return !!GITHUB_TOKEN;
}

export async function getFileSha(filePath: string): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/contents/${filePath}?ref=${GITHUB_BRANCH}`, {
      headers: getHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.sha || null;
  } catch {
    return null;
  }
}

export async function commitFile(
  filePath: string,
  content: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  if (!GITHUB_TOKEN) {
    return { success: false, error: 'GITHUB_TOKEN not configured' };
  }

  try {
    const sha = await getFileSha(filePath);
    const body: Record<string, unknown> = {
      message,
      content: Buffer.from(content).toString('base64'),
      branch: GITHUB_BRANCH,
    };
    if (sha) body.sha = sha;

    const res = await fetch(`${BASE_URL}/contents/${filePath}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.message || 'GitHub API error' };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function deleteFile(
  filePath: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  if (!GITHUB_TOKEN) {
    return { success: false, error: 'GITHUB_TOKEN not configured' };
  }

  const sha = await getFileSha(filePath);
  if (!sha) return { success: false, error: 'File not found' };

  try {
    const res = await fetch(`${BASE_URL}/contents/${filePath}`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ message, sha, branch: GITHUB_BRANCH }),
    });
    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.message || 'GitHub API error' };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function readFileContent(filePath: string): Promise<string | null> {
  if (!GITHUB_TOKEN) return null;
  try {
    const res = await fetch(`${BASE_URL}/contents/${filePath}?ref=${GITHUB_BRANCH}`, {
      headers: getHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Buffer.from(data.content, 'base64').toString('utf8');
  } catch {
    return null;
  }
}

export async function testConnection(): Promise<{ success: boolean; login?: string; error?: string }> {
  if (!GITHUB_TOKEN) {
    return { success: false, error: 'GITHUB_TOKEN not set' };
  }
  try {
    const res = await fetch('https://api.github.com/user', { headers: getHeaders() });
    if (!res.ok) return { success: false, error: 'Invalid token' };
    const data = await res.json();
    return { success: true, login: data.login };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
