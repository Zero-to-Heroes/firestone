import { Challenge } from './challenge';
import { CompletedAchievement } from '../../../models/completed-achievement';
import { GameEvent } from '../../../models/game-event';
import { Events } from '../../events.service';

export class RumbleProgression implements Challenge {

	private readonly achievementId: string;
	private readonly heroId: string;
	private readonly events: Events;

	private completed: boolean = false;
	private currentTurnStartTime: number;
	private rumbleStep: number;
	private currentRumbleStep: number;

	constructor(achievement, events: Events) {
		this.achievementId = achievement.id;
		this.heroId = achievement.cardId;
		this.rumbleStep = achievement.step;
		this.events = events;
	}

	public detect(gameEvent: GameEvent, callback: Function) {
		if (gameEvent.type == GameEvent.RUMBLE_RUN_STEP) {
			this.currentRumbleStep = gameEvent.data[0];
		}

		if (this.currentRumbleStep === this.rumbleStep && gameEvent.type == GameEvent.TURN_START) {
			this.currentTurnStartTime = Date.now();
			return;
		}

		if (this.currentRumbleStep === this.rumbleStep && gameEvent.type === GameEvent.WINNER) {
			// console.log('WINNER detected', gameEvent);
			this.detectGameResultEvent(gameEvent, callback);
			return;
		}
	}

	public getRecordPastDurationMillis(): number {
		return Date.now() - this.currentTurnStartTime;
	}

	public broadcastEndOfCapture() {
		if (this.completed) {
			this.completed = false;
			this.events.broadcast(Events.ACHIEVEMENT_RECORD_END, this.achievementId);
		}
	}

	public notificationTimeout(): number {
		return 10000;
	}

	private detectGameResultEvent(gameEvent: GameEvent, callback: Function) {
		if (!gameEvent.data || gameEvent.data.length == 0) {
			return;
		}

		let winner = gameEvent.data[0];
		let localPlayer = gameEvent.data[1];

		if (localPlayer.CardID === this.heroId && localPlayer.Id === winner.Id) {
			// console.log('completed rumble progression', this);
			callback();
			this.completed = true;
			setTimeout(() => this.broadcastEndOfCapture(), 5000);
		}
	}

	public getAchievementId() {
		return this.achievementId;
	}

	public defaultAchievement() {
		return new CompletedAchievement(this.achievementId, 0, []);
	}
}
