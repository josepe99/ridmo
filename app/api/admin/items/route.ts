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
    console.error('Error in items GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    return await itemController.POST(request);
  } catch (error) {
    const denied = authorizationErrorResponse(error)
    if (denied) return denied
    console.error('Error in items POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
