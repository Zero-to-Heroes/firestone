import { Preferences } from '@firestone/shared/common/service';
import { GameState } from '../../../models/game-state';
import { GameEvent } from '../game-event';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { GameStateEvent } from '../game-state-event';

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
