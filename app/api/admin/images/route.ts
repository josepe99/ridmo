import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/modules/users/server';
import { authorizationErrorResponse } from '@/modules/users/errors'
import { ImageController } from '@/modules/admin/server';

const imageController = new ImageController();

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    return await imageController.POST(request);
  } catch (error) {
    const denied = authorizationErrorResponse(error)
    if (denied) return denied
    console.error('Error in image upload API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    return await imageController.DELETE(request);
  } catch (error) {
    const denied = authorizationErrorResponse(error)
    if (denied) return denied
    console.error('Error in image delete API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
