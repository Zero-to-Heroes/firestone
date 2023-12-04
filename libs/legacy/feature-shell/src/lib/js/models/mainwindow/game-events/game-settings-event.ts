import { GameEvent } from '../../game-event';

export class GameSettingsEvent extends GameEvent {
	readonly additionalData: {
		battlegroundsPrizes: boolean;
		battlegroundsQuests: boolean;
		battlegroundsSpells: boolean;
		battlegroundsBuddies: boolean;
		battlegroundsAnomalies: readonly string[];
	};
}
