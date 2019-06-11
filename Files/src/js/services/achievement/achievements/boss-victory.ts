import { GameEvent } from '../../../models/game-event';
import { Events } from '../../events.service';
import { AbstractChallenge } from './abstract-challenge';

export class BossVictory extends AbstractChallenge {

	private readonly cardId: string;

	private currentTurnStartTime: number;

	constructor(achievement, scenarioIds: number[], events: Events) {
		super(achievement, scenarioIds, events, [GameEvent.GAME_START]);
		this.cardId = achievement.cardId;
	}

	protected resetState() {
		this.currentTurnStartTime = undefined;
	}

	protected detectEvent(gameEvent: GameEvent, callback: Function) {
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
		return Date.now() - this.currentTurnStartTime;
	}

	public getRecordingDuration(): number {
		return 5000;
	}

	private detectGameResultEvent(gameEvent: GameEvent, callback: Function) {
		if (!gameEvent.data || gameEvent.data.length == 0) {
			return;
		}
		let winner = gameEvent.data[0];
		let localPlayer = gameEvent.data[1];
		let opponentPlayer = gameEvent.data[2];
		if (opponentPlayer.CardID === this.cardId && localPlayer.Id === winner.Id) {
			// console.log('Achievement unlocked!', this.achievementId, this.bossId);
			this.callback = callback;
			this.handleCompletion();
		}
	}
}
