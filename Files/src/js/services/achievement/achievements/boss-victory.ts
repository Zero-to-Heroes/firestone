import { Challenge } from './challenge';
import { CompletedAchievement } from '../../../models/completed-achievement';
import { GameEvent } from '../../../models/game-event';
import { Events } from '../../events.service';

export class BossVictory implements Challenge {

	private readonly achievementId: string;
	private readonly bossId: string;
	private readonly bossDbfId: number;
	private readonly events: Events;

	private completed: boolean = false;
	private currentTurnStartTime: number;

	constructor(achievement, events: Events) {
		this.achievementId = achievement.id;
		this.bossId = achievement.bossId;
		this.bossDbfId = achievement.bossDbfId;
		this.events = events;
	}

	public detect(gameEvent: GameEvent, callback: Function) {
		if (gameEvent.type == GameEvent.TURN_START) {
			this.currentTurnStartTime = Date.now();
			return;
		}

		if (gameEvent.type === GameEvent.WINNER) {
			// console.log('WINNER detected', gameEvent);
			this.detectGameResultEvent(gameEvent, callback);
			return;
		}
	}

	public getRecordPastDurationMillis(): number {
		console.log('[recording] recording ', Date.now() - this.currentTurnStartTime, 'ms in the past');
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
		let opponentPlayer = gameEvent.data[2];

		if (opponentPlayer.CardID === this.bossId && localPlayer.Id === winner.Id) {
			// console.log('Achievement unlocked!', this.achievementId, this.bossId);
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
