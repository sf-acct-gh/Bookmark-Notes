import { getSnapshot, todayStamp } from '../../../lib/server/store';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const data = await getSnapshot();
	const filename = `bookmark-notes-backup-${todayStamp()}.json`;
	return new Response(JSON.stringify(data, null, 2), {
		headers: {
			'content-type': 'application/json',
			'content-disposition': `attachment; filename="${filename}"`
		}
	});
};
