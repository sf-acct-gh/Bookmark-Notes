import { getSnapshot, subscribe } from '../../../lib/server/store';
import type { BookmarkData } from '../../../lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
	const encoder = new TextEncoder();
	let unsubscribe: () => void = () => {};

	const stream = new ReadableStream({
		async start(controller) {
			const send = (data: BookmarkData) => {
				controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
			};

			send(await getSnapshot());
			unsubscribe = subscribe(send);

			request.signal.addEventListener('abort', () => {
				unsubscribe();
				try {
					controller.close();
				} catch {
					// already closed
				}
			});
		},
		cancel() {
			unsubscribe();
		}
	});

	return new Response(stream, {
		headers: {
			'content-type': 'text/event-stream',
			'cache-control': 'no-cache',
			connection: 'keep-alive'
		}
	});
};
