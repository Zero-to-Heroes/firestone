import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { CardClass } from '@firestone-hs/reference-data';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { classes } from '../../../services/hs-utils';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { sumOnArray } from '../../../services/utils';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';
import { BucketCard } from './deckbuilder/duels-bucket-cards-list.component';
import { BucketData } from './deckbuilder/duels-deckbuilder-cards.component';

export const DEFAULT_CARD_WIDTH = 170;
export const DEFAULT_CARD_HEIGHT = 221;
@Component({
	selector: 'duels-buckets',
	styleUrls: [`../../../../css/component/duels/desktop/duels-buckets.component.scss`],
	template: `
		<div class="duels-buckets">
			<div class="search">
				<div class="card-search">
					<label class="search-label">
						<div class="icon" inlineSVG="assets/svg/search.svg"></div>
						<input
							[formControl]="searchForm"
							(mousedown)="onMouseDown($event)"
							[placeholder]="'app.collection.card-search.search-box-placeholder' | owTranslate"
						/>
					</label>
				</div>
				<div class="bucket-class-filters">
					<button
						class="bucket-class-filter"
						[ngClass]="{ 'active': isActive(playerClass) }"
						*ngFor="let playerClass of classOptions"
						role="listitem"
						tabindex="0"
						(click)="onClassFilterClicked(playerClass)"
					>
						<img
							[src]="playerClass.image"
							[alt]="playerClass.name"
							class="portrait"
							[helpTooltip]="playerClass.name"
						/>
					</button>
				</div>
			</div>
			<div class="results">
				<virtual-scroller
					class="buckets-container"
					#scroll
					*ngIf="(buckets$ | async)?.length; else emptyState"
					[items]="buckets$ | async"
					bufferAmount="5"
					scrollable
				>
					<div *ngFor="let bucket of scroll.viewPortItems; trackBy: trackByBucketId" class="bucket">
						<div class="bucket-name">{{ bucket.bucketName }}</div>
						<div class="class-images">
							<img
								*ngFor="let bucketClass of bucket.bucketClasses"
								[src]="bucketClass.image"
								class="bucket-class"
								[helpTooltip]="bucketClass.name"
							/>
						</div>
						<div class="bucket-cards">
							<duels-bucket-cards-list [cards]="bucket.bucketCards"></duels-bucket-cards-list>
						</div>
					</div>
				</virtual-scroller>
				<ng-template #emptyState>
					<collection-empty-state [searchString]="searchString$ | async"> </collection-empty-state>
				</ng-template>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsBucketsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	buckets$: Observable<readonly BucketData[]>;
	searchString$: Observable<string>;
	classOptions: readonly ClassOption[];

	searchForm = new FormControl();

	private activeClassFilters = new BehaviorSubject<readonly string[]>([]);

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		// TODO: factor this with deckbuilder-cards?
		this.classOptions = [...classes, 'neutral'].map((playerClass) => {
			return {
				id: playerClass,
				name: this.i18n.translateString(`global.class.${playerClass}`),
				image: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${playerClass}.png`,
			};
		});
		const allBuckets$ = this.store
			.listen$(([main, nav]) => main.duels.bucketsData)
			.pipe(
				this.mapData(([buckets]) => {
					return buckets.map((bucket) => {
						const totalCardsOffered = sumOnArray(bucket.cards, (card) => card.totalOffered);
						const bucketCards = bucket.cards
							.map((card) => {
								const totalBuckets = buckets.filter((b) =>
									b.cards.map((c) => c.cardId).includes(card.cardId),
								).length;
								const refCard = this.allCards.getCard(card.cardId);
								const bucketCard: BucketCard = {
									cardId: card.cardId,
									cardName: refCard.name,
									manaCost: refCard.cost,
									rarity: refCard.rarity?.toLowerCase(),
									offeringRate: card.totalOffered / totalCardsOffered,
									totalBuckets: totalBuckets,
								};
								return bucketCard;
							})
							.sort(
								(a, b) =>
									a.manaCost - b.manaCost ||
									(a.cardName?.toLowerCase() < b.cardName?.toLowerCase() ? -1 : 1),
							);
						const bucketData: BucketData = {
							bucketId: bucket.bucketId,
							bucketName: this.allCards.getCard(bucket.bucketId)?.name,
							bucketClasses: bucket.bucketClasses.map((bucketClass) => ({
								class: bucketClass,
								name: this.i18n.translateString(`global.class.${CardClass[bucketClass].toLowerCase()}`),
								image: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${CardClass[
									bucketClass
								].toLowerCase()}.png`,
							})),
							bucketCardIds: bucketCards.map((c) => c.cardId),
							bucketCards: bucketCards,
						};
						return bucketData;
					});
				}),
			);
		this.searchString$ = this.searchForm.valueChanges.pipe(
			startWith(null),
			this.mapData((data: string) => data?.trim()?.toLowerCase(), null, 50),
		);
		this.buckets$ = combineLatest(allBuckets$, this.activeClassFilters.asObservable(), this.searchString$).pipe(
			this.mapData(([buckets, activeClassFilters, searchString]) =>
				buckets
					.filter(
						(bucket) =>
							!activeClassFilters.length ||
							bucket.bucketClasses.some((bucketClass) =>
								activeClassFilters.includes(CardClass[bucketClass.class].toLowerCase()),
							),
					)
					.map((bucket) =>
						!searchString?.length ? bucket : this.highlightCardsInBucket(bucket, searchString),
					)
					.filter((bucket) => !!bucket),
			),
		);
	}

	trackByBucketId(index: number, item: BucketData) {
		return item.bucketId;
	}

	onClassFilterClicked(playerClass: ClassOption) {
		const activeClassFilters = this.activeClassFilters.value;
		if (activeClassFilters.includes(playerClass.id)) {
			this.activeClassFilters.next(activeClassFilters.filter((c) => c !== playerClass.id));
		} else {
			this.activeClassFilters.next([...activeClassFilters, playerClass.id]);
		}
	}

	isActive(playerClass: ClassOption) {
		return this.activeClassFilters.value.includes(playerClass.id);
	}

	onMouseDown(event: Event) {
		event.stopPropagation();
	}

	private highlightCardsInBucket(bucket: BucketData, searchString: string): BucketData {
		if (!searchString?.length) {
			return bucket;
		}

		const updatedBucket = {
			...bucket,
			bucketCards: bucket.bucketCards.map((card) => ({
				...card,
				dimmed: !this.isMatchingBucketCard(card, searchString),
			})),
		} as BucketData;
		const isMatchingBucket = updatedBucket.bucketCards.some((card) => !card.dimmed);
		return isMatchingBucket ? updatedBucket : null;
	}

	private isMatchingBucketCard(bucketCard: BucketCard, searchString: string): boolean {
		if (!bucketCard.cardName) {
			return false;
		}
		const card = this.allCards.getCard(bucketCard.cardId);
		return (
			card.name.toLowerCase().includes(searchString) ||
			card.text?.toLowerCase().includes(searchString) ||
			card.spellSchool?.toLowerCase().includes(searchString) ||
			card.race?.toLowerCase().includes(searchString) ||
			card.referencedTags?.some((tag) => tag.toLowerCase().includes(searchString))
		);
	}
}

interface ClassOption {
	readonly id: string;
	readonly name: string;
	readonly image: string;
}
