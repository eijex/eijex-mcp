import { NextRequest, NextResponse } from 'next/server';
import { readJson, writeJson } from '../../_lib/store';
import type { SessionLog } from '../../_lib/types';

export async function GET() {
  const logs = (await readJson<SessionLog[]>('session-logs.json')) ?? [];
  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const logs = (await readJson<SessionLog[]>('session-logs.json')) ?? [];
  const entry: SessionLog = {
    ...body,
    id: `sl-${Date.now()}`,
  };
  await writeJson('session-logs.json', [...logs, entry]);
  return NextResponse.json(entry);
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id');
  const logs = (await readJson<SessionLog[]>('session-logs.json')) ?? [];
  await writeJson('session-logs.json', logs.filter((l) => l.id !== id));
  return NextResponse.json({ ok: true });
}
