import { GameEventsEmitterService } from '@firestone/app/common';
import { GameState } from '@firestone/game-state';
import { Preferences } from '@firestone/shared/common/service';

import { GameStateEvent } from '@firestone/app/common';
import { GameEvent } from '../../../../../../../../app/common/src/lib/services/game-events/game-event';

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
