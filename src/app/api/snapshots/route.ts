import { NextRequest, NextResponse } from 'next/server';
import { readJson, writeJson } from '../../_lib/store';
import type { ProjectSnapshot } from '../../_lib/types';

export async function GET() {
  const snapshots = (await readJson<ProjectSnapshot[]>('snapshots.json')) ?? [];
  return NextResponse.json(snapshots);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const snapshots = (await readJson<ProjectSnapshot[]>('snapshots.json')) ?? [];
  const entry: ProjectSnapshot = {
    ...body,
    id: `snap-${Date.now()}`,
    updatedAt: new Date().toISOString(),
  };
  await writeJson('snapshots.json', [...snapshots, entry]);
  return NextResponse.json(entry);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const snapshots = (await readJson<ProjectSnapshot[]>('snapshots.json')) ?? [];
  const updated = snapshots.map((s) =>
    s.id === body.id ? { ...body, updatedAt: new Date().toISOString() } : s,
  );
  await writeJson('snapshots.json', updated);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id');
  const snapshots = (await readJson<ProjectSnapshot[]>('snapshots.json')) ?? [];
  await writeJson('snapshots.json', snapshots.filter((s) => s.id !== id));
  return NextResponse.json({ ok: true });
}
