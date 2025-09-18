import {
	AfterContentInit,
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
import { DeckState, enrichDeck, GameState, GameStateFacadeService, StatsRecap } from '@firestone/game-state';
import { AccountService } from '@firestone/profile/common';
import { PatchesConfigService, Preferences, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, deepEqual } from '@firestone/shared/framework/common';
import { gameFormatToStatGameFormatType } from '@firestone/stats/data-access';
import { CardsHighlightFacadeService } from '@services/decktracker/card-highlight/cards-highlight-facade.service';
import { combineLatest, debounceTime, distinctUntilChanged, filter, Observable, shareReplay, takeUntil } from 'rxjs';
import { DecksProviderService } from '../../../services/decktracker/main/decks-provider.service';
import { Events } from '../../../services/events.service';
import { MainWindowStateFacadeService } from '../../../services/mainwindow/store/main-window-state-facade.service';
import { GameStatsProviderService } from '../../../services/stats/game/game-stats-provider.service';

@Component({
	standalone: false,
	selector: 'decktracker-overlay-root',
	styleUrls: [
		'../../../../css/component/decktracker/overlay/decktracker-overlay.component.scss',
		'./decktracker-overlay-root.component.scss',
	],
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
								[hideOpponentName]="hideOpponentName$ | async"
							></decktracker-title-bar>
							<decktracker-deck-list
								[deckState]="value.deck"
								[displayMode]="displayMode$ | async"
								[colorManaCost]="colorManaCost$ | async"
								[showRelatedCards]="showRelatedCards$ | async"
								[showTransformedInto]="showTransformedInto$ | async"
								[showUnknownCards]="showUnknownCards$ | async"
								[showUpdatedCost]="showUpdatedCost$ | async"
								[showGlobalEffectsZone]="showGlobalEffectsZone$ | async"
								[showDiscoveryZone]="showDiscoveryZone$ | async"
								[showGiftsSeparately]="showGiftsSeparately$ | async"
								[groupSameCardsTogether]="groupSameCardsTogether$ | async"
								[showGeneratedCardsInSeparateZone]="showGeneratedCardsInSeparateZone$ | async"
								[showPlaguesOnTop]="showPlaguesOnTop$ | async"
								[showBoardCardsInSeparateZone]="showBoardCardsInSeparateZone$ | async"
								[showStatsChange]="showStatsChange$ | async"
								[cardsGoToBottom]="cardsGoToBottom$ | async"
								[darkenUsedCards]="darkenUsedCards$ | async"
								[removeDuplicatesInTooltip]="removeDuplicatesInTooltip$ | async"
								[hideGeneratedCardsInOtherZone]="hideGeneratedCardsInOtherZone$ | async"
								[sortCardsByManaCostInOtherZone]="sortCardsByManaCostInOtherZone$ | async"
								[showBottomCardsSeparately]="showBottomCardsSeparately$ | async"
								[showTopCardsSeparately]="showTopCardsSeparately$ | async"
								[showTotalCardsInZone]="showTotalCardsInZone$ | async"
								[sortHandByZoneOrder]="sortHandByZoneOrder$ | async"
								[showDkRunes]="showDkRunes$ | async"
								[side]="player"
								*ngIf="showDecklist$ | async"
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
	extends AbstractSubscriptionComponent
	implements AfterContentInit, OnDestroy
{
	@Input() overlayWidthExtractor: (prefs: Preferences) => number;
	@Input() overlayDisplayModeExtractor: (prefs: Preferences) => string;
	@Input() opacityExtractor: (prefs: Preferences) => number;
	@Input() cardsGoToBottomExtractor: (prefs: Preferences) => boolean;
	@Input() showGlobalEffectsExtractor: (prefs: Preferences) => boolean;
	@Input() showDiscoveryExtractor: (prefs: Preferences) => boolean;
	@Input() darkenUsedCardsExtractor: (prefs: Preferences) => boolean;
	@Input() hideGeneratedCardsInOtherZoneExtractor: (prefs: Preferences) => boolean;
	@Input() sortCardsByManaCostInOtherZoneExtractor: (prefs: Preferences) => boolean;
	@Input() showBottomCardsSeparatelyExtractor: (prefs: Preferences) => boolean;
	@Input() showTopCardsSeparatelyExtractor: (prefs: Preferences) => boolean;
	@Input() scaleExtractor: (prefs: Preferences) => number;
	@Input() deckExtractor: (state: GameState) => DeckState;
	@Input() showDecklistExtractor: (inMulligan: boolean) => boolean;
	@Input() showDeckWinrateExtractor: (prefs: Preferences) => boolean;
	@Input() showMatchupWinrateExtractor: (prefs: Preferences) => boolean;
	@Input() showDkRunesExtractor: (prefs: Preferences) => boolean;
	@Input() hideOpponentNameExtractor: (prefs: Preferences) => boolean;
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
	showTransformedInto$: Observable<boolean>;
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
	showDiscoveryZone$: Observable<boolean>;
	showDeckWinrate$: Observable<boolean>;
	showMatchupWinrate$: Observable<boolean>;
	darkenUsedCards$: Observable<boolean>;
	removeDuplicatesInTooltip$: Observable<boolean>;
	hideGeneratedCardsInOtherZone$: Observable<boolean>;
	sortCardsByManaCostInOtherZone$: Observable<boolean>;
	showBottomCardsSeparately$: Observable<boolean>;
	showTopCardsSeparately$: Observable<boolean>;
	showDkRunes$: Observable<boolean>;
	showTotalCardsInZone$: Observable<boolean>;
	sortHandByZoneOrder$: Observable<boolean>;
	showDecklist$: Observable<boolean>;
	hideOpponentName$: Observable<boolean>;

	active = true;
	windowId: string;
	activeTooltip: string;

	// Why this value?
	overlayWidthInPx = 227;

	showBackdrop: boolean;

	private showTooltipsFromPrefs = true;
	private showTooltips = true;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private el: ElementRef,
		private renderer: Renderer2,
		private events: Events,
		private readonly cardsHighlight: CardsHighlightFacadeService,
		private readonly patchesConfig: PatchesConfigService,
		private readonly gameState: GameStateFacadeService,
		private readonly prefs: PreferencesService,
		private readonly gameStats: GameStatsProviderService,
		private readonly mainWindowState: MainWindowStateFacadeService,
		private readonly decksProvider: DecksProviderService,
		private readonly region: AccountService,
	) {
		super(cdr);
		this.cardsHighlight.init();
	}

	async ngAfterContentInit() {
		await Promise.all([
			this.patchesConfig.isReady(),
			this.gameState.isReady(),
			this.prefs.isReady(),
			this.gameStats.isReady(),
			this.mainWindowState.isReady(),
			this.decksProvider.isReady(),
		]);

		this.showDeckWinrate$ = this.prefs.preferences$$.pipe(
			this.mapData((preferences) => this.showDeckWinrateExtractor(preferences)),
		);
		this.showMatchupWinrate$ = this.prefs.preferences$$.pipe(
			this.mapData((preferences) => this.showMatchupWinrateExtractor(preferences)),
		);
		this.hideOpponentName$ = this.prefs.preferences$$.pipe(
			this.mapData((preferences) =>
				!!this.hideOpponentNameExtractor ? this.hideOpponentNameExtractor(preferences) : false,
			),
		);

		this.showDecklist$ = this.gameState.gameState$$.pipe(
			this.mapData(
				(gameState) => !!gameState && this.showDecklistExtractor(gameState.currentTurn === 'mulligan'),
			),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.deck$ = this.gameState.gameState$$.pipe(
			this.mapData((gameState) => {
				const deck = !gameState ? null : this.deckExtractor(gameState);
				// Add some information so that we can have it even when global effects are hidden
				const enrichedDeck = enrichDeck(deck);
				return enrichedDeck;
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
		this.showTotalCardsInZone$ = this.gameState.gameState$$.pipe(
			this.mapData((gameState) => this.showTotalCardsInZoneExtractor(gameState.currentTurn !== 'mulligan')),
		);
		this.sortHandByZoneOrder$ = this.prefs.preferences$$.pipe(
			this.mapData((preferences) => preferences.overlaySortHandByZoneOrder),
		);
		// const gamesForRegion$ = combineLatest([this.gameStats.gameStats$$, this.region.region$$]).pipe(
		// 	filter(([gameStats, region]) => !!gameStats?.length),
		// 	this.mapData(([gameStats, region]) => (!region ? gameStats : gameStats.filter((s) => s.region === region))),
		// );
		const gamesForRegion$ = this.gameStats.gameStats$$.pipe(this.mapData((gameStats) => gameStats));
		const gamesForDeck$ = combineLatest([
			this.showDeckWinrate$,
			this.showMatchupWinrate$,
			this.gameState.gameState$$.pipe(
				this.mapData((gameState) => ({
					deckstring: gameState?.playerDeck?.deckstring,
					formatType: gameState?.metadata?.formatType,
				})),
			),
			// this.mainWindowState.mainWindowState$$.pipe(
			// 	this.mapData((main) => ({
			// 		timeFilter: 'all-time',
			// 		rankFilter: 'all',
			// 	})),
			// ),
			this.patchesConfig.currentConstructedMetaPatch$$,
			gamesForRegion$,
			this.decksProvider.decks$$,
			this.prefs.preferences$$.pipe(
				this.mapData((prefs) => ({
					desktopDeckDeletes: prefs.desktopDeckDeletes,
					// desktopDeckStatsReset: prefs.desktopDeckStatsReset,
					// desktopDeckHiddenDeckCodes: prefs.desktopDeckHiddenDeckCodes,
					desktopDeckShowHiddenDecks: prefs.desktopDeckShowHiddenDecks,
				})),
				distinctUntilChanged((a, b) => deepEqual(a, b)),
			),
		]).pipe(
			debounceTime(1000),
			filter(
				([
					showDeckWinrate,
					showMatchupWinrate,
					{ deckstring, formatType },
					// { timeFilter, rankFilter },
					patch,
					gameStats,
					decks,
					{
						desktopDeckDeletes,
						// desktopDeckStatsReset,
						// desktopDeckHiddenDeckCodes,
						desktopDeckShowHiddenDecks,
					},
				]) => (showDeckWinrate || showMatchupWinrate) && !!gameStats?.length && !!decks?.length,
			),
			this.mapData(
				([
					showDeckWinrate,
					showMatchupWinrate,
					{ deckstring, formatType },
					// { timeFilter, rankFilter },
					patch,
					gameStats,
					decks,
					{
						desktopDeckDeletes,
						// desktopDeckStatsReset,
						// desktopDeckHiddenDeckCodes,
						desktopDeckShowHiddenDecks,
					},
				]) => {
					const result = DecksProviderService.buildValidReplays(
						deckstring,
						gameStats,
						gameFormatToStatGameFormatType(formatType),
						// 'standard',
						'ranked',
						'all-time',
						'all',
						patch,
						desktopDeckDeletes,
						null,
						null,
						desktopDeckShowHiddenDecks,
						decks,
					);
					return result;
				},
			),
			shareReplay(1),
		);

		this.matchupStatsRecap$ = combineLatest([
			this.gameState.gameState$$.pipe(
				this.mapData((gameState) =>
					!!gameState?.opponentDeck?.hero?.initialClasses?.length
						? gameState?.opponentDeck?.hero?.initialClasses
						: gameState?.opponentDeck?.hero?.classes,
				),
			),
			gamesForDeck$,
		]).pipe(
			this.mapData(([opponentClasses, gamesForDeck]) => {
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

		this.displayMode$ = this.prefs.preferences$$.pipe(
			this.mapData((preferences) => this.overlayDisplayModeExtractor(preferences)),
		);
		this.showTitleBar$ = this.prefs.preferences$$.pipe(
			this.mapData((preferences) => preferences.overlayShowTitleBar),
		);
		this.showControlBar$ = this.prefs.preferences$$.pipe(
			this.mapData((preferences) => preferences.overlayShowControlBar),
		);
		this.opacity$ = this.prefs.preferences$$.pipe(
			this.mapData((preferences) => this.opacityExtractor(preferences) / 100),
		);
		this.colorManaCost$ = this.prefs.preferences$$.pipe(
			this.mapData((preferences) => preferences.overlayShowRarityColors),
		);
		this.showRelatedCards$ = this.prefs.preferences$$.pipe(
			this.mapData((preferences) => preferences.overlayShowRelatedCards),
		);
		this.showTransformedInto$ = this.prefs.preferences$$.pipe(
			this.mapData((preferences) => preferences.overlayShowTransformedInto),
		);
		this.showUnknownCards$ = this.prefs.preferences$$.pipe(
			this.mapData((preferences) => preferences.overlayShowUnknownCards),
		);
		this.showUpdatedCost$ = this.prefs.preferences$$.pipe(
			this.mapData((preferences) => preferences.overlayShowCostReduction),
		);
		this.showGiftsSeparately$ = this.prefs.preferences$$.pipe(
			this.mapData((preferences) => preferences.overlayShowGiftedCardsInSeparateLine),
		);
		this.groupSameCardsTogether$ = this.prefs.preferences$$.pipe(
			this.mapData((preferences) => preferences.overlayGroupSameCardsTogether),
		);
		this.showGeneratedCardsInSeparateZone$ = this.prefs.preferences$$.pipe(
			this.mapData((preferences) => preferences.overlayShowGiftedCardsSeparateZone),
		);
		this.showPlaguesOnTop$ = this.prefs.preferences$$.pipe(
			this.mapData((preferences) => preferences.overlayShowPlaguesOnTop),
		);
		this.showBoardCardsInSeparateZone$ = this.prefs.preferences$$.pipe(
			this.mapData((preferences) => preferences.overlayShowBoardCardsSeparateZone),
		);
		this.showStatsChange$ = this.prefs.preferences$$.pipe(
			this.mapData((preferences) => preferences.overlayShowStatsChange),
		);
		this.cardsGoToBottom$ = this.prefs.preferences$$.pipe(
			this.mapData((preferences) => this.cardsGoToBottomExtractor(preferences)),
		);
		this.showGlobalEffectsZone$ = this.prefs.preferences$$.pipe(
			this.mapData((preferences) => this.showGlobalEffectsExtractor(preferences)),
		);
		this.showDiscoveryZone$ = this.prefs.preferences$$.pipe(
			this.mapData((preferences) => this.showDiscoveryExtractor(preferences)),
		);
		this.darkenUsedCards$ = this.prefs.preferences$$.pipe(
			this.mapData((preferences) => this.darkenUsedCardsExtractor(preferences)),
		);
		this.removeDuplicatesInTooltip$ = this.prefs.preferences$$.pipe(
			this.mapData((preferences) => preferences.overlayRemoveDuplicatesInTooltip),
		);
		this.hideGeneratedCardsInOtherZone$ = this.prefs.preferences$$.pipe(
			this.mapData((preferences) => this.hideGeneratedCardsInOtherZoneExtractor(preferences)),
		);
		this.sortCardsByManaCostInOtherZone$ = this.prefs.preferences$$.pipe(
			this.mapData((preferences) => this.sortCardsByManaCostInOtherZoneExtractor(preferences)),
		);
		this.showBottomCardsSeparately$ = this.prefs.preferences$$.pipe(
			this.mapData((preferences) => this.showBottomCardsSeparatelyExtractor(preferences)),
		);
		this.showTopCardsSeparately$ = this.prefs.preferences$$.pipe(
			this.mapData((preferences) => this.showTopCardsSeparatelyExtractor(preferences)),
		);
		this.showDkRunes$ = this.prefs.preferences$$.pipe(
			this.mapData((preferences) => this.showDkRunesExtractor(preferences)),
		);
		this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.overlayShowTooltipsOnHover)).subscribe((value) => {
			this.showTooltipsFromPrefs = value;
			this.cdr?.detectChanges();
		});

		combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.globalWidgetScale ?? 100)),
			this.prefs.preferences$$.pipe(this.mapData((prefs) => this.scaleExtractor(prefs) ?? 100)),
		])
			.pipe(takeUntil(this.destroyed$))
			.subscribe(([globalScale, scale]) => {
				const newScale = (globalScale / 100) * (scale / 100);
				this.el.nativeElement.style.setProperty('--decktracker-scale', newScale);
				this.el.nativeElement.style.setProperty(
					'--decktracker-max-height',
					this.player === 'player' ? '90vh' : '70vh',
				);
				const element = this.el.nativeElement.querySelector('.scalable');
				if (!!element) {
					this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
				}
			});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		super.ngOnDestroy();
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
