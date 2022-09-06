import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { DeckSortType } from '../../../models/mainwindow/decktracker/deck-sort.type';
import { DeckSummary } from '../../../models/mainwindow/decktracker/deck-summary';
import { FeatureFlags } from '../../../services/feature-flags';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { ConstructedNewDeckVersionEvent } from '../../../services/mainwindow/store/events/decktracker/constructed-new-deck-version-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'decktracker-decks',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/decktracker/main/decktracker-decks.component.scss`,
	],
	template: `
		<!-- <deck-drag-template class="drag-template" [deckName]="'Fake deck'"></deck-drag-template> -->
		<div class="decktracker-decks" *ngIf="decks$ | async as decks">
			<ul class="deck-list" scrollable [attr.aria-label]="'Constructed deck stats'" role="list">
				<li
					*ngFor="let deck of decks; trackBy: trackByDeckId"
					cdkDropList
					cdkDrop
					(cdkDropListDropped)="drop($event)"
					[cdkDropListData]="decks"
					[cdkDropListSortingDisabled]="true"
					[ngClass]="{
						'merging-source': deck.isMergingSource,
						'valid-merging-target': deck.isValidMergingTarget,
						'invalid-merging-target': deck.isInvalidMergingTarget,
						'current-merging-target': deck.isCurrentMergingTarget
					}"
				>
					<decktracker-deck-summary
						[deck]="deck"
						role="listitem"
						cdkDrag
						[cdkDragDisabled]="!enableVersioning"
						[cdkDragData]="deck"
						cdkDragPreviewClass="test-tracker-drag-class"
						(mousedown)="preventAppDrag($event)"
						(mouseenter)="mouseEnterDeck(deck)"
						(moueaseleave)="mouseLeaveDeck(deck)"
						(cdkDragStarted)="deckDragStart($event, deck)"
						(cdkDragReleased)="deckDragRelease($event, deck)"
					>
						<deck-drag-template
							class="drag-template"
							*cdkDragPreview
							[deckName]="deck.deckName"
							[text]="currentDragText$ | async"
						></deck-drag-template>
					</decktracker-deck-summary>
				</li>
			</ul>
			<section class="empty-state" *ngIf="!decks || decks.length === 0">
				<div class="state-container">
					<i class="i-236X165">
						<svg>
							<use xlink:href="assets/svg/sprite.svg#empty_state_tracker" />
						</svg>
					</i>
					<span class="title" [owTranslate]="'app.decktracker.decks.empty-state-title'"></span>
					<span class="subtitle" [owTranslate]="'app.decktracker.decks.empty-state-subtitle'"></span>
				</div>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerDecksComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	enableVersioning = FeatureFlags.ENABLE_DECK_VERSIONS;

	decks$: Observable<readonly InternalDeckSummary[]>;
	currentDragText$: Observable<string>;

	private currentlyDraggedDeck = new BehaviorSubject<string>(null);
	private currentlyMousedOverDeck = new BehaviorSubject<string>(null);

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		const deckSource$: Observable<readonly DeckSummary[]> = combineLatest(
			this.store.listen$(
				([main, nav, prefs]) => main.decktracker.decks,
				([main, nav, prefs]) => prefs.desktopDeckFilters?.sort,
			),
			this.store.listenPrefs$((prefs) => prefs.constructedDecksSearchString),
		).pipe(
			this.mapData(([[decks, sort], [search]]) => {
				// console.debug('[deck] updating decks', decks);
				const result = (decks?.filter((deck) => deck.totalGames > 0 || deck.isPersonalDeck) ?? [])
					.filter(
						(deck) =>
							!search?.length ||
							deck.deckName?.toLowerCase()?.includes(search) ||
							deck.class?.toLowerCase()?.includes(search) ||
							this.i18n.translateString(`global.class.deck.class`)?.toLowerCase()?.includes(search),
					)
					.sort(this.getSortFunction(sort));
				// console.debug('[deck] after update', result);
				return result;
			}),
		);

		const currentMergeSourceDeck$: Observable<DeckSummary> = combineLatest(
			deckSource$,
			this.currentlyDraggedDeck.asObservable(),
		).pipe(
			this.mapData(
				([decks, currentlyDraggedDeck]) => {
					return decks.find((d) => d.deckstring === currentlyDraggedDeck);
				},
				null,
				0,
			),
		);
		this.decks$ = combineLatest(
			deckSource$,
			currentMergeSourceDeck$,
			this.currentlyMousedOverDeck.asObservable(),
		).pipe(
			this.mapData(
				([decks, currentMergeSourceDeck, currentlyMousedOverDeck]) => {
					return decks.map(
						(deck) =>
							({
								...deck,
								isMergingSource: deck.deckstring === currentMergeSourceDeck?.deckstring,
								isCurrentMergingTarget:
									!!currentMergeSourceDeck && deck.deckstring === currentlyMousedOverDeck,
								isValidMergingTarget:
									!!currentMergeSourceDeck &&
									currentMergeSourceDeck.deckstring !== deck.deckstring &&
									currentMergeSourceDeck.class === deck.class,
								isInvalidMergingTarget:
									!!currentMergeSourceDeck &&
									currentMergeSourceDeck.deckstring !== deck.deckstring &&
									currentMergeSourceDeck.class !== deck.class,
							} as InternalDeckSummary),
					);
				},
				null,
				0,
			),
		);
		const currentMousedOverDeck$: Observable<DeckSummary> = combineLatest(
			this.decks$,
			currentMergeSourceDeck$,
			this.currentlyMousedOverDeck.asObservable(),
		).pipe(
			this.mapData(
				([decks, currentMergeSourceDeck, currentlyDraggedDeck]) => {
					return decks
						.filter((d) => d.isValidMergingTarget)
						.find(
							(d) =>
								d.deckstring === currentlyDraggedDeck &&
								d.deckstring !== currentMergeSourceDeck.deckstring,
						);
				},
				null,
				0,
			),
		);
		this.currentDragText$ = currentMousedOverDeck$.pipe(
			this.mapData(
				(deck) =>
					!deck
						? this.i18n.translateString('app.decktracker.decks.drag-to-merge-default')
						: this.i18n.translateString('app.decktracker.decks.drag-to-merge', {
								deckName: deck.deckName,
						  }),
				null,
				0,
			),
		);
	}

	trackByDeckId(index: number, item: DeckSummary) {
		return item.deckstring;
	}

	preventAppDrag(event: MouseEvent) {
		event.stopPropagation();
	}

	drop(event: CdkDragDrop<DeckSummary[]>) {
		if (!this.currentlyMousedOverDeck.value) {
			return;
		}

		const droppedOn: DeckSummary = event.container.data.find(
			(deck) => deck.deckstring === this.currentlyMousedOverDeck.value,
		);
		const dragged: DeckSummary = event.item.data;
		// console.debug(
		// 	'dropping',
		// 	dragged.deckName,
		// 	droppedOn.deckName,
		// 	dragged.deckstring,
		// 	droppedOn.deckstring,
		// 	event,
		// 	droppedOn,
		// );
		if (dragged.deckstring !== droppedOn.deckstring) {
			this.store.send(new ConstructedNewDeckVersionEvent(dragged.deckstring, droppedOn.deckstring));
		}
	}

	deckDragStart(event, deck: DeckSummary) {
		this.currentlyDraggedDeck.next(deck.deckstring);
	}

	deckDragRelease(event, deck: DeckSummary) {
		// console.debug('released drag', deck.deckName, deck);
		this.currentlyDraggedDeck.next(null);
	}

	mouseEnterDeck(deck: InternalDeckSummary) {
		// console.debug('mousing over', deck.deckName, deck);
		if (deck.isValidMergingTarget) {
			this.currentlyMousedOverDeck.next(deck.deckstring);
		} else {
			this.currentlyMousedOverDeck.next(null);
		}
	}

	mouseLeaveDeck(deck: DeckSummary) {
		this.currentlyMousedOverDeck.next(null);
	}

	private getSortFunction(sort: DeckSortType): (a: DeckSummary, b: DeckSummary) => number {
		switch (sort) {
			case 'games-played':
				return (a: DeckSummary, b: DeckSummary) => {
					if (a.totalGames <= b.totalGames) {
						return 1;
					}
					return -1;
				};
			case 'winrate':
				return (a: DeckSummary, b: DeckSummary) => {
					if (a.winRatePercentage <= b.winRatePercentage) {
						return 1;
					}
					return -1;
				};
			case 'last-played':
			default:
				return (a: DeckSummary, b: DeckSummary) => {
					if (a.lastUsedTimestamp <= b.lastUsedTimestamp) {
						return 1;
					}
					return -1;
				};
		}
	}
}

@Component({
	selector: 'deck-drag-template',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/decktracker/main/decktracker-decks.component.scss`,
	],
	template: `
		<div class="deck-drag-template">
			<div class="deck-name">{{ deckName }}</div>
			<div class="text">{{ text }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerDeckDragTemplateComponent {
	@Input() deckName: string;
	@Input() text: string;
}

interface InternalDeckSummary extends DeckSummary {
	readonly isMergingSource: boolean;
	readonly isValidMergingTarget: boolean;
	readonly isCurrentMergingTarget: boolean;
}
