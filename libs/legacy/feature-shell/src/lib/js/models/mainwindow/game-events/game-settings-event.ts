import { GameEvent } from '@firestone/shared/common/service';

export class GameSettingsEvent extends GameEvent {
	readonly additionalData: {
		battlegroundsPrizes: boolean;
		battlegroundsQuests: boolean;
		battlegroundsSpells: boolean;
		battlegroundsBuddies: boolean;
		battlegroundsTrinkets: boolean;
		battlegroundsAnomalies: readonly string[];
	};
}
