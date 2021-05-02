import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class CardNotPlayedReq implements Requirement {
	private isCardPlayed: boolean;

	constructor(private readonly cardId: string) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length !== 1) {
			console.error('invalid parameters for CardNotPlayedReq', rawReq);
		}
		return new CardNotPlayedReq(rawReq.values[0]);
	}

	reset(): void {
		this.isCardPlayed = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.isCardPlayed = undefined;
	}

	isCompleted(): boolean {
		return !this.isCardPlayed;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.CARD_PLAYED) {
			// console.log('handling passive buff event', this.cardId, gameEvent, this);
			this.detectCardPlayedEvent(gameEvent);
			return;
		}
	}

	private detectCardPlayedEvent(gameEvent: GameEvent) {
		const cardId = gameEvent.cardId;
		const controllerId = gameEvent.controllerId;
		const localPlayer = gameEvent.localPlayer;
		if (cardId === this.cardId && controllerId === localPlayer?.PlayerId) {
			this.isCardPlayed = true;
		}
	}
}
