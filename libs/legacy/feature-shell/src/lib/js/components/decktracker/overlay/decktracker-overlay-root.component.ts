import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	Input,
	OnDestroy,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { CardClass } from '@firestone-hs/reference-data';
import { DeckState, GameState, StatsRecap } from '@firestone/game-state';
import { Preferences } from '@firestone/shared/common/service';
import { gameFormatToStatGameFormatType } from '@firestone/stats/data-access';
import { CardsHighlightFacadeService } from '@services/decktracker/card-highlight/cards-highlight-facade.service';
import { Observable, combineLatest, shareReplay } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, takeUntil } from 'rxjs/operators';
import { DecksProviderService } from '../../../services/decktracker/main/decks-provider.service';
import { Events } from '../../../services/events.service';
import { PatchesConfigService } from '../../../services/patches-config.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'decktracker-overlay-root',
	styleUrls: ['../../../../css/component/decktracker/overlay/decktracker-overlay.component.scss'],
	template: `
		<div
			class="root {{ player }}"
			tabindex="0"
			[activeTheme]="'decktracker'"
			[style.opacity]="opacity$ | async"
			[ngClass]="{ active: active }"
		>
			<decktracker-widget-icon
				class="icon"
				(decktrackerToggle)="onDecktrackerToggle($event)"
				[decktrackerToggled]="active"
			></decktracker-widget-icon>
			<!-- Never remove the scalable from the DOM so that we can perform resizing even when not visible -->
			<div class="scalable">
				<ng-container *ngIf="{ deck: deck$ | async } as value">
					<div class="decktracker-container">
						<div
							class="decktracker"
							*ngIf="!!value.deck"
							[style.width.px]="overlayWidthInPx"
							[ngClass]="{ 'hide-control-bar': !(showControlBar$ | async) }"
						>
							<!-- <div class="background"></div> -->
							<decktracker-control-bar
								[settingsCategory]="player"
								[closeEvent]="closeEvent"
								(onMinimize)="onMinimize()"
							></decktracker-control-bar>
							<decktracker-title-bar
								[deck]="value.deck"
								[showTitleBar]="showTitleBar$ | async"
								[showDeckWinrate]="showDeckWinrate$ | async"
								[showMatchupWinrate]="showMatchupWinrate$ | async"
								[showTotalCardsInZone]="showTotalCardsInZone$ | async"
								[deckWinrate]="deckStatsRecap$ | async"
								[matchupWinrate]="matchupStatsRecap$ | async"
							></decktracker-title-bar>
							<decktracker-deck-list
								[deckState]="value.deck"
								[displayMode]="displayMode$ | async"
								[colorManaCost]="colorManaCost$ | async"
								[showRelatedCards]="showRelatedCards$ | async"
								[showUnknownCards]="showUnknownCards$ | async"
								[showUpdatedCost]="showUpdatedCost$ | async"
								[showGlobalEffectsZone]="showGlobalEffectsZone$ | async"
								[showGiftsSeparately]="showGiftsSeparately$ | async"
								[groupSameCardsTogether]="groupSameCardsTogether$ | async"
								[showGeneratedCardsInSeparateZone]="showGeneratedCardsInSeparateZone$ | async"
								[showPlaguesOnTop]="showPlaguesOnTop$ | async"
								[showBoardCardsInSeparateZone]="showBoardCardsInSeparateZone$ | async"
								[showStatsChange]="showStatsChange$ | async"
								[cardsGoToBottom]="cardsGoToBottom$ | async"
								[darkenUsedCards]="darkenUsedCards$ | async"
								[hideGeneratedCardsInOtherZone]="hideGeneratedCardsInOtherZone$ | async"
								[sortCardsByManaCostInOtherZone]="sortCardsByManaCostInOtherZone$ | async"
								[showBottomCardsSeparately]="showBottomCardsSeparately$ | async"
								[showTopCardsSeparately]="showTopCardsSeparately$ | async"
								[showTotalCardsInZone]="showTotalCardsInZone$ | async"
								[showDkRunes]="showDkRunes$ | async"
								[side]="player"
							>
							</decktracker-deck-list>
							<div class="backdrop" *ngIf="showBackdrop"></div>
						</div>
					</div>
				</ng-container>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerOverlayRootComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit, OnDestroy
{
	@Input() overlayWidthExtractor: (prefs: Preferences) => number;
	@Input() overlayDisplayModeExtractor: (prefs: Preferences) => string;
	@Input() opacityExtractor: (prefs: Preferences) => number;
	@Input() cardsGoToBottomExtractor: (prefs: Preferences) => boolean;
	@Input() showGlobalEffectsExtractor: (prefs: Preferences) => boolean;
	@Input() darkenUsedCardsExtractor: (prefs: Preferences) => boolean;
	@Input() hideGeneratedCardsInOtherZoneExtractor: (prefs: Preferences) => boolean;
	@Input() sortCardsByManaCostInOtherZoneExtractor: (prefs: Preferences) => boolean;
	@Input() showBottomCardsSeparatelyExtractor: (prefs: Preferences) => boolean;
	@Input() showTopCardsSeparatelyExtractor: (prefs: Preferences) => boolean;
	@Input() scaleExtractor: (prefs: Preferences) => number;
	@Input() deckExtractor: (state: GameState, inMulligan: boolean) => DeckState;
	@Input() showDeckWinrateExtractor: (prefs: Preferences) => boolean;
	@Input() showMatchupWinrateExtractor: (prefs: Preferences) => boolean;
	@Input() showDkRunesExtractor: (prefs: Preferences) => boolean;
	@Input() showTotalCardsInZoneExtractor: (computedValue: boolean) => boolean = (computedValue) => computedValue;
	@Input() closeEvent: string;
	@Input() player: 'player' | 'opponent';

	deck$: Observable<DeckState>;
	matchupStatsRecap$: Observable<StatsRecap>;
	deckStatsRecap$: Observable<StatsRecap>;

	displayMode$: Observable<string>;
	showTitleBar$: Observable<boolean>;
	showControlBar$: Observable<boolean>;
	opacity$: Observable<number>;
	colorManaCost$: Observable<boolean>;
	showRelatedCards$: Observable<boolean>;
	showUnknownCards$: Observable<boolean>;
	showUpdatedCost$: Observable<boolean>;
	showGiftsSeparately$: Observable<boolean>;
	groupSameCardsTogether$: Observable<boolean>;
	showGeneratedCardsInSeparateZone$: Observable<boolean>;
	showBoardCardsInSeparateZone$: Observable<boolean>;
	showPlaguesOnTop$: Observable<boolean>;
	showStatsChange$: Observable<boolean>;
	cardsGoToBottom$: Observable<boolean>;
	showGlobalEffectsZone$: Observable<boolean>;
	showDeckWinrate$: Observable<boolean>;
	showMatchupWinrate$: Observable<boolean>;
	darkenUsedCards$: Observable<boolean>;
	hideGeneratedCardsInOtherZone$: Observable<boolean>;
	sortCardsByManaCostInOtherZone$: Observable<boolean>;
	showBottomCardsSeparately$: Observable<boolean>;
	showTopCardsSeparately$: Observable<boolean>;
	showDkRunes$: Observable<boolean>;
	showTotalCardsInZone$: Observable<boolean>;

	active = true;
	windowId: string;
	activeTooltip: string;

	overlayWidthInPx = 227;

	showBackdrop: boolean;

	private showTooltipsFromPrefs = true;
	private showTooltips = true;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private el: ElementRef,
		private renderer: Renderer2,
		private events: Events,
		private readonly cardsHighlight: CardsHighlightFacadeService,
		private readonly patchesConfig: PatchesConfigService,
	) {
		super(store, cdr);
		this.cardsHighlight.init();
	}

	async ngAfterViewInit() {
		this.events.on(Events.SHOW_MODAL).subscribe(() => {
			this.showBackdrop = true;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
		this.events.on(Events.HIDE_MODAL).subscribe(() => {
			this.showBackdrop = false;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
	}

	async ngAfterContentInit() {
		await this.patchesConfig.isReady();

		this.showDeckWinrate$ = this.listenForBasicPref$((preferences) => this.showDeckWinrateExtractor(preferences));
		this.showMatchupWinrate$ = this.listenForBasicPref$((preferences) =>
			this.showMatchupWinrateExtractor(preferences),
		);

		this.deck$ = this.store
			.listenDeckState$((gameState) => gameState)
			.pipe(
				this.mapData(([gameState]) => {
					const deck = !gameState
						? null
						: this.deckExtractor(gameState, gameState.currentTurn === 'mulligan');
					return deck;
				}),
				shareReplay(1),
				takeUntil(this.destroyed$),
			);
		// For debug only
		this.deck$
			.pipe(
				this.mapData((deck) => deck?.deckstring),
				distinctUntilChanged(),
				takeUntil(this.destroyed$),
			)
			.subscribe((deckstring) => {
				console.log('[deck-tracker] using deck', deckstring, 'for player', this.player);
			});
		this.showTotalCardsInZone$ = this.store
			.listenDeckState$((gameState) => gameState.currentTurn)
			.pipe(this.mapData(([currentTurn]) => this.showTotalCardsInZoneExtractor(currentTurn !== 'mulligan')));
		const gamesForDeck$ = combineLatest([
			this.showDeckWinrate$,
			this.showMatchupWinrate$,
			this.store.listenDeckState$(
				(gameState) => gameState?.playerDeck?.deckstring,
				(gameState) => gameState?.metadata?.formatType,
			),
			this.store.listen$(
				([main, nav, prefs]) => main.decktracker.filters.time,
				([main, nav, prefs]) => main.decktracker.filters.rank,
			),
			this.patchesConfig.currentConstructedMetaPatch$$,
			this.store.gameStats$(),
			this.store.decks$(),
			this.store.listenPrefs$(
				(prefs) => prefs.desktopDeckDeletes,
				(prefs) => prefs.desktopDeckStatsReset,
				(prefs) => prefs.desktopDeckHiddenDeckCodes,
				(prefs) => prefs.desktopDeckShowHiddenDecks,
			),
		]).pipe(
			debounceTime(1000),
			filter(
				([
					showDeckWinrate,
					showMatchupWinrate,
					[deckstring, formatType],
					[timeFilter, rankFilter],
					patch,
					gameStats,
					decks,
					[desktopDeckDeletes, desktopDeckStatsReset, desktopDeckHiddenDeckCodes, desktopDeckShowHiddenDecks],
				]) => (showDeckWinrate || showDeckWinrate) && !!gameStats?.length && !!decks?.length,
			),
			this.mapData(
				([
					showDeckWinrate,
					showMatchupWinrate,
					[deckstring, formatType],
					[timeFilter, rankFilter],
					patch,
					gameStats,
					decks,
					[desktopDeckDeletes, desktopDeckStatsReset, desktopDeckHiddenDeckCodes, desktopDeckShowHiddenDecks],
				]) => {
					const result = DecksProviderService.buildValidReplays(
						deckstring,
						gameStats,
						gameFormatToStatGameFormatType(formatType),
						// 'standard',
						'ranked',
						timeFilter,
						rankFilter,
						patch,
						desktopDeckDeletes,
						desktopDeckStatsReset,
						desktopDeckHiddenDeckCodes,
						desktopDeckShowHiddenDecks,
						decks,
					);
					return result;
				},
			),
			shareReplay(1),
		);

		this.matchupStatsRecap$ = combineLatest([
			this.store.listenDeckState$((gameState) => gameState.opponentDeck?.hero?.classes),
			gamesForDeck$,
		]).pipe(
			this.mapData(([[opponentClasses], gamesForDeck]) => {
				const gamesForOpponent = gamesForDeck.filter((stat) =>
					!stat.opponentClass
						? false
						: opponentClasses?.includes(CardClass[stat.opponentClass.toUpperCase()]),
				);
				return StatsRecap.from(
					gamesForOpponent,
					opponentClasses?.[0] ? CardClass[opponentClasses[0]].toLowerCase() : null,
				);
			}),
		);
		this.deckStatsRecap$ = gamesForDeck$.pipe(this.mapData((gameStats) => StatsRecap.from(gameStats)));

		this.displayMode$ = this.listenForBasicPref$((preferences) => this.overlayDisplayModeExtractor(preferences));
		this.showTitleBar$ = this.listenForBasicPref$((preferences) => preferences.overlayShowTitleBar);
		this.showControlBar$ = this.listenForBasicPref$((preferences) => preferences.overlayShowControlBar);
		this.opacity$ = this.listenForBasicPref$((preferences) => this.opacityExtractor(preferences) / 100);
		this.colorManaCost$ = this.listenForBasicPref$((preferences) => preferences.overlayShowRarityColors);
		this.showRelatedCards$ = this.listenForBasicPref$((preferences) => preferences.overlayShowRelatedCards);
		this.showUnknownCards$ = this.listenForBasicPref$((preferences) => preferences.overlayShowUnknownCards);
		this.showUpdatedCost$ = this.listenForBasicPref$((preferences) => preferences.overlayShowCostReduction);
		this.showGiftsSeparately$ = this.listenForBasicPref$(
			(preferences) => preferences.overlayShowGiftedCardsInSeparateLine,
		);
		this.groupSameCardsTogether$ = this.listenForBasicPref$(
			(preferences) => preferences.overlayGroupSameCardsTogether,
		);
		this.showGeneratedCardsInSeparateZone$ = this.listenForBasicPref$(
			(preferences) => preferences.overlayShowGiftedCardsSeparateZone,
		);
		this.showPlaguesOnTop$ = this.listenForBasicPref$((preferences) => preferences.overlayShowPlaguesOnTop);
		this.showBoardCardsInSeparateZone$ = this.listenForBasicPref$(
			(preferences) => preferences.overlayShowBoardCardsSeparateZone,
		);
		this.showStatsChange$ = this.listenForBasicPref$((preferences) => preferences.overlayShowStatsChange);
		this.cardsGoToBottom$ = this.listenForBasicPref$((preferences) => this.cardsGoToBottomExtractor(preferences));
		this.showGlobalEffectsZone$ = this.listenForBasicPref$((preferences) =>
			this.showGlobalEffectsExtractor(preferences),
		);
		this.darkenUsedCards$ = this.listenForBasicPref$((preferences) => this.darkenUsedCardsExtractor(preferences));
		this.hideGeneratedCardsInOtherZone$ = this.listenForBasicPref$((preferences) =>
			this.hideGeneratedCardsInOtherZoneExtractor(preferences),
		);
		this.sortCardsByManaCostInOtherZone$ = this.listenForBasicPref$((preferences) =>
			this.sortCardsByManaCostInOtherZoneExtractor(preferences),
		);
		this.showBottomCardsSeparately$ = this.listenForBasicPref$((preferences) =>
			this.showBottomCardsSeparatelyExtractor(preferences),
		);
		this.showTopCardsSeparately$ = this.listenForBasicPref$((preferences) =>
			this.showTopCardsSeparatelyExtractor(preferences),
		);
		this.showDkRunes$ = this.listenForBasicPref$((preferences) => this.showDkRunesExtractor(preferences));
		this.store
			.listenPrefs$((prefs) => prefs.overlayShowTooltipsOnHover)
			.pipe(this.mapData(([pref]) => pref))
			.subscribe((value) => {
				this.showTooltipsFromPrefs = value;
				this.cdr?.detectChanges();
			});
		this.store
			.listenPrefs$((prefs) => this.scaleExtractor(prefs))
			.pipe(
				this.mapData(([pref]) => pref),
				filter((pref) => !!pref),
				distinctUntilChanged(),
				takeUntil(this.destroyed$),
			)
			.subscribe((scale) => {
				this.el.nativeElement.style.setProperty('--decktracker-scale', scale / 100);
				this.el.nativeElement.style.setProperty(
					'--decktracker-max-height',
					this.player === 'player' ? '90vh' : '70vh',
				);
				const newScale = scale / 100;
				const element = this.el.nativeElement.querySelector('.scalable');
				this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
			});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		super.ngOnDestroy();
		// this.cardsHighlight.shutDown();
	}

	onMinimize() {
		this.onDecktrackerToggle(false);
	}

	async onDecktrackerToggle(toggled: boolean) {
		this.active = toggled;
		// Avoid artifacts when minimizing
		this.showTooltips = this.active && this.showTooltipsFromPrefs;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
