import { StatGameFormatType, StatGameModeType } from '@firestone/stats/data-access';
import { MmrGroupFilterType } from '../battlegrounds/mmr-group-filter-type';
import { DeckRankFilterType } from './deck-rank-filter.type';
import { DeckRankingCategoryType } from './deck-ranking-category.type';
import { DeckSortType } from './deck-sort.type';
import { DeckTimeFilterType } from './deck-time-filter.type';

export class DeckFilters {
	readonly gameFormat: StatGameFormatType = 'all';
	readonly gameMode: StatGameModeType = 'ranked';
	readonly time: DeckTimeFilterType = 'all-time';
	readonly sort: DeckSortType = 'last-played';
	readonly rank: DeckRankFilterType = 'all';
	readonly rankingGroup: MmrGroupFilterType = 'per-match';
	readonly rankingCategory: DeckRankingCategoryType = 'leagues';
}
