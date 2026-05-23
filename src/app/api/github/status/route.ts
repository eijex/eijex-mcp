import { NextResponse } from 'next/server';
import { testConnection, isGitHubConfigured } from '../../../_lib/github';

export async function GET() {
  if (!isGitHubConfigured()) {
    return NextResponse.json({ configured: false, connected: false });
  }

  const result = await testConnection();
  return NextResponse.json({
    configured: true,
    connected: result.success,
    login: result.login,
    error: result.error,
  });
}
