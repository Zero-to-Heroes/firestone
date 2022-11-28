import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class ResummonRecurringVillainRew implements Requirement {
	private numberOfResummons = 0;

	constructor(private readonly targetNumberOfResummons: number, private readonly qualifier: string) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length === 0) {
			console.error('invalid parameters for ResummonRecurringVillainRew', rawReq);
		}
		return new ResummonRecurringVillainRew(parseInt(rawReq.values[0]), rawReq.values[1]);
	}

	reset(): void {
		this.numberOfResummons = 0;
	}

	afterAchievementCompletionReset(): void {
		this.numberOfResummons = 0;
	}

	isCompleted(): boolean {
		if (this.qualifier === 'AT_LEAST') {
			return this.numberOfResummons >= this.targetNumberOfResummons;
		}
		return this.numberOfResummons === this.targetNumberOfResummons;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.MINION_SUMMONED) {
			this.handleEvent(gameEvent);
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		if (
			gameEvent.controllerId == gameEvent.localPlayer?.PlayerId &&
			gameEvent.cardId === 'DAL_749' &&
			gameEvent.additionalData.creatorCardId === 'DAL_749'
		) {
			this.numberOfResummons++;
		}
	}
}
