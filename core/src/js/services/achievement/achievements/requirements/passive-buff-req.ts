import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class PassiveBuffReq implements Requirement {
	private isPassiveBuffPlayed: boolean;

	constructor(private readonly cardId: string) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length !== 1) {
			console.error('invalid parameters for CorrectOpponentReq', rawReq);
		}
		return new PassiveBuffReq(rawReq.values[0]);
	}

	reset(): void {
		this.isPassiveBuffPlayed = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.isPassiveBuffPlayed = undefined;
	}

	isCompleted(): boolean {
		return this.isPassiveBuffPlayed;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.PASSIVE_BUFF) {
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
			this.isPassiveBuffPlayed = true;
		}
	}
}
