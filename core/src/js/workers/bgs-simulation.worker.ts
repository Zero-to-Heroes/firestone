import { AllCardsService } from '@firestone-hs/reference-data';
import { simulateBattle } from '@firestone-hs/simulate-bgs-battle';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { CardsData } from '@firestone-hs/simulate-bgs-battle/dist/cards/cards-data';
import { SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';

// console.log('creating worker');
const ctx: Worker = self as any;

const cards = new AllCardsService();
cards.initializeCardsDb();

// Respond to message from parent thread
ctx.onmessage = async ev => {
	// console.debug('[bgs-simulation] simulator received event');
	await cards.initializeCardsDb();
	// console.debug('[bgs-simulation] cards info initialized');

	const battleInfo: BgsBattleInfo = ev.data;
	const cardsData = new CardsData(cards, false);
	cardsData.inititialize(battleInfo.options.validTribes);
	// console.debug('[bgs-simulation] cards data initialized');

	const result: SimulationResult = simulateBattle(battleInfo, cards, cardsData);
	// console.debug('[bgs-simulation] simulation completed');

	ctx.postMessage(JSON.stringify(result));
};
