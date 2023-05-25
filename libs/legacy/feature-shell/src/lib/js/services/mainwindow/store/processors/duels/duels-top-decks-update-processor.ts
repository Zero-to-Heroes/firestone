import { DeckDefinition } from '@firestone-hs/deckstrings';
import { DeckStat } from '@firestone-hs/duels-global-stats/dist/stat';
import { groupByFunction } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DuelsGroupedDecks } from '@legacy-import/src/lib/js/models/duels/duels-grouped-decks';
import { DuelsDeckStat } from '@legacy-import/src/lib/js/models/duels/duels-player-stats';
import { Set } from '@legacy-import/src/lib/js/models/set';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { SetsManagerService, getCard } from '../../../../collection/sets-manager.service';
import { ExtendedDeckStat } from '../../../../duels/duels-state-builder.service';
import { LocalizationService } from '../../../../localization.service';
import { DuelsTopDecksUpdateEvent } from '../../events/duels/duels-top-decks-event';
import { Processor } from '../processor';

export class DuelsTopDecksUpdateProcessor implements Processor {
	constructor(
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationService,
		private readonly setsManager: SetsManagerService,
	) {}

	// TODO: why is this computed when I have not accessed the top decks yet?
	public async process(
		event: DuelsTopDecksUpdateEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const topDecks: readonly DuelsGroupedDecks[] = this.buildTopDeckStats(
			currentState.duels.globalStatsDecks?.decks ?? [],
			this.setsManager.sets$$?.getValue() ?? [],
		);
		return [
			currentState.update({
				duels: currentState.duels.update({
					topDecks: topDecks,
				}),
			}),
			null,
		];
	}

	private buildTopDeckStats(
		deckStats: readonly ExtendedDeckStat[],
		sets: readonly Set[],
	): readonly DuelsGroupedDecks[] {
		const decks = deckStats
			// This should already be filtered out by the API
			.filter((stat) => stat.decklist)
			// Same here
			.slice(0, 1000)
			.map((stat) => {
				const start = Date.now();
				const dustCost = this.buildDustCost(stat.deckDefinition, sets);
				const result = {
					...(stat as DeckStat),
					heroCardId: stat.heroCardId,
					dustCost: dustCost,
					allCardNames: stat.allCardNames,
					startDate: new Date(stat.periodStart).getTime(),
				} as DuelsDeckStat;
				return result;
			})
			.sort((a, b) => b.startDate - a.startDate);
		console.debug('[duels-top-decks-update-processor] top decks', decks?.length);
		const groupedDecks: readonly DuelsGroupedDecks[] = [...this.groupDecks(decks)];
		return groupedDecks;
	}

	private groupDecks(decks: readonly DuelsDeckStat[]): readonly DuelsGroupedDecks[] {
		const groupingFunction = (deck: DuelsDeckStat) => {
			const date = new Date(deck.periodStart);
			return date.toLocaleDateString(this.i18n.formatCurrentLocale(), {
				month: 'short',
				day: '2-digit',
				year: 'numeric',
			});
		};
		const groupByDate = groupByFunction(groupingFunction);
		const decksByDate = groupByDate(decks);
		return Object.keys(decksByDate).map((date) => this.buildGroupedDecks(date, decksByDate[date]));
	}

	private buildDustCost(deck: DeckDefinition, sets: readonly Set[]): number {
		const start = Date.now();
		const allCards = [...deck.cards.map((cards) => cards[0]), ...(deck.sideboards ?? [])];
		// console.debug('[duels-top-decks-update-processor] built all cards in', Date.now() - start, 'ms');
		const result = allCards
			.map((cardDbfId) => this.allCards.getCardFromDbfId(+cardDbfId))
			.filter((card) => card)
			.map((card) => getCard(sets, card.id))
			.filter((card) => card)
			.filter((card) => card.getNumberCollected() === 0)
			.map((card) => card.getRegularDustCost())
			.reduce((a, b) => a + b, 0);
		// console.debug('[duels-top-decks-update-processor] built dust cost in', Date.now() - start, 'ms');
		return result;
	}

	private buildGroupedDecks(date: string, decks: readonly DuelsDeckStat[]): DuelsGroupedDecks {
		return DuelsGroupedDecks.create({
			header: date,
			decks: decks,
		} as DuelsGroupedDecks);
	}
}
