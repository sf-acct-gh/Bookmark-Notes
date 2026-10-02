import { json } from '@sveltejs/kit';
import { createWorkspace, ValidationError } from '../../../lib/server/store';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => ({}));
	try {
		const workspace = await createWorkspace(String(body.name ?? ''));
		return json(workspace, { status: 201 });
	} catch (err) {
		if (err instanceof ValidationError) return json({ error: err.message }, { status: 400 });
		throw err;
	}
};
