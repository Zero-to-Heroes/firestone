/**
 * Persistent compute worker for the Electron main process. Runs the CPU-heavy work
 * that used to block the main thread (docs/electron-memory-investigation.md):
 *
 *  - Plan F: BGS battle simulations (previously one worker per fight, with the whole
 *    cards DB cloned every time — the +150-240 MB RSS spikes per fight);
 *  - Plan H: end-of-game upload prep — full replay-XML parses (parseBattlegroundsGame,
 *    extractStatsForGame) and DEFLATE zips.
 *
 * Protocol: first an { type: 'init', cards } message (cards sent once per worker
 * lifetime), then requests correlated by id. Every request ends with a message
 * flagged done: true; battle simulations additionally post intermediate results with
 * done: false. Errors resolve to { ok: false } so callers can fall back.
 *
 * Bundled by apps/electron-app/build-worker.js (esbuild) because the packaged app's
 * node_modules doesn't contain the @firestone-hs/* deps
 * (../knowledge/bug-electron-bgs-simulator-worker.md).
 */
import { extractStatsForGame } from '@firestone-hs/build-global-stats/dist/stats-builder';
import {
	CardsPlayedByTurnParser,
	extractTotalDuration,
	extractTotalTurns,
	parseBattlegroundsGame,
	parseGame,
	parseHsReplayString,
} from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { AllCardsService } from '@firestone-hs/reference-data';
import { simulateBattle } from '@firestone-hs/simulate-bgs-battle';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { CardsData } from '@firestone-hs/simulate-bgs-battle/dist/cards/cards-data';
import { trimPowerLogLinesToLastCompletedGame } from '@firestone/power-log-parser';
import JSZip from 'jszip';
import * as fs from 'fs';
import { parentPort } from 'worker_threads';

if (!parentPort) {
	throw new Error('This file must be run as a worker thread');
}

let cards: AllCardsService | null = null;

type WorkerRequest =
	| { type: 'init'; cards: any }
	| { id: number; type: 'simulateBattle'; battleInfo: BgsBattleInfo }
	| {
			id: number;
			type: 'parseBattlegroundsGame';
			xml: string;
			mainPlayer: any;
			battleResultHistory: any;
			faceOffs: any;
	  }
	| { id: number; type: 'extractStatsForGame'; message: any; xml: string }
	| { id: number; type: 'extractReplayEssentials'; xml: string }
	| { id: number; type: 'zipSingleFile'; fileName: string; content: string }
	| { id: number; type: 'zipPowerLogFile'; path: string }
	| { id: number; type: 'parseJson'; text: string };

parentPort.on('message', async (data: WorkerRequest) => {
	if (data.type === 'init') {
		cards = Object.assign(new AllCardsService(), data.cards);
		return;
	}

	try {
		switch (data.type) {
			case 'simulateBattle': {
				const battleInfo = data.battleInfo;
				const cardsData = new CardsData(cards!, false);
				cardsData.inititialize(battleInfo.options.validTribes);
				const battleIterator = simulateBattle(battleInfo, cards!, cardsData);
				let result = battleIterator.next();
				while (!result.done) {
					parentPort!.postMessage({
						id: data.id,
						ok: true,
						result: JSON.stringify(result.value),
						done: false,
					});
					result = battleIterator.next();
				}
				parentPort!.postMessage({ id: data.id, ok: true, result: JSON.stringify(result.value), done: true });
				return;
			}
			case 'parseBattlegroundsGame': {
				const result = parseBattlegroundsGame(
					data.xml,
					data.mainPlayer,
					data.battleResultHistory,
					data.faceOffs,
					cards!,
				);
				parentPort!.postMessage({ id: data.id, ok: true, result: JSON.stringify(result), done: true });
				return;
			}
			case 'extractStatsForGame': {
				const result = await extractStatsForGame(data.message, data.xml, cards!);
				parentPort!.postMessage({ id: data.id, ok: true, result: JSON.stringify(result), done: true });
				return;
			}
			// Parses the replay XML and returns only the plain summary the upload
			// pipeline needs (ReplayEssentials), so the main thread never parses the
			// XML at all for BG games (Plan H phase 2)
			case 'extractReplayEssentials': {
				const replay = parseHsReplayString(data.xml, cards!);
				const parser = new CardsPlayedByTurnParser(cards!);
				parseGame(replay, [parser]);
				const essentials = {
					mainPlayerId: replay.mainPlayerId,
					mainPlayerCardId: replay.mainPlayerCardId,
					mainPlayerName: replay.mainPlayerName,
					mainPlayerHeroPowerCardId: replay.mainPlayerHeroPowerCardId,
					opponentPlayerId: replay.opponentPlayerId,
					opponentPlayerCardId: replay.opponentPlayerCardId,
					opponentPlayerName: replay.opponentPlayerName,
					opponentPlayerHeroPowerCardId: replay.opponentPlayerHeroPowerCardId,
					region: replay.region,
					gameType: replay.gameType,
					result: replay.result,
					additionalResult: replay.additionalResult,
					playCoin: replay.playCoin,
					totalDurationSeconds: extractTotalDuration(replay),
					totalDurationTurns: extractTotalTurns(replay),
					hasBgsQuests: replay.hasBgsQuests,
					bgsHeroQuests: replay.bgsHeroQuests,
					hasBgsAnomalies: replay.hasBgsAnomalies,
					bgsAnomalies: replay.bgsAnomalies,
					hasBgsTrinkets: replay.hasBgsTrinkets,
					hasBgsTimewarped: replay.hasBgsTimewarped,
					bgsHeroTrinkets: replay.bgsHeroTrinkets,
					bgsHeroTrinketsOffered: replay.bgsHeroTrinketsOffered,
					playerPlayedCardsByTurn: parser.cardsPlayedByTurn[replay.mainPlayerId] ?? [],
					playerCastCardsByTurn: parser.cardsCastByTurn[replay.mainPlayerId] ?? [],
					opponentPlayedCardsByTurn: parser.cardsPlayedByTurn[replay.opponentPlayerId] ?? [],
					opponentCastCardsByTurn: parser.cardsCastByTurn[replay.opponentPlayerId] ?? [],
				};
				parentPort!.postMessage({ id: data.id, ok: true, result: JSON.stringify(essentials), done: true });
				return;
			}
			// JSON.parse of large API payloads (Plan G (b)): the result goes back as a
			// structured clone (resultObject), NOT re-stringified — main pays the V8
			// deserialize instead of the full JSON tokenization
			case 'parseJson': {
				const parsed = data.text?.length ? JSON.parse(data.text) : null;
				parentPort!.postMessage({ id: data.id, ok: true, resultObject: parsed, done: true });
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
				parentPort!.postMessage({ id: data.id, ok: true, resultBytes: bytes, done: true }, [
					bytes.buffer as ArrayBuffer,
				]);
				return;
			}
			// End-of-game power.log upload (Plan C track 1 + the empty-upload bug,
			// docs/electron-memory-investigation.md): main only sends the file path; the
			// whole file is read, trimmed to the just-completed game and zipped here, so
			// the game log never lives on the main-process heap
			case 'zipPowerLogFile': {
				const content = fs.readFileSync(data.path, 'utf8');
				const gameLines = trimPowerLogLinesToLastCompletedGame(content.split(/\r?\n/));
				const gameLog = gameLines.join('\n');
				const zip = new JSZip();
				zip.file('power.log', gameLog);
				const bytes: Uint8Array = await zip.generateAsync({
					type: 'uint8array',
					compression: 'DEFLATE',
					compressionOptions: {
						level: 9,
					},
				});
				parentPort!.postMessage(
					{
						id: data.id,
						ok: true,
						resultBytes: bytes,
						result: JSON.stringify({ fileChars: content.length, gameLogChars: gameLog.length }),
						done: true,
					},
					[bytes.buffer as ArrayBuffer],
				);
				return;
			}
		}
	} catch (e: any) {
		parentPort!.postMessage({ id: (data as any).id, ok: false, error: e?.message ?? String(e), done: true });
	}
});
