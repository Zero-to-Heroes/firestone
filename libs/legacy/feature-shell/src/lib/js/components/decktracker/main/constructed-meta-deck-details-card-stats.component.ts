import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { ConstructedCardData } from '@firestone-hs/constructed-deck-stats';
import { SortCriteria, SortDirection, invertDirection } from '@firestone/shared/common/view';
import {
	AbstractSubscriptionComponent,
	buildPercents,
	groupByFunction,
	uuidShort,
} from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';

@Component({
	selector: 'constructed-meta-deck-details-card-stats',
	styleUrls: [
		`../../../../css/component/decktracker/main/constructed-meta-deck-details-cards-columns.scss`,
		`../../../../css/component/decktracker/main/constructed-meta-deck-details-card-stats.component.scss`,
	],
	template: `
		<div class="constructed-meta-deck-details-card-stats" [ngClass]="{ deck: isDeck, archetype: !isDeck }">
			<div class="controls">
				<preference-toggle
					class="show-relative-info-button"
					field="constructedMetaDecksShowRelativeInfo"
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
					class="cell data winrate"
					[name]="'app.decktracker.meta.details.cards.mulligan-winrate-header' | owTranslate"
					[helpTooltip]="'app.decktracker.meta.details.cards.mulligan-winrate-header-tooltip' | owTranslate"
					[sort]="sort"
					[criteria]="'mulligan-winrate'"
					(sortClick)="onSortClick($event)"
				>
				</sortable-table-label>
				<sortable-table-label
					class="cell data copy-1"
					[name]="'app.decktracker.meta.details.cards.copy-1-header' | owTranslate"
					[helpTooltip]="'app.decktracker.meta.details.cards.copy-1-header-tooltip' | owTranslate"
					[sort]="sort"
					[criteria]="'copy-1'"
					(sortClick)="onSortClick($event)"
				>
				</sortable-table-label>
				<!-- <sortable-table-label
					class="cell data copy-2"
					[name]="'app.decktracker.meta.details.cards.copy-2-header' | owTranslate"
					[helpTooltip]="'app.decktracker.meta.details.cards.copy-2-header-tooltip' | owTranslate"
					[sort]="sort"
					[criteria]="'copy-2'"
					(sortClick)="onSortClick($event)"
				>
				</sortable-table-label> -->
				<sortable-table-label
					class="cell data kept"
					[name]="'app.decktracker.meta.details.cards.mulligan-kept-header' | owTranslate"
					[helpTooltip]="'app.decktracker.meta.details.cards.mulligan-kept-header-tooltip' | owTranslate"
					[sort]="sort"
					[criteria]="'kept'"
					(sortClick)="onSortClick($event)"
				>
				</sortable-table-label>
				<sortable-table-label
					class="cell data drawn"
					[name]="'app.decktracker.meta.details.cards.mulligan-drawn-winrate-header' | owTranslate"
					[helpTooltip]="
						'app.decktracker.meta.details.cards.mulligan-drawn-winrate-header-tooltip' | owTranslate
					"
					[sort]="sort"
					[criteria]="'drawn-winrate'"
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
					<div class="cell data winrate {{ card.mulliganWinrateCss }}">{{ card.mulliganWinrateStr }}</div>
					<div class="cell data copy-1">{{ card.copy1Str }}</div>
					<!-- <div class="cell data copy-2">{{ card.copy2Str }}</div> -->
					<div class="cell data kept ">{{ card.keptInMulliganStr }}</div>
					<div class="cell data drawn {{ card.drawnWinrateCss }}">{{ card.drawnWinrateStr }}</div>
				</li>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMetaDeckDetailsCardStatsComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	sortCriteria$: Observable<SortCriteria<ColumnSortType>>;
	cardData$: Observable<readonly InternalCardData[]>;

	@Input() set cards(value: readonly ConstructedCardData[]) {
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
	@Input() isDeck: boolean;

	private cardData$$ = new BehaviorSubject<readonly ConstructedCardData[]>([]);
	private showRelativeInfo$$ = new BehaviorSubject<boolean>(false);
	private deckWinrate$$ = new BehaviorSubject<number>(null);
	private totalGames$$ = new BehaviorSubject<number>(null);

	private sortCriteria$$ = new BehaviorSubject<SortCriteria<ColumnSortType>>({
		criteria: 'mulligan-winrate',
		direction: 'desc',
	});

	constructor(protected readonly cdr: ChangeDetectorRef, private readonly allCards: CardsFacadeService) {
		super(cdr);
	}

	// TODO: show the info related to the global deck winrate, to make it easier to see
	// which cards do well or not
	ngAfterContentInit(): void {
		this.sortCriteria$ = this.sortCriteria$$.asObservable();
		this.cardData$ = combineLatest([
			this.cardData$$,
			this.sortCriteria$$,
			this.showRelativeInfo$$,
			this.deckWinrate$$,
			this.totalGames$$,
		]).pipe(
			this.mapData(([cardData, sortCriteria, showRelativeInfo, deckWinrate, totalGames]) => {
				console.debug('cardsData', cardData);
				const groupedByCardId = groupByFunction((data: ConstructedCardData) => data.cardId)(cardData);
				const result = Object.keys(groupedByCardId)
					.map((cardId) => {
						const card = this.allCards.getCard(cardId);
						const data = groupedByCardId[cardId];
						const copies = data.length;
						const firstCopyData = data[0];

						const absoluteMulliganWinrate = firstCopyData.inHandAfterMulligan
							? firstCopyData.inHandAfterMulliganThenWin / firstCopyData.inHandAfterMulligan
							: null;
						const relativeMulliganWinrate = buildRelative(absoluteMulliganWinrate, deckWinrate);
						const mulliganWinrate = showRelativeInfo ? relativeMulliganWinrate : absoluteMulliganWinrate;
						const mulliganWinrateStr = buildPercents(mulliganWinrate);
						const mulliganWinrateCss = buildCss(relativeMulliganWinrate);

						const keptInMulligan = firstCopyData.drawnBeforeMulligan
							? firstCopyData.keptInMulligan / firstCopyData.drawnBeforeMulligan
							: null;
						const keptInMulliganStr = buildPercents(keptInMulligan);

						// const absoluteDrawnWinrate = firstCopyData.drawn
						// 	? firstCopyData.drawnThenWin / firstCopyData.drawn
						// 	: null;

						const absoluteDrawnWinrate =
							firstCopyData.drawn + firstCopyData.inHandAfterMulligan
								? (firstCopyData.drawnThenWin + firstCopyData.inHandAfterMulliganThenWin) /
								  (firstCopyData.drawn + firstCopyData.inHandAfterMulligan)
								: null;
						const relativeDrawnWinrate = buildRelative(absoluteDrawnWinrate, deckWinrate);
						const drawnWinrate = showRelativeInfo ? relativeDrawnWinrate : absoluteDrawnWinrate;
						const drawnWinrateStr = buildPercents(drawnWinrate);
						const drawnWinrateCss = buildCss(relativeDrawnWinrate);

						const copy1 = firstCopyData.inStartingDeck / totalGames;
						const copy1Str = buildPercents(copy1);
						console.debug(
							'copy1',
							copy1,
							copy1Str,
							firstCopyData.inStartingDeck,
							totalGames,
							firstCopyData,
						);
						const secondCopyData = data[1];
						const copy2 = (secondCopyData?.inStartingDeck ?? 0) / totalGames;
						const copy2Str = copy2 > 0 ? buildPercents(copy2) : '-';

						const internalEntityId = uuidShort();
						// const mulliganKept = buildPercents(firstCopyData.keptInMulligan);
						const result: InternalCardData = {
							cardName: card.name,
							mulliganWinrate: mulliganWinrate,
							mulliganWinrateStr: mulliganWinrateStr,
							mulliganWinrateCss: mulliganWinrateCss,
							drawnWinrate: drawnWinrate,
							drawnWinrateStr: drawnWinrateStr,
							drawnWinrateCss: drawnWinrateCss,
							keptInMulligan: keptInMulligan,
							keptInMulliganStr: keptInMulliganStr,
							copy1: copy1,
							copy1Str: copy1Str,
							copy2: copy2,
							copy2Str: copy2Str,
							deckCard: VisualDeckCard.create({
								cardId: card.id,
								cardName: card.name,
								manaCost: card.cost,
								rarity: card.rarity,
								totalQuantity: copies,
								internalEntityId: internalEntityId,
								internalEntityIds: [internalEntityId],
							}),
							// mulliganKept: mulliganKept,
						};
						return result;
					})
					.sort((a, b) => this.sortCards(a, b, sortCriteria));
				return result;
			}),
		);
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
			case 'mulligan-winrate':
				return this.sortByMulliganWinrate(a, b, sortCriteria.direction);
			case 'kept':
				return this.sortByKept(a, b, sortCriteria.direction);
			case 'drawn-winrate':
				return this.sortByDrawnWinrate(a, b, sortCriteria.direction);
			case 'copy-1':
				return this.sortByCopy1(a, b, sortCriteria.direction);
			case 'copy-2':
				return this.sortByCopy2(a, b, sortCriteria.direction);
			default:
				return 0;
		}
	}

	private sortByCost(a: InternalCardData, b: InternalCardData, direction: SortDirection): number {
		const compare =
			(a.deckCard?.manaCost ?? -1) - (b.deckCard?.manaCost ?? -1) || a.cardName.localeCompare(b.cardName);

		return direction === 'asc' ? compare : -compare;
	}

	private sortByMulliganWinrate(a: InternalCardData, b: InternalCardData, direction: SortDirection): number {
		return direction === 'asc' ? a.mulliganWinrate - b.mulliganWinrate : b.mulliganWinrate - a.mulliganWinrate;
	}

	private sortByKept(a: InternalCardData, b: InternalCardData, direction: SortDirection): number {
		return direction === 'asc' ? a.keptInMulligan - b.keptInMulligan : b.keptInMulligan - a.keptInMulligan;
	}

	private sortByDrawnWinrate(a: InternalCardData, b: InternalCardData, direction: SortDirection): number {
		return direction === 'asc' ? a.drawnWinrate - b.drawnWinrate : b.drawnWinrate - a.drawnWinrate;
	}

	private sortByCopy1(a: InternalCardData, b: InternalCardData, direction: SortDirection): number {
		return direction === 'asc' ? a.copy1 - b.copy1 : b.copy1 - a.copy1;
	}

	private sortByCopy2(a: InternalCardData, b: InternalCardData, direction: SortDirection): number {
		return direction === 'asc' ? a.copy2 - b.copy2 : b.copy2 - a.copy2;
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
	readonly mulliganWinrate: number;
	readonly mulliganWinrateStr: string;
	readonly mulliganWinrateCss: string;
	readonly keptInMulligan: number;
	readonly keptInMulliganStr: string;
	readonly drawnWinrate: number;
	readonly drawnWinrateStr: string;
	readonly drawnWinrateCss: string;
	readonly copy1: number;
	readonly copy1Str: string;
	readonly copy2: number;
	readonly copy2Str: string;
}

type ColumnSortType = 'name' | 'mulligan-winrate' | 'kept' | 'drawn-winrate' | 'copy-1' | 'copy-2';
