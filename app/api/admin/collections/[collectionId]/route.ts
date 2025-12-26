import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { CollectionController } from '@/lib/controllers/collection.controller';

const collectionController = new CollectionController();

export async function PUT(request: NextRequest, { params }: { params: { collectionId: string } }) {
	try {
		await requireAdmin();
		const id = params.collectionId;
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
		console.error('Error updating collection:', error);
		return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 });
	}
}
