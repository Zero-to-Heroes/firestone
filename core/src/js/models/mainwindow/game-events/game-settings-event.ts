import { GameEvent } from '../../game-event';

export class GameSettingsEvent extends GameEvent {
	readonly additionalData: {
		battlegroundsPrizes: boolean;
	};
}
