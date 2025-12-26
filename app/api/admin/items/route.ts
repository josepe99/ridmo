import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { ItemController } from '@/lib/controllers/item.controller';

const itemController = new ItemController();

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    return await itemController.GET(request);
  } catch (error) {
    console.error('Error in items GET API:', error);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    return await itemController.POST(request);
  } catch (error) {
    console.error('Error in items POST API:', error);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}
