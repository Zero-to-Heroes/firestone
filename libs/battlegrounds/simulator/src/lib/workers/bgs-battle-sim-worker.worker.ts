/// <reference lib="webworker" />

/**
 * Persistent compute web worker (Overwolf / renderer-side counterpart of the Electron
 * compute worker — Plans F and H, docs/electron-memory-investigation.md):
 *
 *  - BGS battle simulations (previously one worker per fight, with the whole cards DB
 *    cloned every time);
 *  - end-of-game upload prep — full replay-XML parses (extractReplayEssentials,
 *    parseBattlegroundsGame, extractStatsForGame) and DEFLATE zips, which used to
 *    block the background renderer for seconds after GAME_END.
 *
 * Protocol: one { type: 'init', cards } message per worker lifetime (the cards DB is
 * cloned once, not once per fight), then { id, type, ... } requests. Every request
 * ends with a message flagged done: true; battle simulations additionally post
 * intermediate results with done: false. Errors resolve to { result: null } so the
 * host can fall back to its main-thread path.
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
import { SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';
import JSZip from 'jszip';

let cards: AllCardsService | null = null;

addEventListener('message', async ({ data }) => {
	if (data?.type === 'init') {
		cards = Object.assign(new AllCardsService(), data.cards);
		return;
	}
	const id: number = data?.id;
	if (id == null) {
		return;
	}

	try {
		switch (data.type) {
			case 'simulateBattle': {
				const battleInfo: BgsBattleInfo = data.battleInfo;
				const cardsData = new CardsData(cards!, false);
				cardsData.inititialize(battleInfo.options.validTribes);

				const battleIterator = simulateBattle(battleInfo, cards!, cardsData);
				let result = battleIterator.next();
				while (!result.done) {
					const simulationResult: SimulationResult = result.value;
					postMessage({ id: id, done: false, result: JSON.stringify(simulationResult) });
					result = battleIterator.next();
				}
				const simulationResult: SimulationResult = result.value;
				postMessage({ id: id, done: true, result: JSON.stringify(simulationResult) });
				return;
			}
			// Same summary extraction as the Electron compute worker (Plan H phase 2):
			// the caller never parses the replay XML on its own thread for BG games
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
				postMessage({ id: id, done: true, result: JSON.stringify(essentials) });
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
				postMessage({ id: id, done: true, result: JSON.stringify(result) });
				return;
			}
			case 'extractStatsForGame': {
				const result = await extractStatsForGame(data.message, data.xml, cards!);
				postMessage({ id: id, done: true, result: JSON.stringify(result) });
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
				postMessage({ id: id, done: true, resultBytes: bytes }, { transfer: [bytes.buffer as ArrayBuffer] });
				return;
			}
			default:
				postMessage({ id: id, done: true, result: null });
		}
	} catch (e) {
		console.error('Exception in compute worker', data?.type, e);
		postMessage({ id: id, done: true, result: null });
	}
});
