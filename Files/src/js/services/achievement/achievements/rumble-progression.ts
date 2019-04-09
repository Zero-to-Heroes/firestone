import { GameEvent } from '../../../models/game-event';
import { Events } from '../../events.service';
import { AbstractChallenge } from './abstract-challenge';

export class RumbleProgression extends AbstractChallenge {

	private readonly heroId: string;
	private readonly shrineId: string;
	private readonly rumbleStep: number;

	private currentTurnStartTime: number;
	private currentRumbleStep: number;
	private shrinePlayed: boolean = false;

	constructor(achievement, scenarioId: number, events: Events) {
		super(achievement, [scenarioId], events, [GameEvent.GAME_START]);
		this.heroId = achievement.cardId;
		this.shrineId = achievement.secondaryCardId;
		this.rumbleStep = achievement.step;
	}

	protected resetState() {
		this.currentTurnStartTime = undefined;
		this.currentRumbleStep = undefined;
		this.shrinePlayed = undefined;
	}

	protected detectEvent(gameEvent: GameEvent, callback: Function) {
		if (gameEvent.type == GameEvent.RUMBLE_RUN_STEP) {
			this.currentRumbleStep = gameEvent.data[0];
		}
		if (gameEvent.type == GameEvent.CARD_PLAYED || gameEvent.type === GameEvent.CARD_ON_BOARD_AT_GAME_START) {
			const cardId = gameEvent.data[0];
			const controllerId = gameEvent.data[1];
			const localPlayer = gameEvent.data[2];
			if (cardId == this.shrineId && controllerId == localPlayer.PlayerId) {
				this.shrinePlayed = true;
			}
			return;
		}
		if (this.currentRumbleStep === this.rumbleStep && gameEvent.type == GameEvent.TURN_START) {
			this.currentTurnStartTime = Date.now();
			return;
		}
		if (this.currentRumbleStep === this.rumbleStep && this.shrinePlayed && gameEvent.type === GameEvent.WINNER) {
			// console.log('WINNER detected', gameEvent);
			this.detectGameResultEvent(gameEvent, callback);
			return;
		}
	}

	public getRecordPastDurationMillis(): number {
		return Date.now() - this.currentTurnStartTime;
	}

	public broadcastEndOfCapture() {
		this.events.broadcast(Events.ACHIEVEMENT_RECORD_END, this.achievementId, 5000);
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
			this.callback = callback;
			this.handleCompletion();
		}
	}
}
