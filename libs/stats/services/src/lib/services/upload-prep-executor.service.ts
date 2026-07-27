import { GlobalStats } from '@firestone-hs/build-global-stats/dist/model/global-stats';
import { ReviewMessage } from '@firestone-hs/build-global-stats/dist/review-message';
import {
	BattleResultHistory,
	BgsFaceOff,
	BgsPlayer,
	BgsPostMatchStats,
} from '@firestone-hs/hs-replay-xml-parser/dist/public-api';

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
	abstract parseBattlegroundsGame(
		replayXml: string,
		mainPlayer: BgsPlayer,
		battleResultHistory: readonly BattleResultHistory[],
		faceOffs: readonly BgsFaceOff[],
	): Promise<BgsPostMatchStats | null>;

	abstract extractStatsForGame(message: ReviewMessage, replayXml: string): Promise<GlobalStats | null>;

	/** Returns the bytes of a zip archive containing the single given file, DEFLATE level 9 */
	abstract zipSingleFile(fileName: string, content: string): Promise<Uint8Array | null>;
}
