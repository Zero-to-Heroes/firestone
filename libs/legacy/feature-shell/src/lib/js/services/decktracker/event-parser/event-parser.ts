import { GameState } from '@firestone/game-state';
import { Preferences } from '@firestone/shared/common/service';
import { GameStateEvent } from '../../../models/decktracker/game-state-event';
import { GameEvent } from '../../../models/game-event';
import { GameEventsEmitterService } from '../../game-events-emitter.service';

export interface EventParser {
	applies(gameEvent: GameEvent | GameStateEvent, state?: GameState, prefs?: Preferences): boolean;
	parse(
		currentState: GameState,
		gameEvent: GameEvent | GameStateEvent,
		additionalInfo?: {
			secretWillTrigger?: {
				cardId: string;
				reactingToCardId: string;
				reactingToEntityId: number;
			};
			minionsWillDie?: readonly {
				cardId: string;
				entityId: number;
			}[];
		},
	): Promise<GameState>;
	sideEffects?(gameEvent: GameEvent | GameStateEvent, eventsEmtter: GameEventsEmitterService): void;
	event(): string;
}
