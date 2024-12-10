import { NextRequest, NextResponse } from 'next/server';
import { repositories } from '@/lib/repositories';
import { withAdminAuth } from '@/lib/auth';

export const GET = withAdminAuth(async (req: NextRequest, context: { params: { id: string } }) => {
  try {
    const resolvedParams = await context.params;
    const batchId = parseInt(resolvedParams.id, 10);
    if (isNaN(batchId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const batch = await repositories.batch.getBatchWithRelations(batchId);
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    return NextResponse.json(batch, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    throw new Error('Error fetching batches');
  }
})

export const DELETE = withAdminAuth(async (request: NextRequest, context: { params: { id: string } }) => {
  try {
    const resolvedParams = await context.params;
    const batchId = parseInt(resolvedParams.id, 10);
    if (isNaN(batchId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await repositories.batch.deleteBatch(batchId);
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {

    if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    throw new Error('Error deleting batches');

  }
})
