import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { writeFile, unlink, readFile } from 'fs/promises'
import { join } from 'path'
import { mkdir } from 'fs/promises'
import { existsSync } from 'fs'

// Initialize Prisma Client
const prisma = new PrismaClient()

// Helper function to delete image file
async function deleteImageFile(imagePath: string | null) {
  if (!imagePath) return
  const fullPath = join('public', imagePath)
  if (existsSync(fullPath)) {
    await unlink(fullPath)
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const sn = formData.get('sn') as string
    const pin = formData.get('pin') as string
    const descr = formData.get('descr') as string
    const garant = formData.get('garant') as string
    const image = formData.get('image') as File

    if (!sn || !pin || !image) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if PC with this SN already exists
    const existingPC = await prisma.pC.findUnique({
      where: { sn }
    })

    if (existingPC) {
      return NextResponse.json(
        { error: `A PC with serial number ${sn} already exists` },
        { status: 409 }
      )
    }

    // Ensure the images directory exists
    const imagesDir = join('public', 'pc-images')
    await mkdir(imagesDir, { recursive: true })

    // Save image
    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const imagePath = join(imagesDir, `${sn}.jpg`)
    await writeFile(imagePath, buffer)

    // Create PC record
    const pc = await prisma.pC.create({
      data: {
        sn,
        pin,
        descr: descr || undefined,
        garant: garant ? new Date(garant) : new Date(),
        documentPath: `/pc-images/${sn}.jpg`,
        block: false,
      }
    })

    return NextResponse.json(pc)
  } catch (error: any) {
    console.error('Error creating PC:', error)
    return NextResponse.json(
      { error: 'Error creating PC. Please try again.' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const status = searchParams.get('status') || 'all'

    const pcs = await prisma.pC.findMany({
      where: {
        sn: {
          contains: search,
          mode: 'insensitive'
        },
        ...(status !== 'all' && {
          block: status === 'blocked'
        })
      },
      orderBy: {
        [sortBy]: sortOrder
      }
    })

    return NextResponse.json(pcs)
  } catch (error: any) {
    console.error('Error fetching PCs:', error)
    return NextResponse.json({ error: error.message })
  }
}

export async function PUT(request: Request) {
  try {
    const formData = await request.formData()
    const id = parseInt(formData.get('id') as string)
    const sn = formData.get('sn') as string
    const pin = formData.get('pin') as string
    const descr = formData.get('descr') as string
    const garant = formData.get('garant') as string
    const block = formData.get('block') === 'true'
    const image = formData.get('image') as File | null
    const deleteImage = formData.get('deleteImage') === 'true'

    if (!id || !sn || !pin) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get current PC data
    const currentPC = await prisma.pC.findUnique({
      where: { id }
    })

    if (!currentPC) {
      return NextResponse.json(
        { error: 'PC not found' },
        { status: 404 }
      )
    }

    // Check if new SN already exists for different PC
    const existingPC = await prisma.pC.findFirst({
      where: {
        sn,
        NOT: {
          id
        }
      }
    })

    if (existingPC) {
      return NextResponse.json(
        { error: `Another PC with serial number ${sn} already exists` },
        { status: 409 }
      )
    }

    // Handle image operations
    let documentPath: string | null = currentPC.documentPath
    
    // If deleting image
    if (deleteImage) {
      await deleteImageFile(currentPC.documentPath)
      documentPath = null
    }
    // If uploading new image
    else if (image) {
      // Delete old image if it exists and SN changed
      if (currentPC.documentPath && currentPC.sn !== sn) {
        await deleteImageFile(currentPC.documentPath)
      }
      
      // Save new image
      const imagesDir = join('public', 'pc-images')
      await mkdir(imagesDir, { recursive: true })
      const bytes = await image.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const imagePath = join(imagesDir, `${sn}.jpg`)
      await writeFile(imagePath, buffer)
      documentPath = `/pc-images/${sn}.jpg`
    }
    // If SN changed but keeping the same image
    else if (currentPC.sn !== sn && currentPC.documentPath) {
      const oldPath = join('public', currentPC.documentPath)
      const newPath = join('public', 'pc-images', `${sn}.jpg`)
      const newDocumentPath = `/pc-images/${sn}.jpg`
      
      if (existsSync(oldPath)) {
        const imageContent = await readFile(oldPath)
        await writeFile(newPath, imageContent)
        await unlink(oldPath)
        documentPath = newDocumentPath
      }
    }

    // Update PC record
    const pc = await prisma.pC.update({
      where: { id },
      data: {
        sn,
        pin,
        descr: descr || undefined,
        garant: garant ? new Date(garant) : new Date(),
        block,
        documentPath
      }
    })

    return NextResponse.json(pc)
  } catch (error: any) {
    console.error('Error updating PC:', error)
    return NextResponse.json(
      { error: 'Error updating PC. Please try again.' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') as string)

    if (!id) {
      return NextResponse.json(
        { error: 'Missing PC ID' },
        { status: 400 }
      )
    }

    // Get PC data before deletion
    const pc = await prisma.pC.findUnique({
      where: { id }
    })

    if (pc && pc.documentPath) {
      // Delete the image file
      await deleteImageFile(pc.documentPath)
    }

    // Delete PC record
    await prisma.pC.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting PC:', error)
    return NextResponse.json(
      { error: 'Error deleting PC. Please try again.' },
      { status: 500 }
    )
  }
}
