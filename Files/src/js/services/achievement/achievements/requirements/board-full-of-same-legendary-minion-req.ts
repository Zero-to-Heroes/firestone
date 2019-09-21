import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { AllCardsService } from '../../../all-cards.service';
import { Requirement } from './_requirement';

export class BoardFullOfSameLegendaryMinionReq implements Requirement {
	private isConditionMet: boolean;

	constructor(private readonly cards: AllCardsService) {}

	public static create(rawReq: RawRequirement, cards: AllCardsService): Requirement {
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
			const board: { entityId: number; cardId: string }[] = gameEvent.gameState.Player.Board;
			const realBoard = board.filter(entity => entity.cardId && entity.cardId.length > 0);
			const numberOfMinions = board.length;
			const numberOfDifferentMinions =
				realBoard && realBoard.length > 0 ? [...new Set(realBoard.map(entity => entity.cardId))].length : 0;
			const isMinionLegendary =
				realBoard && realBoard.length > 0 && (this.cards.getCard(realBoard[0].cardId).rarity || '').toLowerCase() === 'legendary';
			this.isConditionMet = numberOfMinions === 7 && numberOfDifferentMinions === 1 && isMinionLegendary;
		}
	}
}
