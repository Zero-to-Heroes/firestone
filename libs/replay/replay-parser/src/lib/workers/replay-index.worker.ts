/// <reference lib="webworker" />

import { buildReplayIndex } from './replay-index-builder';

addEventListener('message', ({ data }) => {
	try {
		const index = buildReplayIndex(data.xml as string);
		postMessage({
			type: 'index',
			turnCount: index.turnChunks.length,
			totalDuration: index.totalDuration,
			turnTimestamps: index.turnTimestamps,
		});
	} catch (error) {
		postMessage({
			type: 'error',
			message: error instanceof Error ? error.message : String(error),
		});
	}
});
