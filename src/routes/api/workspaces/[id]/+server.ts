import { json } from '@sveltejs/kit';
import { deleteWorkspace, renameWorkspace, ValidationError } from '../../../../lib/server/store';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const body = await request.json().catch(() => ({}));
	try {
		const workspace = await renameWorkspace(params.id, String(body.name ?? ''));
		return json(workspace);
	} catch (err) {
		if (err instanceof ValidationError) return json({ error: err.message }, { status: 400 });
		throw err;
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		await deleteWorkspace(params.id);
		return new Response(null, { status: 204 });
	} catch (err) {
		if (err instanceof ValidationError) return json({ error: err.message }, { status: 400 });
		throw err;
	}
};
