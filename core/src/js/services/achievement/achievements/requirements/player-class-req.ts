import { CardsFacadeService } from '@services/cards-facade.service';
import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class PlayerClassReq implements Requirement {
	private isCorrectPlayerClass: boolean;

	constructor(private readonly playerClass: string, private readonly cards: CardsFacadeService) {}

	public static create(rawReq: RawRequirement, cards: CardsFacadeService): Requirement {
		if (!rawReq.values || rawReq.values.length !== 1) {
			console.error('invalid parameters for PlayerClassReq', rawReq);
		}
		return new PlayerClassReq(rawReq.values[0], cards);
	}

	reset(): void {
		this.isCorrectPlayerClass = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.isCorrectPlayerClass = undefined;
	}

	isCompleted(): boolean {
		return this.isCorrectPlayerClass;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.LOCAL_PLAYER) {
			this.handleEvent(gameEvent);
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		const localPlayer = gameEvent.localPlayer;
		const cardId = gameEvent.gameState?.Player?.Hero?.cardId ?? localPlayer?.CardID;
		if (cardId) {
			const card = this.cards.getCard(cardId);
			const playerClass = card && card.playerClass ? card.playerClass.toLowerCase() : null;
			this.isCorrectPlayerClass = playerClass === this.playerClass;
		}
	}
}
