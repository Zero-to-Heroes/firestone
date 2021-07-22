import { MmrGroupFilterType } from '../battlegrounds/mmr-group-filter-type';
import { StatGameFormatType } from '../stats/stat-game-format.type';
import { StatGameModeType } from '../stats/stat-game-mode.type';
import { DeckRankFilterType } from './deck-rank-filter.type';
import { DeckSortType } from './deck-sort.type';
import { DeckTimeFilterType } from './deck-time-filter.type';

export class DeckFilters {
	readonly gameFormat: StatGameFormatType = 'all';
	readonly gameMode: StatGameModeType = 'ranked';
	readonly time: DeckTimeFilterType = 'all-time';
	readonly sort: DeckSortType = 'last-played';
	readonly rank: DeckRankFilterType = 'all';
	readonly rankingGroup: MmrGroupFilterType = 'per-match';
}
