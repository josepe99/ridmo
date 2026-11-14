import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/modules/users/server';
import { authorizationErrorResponse } from '@/modules/users/errors'
import { CollectionController } from '@/modules/admin/server';

const collectionController = new CollectionController();

export async function PUT(request: NextRequest, { params }: { params: Promise<{ collectionId: string }> }) {
	try {
		await requireAdmin();
		const { collectionId: id } = await params;
		const body = await request.json();
		// Actualizar la colección
		const updated = await collectionController.updateCollection(id, body);
		if (!updated) {
			return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
		}
		// Obtener la colección actualizada
		const result = await collectionController.getCollectionById(id);
		return NextResponse.json(result);
	} catch (error) {
		const denied = authorizationErrorResponse(error)
		if (denied) return denied
		console.error('Error updating collection:', error);
		return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 });
	}
}
