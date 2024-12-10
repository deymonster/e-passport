import { NextResponse, NextRequest } from 'next/server'
import { repositories } from '@/lib/repositories';
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { withAdminAuth } from '@/lib/auth';

export const GET  = withAdminAuth(async (req: NextRequest) => {
  try {
    const documents = await repositories.document.getAll();
    return NextResponse.json(documents, { status: 200 })
  } catch (error) {
    if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    throw new Error('Error getting documents');
  }
});

export const POST = withAdminAuth(async (request: NextRequest) => {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string

    if (!file || !name) {
      return NextResponse.json({ error: 'File and name are required' }, { status: 400 })
    }

    // Проверяем размеры файла (например, не более 10 МБ)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds the limit of 10MB' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })
    
    // Generate unique filename
    const filename = `${Date.now()}-${file.name}`
    const filePath = join('uploads', filename)
    const fullPath = join(process.cwd(), 'public', filePath)
    

    // Convert File to Buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(fullPath, buffer)

    // Save document record to database
    const document = await repositories.document.createDocument(
      name,
      filePath.replace(/\\/g, '/') // Ensure consistent path format
    )

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    throw new Error('Error creating document');
  }
});
