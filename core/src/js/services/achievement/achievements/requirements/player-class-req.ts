import { AllCardsService } from '@firestone-hs/replay-parser';
import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class PlayerClassReq implements Requirement {
	private isCorrectPlayerClass: boolean;

	constructor(private readonly playerClass: string, private readonly cards: AllCardsService) {}

	public static create(rawReq: RawRequirement, cards: AllCardsService): Requirement {
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
		if (localPlayer?.CardID) {
			const card = this.cards.getCard(localPlayer?.CardID);
			const playerClass = card && card.playerClass ? card.playerClass.toLowerCase() : null;
			this.isCorrectPlayerClass = playerClass === this.playerClass;
		}
	}
}
