/// <reference lib="webworker" />

/**
 * Persistent BGS battle-sim web worker (Overwolf / renderer-side counterpart of the
 * Electron compute worker — Plan F, docs/electron-memory-investigation.md).
 *
 * Protocol: one { type: 'init', cards } message per worker lifetime (the cards DB is
 * cloned once, not once per fight), then { id, type: 'simulateBattle', battleInfo }
 * requests. Every request ends with a message flagged done: true; intermediate
 * results are posted with done: false. Errors resolve to { result: null } so the
 * host can fall back.
 */
import { AllCardsService } from '@firestone-hs/reference-data';
import { simulateBattle } from '@firestone-hs/simulate-bgs-battle';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { CardsData } from '@firestone-hs/simulate-bgs-battle/dist/cards/cards-data';
import { SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';

let cards: AllCardsService | null = null;

addEventListener('message', ({ data }) => {
	if (data?.type === 'init') {
		cards = Object.assign(new AllCardsService(), data.cards);
		return;
	}
	if (data?.type !== 'simulateBattle') {
		return;
	}

	const id: number = data.id;
	const battleInfo: BgsBattleInfo = data.battleInfo;
	try {
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
	} catch (e) {
		console.warn('no-format', 'battleInfo', JSON.stringify(battleInfo));
		console.error('Exception while simulating battle', e);
		postMessage({ id: id, done: true, result: null });
	}
});
