import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { ImageController } from '@/lib/controllers/image.controller';

const imageController = new ImageController();

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    return await imageController.POST(request);
  } catch (error) {
    console.error('Error in image upload API:', error);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    return await imageController.DELETE(request);
  } catch (error) {
    console.error('Error in image delete API:', error);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}
