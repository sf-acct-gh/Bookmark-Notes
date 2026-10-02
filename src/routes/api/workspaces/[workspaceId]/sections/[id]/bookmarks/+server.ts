import { json } from '@sveltejs/kit';
import {
	addBookmark,
	findDuplicateUrl,
	ValidationError
} from '../../../../../../../lib/server/store';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const body = await request.json().catch(() => ({}));
	const url = String(body.url ?? '');

	if (!body.allowDuplicate) {
		const duplicate = await findDuplicateUrl(params.workspaceId, url);
		if (duplicate) return json({ duplicate }, { status: 409 });
	}

	try {
		const bookmark = await addBookmark(params.workspaceId, params.id, {
			name: String(body.name ?? ''),
			url,
			notes: body.notes ? String(body.notes) : ''
		});
		return json(bookmark, { status: 201 });
	} catch (err) {
		if (err instanceof ValidationError) return json({ error: err.message }, { status: 400 });
		throw err;
	}
};
