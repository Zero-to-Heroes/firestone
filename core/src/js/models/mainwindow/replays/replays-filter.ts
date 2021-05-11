import { IOption } from 'ng-select';
import { GameStat } from '../stats/game-stat';
import { StatGameFormatType } from '../stats/stat-game-format.type';
import { ReplaysFilterCategoryType } from './replays-filter-category.type';

export class ReplaysFilter {
	readonly type: ReplaysFilterCategoryType;
	readonly placeholder: string;
	readonly options: readonly IOption[];
	readonly selectedOption: string;

	static create(base: ReplaysFilter): ReplaysFilter {
		return Object.assign(new ReplaysFilter(), base);
	}

	private constructor() {
		// To force call to static factory
	}

	update(value: ReplaysFilter): ReplaysFilter {
		return Object.assign(new ReplaysFilter(), this, value);
	}

	allows(stat: GameStat): boolean {
		if (!this.selectedOption) {
			return true;
		}

		switch (this.type) {
			case 'gameMode':
				return this.allowsGameMode(stat.gameMode, stat.gameFormat, this.selectedOption);
			case 'deckstring':
				return stat.playerDecklist === this.selectedOption;
			case 'bg-hero':
				return stat.playerCardId === this.selectedOption;
			default:
				return true;
		}
	}

	allowsGameMode(gameMode: string, format: StatGameFormatType, selectedOption: string): boolean {
		switch (selectedOption) {
			case 'both-duels':
				return gameMode === 'duels' || gameMode === 'paid-duels';
			case 'ranked-standard':
				return gameMode === 'ranked' && format === 'standard';
			case 'ranked-wild':
				return gameMode === 'ranked' && format === 'wild';
			case 'ranked-classic':
				return gameMode === 'ranked' && format === 'classic';
			default:
				return gameMode === selectedOption;
		}
	}
}
