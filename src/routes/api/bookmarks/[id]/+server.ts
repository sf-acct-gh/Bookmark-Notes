import { json } from '@sveltejs/kit';
import {
	deleteBookmark,
	findBookmarkWorkspaceId,
	findDuplicateUrl,
	updateBookmark,
	ValidationError
} from '../../../../lib/server/store';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const body = await request.json().catch(() => ({}));
	const url = String(body.url ?? '');

	try {
		if (!body.allowDuplicate) {
			const workspaceId = await findBookmarkWorkspaceId(params.id);
			const duplicate = await findDuplicateUrl(workspaceId, url, params.id);
			if (duplicate) return json({ duplicate }, { status: 409 });
		}

		const bookmark = await updateBookmark(params.id, {
			name: String(body.name ?? ''),
			url,
			notes: body.notes ? String(body.notes) : '',
			sectionId: String(body.sectionId ?? '')
		});
		return json(bookmark);
	} catch (err) {
		if (err instanceof ValidationError) return json({ error: err.message }, { status: 400 });
		throw err;
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		await deleteBookmark(params.id);
		return new Response(null, { status: 204 });
	} catch (err) {
		if (err instanceof ValidationError) return json({ error: err.message }, { status: 404 });
		throw err;
	}
};
