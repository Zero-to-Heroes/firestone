import { StatGameFormatType } from '../stats/stat-game-format.type';
import { StatGameModeType } from '../stats/stat-game-mode.type';
import { DeckTimeFilterType } from './deck-time-filter.type';

export class DeckFilters {
	readonly gameFormat: StatGameFormatType = 'standard';
	readonly gameMode: StatGameModeType = 'ranked';
	readonly time: DeckTimeFilterType = 'all-time';
}
