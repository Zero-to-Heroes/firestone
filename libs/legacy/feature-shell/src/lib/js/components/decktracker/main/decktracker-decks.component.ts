import { CdkDragDrop } from '@angular/cdk/drag-drop';
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { DeckSummary } from '@firestone/constructed/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, arraysEqual } from '@firestone/shared/framework/common';
import { OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, distinctUntilChanged } from 'rxjs';
import { DeckSortType } from '../../../models/mainwindow/decktracker/deck-sort.type';
import { DecksProviderService } from '../../../services/decktracker/main/decks-provider.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { ConstructedNewDeckVersionEvent } from '../../../services/mainwindow/store/events/decktracker/constructed-new-deck-version-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';

@Component({
	standalone: false,
	selector: 'decktracker-decks',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/decktracker/main/decktracker-decks.component.scss`,
	],
	template: `
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
	decks$: Observable<readonly InternalDeckSummary[]>;
	currentDragText$: Observable<string>;

	private currentlyDraggedDeck = new BehaviorSubject<string>(null);
	private currentlyMousedOverDeck = new BehaviorSubject<string>(null);

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly deckService: DecksProviderService,
		private readonly prefs: PreferencesService,
		private readonly ow: OverwolfService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await Promise.all([this.deckService.isReady(), this.prefs.isReady()]);

		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;

		const deckSource$: Observable<readonly DeckSummary[]> = combineLatest([
			this.deckService.decks$$,
			this.prefs.preferences$$.pipe(
				this.mapData((prefs) => ({
					sort: prefs.desktopDeckFilters?.sort,
					search: prefs.constructedDecksSearchString,
					playerClass: prefs.desktopPlayerClassFilter,
				})),
				distinctUntilChanged(
					(a, b) => a.sort === b.sort && a.search === b.search && arraysEqual(a.playerClass, b.playerClass),
				),
			),
		]).pipe(
			this.mapData(([decks, { sort, search, playerClass }]) => {
				const result = (decks?.filter((deck) => deck.totalGames > 0 || deck.isPersonalDeck) ?? [])
					.filter((deck) => !playerClass?.length || playerClass.includes(deck.class))
					.filter(
						(deck) =>
							!search?.length ||
							deck.deckName?.toLowerCase()?.includes(search) ||
							deck.class?.toLowerCase()?.includes(search) ||
							this.i18n.translateString(`global.class.deck.class`)?.toLowerCase()?.includes(search),
					)
					.sort(this.getSortFunction(sort));
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
		this.decks$ = combineLatest([
			deckSource$,
			currentMergeSourceDeck$,
			this.currentlyMousedOverDeck.asObservable(),
		]).pipe(
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

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByDeckId(index: number, item: DeckSummary) {
		return item.deckstring;
	}

	preventAppDrag(event: MouseEvent) {
		event.stopPropagation();
	}

	drop(event: CdkDragDrop<readonly InternalDeckSummary[]>) {
		if (!this.currentlyMousedOverDeck.value) {
			return;
		}

		const droppedOn: DeckSummary = event.container.data.find(
			(deck) => deck.deckstring === this.currentlyMousedOverDeck.value,
		);
		const dragged: DeckSummary = event.item.data;
		console.debug('dropping', dragged.deckstring, droppedOn.deckstring);
		if (dragged.deckstring !== droppedOn.deckstring) {
			this.stateUpdater.next(new ConstructedNewDeckVersionEvent(dragged.deckstring, droppedOn.deckstring));
		}
	}

	deckDragStart(event, deck: DeckSummary) {
		this.currentlyDraggedDeck.next(deck.deckstring);
	}

	deckDragRelease(event, deck: DeckSummary) {
		this.currentlyDraggedDeck.next(null);
	}

	mouseEnterDeck(deck: InternalDeckSummary) {
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
	standalone: false,
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
	readonly isInvalidMergingTarget: boolean;
}
