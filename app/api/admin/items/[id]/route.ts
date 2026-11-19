import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/modules/users/server';
import { authorizationErrorResponse } from '@/modules/users/errors'
import { ItemController } from '@/modules/admin/server';

const itemController = new ItemController();

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    return await itemController.GET(request);
  } catch (error) {
    const denied = authorizationErrorResponse(error)
    if (denied) return denied
    console.error('Error in item GET API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    return await itemController.PUT(request);
  } catch (error) {
    const denied = authorizationErrorResponse(error)
    if (denied) return denied
    console.error('Error in item PUT API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    return await itemController.DELETE(request);
  } catch (error) {
    const denied = authorizationErrorResponse(error)
    if (denied) return denied
    console.error('Error in item DELETE API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
