import { Injectable } from '@angular/core';
import { GlobalStats } from '@firestone-hs/build-global-stats/dist/model/global-stats';
import { ReviewMessage } from '@firestone-hs/build-global-stats/dist/review-message';
import {
	BattleResultHistory,
	BgsFaceOff,
	BgsPlayer,
	BgsPostMatchStats,
} from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { UploadPrepExecutorService } from '@firestone/stats/services';
import { ComputeWorkerHost } from './compute-worker-host';

/**
 * Electron implementation of UploadPrepExecutorService (Plan H,
 * docs/electron-memory-investigation.md): runs the replay-XML parses and DEFLATE
 * zips of the end-of-game upload pipeline in the persistent compute worker, instead
 * of blocking the main thread for seconds after GAME_END.
 *
 * Any failure resolves to null, which makes the callers fall back to their
 * main-thread path.
 */
@Injectable()
export class UploadPrepWorkerService extends UploadPrepExecutorService {
	constructor(private readonly workerHost: ComputeWorkerHost) {
		super();
	}

	public async parseBattlegroundsGame(
		replayXml: string,
		mainPlayer: BgsPlayer,
		battleResultHistory: readonly BattleResultHistory[],
		faceOffs: readonly BgsFaceOff[],
	): Promise<BgsPostMatchStats | null> {
		const response = await this.workerHost.request({
			type: 'parseBattlegroundsGame',
			xml: replayXml,
			mainPlayer: mainPlayer,
			battleResultHistory: battleResultHistory,
			faceOffs: faceOffs,
		});
		return response?.ok && response.result ? JSON.parse(response.result) : null;
	}

	public async extractStatsForGame(message: ReviewMessage, replayXml: string): Promise<GlobalStats | null> {
		const response = await this.workerHost.request({
			type: 'extractStatsForGame',
			message: message,
			xml: replayXml,
		});
		return response?.ok && response.result ? JSON.parse(response.result) : null;
	}

	public async zipSingleFile(fileName: string, content: string): Promise<Uint8Array | null> {
		const response = await this.workerHost.request({
			type: 'zipSingleFile',
			fileName: fileName,
			content: content,
		});
		return response?.ok && response.resultBytes ? response.resultBytes : null;
	}
}
