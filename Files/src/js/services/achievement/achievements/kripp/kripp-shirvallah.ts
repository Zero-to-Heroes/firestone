import { AbstractChallenge } from '../abstract-challenge';
import { GameEvent } from '../../../../models/game-event';
import { Events } from '../../../events.service';
import { GameType } from '../../../../models/enums/game-type';

export class KrippShirvallah extends AbstractChallenge {
	private readonly cardId: string;

	private tigerPlayed = false;
	private turnStartTime: number;

	constructor(achievement, events: Events) {
		super(achievement, [GameType.RANKED], events, [GameEvent.GAME_END]);
		this.cardId = achievement.cardId;
	}

	protected resetState() {
		this.tigerPlayed = false;
	}

	protected detectEvent(gameEvent: GameEvent, callback: Function) {
		if (gameEvent.type === GameEvent.TURN_START && !this.tigerPlayed) {
			this.turnStartTime = Date.now();
		}
		if (gameEvent.type === GameEvent.CARD_PLAYED) {
			this.detectCardPlayedEvent(gameEvent, callback);
			return;
		}
		if (gameEvent.type === GameEvent.WINNER) {
			this.detectGameResultEvent(gameEvent, callback);
			return;
		}
	}

	public getRecordPastDurationMillis(): number {
		return Date.now() - this.turnStartTime;
	}

	private detectCardPlayedEvent(gameEvent: GameEvent, callback: Function) {
		const cardId = gameEvent.cardId;
		const controllerId = gameEvent.controllerId;
		const localPlayer = gameEvent.localPlayer;
		if (cardId === this.cardId && controllerId === localPlayer.PlayerId) {
			this.tigerPlayed = true;
		}
	}

	private detectGameResultEvent(gameEvent: GameEvent, callback: Function) {
		const winner = gameEvent.additionalData.winner;
		const localPlayer = gameEvent.localPlayer;
		if (localPlayer.Id === winner.Id) {
			this.callback = callback;
			this.handleCompletion();
		}
	}

	protected additionalCheckForCompletion(): boolean {
		return this.tigerPlayed;
	}
}
