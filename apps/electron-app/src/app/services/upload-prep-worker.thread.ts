/**
 * Persistent worker for the CPU-heavy parts of the end-of-game upload pipeline
 * (Plan H, docs/electron-memory-investigation.md): full replay-XML parses
 * (parseBattlegroundsGame, extractStatsForGame) and DEFLATE zips, which used to
 * block the Electron main thread for seconds after GAME_END.
 *
 * Protocol: first an { type: 'init', cards } message (cards sent once per worker
 * lifetime), then request/response pairs correlated by id. Results are
 * JSON-serialized (they are plain data); errors resolve to { ok: false } so the
 * caller can fall back to the main-thread path.
 *
 * Bundled by apps/electron-app/build-worker.js (esbuild) because the packaged
 * app's node_modules doesn't contain the @firestone-hs/* deps.
 */
import { extractStatsForGame } from '@firestone-hs/build-global-stats/dist/stats-builder';
import { parseBattlegroundsGame } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { AllCardsService } from '@firestone-hs/reference-data';
import JSZip from 'jszip';
import { parentPort } from 'worker_threads';

if (!parentPort) {
	throw new Error('This file must be run as a worker thread');
}

let cards: AllCardsService | null = null;

type WorkerRequest =
	| { type: 'init'; cards: any }
	| {
			id: number;
			type: 'parseBattlegroundsGame';
			xml: string;
			mainPlayer: any;
			battleResultHistory: any;
			faceOffs: any;
	  }
	| { id: number; type: 'extractStatsForGame'; message: any; xml: string }
	| { id: number; type: 'zipSingleFile'; fileName: string; content: string };

parentPort.on('message', async (data: WorkerRequest) => {
	if (data.type === 'init') {
		cards = Object.assign(new AllCardsService(), data.cards);
		return;
	}

	try {
		switch (data.type) {
			case 'parseBattlegroundsGame': {
				const result = parseBattlegroundsGame(
					data.xml,
					data.mainPlayer,
					data.battleResultHistory,
					data.faceOffs,
					cards!,
				);
				parentPort!.postMessage({ id: data.id, ok: true, result: JSON.stringify(result) });
				return;
			}
			case 'extractStatsForGame': {
				const result = await extractStatsForGame(data.message, data.xml, cards!);
				parentPort!.postMessage({ id: data.id, ok: true, result: JSON.stringify(result) });
				return;
			}
			case 'zipSingleFile': {
				const zip = new JSZip();
				zip.file(data.fileName, data.content);
				const bytes: Uint8Array = await zip.generateAsync({
					type: 'uint8array',
					compression: 'DEFLATE',
					compressionOptions: {
						level: 9,
					},
				});
				parentPort!.postMessage({ id: data.id, ok: true, resultBytes: bytes }, [bytes.buffer as ArrayBuffer]);
				return;
			}
		}
	} catch (e: any) {
		parentPort!.postMessage({ id: (data as any).id, ok: false, error: e?.message ?? String(e) });
	}
});
