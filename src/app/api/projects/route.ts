import { NextResponse } from 'next/server';
import { PROJECTS } from '../../_lib/data/static-data';

export async function GET() {
  try {
    return NextResponse.json(PROJECTS);
  } catch (error) {
    console.error('Error loading projects:', error);
    return NextResponse.json([], { status: 200 });
  }
}
