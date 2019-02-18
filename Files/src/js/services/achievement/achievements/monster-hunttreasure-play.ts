import { GameEvent } from '../../../models/game-event';
import { Events } from '../../events.service';
import { AbstractChallenge } from './abstract-challenge';

export class MonsterHuntTreasurePlay extends AbstractChallenge {

	private readonly cardId: string;

	constructor(achievement, scenarioId: number, events: Events) {
		super(achievement, scenarioId, events, [GameEvent.GAME_START, GameEvent.GAME_END]);
		this.cardId = achievement.cardId;
	}

	protected resetState() {
		// No specific state
	}

	protected detectEvent(gameEvent: GameEvent, callback: Function) {
		if (gameEvent.type == GameEvent.CARD_PLAYED) {
			this.detectCardPlayedEvent(gameEvent, callback);
			return;
		}
	}

	public getRecordPastDurationMillis(): number {
		return 1000;
	}

	public notificationTimeout(): number {
		return 5000;
	}

	public broadcastEndOfCapture() {
		this.events.broadcast(Events.ACHIEVEMENT_RECORD_END, this.achievementId, 10000);
	}

	private detectCardPlayedEvent(gameEvent: GameEvent, callback: Function) {
		if (!gameEvent.data || gameEvent.data.length == 0) {
			return;
		}
		const cardId = gameEvent.data[0];
		const controllerId = gameEvent.data[1];
		const localPlayer = gameEvent.data[2];
		if (cardId == this.cardId && controllerId == localPlayer.PlayerId) {
			this.callback = callback;
			this.handleCompletion();
		}
	}
}
