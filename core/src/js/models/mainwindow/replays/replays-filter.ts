import { IOption } from 'ng-select';
import { GameStat } from '../stats/game-stat';
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

	update(value: ReplaysFilter): object {
		return Object.assign(new ReplaysFilter(), this, value);
	}

	allows(stat: GameStat): boolean {
		if (!this.selectedOption) {
			return true;
		}

		switch (this.type) {
			case 'gameMode':
				return stat.gameMode === this.selectedOption;
			case 'deckstring':
				return stat.playerDecklist === this.selectedOption;
			default:
				return true;
		}
	}
}
