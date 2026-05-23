import { NextResponse } from 'next/server';
import { LibrarySummary } from '../../../_lib/types';
import generatedData from '../../../_lib/data/generated.json';
import { PROJECTS } from '../../../_lib/data/static-data';

export async function GET() {
  const projectCount = PROJECTS.length;
  const healthy = projectCount > 0;

  const summary: LibrarySummary = {
    healthy,
    counts: {
      ...generatedData.counts,
      projects: projectCount,
    },
    lastCheck: generatedData.generatedAt,
  };

  return NextResponse.json(summary);
}
