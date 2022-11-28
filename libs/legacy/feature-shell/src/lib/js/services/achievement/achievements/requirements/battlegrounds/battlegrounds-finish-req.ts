import { RawRequirement } from '../../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../../models/game-event';
import { QualifierType } from '../_qualifier.type';
import { Requirement } from '../_requirement';

export class BattlegroundsFinishReq implements Requirement {
	private isValid: boolean;
	private latestPlace: number;
	private gameOver: boolean;

	constructor(private readonly targetPlace: number, private readonly qualifier: QualifierType) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length !== 2) {
			console.error('invalid parameters for BattlegroundsFinishReq', rawReq);
		}
		return new BattlegroundsFinishReq(parseInt(rawReq.values[0]), rawReq.values[1] as QualifierType);
	}

	reset(): void {
		this.isValid = undefined;
		this.latestPlace = undefined;
		this.gameOver = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.isValid = undefined;
		this.latestPlace = undefined;
		this.gameOver = undefined;
	}

	isCompleted(): boolean {
		return this.isValid;
	}

	test(gameEvent: GameEvent): void {
		// Don't use the winner event here, because the leaderboard positions are still updated after the event is sent
		if (gameEvent.type === GameEvent.GAME_END) {
			this.gameOver = true;
			this.detectLeaderboardPlace();
			return;
		}
		if (gameEvent.type === GameEvent.LOCAL_PLAYER_LEADERBOARD_PLACE_CHANGED) {
			this.latestPlace = gameEvent.additionalData.newPlace;
			this.detectLeaderboardPlace();
			return;
		}
	}

	private detectLeaderboardPlace() {
		if (this.qualifier === 'AT_LEAST') {
			this.isValid = this.gameOver && this.latestPlace <= this.targetPlace;
		} else {
			this.isValid = false;
		}
	}
}
