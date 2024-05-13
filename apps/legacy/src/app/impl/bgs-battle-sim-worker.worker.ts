/// <reference lib="webworker" />

import { AllCardsService } from '@firestone-hs/reference-data';
import { simulateBattle } from '@firestone-hs/simulate-bgs-battle';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { CardsData } from '@firestone-hs/simulate-bgs-battle/dist/cards/cards-data';
import { SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';

addEventListener('message', ({ data }) => {
	const battleInfo: BgsBattleInfo = data.battleMessage;
	const cards: AllCardsService = Object.assign(new AllCardsService(), data.cards);

	const cardsData = new CardsData(cards, false);
	cardsData.inititialize(battleInfo.options.validTribes);

	try {
		const result: SimulationResult = simulateBattle(battleInfo, cards, cardsData);
		postMessage(JSON.stringify(result));
	} catch (e) {
		console.warn('no-format', 'battleInfo', battleInfo);
		console.error('Exception while simulating battle', e);
		postMessage(null);
	}
});
