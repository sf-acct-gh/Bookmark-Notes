import { json } from '@sveltejs/kit';
import { getSnapshot } from '../../../lib/server/store';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return json(await getSnapshot());
};
