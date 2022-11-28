import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class CardDrawnOrReceivedInHandReq implements Requirement {
	private isCardDrawn: boolean;

	constructor(private readonly cardId: string) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length !== 1) {
			console.error('invalid parameters for CardDrawnOrReceivedInHandReq', rawReq);
		}
		return new CardDrawnOrReceivedInHandReq(rawReq.values[0]);
	}

	reset(): void {
		this.isCardDrawn = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.isCardDrawn = undefined;
	}

	isCompleted(): boolean {
		return this.isCardDrawn;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.CARD_DRAW_FROM_DECK || gameEvent.type === GameEvent.RECEIVE_CARD_IN_HAND) {
			this.detectCardPlayedEvent(gameEvent);
			return;
		}
	}

	private detectCardPlayedEvent(gameEvent: GameEvent) {
		const cardId = gameEvent.cardId;
		const controllerId = gameEvent.controllerId;
		const localPlayer = gameEvent.localPlayer;
		if (cardId === this.cardId && controllerId === localPlayer?.PlayerId) {
			this.isCardDrawn = true;
		}
	}
}
