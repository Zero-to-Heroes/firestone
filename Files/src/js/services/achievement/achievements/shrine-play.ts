import { GameEvent } from '../../../models/game-event';
import { Events } from '../../events.service';
import { AbstractChallenge } from './abstract-challenge';

export class ShrinePlay extends AbstractChallenge {

	private readonly cardId: string;

	private mulliganOver: boolean = false;

	constructor(achievement, scenarioId: number, events: Events) {
		super(achievement, scenarioId, events, [GameEvent.GAME_START, GameEvent.GAME_END]);
		this.cardId = achievement.cardId;
	}

	protected resetState() {
		this.mulliganOver = false;
	}

	protected detectEvent(gameEvent: GameEvent, callback: Function) {
		if (gameEvent.type === GameEvent.CARD_PLAYED || gameEvent.type === GameEvent.CARD_ON_BOARD_AT_GAME_START) {
			this.detectCardPlayedEvent(gameEvent, callback);
			return;
		}
		if (gameEvent.type === GameEvent.MULLIGAN_DONE) {
			this.mulliganOver = true;
			this.handleCompletion();
			return;
		}
	}

	public getRecordPastDurationMillis(): number {
		return 100;
	}

	public notificationTimeout(): number {
		// Since we stop recording only when mulligan is done, it could take some time
		return 15000;
	}

	public broadcastEndOfCapture() {
		this.events.broadcast(Events.ACHIEVEMENT_RECORD_END, this.achievementId, 15000);
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

	// There is an implicit check on having the right scenarioID and the presence of a callback
	protected additionalCheckForCompletion(): boolean {
		return this.mulliganOver;
	}
}
