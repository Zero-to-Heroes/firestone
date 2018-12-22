import { Challenge } from './challenge';
import { CompletedAchievement } from '../../../models/completed-achievement';
import { GameEvent } from '../../../models/game-event';
import { Events } from '../../events.service';

export class DungeonRunPassivePlay implements Challenge {

	private readonly achievementId: string;
	private readonly cardId: string;
	private readonly events:Events;

	constructor(achievement, events: Events) {
		this.achievementId = achievement.id;
		this.cardId = achievement.cardId;
		this.events = events;
	}

	public detect(gameEvent: GameEvent, callback: Function) {
		if (gameEvent.type == GameEvent.PASSIVE_BUFF) {
			// console.log('handling passive buff event', this.cardId, gameEvent, this);
			this.detectCardPlayedEvent(gameEvent, callback);
			return;
		}
	}

	public getRecordPastDurationMillis(): number {
		return 1000;
	}

	public getAchievementId() {
		return this.achievementId;
	}

	public defaultAchievement() {
		return new CompletedAchievement(this.achievementId, 0, []);
	}

	public notificationTimeout(): number {
		return 5000;
	}

	public broadcastEndOfCapture() {
		this.events.broadcast(Events.ACHIEVEMENT_RECORD_END, this.achievementId, 10000);
		// setTimeout(() => this.events.broadcast(Events.ACHIEVEMENT_RECORD_END, this.achievementId), 10000);
	}

	private detectCardPlayedEvent(gameEvent: GameEvent, callback: Function) {
		if (!gameEvent.data || gameEvent.data.length == 0) {
			return;
		}

		const cardId = gameEvent.data[0];
		const controllerId = gameEvent.data[1];
		const localPlayer = gameEvent.data[2];
		if (cardId == this.cardId && controllerId == localPlayer.PlayerId) {
			// console.log('Passive buff achievement complete');
			callback();
			this.broadcastEndOfCapture();
		}
	}
}
