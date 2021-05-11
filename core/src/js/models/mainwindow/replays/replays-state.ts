import { AllCardsService } from '@firestone-hs/replay-parser';
import { IOption } from 'ng-select';
import { classes, formatClass } from '../../../services/hs-utils';
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
		return this.filters.find((filter) => filter.type === type);
	}

	public static buildFilters(decks: readonly DeckSummary[], allCards: AllCardsService): readonly ReplaysFilter[] {
		const collator = new Intl.Collator('en-US');
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
						label: 'Ranked (All)',
					} as IOption,
					{
						value: 'ranked-standard',
						label: 'Ranked Standard',
					} as IOption,
					{
						value: 'ranked-wild',
						label: 'Ranked Wild',
					} as IOption,
					{
						value: 'ranked-classic',
						label: 'Ranked Classic',
					} as IOption,
					{
						value: 'both-duels',
						label: 'Duels (All)',
					} as IOption,
					{
						value: 'duels',
						label: 'Duels Casual',
					} as IOption,
					{
						value: 'paid-duels',
						label: 'Duels Heroic',
					} as IOption,
					{
						value: 'arena',
						label: 'Arena',
					} as IOption,
					{
						value: 'casual',
						label: 'Casual (All)',
					} as IOption,
					{
						value: 'friendly',
						label: 'Friendly (All)',
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
						(deck) =>
							({
								label: deck.deckName,
								value: deck.deckstring,
							} as IOption),
					),
				] as readonly IOption[],
				selectedOption: null,
			} as ReplaysFilter),
			ReplaysFilter.create({
				type: 'bg-hero',
				placeholder: 'All heroes',
				options: [
					{
						value: null,
						label: 'All heroes',
					} as IOption,
					...allCards
						.getCards()
						.filter((card) => card.battlegroundsHero)
						.map(
							(card) =>
								({
									label: card.name,
									value: card.id,
								} as IOption),
						)
						.sort((a, b) => collator.compare(a.label, b.label)),
				] as readonly IOption[],
				selectedOption: null,
			} as ReplaysFilter),
			ReplaysFilter.create({
				type: 'player-class',
				placeholder: 'All classes',
				options: [
					{
						value: null,
						label: 'All classes',
					} as IOption,
					...classes
						.map(
							(playerClass) =>
								({
									label: formatClass(playerClass),
									value: playerClass,
								} as IOption),
						)
						.sort((a, b) => collator.compare(a.label, b.label)),
				] as readonly IOption[],
				selectedOption: null,
			} as ReplaysFilter),
		];
	}
}
