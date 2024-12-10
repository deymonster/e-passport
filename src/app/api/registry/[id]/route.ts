import { NextResponse, NextRequest } from 'next/server';
import { repositories } from '@/lib/repositories';
import { withAdminAuth } from '@/lib/auth';

export const GET = withAdminAuth(async (req: NextRequest, context: { params: { id: string } }) => {
  try {
    const recordId = parseInt(context.params.id, 10);
    if (isNaN(recordId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const record = await repositories.registryRecord.getById(recordId);
    if (!record) {
      return NextResponse.json({ error: 'Registry record not found' }, { status: 404 });
    }

    return NextResponse.json(record, { status: 200 });
  } catch (error) {
    console.error('Error fetching registry record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const DELETE = withAdminAuth(async (req: NextRequest, context: { params: { id: string } }) => {
  try {
    const recordId = parseInt(context.params.id, 10);
    if (isNaN(recordId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await repositories.registryRecord.delete(recordId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting registry record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const PATCH = withAdminAuth(async (req: NextRequest, context: { params: { id: string } }) => {
  try {
    const recordId = parseInt(context.params.id, 10);
    if (isNaN(recordId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await req.json();
    const { name, url } = body;

    if (!name || !url) {
      return NextResponse.json(
        { error: 'Both name and url are required' },
        { status: 400 }
      );
    }

    const updatedRecord = await repositories.registryRecord.update(recordId, {
      ...(name && { name }),
      ...(url && { url }),
    });
    
    return NextResponse.json(updatedRecord, { status: 200 });
  } catch (error) {
    console.error('Error updating registry record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
