import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
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
		// Do nothing
	}

	isCompleted(): boolean {
		return this.isMulliganOver;
	}

	test(gameEvent: GameEvent): void {
		// We want to fire it only once, and there are 2 muligans events sent
		if (gameEvent.type === GameEvent.MULLIGAN_DONE) {
			this.detectGameResultEvent(gameEvent);
		}
	}

	private detectGameResultEvent(gameEvent: GameEvent): void {
		const winner = gameEvent.additionalData.winner;
		const localPlayer = gameEvent.localPlayer;
		if (localPlayer.Id === winner.Id) {
			this.isMulliganOver = true;
		}
	}
}
