import { Map } from 'immutable';
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
		meta = meta ?? extractMeta(chunk);
		turnChunks.push([...chunk]);
	}

	return finalizeReplayIndex(turnChunks, meta, xmlParser.getEntityCardIdMap());
}

export function extractMeta(chunk: readonly HistoryItem[]): ReplayIndexMeta | null {
	if (!(chunk[0] instanceof GameHistoryItem)) {
		return null;
	}
	const gameHistory = chunk[0] as GameHistoryItem;
	return {
		buildNumber: gameHistory.buildNumber,
		formatType: gameHistory.formatType,
		gameType: gameHistory.gameType,
		scenarioID: gameHistory.scenarioID,
	};
}

export function finalizeReplayIndex(
	turnChunks: readonly (readonly HistoryItem[])[],
	meta: ReplayIndexMeta | null,
	entityCardId: Map<number, string>,
): ReplayIndex {
	const turnTimestamps = turnChunks.map((chunk) => getLastTimestamp(chunk));
	const totalDuration = turnTimestamps.length ? turnTimestamps[turnTimestamps.length - 1] : 0;

	return {
		meta,
		turnChunks,
		entityCardId,
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
