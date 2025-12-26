import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { ItemController } from '@/lib/controllers/item.controller';

const itemController = new ItemController();

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    return await itemController.GET(request);
  } catch (error) {
    console.error('Error in item GET API:', error);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    return await itemController.PUT(request);
  } catch (error) {
    console.error('Error in item PUT API:', error);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    return await itemController.DELETE(request);
  } catch (error) {
    console.error('Error in item DELETE API:', error);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}
