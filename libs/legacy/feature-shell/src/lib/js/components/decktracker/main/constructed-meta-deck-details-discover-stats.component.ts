import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { ConstructedDiscoverCardData } from '@firestone-hs/constructed-deck-stats';
import { PreferencesService } from '@firestone/shared/common/service';
import { SortCriteria, SortDirection, invertDirection } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent, buildPercents, uuidShort } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	standalone: false,
	selector: 'constructed-meta-deck-details-discover-stats',
	styleUrls: [
		`./constructed-meta-deck-details-discover-columns.scss`,
		`./constructed-meta-deck-details-discover-stats.component.scss`,
	],
	template: `
		<div class="constructed-meta-deck-details-discover-stats">
			<div class="controls">
				<preference-toggle
					class="show-relative-info-button"
					field="constructedMetaDecksShowRelativeInfo2"
					[label]="'app.decktracker.meta.details.cards.show-relative-info-button' | owTranslate"
					[helpTooltip]="'app.decktracker.meta.details.cards.show-relative-info-button-tooltip' | owTranslate"
				></preference-toggle>
			</div>
			<div class="header" *ngIf="sortCriteria$ | async as sort">
				<sortable-table-label
					class="cell card-name"
					[name]="'app.decktracker.meta.details.cards.card-header' | owTranslate"
					[sort]="sort"
					[criteria]="'name'"
					(sortClick)="onSortClick($event)"
				>
				</sortable-table-label>
				<sortable-table-label
					class="cell data discovered"
					[name]="'app.arena.card-stats.header-discovered' | owTranslate"
					[sort]="sort"
					[criteria]="'discovered'"
					(sortClick)="onSortClick($event)"
				>
				</sortable-table-label>
				<sortable-table-label
					class="cell data winrate"
					[name]="discoverWinrateHeader$ | async"
					[helpTooltip]="discoverWinrateHeaderTooltip$ | async"
					[sort]="sort"
					[criteria]="'winrate'"
					(sortClick)="onSortClick($event)"
				>
				</sortable-table-label>
			</div>
			<div class="cards" scrollable>
				<li class="card-line" *ngFor="let card of cardData$ | async">
					<div class="cell card-name">
						<deck-card
							class="card"
							[card]="card.deckCard"
							[colorManaCost]="true"
							[showRelatedCards]="true"
							[side]="'player'"
						></deck-card>
					</div>
					<div class="cell data discovered ">{{ card.discovered }}</div>
					<div class="cell data winrate {{ card.discoverWinrateCss }}">{{ card.discoverWinrateStr }}</div>
				</li>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMetaDeckDetailsDiscoverStatsComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	sortCriteria$: Observable<SortCriteria<ColumnSortType>>;
	cardData$: Observable<readonly InternalCardData[]>;

	discoverWinrateHeader$: Observable<string>;
	discoverWinrateHeaderTooltip$: Observable<string>;

	@Input() set cards(value: readonly ConstructedDiscoverCardData[]) {
		this.cardData$$.next(value);
	}
	@Input() set showRelativeInfo(value: boolean) {
		this.showRelativeInfo$$.next(value);
	}
	@Input() set deckWinrate(value: number) {
		this.deckWinrate$$.next(value);
	}
	@Input() set totalGames(value: number) {
		this.totalGames$$.next(value);
	}

	private cardData$$ = new BehaviorSubject<readonly ConstructedDiscoverCardData[]>([]);
	private showRelativeInfo$$ = new BehaviorSubject<boolean>(false);
	private deckWinrate$$ = new BehaviorSubject<number>(null);
	private totalGames$$ = new BehaviorSubject<number>(null);

	private showImpact$: Observable<boolean>;

	private sortCriteria$$ = new BehaviorSubject<SortCriteria<ColumnSortType>>({
		criteria: 'discovered',
		direction: 'desc',
	});

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	// TODO: show the info related to the global deck winrate, to make it easier to see
	// which cards do well or not
	async ngAfterContentInit() {
		await this.prefs.isReady();

		this.sortCriteria$ = this.sortCriteria$$.asObservable();
		this.showImpact$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.constructedMetaDecksShowRelativeInfo2),
		);
		this.discoverWinrateHeader$ = this.showImpact$.pipe(
			this.mapData((showImpact) =>
				showImpact
					? this.i18n.translateString('app.decktracker.meta.details.cards.discovered-winrate-impact-header')
					: this.i18n.translateString('app.decktracker.meta.details.cards.discovered-winrate-header'),
			),
		);
		this.discoverWinrateHeaderTooltip$ = this.showImpact$.pipe(
			this.mapData((showImpact) =>
				showImpact
					? this.i18n.translateString(
							'app.decktracker.meta.details.cards.discovered-winrate-impact-header-tooltip',
					  )
					: this.i18n.translateString('app.decktracker.meta.details.cards.discovered-winrate-header-tooltip'),
			),
		);
		this.cardData$ = combineLatest([
			this.cardData$$,
			this.sortCriteria$$,
			this.showRelativeInfo$$,
			this.deckWinrate$$,
			this.totalGames$$,
		]).pipe(
			this.mapData(([cardData, sortCriteria, showRelativeInfo, deckWinrate, totalGames]) => {
				const result = cardData
					.map((data) => {
						const refCard = this.allCards.getCard(data.cardId);

						const absoluteDiscoverWinrate = !data.discovered
							? null
							: data.discoveredThenWin / data.discovered;
						const relativeDiscoverWinrate = buildRelative(absoluteDiscoverWinrate, deckWinrate);
						const discoverWinrate = showRelativeInfo ? relativeDiscoverWinrate : absoluteDiscoverWinrate;
						const discoverWinrateStr = showRelativeInfo
							? discoverWinrate == null
								? '-'
								: (100 * discoverWinrate).toFixed(2)
							: buildPercents(discoverWinrate);
						const discoverWinrateCss = buildCss(relativeDiscoverWinrate);

						const discovered = data.discovered;
						const discoveredStr = discovered == null ? '-' : discovered.toString();

						const internalEntityId = uuidShort();
						// const mulliganKept = buildPercents(firstCopyData.keptInMulligan);
						const result: InternalCardData = {
							cardName: refCard.name,
							discoverWinrate: discoverWinrate,
							discoverWinrateStr: discoverWinrateStr,
							discoverWinrateCss: discoverWinrateCss,
							discovered: discovered,
							discoveredStr: discoveredStr,
							deckCard: VisualDeckCard.create({
								cardId: refCard.id,
								cardName: refCard.name,
								refManaCost: refCard.cost,
								rarity: refCard.rarity,
								totalQuantity: 1,
								internalEntityId: internalEntityId,
								internalEntityIds: [internalEntityId],
							}),
						};
						return result;
					})
					.sort((a, b) => this.sortCards(a, b, sortCriteria));
				return result;
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onSortClick(rawCriteria: string) {
		const criteria: ColumnSortType = rawCriteria as ColumnSortType;
		this.sortCriteria$$.next({
			criteria: criteria,
			direction:
				criteria === this.sortCriteria$$.value?.criteria
					? invertDirection(this.sortCriteria$$.value.direction)
					: 'desc',
		});
	}

	private sortCards(a: InternalCardData, b: InternalCardData, sortCriteria: SortCriteria<ColumnSortType>): number {
		switch (sortCriteria?.criteria) {
			case 'name':
				return this.sortByCost(a, b, sortCriteria.direction);
			case 'winrate':
				return this.sortByWinrate(a, b, sortCriteria.direction);
			case 'discovered':
				return this.sortByDiscovered(a, b, sortCriteria.direction);
			default:
				return 0;
		}
	}

	private sortByCost(a: InternalCardData, b: InternalCardData, direction: SortDirection): number {
		const compare =
			(a.deckCard?.refManaCost ?? -1) - (b.deckCard?.refManaCost ?? -1) || a.cardName.localeCompare(b.cardName);

		return direction === 'asc' ? compare : -compare;
	}

	private sortByWinrate(a: InternalCardData, b: InternalCardData, direction: SortDirection): number {
		return direction === 'asc' ? a.discoverWinrate - b.discoverWinrate : b.discoverWinrate - a.discoverWinrate;
	}

	private sortByDiscovered(a: InternalCardData, b: InternalCardData, direction: SortDirection): number {
		return direction === 'asc' ? a.discovered - b.discovered : b.discovered - a.discovered;
	}
}

const buildRelative = (value: number, deckWinrate: number): number => {
	if (value == null) {
		return null;
	}
	return value - deckWinrate;
};

const buildCss = (value: number): string => {
	if (value == null) {
		return null;
	}
	return value > 0 ? 'positive' : value < 0 ? 'negative' : null;
};

interface InternalCardData {
	readonly cardName: string;
	readonly deckCard: VisualDeckCard;
	readonly discoverWinrate: number;
	readonly discoverWinrateStr: string;
	readonly discoverWinrateCss: string;
	readonly discovered: number;
	readonly discoveredStr: string;
}

type ColumnSortType = 'name' | 'winrate' | 'discovered';
