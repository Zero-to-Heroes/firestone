import { Challenge } from './challenge';
import { CompletedAchievement } from '../../../models/completed-achievement';
import { GameEvent } from '../../../models/game-event';

export class BossEncounter implements Challenge {

	private readonly achievementId: string;
	private readonly bossId: string;
	private readonly bossDbfId: number;

	private completed = false;

	constructor(achievement) {
		this.achievementId = achievement.id;
		this.bossId = achievement.bossId;
		this.bossDbfId = achievement.bossDbfId;
	}

	public detect(gameEvent: GameEvent, callback: Function) {
		if (this.completed) {	
			return;
		}

		if (!gameEvent.data || gameEvent.data.length == 0) {
			return;
		}

		if (gameEvent.type == GameEvent.OPPONENT) {
			this.detectOpponentEvent(gameEvent, callback);
			return;
		}
	}

	private detectOpponentEvent(gameEvent: GameEvent, callback: Function) {
		if (gameEvent.data[0].CardID == this.bossId) {
			// console.log('Meeting boss unlocked!', this.achievementId, this.bossId, this);
			callback();
		}
	}

	public getAchievementId() {
		// console.log('returning achievement id', this.achievementId, this);
		return this.achievementId;
	}

	public defaultAchievement() {
		return new CompletedAchievement(this.achievementId, 0, []);
	}
}
