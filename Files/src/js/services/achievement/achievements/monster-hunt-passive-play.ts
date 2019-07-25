import { GameEvent } from '../../../models/game-event';
import { Events } from '../../events.service';
import { AbstractChallenge } from './abstract-challenge';

export class MonsterHuntPassivePlay extends AbstractChallenge {

	private readonly cardId: string;

	constructor(achievement, scenarioId: number, events: Events) {
		super(achievement, [scenarioId], events, [GameEvent.GAME_START, GameEvent.GAME_END]);
		this.cardId = achievement.cardId;
	}

	protected resetState() {
		// No specific state
	}

	protected detectEvent(gameEvent: GameEvent, callback: Function) {
		if (gameEvent.type == GameEvent.PASSIVE_BUFF) {
			this.detectCardPlayedEvent(gameEvent, callback);
			return;
		}
	}

	private detectCardPlayedEvent(gameEvent: GameEvent, callback: Function) {
		const cardId = gameEvent.cardId;
		const controllerId = gameEvent.controllerId;
		const localPlayer = gameEvent.localPlayer;
		if (cardId == this.cardId && controllerId == localPlayer.PlayerId) {
			this.callback = callback;
			this.handleCompletion();
		}
	}
}
