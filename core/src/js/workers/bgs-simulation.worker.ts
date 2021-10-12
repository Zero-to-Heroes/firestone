import { AllCardsService } from '@firestone-hs/reference-data';
import { simulateBattle } from '@firestone-hs/simulate-bgs-battle';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { CardsData } from '@firestone-hs/simulate-bgs-battle/dist/cards/cards-data';
import { SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';

const ctx: Worker = self as any;

// Respond to message from parent thread
ctx.onmessage = async (ev) => {
	const battleInfo: BgsBattleInfo = ev.data.battleMessage;
	const cards: AllCardsService = Object.assign(new AllCardsService(), ev.data.cards);

	const cardsData = new CardsData(cards, false);
	cardsData.inititialize(battleInfo.options.validTribes);

	const result: SimulationResult = simulateBattle(battleInfo, cards, cardsData);

	ctx.postMessage(JSON.stringify(result));
};
