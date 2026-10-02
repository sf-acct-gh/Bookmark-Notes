import { json } from '@sveltejs/kit';
import { createSection, ValidationError } from '../../../../../lib/server/store';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const body = await request.json().catch(() => ({}));
	try {
		const section = await createSection(params.workspaceId, String(body.name ?? ''));
		return json(section, { status: 201 });
	} catch (err) {
		if (err instanceof ValidationError) return json({ error: err.message }, { status: 400 });
		throw err;
	}
};
