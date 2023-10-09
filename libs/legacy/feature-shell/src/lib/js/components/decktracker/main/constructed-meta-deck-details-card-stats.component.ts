import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { ConstructedCardData } from '@firestone-hs/constructed-deck-stats';
import { SortCriteria, SortDirection, invertDirection } from '@firestone/shared/common/view';
import {
	AbstractSubscriptionComponent,
	buildPercents,
	groupByFunction,
	uuid,
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
		<div class="constructed-meta-deck-details-card-stats">
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
					[sort]="sort"
					[criteria]="'mulligan-winrate'"
					(sortClick)="onSortClick($event)"
				>
				</sortable-table-label>
				<sortable-table-label
					class="cell data kept"
					[name]="'app.decktracker.meta.details.cards.mulligan-kept-header' | owTranslate"
					[sort]="sort"
					[criteria]="'kept'"
					(sortClick)="onSortClick($event)"
				>
				</sortable-table-label>
				<sortable-table-label
					class="cell data drawn"
					[name]="'app.decktracker.meta.details.cards.mulligan-drawn-winrate-header' | owTranslate"
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
					<div class="cell data winrate">{{ card.mulliganWinrateStr }}</div>
					<div class="cell data kept">{{ card.keptInMulliganStr }}</div>
					<div class="cell data drawn">{{ card.drawnWinrateStr }}</div>
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

	private cardData$$ = new BehaviorSubject<readonly ConstructedCardData[]>([]);

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
		this.cardData$ = combineLatest([this.cardData$$, this.sortCriteria$$]).pipe(
			this.mapData(([cardData, sortCriteria]) => {
				const groupedByCardId = groupByFunction((data: ConstructedCardData) => data.cardId)(cardData);
				const result = Object.keys(groupedByCardId)
					.map((cardId) => {
						const card = this.allCards.getCard(cardId);
						const data = groupedByCardId[cardId];
						const copies = data.length;
						const firstCopyData = data[0];
						const mulliganWinrate = firstCopyData.inHandAfterMulligan
							? firstCopyData.inHandAfterMulliganThenWin / firstCopyData.inHandAfterMulligan
							: null;
						const mulliganWinrateStr = buildPercents(mulliganWinrate);
						const keptInMulligan = firstCopyData.drawnBeforeMulligan
							? firstCopyData.keptInMulligan / firstCopyData.drawnBeforeMulligan
							: null;
						const keptInMulliganStr = buildPercents(keptInMulligan);
						const drawnWinrate = firstCopyData.drawn
							? firstCopyData.drawnThenWin / firstCopyData.drawn
							: null;
						const drawnWinrateStr = buildPercents(drawnWinrate);
						const internalEntityId = uuid();
						// const mulliganKept = buildPercents(firstCopyData.keptInMulligan);
						const result: InternalCardData = {
							cardName: card.name,
							mulliganWinrate: mulliganWinrate,
							mulliganWinrateStr: mulliganWinrateStr,
							drawnWinrate: drawnWinrate,
							drawnWinrateStr: drawnWinrateStr,
							keptInMulligan: keptInMulligan,
							keptInMulliganStr: keptInMulliganStr,
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
			default:
				return 0;
		}
	}

	private sortByCost(a: InternalCardData, b: InternalCardData, direction: SortDirection): number {
		const compare =
			(a.deckCard?.manaCost ?? 0) - (b.deckCard?.manaCost ?? 0) || a.cardName.localeCompare(b.cardName);

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
}

interface InternalCardData {
	readonly cardName: string;
	readonly deckCard: VisualDeckCard;
	readonly mulliganWinrate: number;
	readonly mulliganWinrateStr: string;
	readonly keptInMulligan: number;
	readonly keptInMulliganStr: string;
	readonly drawnWinrate: number;
	readonly drawnWinrateStr: string;
}

type ColumnSortType = 'name' | 'mulligan-winrate' | 'kept' | 'drawn-winrate';
