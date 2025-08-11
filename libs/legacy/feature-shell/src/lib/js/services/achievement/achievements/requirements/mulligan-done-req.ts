import { GameEvent } from '@firestone/game-state';
import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { Requirement } from './_requirement';

export class MulliganDoneReq implements Requirement {
	private isMulliganOver: boolean;

	public static create(rawReq: RawRequirement): Requirement {
		return new MulliganDoneReq();
	}

	reset(): void {
		this.isMulliganOver = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.isMulliganOver = undefined;
	}

	isCompleted(): boolean {
		return this.isMulliganOver;
	}

	test(gameEvent: GameEvent): void {
		// We want to fire it only once, and there are 2 muligans events sent
		if (gameEvent.type === GameEvent.MULLIGAN_DONE) {
			this.isMulliganOver = true;
		}
	}
}
