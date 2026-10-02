import { error } from '@sveltejs/kit';
import { getSnapshot, slugify, todayStamp } from '../../../../lib/server/store';
import type { BookmarkData } from '../../../../lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const snapshot = await getSnapshot();
	const workspace = snapshot.workspaces.find((w) => w.id === params.workspaceId);
	if (!workspace) throw error(404, 'Workspace not found');

	const payload: BookmarkData = { workspaces: [workspace] };
	const filename = `bookmark-notes-${slugify(workspace.name)}-${todayStamp()}.json`;
	return new Response(JSON.stringify(payload, null, 2), {
		headers: {
			'content-type': 'application/json',
			'content-disposition': `attachment; filename="${filename}"`
		}
	});
};
