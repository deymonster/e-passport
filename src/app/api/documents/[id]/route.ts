import { NextRequest, NextResponse } from 'next/server'
import { repositories } from '@/lib/repositories';
import { unlink } from 'fs/promises'
import { join } from 'path'
import { withAdminAuth } from '@/lib/auth';

// удаление документа админом
export const DELETE = withAdminAuth(async (request: NextRequest, context: { params: { id: string } }) => {
  try {
    const resolvedParams = await context.params;
    const documentId = parseInt(resolvedParams.id, 10)
    if (isNaN(documentId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    // Get document before deletion to get the file path
    const document = await repositories.document.getById(documentId)
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Delete the physical file
    const fullPath = join(process.cwd(), 'public', document.filePath)
    try {
      await unlink(fullPath)
    } catch (error) {
      if (error instanceof Error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
      }
      throw new Error('Error deleting file');
    }

    // Delete from database
    await repositories.document.delete(documentId);
    
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    throw new Error('Error deleting document');
    }
});

// получение документа для админа
export const GET = withAdminAuth(async (request: NextRequest, context: { params: { id: string }}) => {
  try {
    const resolvedParams = await context.params;
    const documentId = parseInt(resolvedParams.id, 10)
    if (isNaN(documentId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const document = await repositories.document.getById(documentId);
    
    
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json(document, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    throw new Error('Error getting document');
    }
});


// изменение документа админом
export const PATCH = withAdminAuth(async (request: NextRequest, context: { params: { id: string }}) => {
  try {
    const resolvedParams = await context.params;
    const documentId = parseInt(resolvedParams.id, 10)
    const body = await request.json();
    const document = await repositories.document.update(documentId, body);
    return NextResponse.json(document, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    throw new Error('Error updating document');
  }
});

