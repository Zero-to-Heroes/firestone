import { GameEvent } from '../../../../models/game-event';
import { Events } from '../../../events.service';
import { AbstractChallenge } from '../abstract-challenge';

export class DalaranHeistPassivePlay extends AbstractChallenge {

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
			// console.log('handling passive buff event', this.cardId, gameEvent, this);
			this.detectCardPlayedEvent(gameEvent, callback);
			return;
		}
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
			this.callback = callback;
			this.handleCompletion();
		}
	}
}
