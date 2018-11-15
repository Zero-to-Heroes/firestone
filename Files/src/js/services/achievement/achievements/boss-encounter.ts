import { Challenge } from './challenge';
import { CompletedAchievement } from '../../../models/completed-achievement';
import { GameEvent } from '../../../models/game-event';
import { Events } from '../../events.service';

export class BossEncounter implements Challenge {

	private readonly achievementId: string;
	private readonly bossId: string;
	private readonly bossDbfId: number;
	private readonly events:Events;

	private sceneChanged: boolean = false;
	private completed = false;
	private callback;

	constructor(achievement, events: Events) {
		this.achievementId = achievement.id;
		this.bossId = achievement.bossId;
		this.bossDbfId = achievement.bossDbfId;
		this.events = events;
		
		events.on(Events.SCENE_CHANGED).subscribe((data) => {
			if (data.data[0] === 'scene_gameplay') {
				this.sceneChanged = true;
				this.handleCompletion();
			}
		})
	}

	public detect(gameEvent: GameEvent, callback: Function) {
		if (gameEvent.type == GameEvent.MULLIGAN_DONE) {
			this.broadcastEndOfCapture();
			return;
		}

		if (gameEvent.type == GameEvent.OPPONENT) {
			this.detectOpponentEvent(gameEvent, callback);
			return;
		}
	}

	public getRecordPastDurationMillis(): number {
		return 100;
	}

	public broadcastEndOfCapture() {
		if (this.completed) {
			this.completed = false;
			console.log('broadcasting end of capture', this);
			this.events.broadcast(Events.ACHIEVEMENT_RECORD_END, this.achievementId);
		}
	}

	public getAchievementId() {
		// console.log('returning achievement id', this.achievementId, this);
		return this.achievementId;
	}

	public defaultAchievement() {
		return new CompletedAchievement(this.achievementId, 0, []);
	}

	public notificationTimeout(): number {
		// Since we stop recording only when mulligan is done, it could take some time
		return 15000;
	}

	private detectOpponentEvent(gameEvent: GameEvent, callback: Function) {
		if (!gameEvent.data || gameEvent.data.length == 0) {
			return;
		}

		if (gameEvent.data[0].CardID == this.bossId) {
			console.log('achievement completed, waiting for detection');
			this.callback = callback;
			this.handleCompletion();
		}
	}

	private handleCompletion() {
		if (this.sceneChanged && this.callback) {
			console.log('scene changed, completing achievement');
			this.callback();
			this.sceneChanged = false;
			this.completed = true;
			this.callback = undefined;
		}
	}
}
