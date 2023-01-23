import { CardsFacadeService } from '@firestone/shared/framework/core';
import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class BoardFullOfSameLegendaryMinionReq implements Requirement {
	private isConditionMet: boolean;

	constructor(private readonly cards: CardsFacadeService) {}

	public static create(rawReq: RawRequirement, cards: CardsFacadeService): Requirement {
		return new BoardFullOfSameLegendaryMinionReq(cards);
	}

	reset(): void {
		this.isConditionMet = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.isConditionMet = undefined;
	}

	isCompleted(): boolean {
		return this.isConditionMet;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.gameState) {
			this.handleEvent(gameEvent);
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		if (gameEvent.gameState && gameEvent.gameState.Player && gameEvent.gameState.Player.Board) {
			const board = gameEvent.gameState.Player.Board;
			const legendaryMinionsOnBoard = board
				.filter((entity) => entity.cardId && entity.cardId.length > 0)
				.map((entity) => this.cards.getCard(entity.cardId))
				.filter((card) => card)
				.filter((card) => card.rarity && card.rarity.toLowerCase() === 'legendary')
				.filter((card) => card.type && card.type.toLowerCase() === 'minion');
			const numberOfLegendaryMinions = legendaryMinionsOnBoard.length;
			const numberOfDifferentMinions =
				legendaryMinionsOnBoard.length > 0
					? [...new Set(legendaryMinionsOnBoard.map((entity) => entity.id))].length
					: 0;
			this.isConditionMet = numberOfLegendaryMinions === 7 && numberOfDifferentMinions === 1;
		}
	}
}
