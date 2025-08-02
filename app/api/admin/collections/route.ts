import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    
    const body = await request.json()
    const { name, slug, description, imageUrl, isActive } = body

    // Check if slug already exists
    const existingCollection = await prisma.collection.findUnique({
      where: { slug }
    })

    if (existingCollection) {
      return NextResponse.json(
        { error: 'A collection with this slug already exists' },
        { status: 400 }
      )
    }

    const collection = await prisma.collection.create({
      data: {
        name,
        slug,
        description: description || null,
        imageUrl: imageUrl || null,
        isActive: isActive ?? true
      }
    })

    return NextResponse.json(collection)
  } catch (error) {
    console.error('Error creating collection:', error)
    return NextResponse.json(
      { error: 'Failed to create collection' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    
    const collections = await prisma.collection.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: {
            items: true
          }
        }
      }
    })

    return NextResponse.json(collections)
  } catch (error) {
    console.error('Error fetching collections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    )
  }
}
