import { json } from '@sveltejs/kit';
import { deleteSection, renameSection, ValidationError } from '../../../../../../lib/server/store';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const body = await request.json().catch(() => ({}));
	try {
		const section = await renameSection(params.workspaceId, params.id, String(body.name ?? ''));
		return json(section);
	} catch (err) {
		if (err instanceof ValidationError) return json({ error: err.message }, { status: 400 });
		throw err;
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		await deleteSection(params.workspaceId, params.id);
		return new Response(null, { status: 204 });
	} catch (err) {
		if (err instanceof ValidationError) return json({ error: err.message }, { status: 404 });
		throw err;
	}
};
