import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class GameMaxTurnsReq implements Requirement {
	private isRequirementMet = true;

	constructor(private readonly targetTurn: number) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length === 0) {
			console.error('invalid parameters for GameMinTurnsReq', rawReq);
		}
		return new GameMaxTurnsReq(parseInt(rawReq.values[0]));
	}

	reset(): void {
		this.isRequirementMet = true;
	}

	afterAchievementCompletionReset(): void {
		this.isRequirementMet = true;
	}

	isCompleted(): boolean {
		return this.isRequirementMet;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.TURN_START) {
			this.handleEvent(gameEvent);
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		const turnNumber = gameEvent.additionalData.turnNumber;
		if (turnNumber > this.targetTurn) {
			this.isRequirementMet = false;
		}
	}
}
