/// <reference lib="webworker" />

import { buildReplayIndex } from '../../../libs/replay/replay-parser/src/lib/services/replay-index-builder';
import { serializeReplayIndex } from '../../../libs/replay/replay-parser/src/lib/services/replay-index-transfer';

addEventListener('message', ({ data }) => {
	try {
		const index = buildReplayIndex(data.xml as string);
		postMessage({
			type: 'index',
			index: serializeReplayIndex(index),
		});
	} catch (error) {
		postMessage({
			type: 'error',
			message: error instanceof Error ? error.message : String(error),
		});
	}
});
