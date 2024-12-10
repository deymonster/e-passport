import { NextResponse, NextRequest } from 'next/server';
import { repositories } from '@/lib/repositories';
import { withAdminAuth } from '@/lib/auth';

export const GET = withAdminAuth (async (req: NextRequest) =>{
  try {
    const records = await repositories.registryRecord.getAll();
    return NextResponse.json(records, { status: 200 });
  } catch (error) {
    console.error('Error fetching registry records:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const POST = withAdminAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { name, url } = body;

    if (!name || !url) {
      return NextResponse.json(
        { error: 'Both name and url are required' },
        { status: 400 }
      );
    }

    const newRecord = await repositories.registryRecord.create({
      name,
      url,
    });

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error) {
    console.error('Error creating registry record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
