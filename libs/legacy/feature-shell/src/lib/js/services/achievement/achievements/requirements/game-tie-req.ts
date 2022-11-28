import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class GameTieReq implements Requirement {
	private isGameTied: boolean;

	public static create(rawReq: RawRequirement): Requirement {
		return new GameTieReq();
	}

	reset(): void {
		this.isGameTied = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.isGameTied = undefined;
	}

	isCompleted(): boolean {
		return this.isGameTied;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.TIE) {
			this.handleEvent(gameEvent);
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		this.isGameTied = true;
	}
}
