import { RawRequirement } from '../../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../../models/game-event';
import { Requirement } from '../_requirement';

export class BattlegroundsTriplePlayReq implements Requirement {
	private isCardDrawn: boolean;

	constructor(private readonly cardIds: readonly string[]) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values) {
			console.error('invalid parameters for BattlegroundsTriplePlayReq', rawReq);
		}
		return new BattlegroundsTriplePlayReq(rawReq.values);
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
			// console.log('handling passive buff event', this.cardId, gameEvent, this);
			this.detectCardPlayedEvent(gameEvent);
			return;
		}
	}

	private detectCardPlayedEvent(gameEvent: GameEvent) {
		const cardId = gameEvent.cardId;
		const controllerId = gameEvent.controllerId;
		const localPlayer = gameEvent.localPlayer;
		const isPremium = gameEvent.additionalData.isPremium;
		if (this.cardIds.indexOf(cardId) !== -1 && controllerId === localPlayer?.PlayerId && isPremium) {
			this.isCardDrawn = true;
		}
	}
}
