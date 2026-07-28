import { Injectable } from '@angular/core';
import { GlobalStats } from '@firestone-hs/build-global-stats/dist/model/global-stats';
import { ReviewMessage } from '@firestone-hs/build-global-stats/dist/review-message';
import {
	BattleResultHistory,
	BgsFaceOff,
	BgsPlayer,
	BgsPostMatchStats,
} from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { ReplayEssentials, UploadPrepExecutorService } from '@firestone/stats/services';
import { BgsBattleSimulationWorkerService } from './bgs-battle-simulation-worker.service';

/**
 * Web-worker implementation of UploadPrepExecutorService (Plan H port to Overwolf,
 * docs/electron-memory-investigation.md): runs the replay-XML parses and DEFLATE
 * zips of the end-of-game upload pipeline in the shared persistent compute worker
 * (the same worker, and cards copy, as the BGS battle sims), instead of blocking
 * the background renderer for seconds after GAME_END.
 *
 * Any failure resolves to null, which makes the callers fall back to their
 * historical main-thread path.
 */
@Injectable()
export class WebWorkerUploadPrepService extends UploadPrepExecutorService {
	constructor(private readonly workerHost: BgsBattleSimulationWorkerService) {
		super();
	}

	public async extractReplayEssentials(replayXml: string): Promise<ReplayEssentials | null> {
		const response = await this.workerHost.requestOnce({
			type: 'extractReplayEssentials',
			xml: replayXml,
		});
		return response?.result ? JSON.parse(response.result) : null;
	}

	public async parseBattlegroundsGame(
		replayXml: string,
		mainPlayer: BgsPlayer,
		battleResultHistory: readonly BattleResultHistory[],
		faceOffs: readonly BgsFaceOff[],
	): Promise<BgsPostMatchStats | null> {
		const response = await this.workerHost.requestOnce({
			type: 'parseBattlegroundsGame',
			xml: replayXml,
			mainPlayer: mainPlayer,
			battleResultHistory: battleResultHistory,
			faceOffs: faceOffs,
		});
		return response?.result ? JSON.parse(response.result) : null;
	}

	public async extractStatsForGame(message: ReviewMessage, replayXml: string): Promise<GlobalStats | null> {
		const response = await this.workerHost.requestOnce({
			type: 'extractStatsForGame',
			message: message,
			xml: replayXml,
		});
		return response?.result ? JSON.parse(response.result) : null;
	}

	public async zipSingleFile(fileName: string, content: string): Promise<Uint8Array | null> {
		const response = await this.workerHost.requestOnce({
			type: 'zipSingleFile',
			fileName: fileName,
			content: content,
		});
		return response?.resultBytes ?? null;
	}
}
