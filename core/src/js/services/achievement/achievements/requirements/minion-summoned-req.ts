import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class MinionSummonedReq implements Requirement {
	private isMinionSummoned: boolean;

	constructor(private readonly cardId: string) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length !== 1) {
			console.error('invalid parameters for MinionSummonedReq', rawReq);
		}
		return new MinionSummonedReq(rawReq.values[0]);
	}

	reset(): void {
		this.isMinionSummoned = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.isMinionSummoned = undefined;
	}

	isCompleted(): boolean {
		return this.isMinionSummoned;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.MINION_SUMMONED) {
			this.detectCardPlayedEvent(gameEvent);
			return;
		}
	}

	private detectCardPlayedEvent(gameEvent: GameEvent) {
		const cardId = gameEvent.cardId;
		const controllerId = gameEvent.controllerId;
		const localPlayer = gameEvent.localPlayer;
		if (cardId === this.cardId && controllerId === localPlayer?.PlayerId) {
			this.isMinionSummoned = true;
		}
	}
}
