/// <reference lib="webworker" />

import { AllCardsService } from '@firestone-hs/reference-data';
import { simulateBattle } from '@firestone-hs/simulate-bgs-battle';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { CardsData } from '@firestone-hs/simulate-bgs-battle/dist/cards/cards-data';
import { SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';

addEventListener('message', ({ data }) => {
	const battleMessages: readonly BgsBattleInfo[] = data?.battleMessages;
	if (!battleMessages?.length) {
		return;
	}

	const cards: AllCardsService = Object.assign(new AllCardsService(), data.cards);

	const cardsData = new CardsData(cards, false);
	cardsData.inititialize(battleMessages[0].options.validTribes);

	const permutationResults: InternalPermutationResult[] = [];
	// let i = 0;

	for (const battleInfo of battleMessages) {
		const permutationResult: SimulationResult = simulateBattle(battleInfo, cards, cardsData);
		if (!!permutationResult) {
			permutationResults.push({
				permutation: battleInfo.playerBoard.board,
				result: {
					...permutationResult,
					outcomeSamples: undefined,
				},
			});
		}
	}

	postMessage(JSON.stringify(permutationResults));
});

export type Permutation = BoardEntity[];
export type Chunk = Permutation[];

export interface InternalPermutationResult {
	readonly permutation: Permutation;
	readonly result: SimulationResult;
}
