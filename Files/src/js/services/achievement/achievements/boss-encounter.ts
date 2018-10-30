import { Challenge } from './challenge';
import { CompletedAchievement } from '../../../models/completed-achievement';
import { GameEvent } from '../../../models/game-event';
import { Events } from '../../events.service';

export class BossEncounter implements Challenge {

	private readonly achievementId: string;
	private readonly bossId: string;
	private readonly bossDbfId: number;

	private waitingForSceneChange: boolean = false;
	private completed = false;
	private callback;

	constructor(achievement, events: Events) {
		this.achievementId = achievement.id;
		this.bossId = achievement.bossId;
		this.bossDbfId = achievement.bossDbfId;
		
		events.on(Events.SCENE_CHANGED).subscribe((data) => {
			if (this.waitingForSceneChange && this.callback && data.data[0] === 'scene_gameplay') {
				console.log('scene changed, completing achievement', data, this.waitingForSceneChange, this.callback);
				this.waitingForSceneChange = false;
				this.callback();
				this.callback = undefined;
			}
		})
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
			console.log('achievement completed, waiting for detection');
			this.callback = callback;
			this.waitingForSceneChange = true;
			// callback();
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
