import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class GameMinTurnsReq implements Requirement {
	private hasElapsedEnoughTurns: boolean;

	constructor(private readonly targetTurn: number) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length === 0) {
			console.error('invalid parameters for GameMinTurnsReq', rawReq);
		}
		return new GameMinTurnsReq(parseInt(rawReq.values[0]));
	}

	reset(): void {
		this.hasElapsedEnoughTurns = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.hasElapsedEnoughTurns = undefined;
	}

	isCompleted(): boolean {
		return this.hasElapsedEnoughTurns;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.TURN_START) {
			this.handleEvent(gameEvent);
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		const turnNumber = gameEvent.additionalData.turnNumber;
		if (turnNumber >= this.targetTurn) {
			this.hasElapsedEnoughTurns = true;
		}
	}
}
