import { IOption } from 'ng-select';
import { DeckSummary } from '../decktracker/deck-summary';
import { GameStat } from '../stats/game-stat';
import { GroupedReplays } from './grouped-replays';
import { ReplaysFilter } from './replays-filter';
import { ReplaysFilterCategoryType } from './replays-filter-category.type';

export class ReplaysState {
	readonly allReplays: readonly GameStat[];
	readonly groupedReplays: readonly GroupedReplays[];
	readonly groupByCriteria: 'creation-date' = 'creation-date';
	readonly filters: readonly ReplaysFilter[];
	readonly isLoading: boolean = true;

	public getFilter(type: ReplaysFilterCategoryType) {
		return this.filters.find(filter => filter.type === type);
	}

	public static buildFilters(decks: readonly DeckSummary[]): readonly ReplaysFilter[] {
		return [
			ReplaysFilter.create({
				type: 'gameMode',
				placeholder: 'All game modes',
				options: [
					{
						value: null,
						label: 'All game modes',
					} as IOption,
					{
						value: 'battlegrounds',
						label: 'Battlegrounds',
					} as IOption,
					{
						value: 'ranked',
						label: 'Ranked',
					} as IOption,
					{
						value: 'arena',
						label: 'Arena',
					} as IOption,
					{
						value: 'casual',
						label: 'Casual',
					} as IOption,
					{
						value: 'friendly',
						label: 'Friendly',
					} as IOption,
					{
						value: 'tavern-brawl',
						label: 'Tavern Brawl',
					} as IOption,
					{
						value: 'practice',
						label: 'Vs AI',
					} as IOption,
				] as readonly IOption[],
				selectedOption: null,
			} as ReplaysFilter),
			ReplaysFilter.create({
				type: 'deckstring',
				placeholder: 'All decks',
				options: [
					{
						value: null,
						label: 'All decks',
					} as IOption,
					...decks.map(
						deck =>
							({
								label: deck.deckName,
								value: deck.deckstring,
							} as IOption),
					),
				] as readonly IOption[],
				selectedOption: null,
			} as ReplaysFilter),
		];
	}
}
