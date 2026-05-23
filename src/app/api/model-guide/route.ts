import { NextRequest, NextResponse } from 'next/server';
import { readJson, writeJson } from '../../_lib/store';
import type { ModelRecommendation } from '../../_lib/types';

export async function GET() {
  const items = (await readJson<ModelRecommendation[]>('model-guide.json')) ?? [];
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const items = (await readJson<ModelRecommendation[]>('model-guide.json')) ?? [];
  const entry: ModelRecommendation = {
    ...body,
    id: `mg-${Date.now()}`,
  };
  await writeJson('model-guide.json', [...items, entry]);
  return NextResponse.json(entry);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const items = (await readJson<ModelRecommendation[]>('model-guide.json')) ?? [];
  const updated = items.map((item) => (item.id === body.id ? body : item));
  await writeJson('model-guide.json', updated);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id');
  const items = (await readJson<ModelRecommendation[]>('model-guide.json')) ?? [];
  await writeJson('model-guide.json', items.filter((item) => item.id !== id));
  return NextResponse.json({ ok: true });
}
