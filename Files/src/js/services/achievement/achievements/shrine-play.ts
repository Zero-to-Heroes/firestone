import { Challenge } from './challenge';
import { CompletedAchievement } from '../../../models/completed-achievement';
import { GameEvent } from '../../../models/game-event';
import { Events } from '../../events.service';

export class ShrinePlay implements Challenge {

	private readonly achievementId: string;
	private readonly cardId: string;
	private readonly events:Events;

	private mulliganOver: boolean = false;
	private completed = false;
	private callback;

	constructor(achievement, events: Events) {
		this.achievementId = achievement.id;
		this.cardId = achievement.cardId;
		this.events = events;
	}

	public detect(gameEvent: GameEvent, callback: Function) {
		if (gameEvent.type == GameEvent.CARD_PLAYED) {
			this.detectCardPlayedEvent(gameEvent, callback);
			return;
		}

		if (gameEvent.type == GameEvent.MULLIGAN_DONE) {
			this.mulliganOver = true;
			this.handleCompletion();
		}
	}

	public getRecordPastDurationMillis(): number {
		return 100;
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

	public broadcastEndOfCapture() {
		this.completed = false;
		setTimeout(() => this.events.broadcast(Events.ACHIEVEMENT_RECORD_END, this.achievementId), 15000);
	}

	private detectCardPlayedEvent(gameEvent: GameEvent, callback: Function) {
		if (!gameEvent.data || gameEvent.data.length == 0) {
			return;
		}

		const cardId = gameEvent.data[0];
		const controllerId = gameEvent.data[1];
		const localPlayer = gameEvent.data[2];
		if (cardId == this.cardId && controllerId == localPlayer.PlayerId) {
			console.log('achievement completed, waiting for mulligan done');
			this.callback = callback;
			this.handleCompletion();
		}
	}

	private handleCompletion() {
		if (this.mulliganOver && this.callback) {
			console.log('completing achievement', this.achievementId, this);
			this.callback();
			this.mulliganOver = false;
			this.completed = true;
			this.callback = undefined;
			this.broadcastEndOfCapture();
		}
	}
}
