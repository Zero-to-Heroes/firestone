import { ReplayIndex, ReplayIndexMeta } from '../models/replay-index';
import { GameHistoryItem } from '../models/models';
import { HistoryItem } from '../models/history/history-item';
import { XmlParserService } from './xml-parser.service';

export function buildReplayIndex(replayAsString: string): ReplayIndex {
	const xmlParser = new XmlParserService();
	const turnChunks: HistoryItem[][] = [];
	let meta: ReplayIndexMeta | null = null;

	for (const chunk of xmlParser.parseXml(replayAsString)) {
		if (!chunk?.length) {
			continue;
		}
		if (!meta && chunk[0] instanceof GameHistoryItem) {
			const gameHistory = chunk[0] as GameHistoryItem;
			meta = {
				buildNumber: gameHistory.buildNumber,
				formatType: gameHistory.formatType,
				gameType: gameHistory.gameType,
				scenarioID: gameHistory.scenarioID,
			};
		}
		turnChunks.push([...chunk]);
	}

	const turnTimestamps = turnChunks.map((chunk) => getLastTimestamp(chunk));
	const totalDuration = turnTimestamps.length ? turnTimestamps[turnTimestamps.length - 1] : 0;

	return {
		meta,
		turnChunks,
		entityCardId: xmlParser.getEntityCardIdMap(),
		turnTimestamps,
		totalDuration,
	};
}

function getLastTimestamp(chunk: readonly HistoryItem[]): number {
	for (let i = chunk.length - 1; i >= 0; i--) {
		if (chunk[i].timestamp != null) {
			return chunk[i].timestamp;
		}
	}
	return 0;
}
