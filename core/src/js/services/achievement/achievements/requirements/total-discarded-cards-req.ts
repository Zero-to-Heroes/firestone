import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class TotalDiscardedCardsReq implements Requirement {
	private totalDiscardedCards = 0;
	private completed = false;

	constructor(private readonly targetDiscardedCards: number) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length === 0) {
			console.error('invalid parameters for TotalDiscardedCardsReq', rawReq);
		}
		return new TotalDiscardedCardsReq(parseInt(rawReq.values[0]));
	}

	reset(): void {
		this.totalDiscardedCards = 0;
		this.completed = false;
	}

	afterAchievementCompletionReset(): void {
		this.totalDiscardedCards = 0;
		this.completed = true;
	}

	isCompleted(): boolean {
		return !this.completed && this.totalDiscardedCards >= this.targetDiscardedCards;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.DISCARD_CARD) {
			this.handleEvent(gameEvent);
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		const localPlayerId = gameEvent.localPlayer?.PlayerId;
		const controllerId = gameEvent.controllerId;
		// We check that the cardID is indeed our cardId, in case of mirror matches for instance
		if (controllerId === localPlayerId) {
			this.totalDiscardedCards++;
		}
	}
}
