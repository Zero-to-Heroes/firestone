import { AllCardsService } from '@firestone-hs/reference-data';
import { simulateBattle } from '@firestone-hs/simulate-bgs-battle';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { CardsData } from '@firestone-hs/simulate-bgs-battle/dist/cards/cards-data';
import { BgsBattleSimulationResult } from '../models/battlegrounds/bgs-battle-simulation-result';

// console.log('creating worker');
const ctx: Worker = self as any;

const cards = new AllCardsService();
const cardsData = new CardsData(cards, false);

// Respond to message from parent thread
ctx.onmessage = async ev => {
	await cards.initializeCardsDb();
	cardsData.inititialize();
	// console.log('cards info initialized', ev);

	const battleInfo: BgsBattleInfo = ev.data;
	// console.log('received message in worker', battleInfo, ev);

	const result: BgsBattleSimulationResult = simulateBattle(battleInfo, cards, cardsData);
	// console.log('worker result', result);

	ctx.postMessage(JSON.stringify(result));
};
