import { GlobalStats } from '@firestone-hs/build-global-stats/dist/model/global-stats';
import { ReviewMessage } from '@firestone-hs/build-global-stats/dist/review-message';
import {
	BattleResultHistory,
	BgsFaceOff,
	BgsPlayer,
	BgsPostMatchStats,
} from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { ReplayEssentials } from '../models/replay-essentials';

/**
 * Offloads the CPU-heavy parts of the end-of-game upload pipeline (full replay-XML
 * parses and DEFLATE compression) to another thread, so the process that owns the
 * windows doesn't get flagged "Not responding" (see
 * docs/electron-memory-investigation.md, Plan H).
 *
 * Only Electron provides an implementation (a persistent worker_threads worker);
 * when absent, callers fall back to their historical main-thread path. Every method
 * returns null on failure so callers can always fall back.
 */
export abstract class UploadPrepExecutorService {
	/**
	 * Parses the full replay XML off-thread and returns only the plain summary the
	 * upload pipeline needs, so the main thread never has to parse the XML at all
	 * (Plan H phase 2). Includes the CardsPlayedByTurnParser walk.
	 */
	abstract extractReplayEssentials(replayXml: string): Promise<ReplayEssentials | null>;

	abstract parseBattlegroundsGame(
		replayXml: string,
		mainPlayer: BgsPlayer,
		battleResultHistory: readonly BattleResultHistory[],
		faceOffs: readonly BgsFaceOff[],
	): Promise<BgsPostMatchStats | null>;

	abstract extractStatsForGame(message: ReviewMessage, replayXml: string): Promise<GlobalStats | null>;

	/** Returns the bytes of a zip archive containing the single given file, DEFLATE level 9 */
	abstract zipSingleFile(fileName: string, content: string): Promise<Uint8Array | null>;

	/**
	 * Reads the on-disk Power.log at `path`, trims it to the last completed game and
	 * zips it (as `power.log`, DEFLATE level 9) — entirely off-thread, so the game log
	 * never has to be buffered on the caller's heap (Plan C track 1 / the Electron
	 * empty-power.log-upload bug). Default implementation returns null (no file
	 * access), which makes callers fall back to the in-memory PowerLogBufferService.
	 */
	zipPowerLogFile(path: string): Promise<Uint8Array | null> {
		return Promise.resolve(null);
	}
}
