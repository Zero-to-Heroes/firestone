import { GameEvent } from '../../../../models/game-event';
import { Events } from '../../../events.service';
import { AbstractChallenge } from '../abstract-challenge';

export class DalaranHeistTreasurePlay extends AbstractChallenge {

    private readonly cardId: string;
    
    private entityId: number;

	constructor(achievement, scenarioIds: number[], events: Events) {
		super(achievement, scenarioIds, events, [GameEvent.GAME_START, GameEvent.GAME_END]);
		this.cardId = achievement.cardId;
	}

	protected resetState() {
        this.entityId = undefined;
	}

	protected detectEvent(gameEvent: GameEvent, callback: Function) {
		if (gameEvent.type == GameEvent.CARD_PLAYED || gameEvent.type == GameEvent.CARD_CHANGED_ON_BOARD) {
			this.detectCardPlayedEvent(gameEvent, callback);
			return;
        }
        // Specific handling for The Box
        // Maybe it should have its own handler, but it's easier to do it that way :p
        if (this.cardId === 'DALA_701') {
            // If we draw The Box, save the entity Id, so that we can match it with a treasure that is played later
            if ((gameEvent.type === GameEvent.CARD_DRAW_FROM_DECK || gameEvent.type === GameEvent.RECEIVE_CARD_IN_HAND) 
                    && gameEvent.data[0] === this.cardId) {
                this.entityId = gameEvent.data[4];
                console.log('saved entityId', this.cardId, this.entityId);
            }            
        }
	}

	private detectCardPlayedEvent(gameEvent: GameEvent, callback: Function) {
		if (!gameEvent.data || gameEvent.data.length == 0) {
			return;
		}
		const cardId = gameEvent.data[0];
		const controllerId = gameEvent.data[1];
        const localPlayer = gameEvent.data[2];
        const entityId = gameEvent.data[4];
		if (controllerId == localPlayer.PlayerId && (cardId === this.cardId || entityId === this.entityId)) {
            console.log('everything ok', this);
			this.callback = callback;
			this.handleCompletion();
		}
	}
}
