import { IOption } from 'ng-select';
import { isMercenaries, isMercenariesPvE, isMercenariesPvP } from '../../../services/mercenaries/mercenaries-utils';
import { GameStat } from '../stats/game-stat';
import { StatGameFormatType } from '../stats/stat-game-format.type';
import { StatGameModeType } from '../stats/stat-game-mode.type';
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
		switch (this.type) {
			case 'gameMode':
				return this.allowsGameMode(stat.gameMode, stat.gameFormat, this.selectedOption);
			case 'deckstring':
				return (
					!this.selectedOption || stat.gameMode !== 'ranked' || stat.playerDecklist === this.selectedOption
				);
			case 'bg-hero':
				return !this.selectedOption || stat.playerCardId === this.selectedOption;
			case 'player-class':
				return !this.selectedOption || stat.playerClass === this.selectedOption;
			case 'opponent-class':
				return !this.selectedOption || stat.opponentClass === this.selectedOption;
			default:
				return true;
		}
	}

	allowsGameMode(gameMode: StatGameModeType, format: StatGameFormatType, selectedOption: string): boolean {
		switch (selectedOption) {
			case null:
				return !isMercenariesPvE(gameMode);
			case 'both-duels':
				return gameMode === 'duels' || gameMode === 'paid-duels';
			case 'ranked-standard':
				return gameMode === 'ranked' && format === 'standard';
			case 'ranked-wild':
				return gameMode === 'ranked' && format === 'wild';
			case 'ranked-classic':
				return gameMode === 'ranked' && format === 'classic';
			case 'mercenaries-all':
				return isMercenaries(gameMode);
			case 'mercenaries-pve':
				return isMercenariesPvE(gameMode);
			case 'mercenaries-pvp':
				return isMercenariesPvP(gameMode);
			default:
				return gameMode === selectedOption;
		}
	}
}
