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
import { formatFormat, GameFormatString } from '@firestone-hs/reference-data';
import { combineLatest, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { CardTooltipPositionType } from '../../../directives/card-tooltip-position.type';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { StatsRecap } from '../../../models/decktracker/stats-recap';
import { DeckTimeFilterType } from '../../../models/mainwindow/decktracker/deck-time-filter.type';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { PatchInfo } from '../../../models/patches';
import { Preferences } from '../../../models/preferences';
import { DebugService } from '../../../services/debug.service';
import { CardsHighlightService } from '../../../services/decktracker/card-highlight/cards-highlight.service';
import { DecksStateBuilderService } from '../../../services/decktracker/main/decks-state-builder.service';
import { Events } from '../../../services/events.service';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../services/ui-store/app-ui-store.service';
import { arraysEqual } from '../../../services/utils';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'decktracker-overlay-root',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		`../../../../css/global/cdk-overlay.scss`,
		'../../../../css/component/decktracker/overlay/decktracker-overlay.component.scss',
		`../../../../css/themes/decktracker-theme.scss`,
	],
	template: `
		<div
			class="root overlay-container-parent {{ player }}"
			[activeTheme]="'decktracker'"
			[style.opacity]="opacity$ | async"
			[ngClass]="{ 'active': active }"
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
							<div class="background"></div>
							<decktracker-control-bar
								[windowId]="windowId"
								[settingsCategory]="player"
								[closeEvent]="closeEvent"
								(onMinimize)="onMinimize()"
							></decktracker-control-bar>
							<decktracker-title-bar
								[deck]="value.deck"
								[showTitleBar]="showTitleBar$ | async"
								[showDeckWinrate]="showDeckWinrate$ | async"
								[showMatchupWinrate]="showMatchupWinrate$ | async"
								[deckWinrate]="deckStatsRecap$ | async"
								[matchupWinrate]="matchupStatsRecap$ | async"
								[tooltipPosition]="tooltipPosition"
							></decktracker-title-bar>
							<decktracker-deck-list
								[deckState]="value.deck"
								[displayMode]="displayMode$ | async"
								[colorManaCost]="colorManaCost$ | async"
								[showUpdatedCost]="showUpdatedCost$ | async"
								[showGlobalEffectsZone]="showGlobalEffectsZone$ | async"
								[showGiftsSeparately]="showGiftsSeparately$ | async"
								[showStatsChange]="showStatsChange$ | async"
								[cardsGoToBottom]="cardsGoToBottom$ | async"
								[tooltipPosition]="tooltipPosition"
								[darkenUsedCards]="darkenUsedCards$ | async"
								[hideGeneratedCardsInOtherZone]="hideGeneratedCardsInOtherZone$ | async"
								[sortCardsByManaCostInOtherZone]="sortCardsByManaCostInOtherZone$ | async"
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
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit, OnDestroy {
	@Input() overlayWidthExtractor: (prefs: Preferences) => number;
	@Input() overlayDisplayModeExtractor: (prefs: Preferences) => string;
	@Input() opacityExtractor: (prefs: Preferences) => number;
	@Input() cardsGoToBottomExtractor: (prefs: Preferences) => boolean;
	@Input() showGlobalEffectsExtractor: (prefs: Preferences) => boolean;
	@Input() darkenUsedCardsExtractor: (prefs: Preferences) => boolean;
	@Input() hideGeneratedCardsInOtherZoneExtractor: (prefs: Preferences) => boolean;
	@Input() sortCardsByManaCostInOtherZoneExtractor: (prefs: Preferences) => boolean;
	@Input() scaleExtractor: (prefs: Preferences) => number;
	@Input() deckExtractor: (state: GameState) => DeckState;
	@Input() trackerPositionUpdater: (left: number, top: number) => void;
	@Input() trackerPositionExtractor: (prefs: Preferences) => { left: number; top: number };
	@Input() defaultTrackerPositionLeftProvider: (gameWidth: number, width: number) => number;
	@Input() defaultTrackerPositionTopProvider: (gameWidth: number, width: number) => number;
	@Input() showDeckWinrateExtractor: (prefs: Preferences) => boolean;
	@Input() showMatchupWinrateExtractor: (prefs: Preferences) => boolean;
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
	showUpdatedCost$: Observable<boolean>;
	showGiftsSeparately$: Observable<boolean>;
	showStatsChange$: Observable<boolean>;
	cardsGoToBottom$: Observable<boolean>;
	showGlobalEffectsZone$: Observable<boolean>;
	showDeckWinrate$: Observable<boolean>;
	showMatchupWinrate$: Observable<boolean>;
	darkenUsedCards$: Observable<boolean>;
	hideGeneratedCardsInOtherZone$: Observable<boolean>;
	sortCardsByManaCostInOtherZone$: Observable<boolean>;
	active = true;
	windowId: string;
	activeTooltip: string;

	overlayWidthInPx = 227;

	tooltipPosition: CardTooltipPositionType = 'left';
	showBackdrop: boolean;

	private showTooltipsFromPrefs = true;
	private showTooltips = true;

	private gameInfoUpdatedListener: (message: any) => void;

	constructor(
		private prefs: PreferencesService,
		private ow: OverwolfService,
		private el: ElementRef,
		private renderer: Renderer2,
		private events: Events,
		private init_DebugService: DebugService,
		private readonly cardsHighlight: CardsHighlightService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;
		this.gameInfoUpdatedListener = this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (res && res.resolutionChanged) {
				await this.changeWindowSize();
				await this.restoreWindowPosition(true);
			}
		});
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

		await this.changeWindowSize();
		await this.ow.bringToFront(this.windowId);
	}

	ngAfterContentInit() {
		this.deck$ = this.store
			.listenDeckState$((gameState) => gameState)
			.pipe(
				debounceTime(50),
				filter(([gameState]) => !!gameState),
				map(([gameState]) => this.deckExtractor(gameState)),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((filter) => cdLog('emitting deck in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);
		this.matchupStatsRecap$ = combineLatest(
			this.store.listenDeckState$((gameState) => gameState),
			this.store.listen$(
				([main, nav, prefs]) => main.stats.gameStats,
				([main, nav, prefs]) => main.decktracker.filters.time,
				([main, nav, prefs]) => main.decktracker.patch,
			),
		).pipe(
			filter(([[gameState], [gameStats, timeFilter, patch]]) => !!gameStats?.stats?.length),
			map(
				([[gameState], [gameStats, timeFilter, patch]]) =>
					[
						formatFormat(gameState.metadata.formatType),
						timeFilter,
						gameState.playerDeck.deckstring,
						gameState.opponentDeck?.hero?.playerClass,
						gameStats.stats,
						patch,
					] as [GameFormatString, DeckTimeFilterType, string, string, readonly GameStat[], PatchInfo],
			),
			map(
				([gameFormat, timeFilter, deckstring, opponentClass, gameStats, patch]) =>
					[
						gameStats
							.filter((stat) => stat.gameMode === 'ranked')
							.filter((stat) => stat.gameFormat === gameFormat)
							.filter((stat) => DecksStateBuilderService.isValidDate(stat, timeFilter, patch))
							.filter((stat) => stat.playerDecklist === deckstring)
							.filter((stat) => stat.opponentClass === opponentClass),
						opponentClass,
					] as [readonly GameStat[], string],
			),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			map(([gameStats, opponentClass]) => StatsRecap.from(gameStats, opponentClass)),
			// FIXME
			tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
			tap((filter) => cdLog('emitting matchupStatsRecap in ', this.constructor.name, filter)),
			takeUntil(this.destroyed$),
		);
		this.deckStatsRecap$ = combineLatest(
			this.store.listenDeckState$((gameState) => gameState),
			this.store.listen$(
				([main, nav, prefs]) => main.stats.gameStats,
				([main, nav, prefs]) => main.decktracker.filters.time,
				([main, nav, prefs]) => main.decktracker.patch,
			),
		).pipe(
			filter(([[gameState], [gameStats, timeFilter, patch]]) => !!gameStats?.stats?.length),
			map(
				([[gameState], [gameStats, timeFilter, patch]]) =>
					[
						formatFormat(gameState.metadata.formatType),
						timeFilter,
						gameState.playerDeck.deckstring,
						gameStats.stats,
						patch,
					] as [GameFormatString, DeckTimeFilterType, string, readonly GameStat[], PatchInfo],
			),
			map(([gameFormat, timeFilter, deckstring, gameStats, patch]) =>
				gameStats
					.filter((stat) => stat.gameMode === 'ranked')
					.filter((stat) => stat.gameFormat === gameFormat)
					.filter((stat) => DecksStateBuilderService.isValidDate(stat, timeFilter, patch))
					.filter((stat) => stat.playerDecklist === deckstring),
			),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			map((gameStats) => StatsRecap.from(gameStats)),
			// FIXME
			tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
			tap((filter) => cdLog('emitting deckStatsRecap in ', this.constructor.name, filter)),
			takeUntil(this.destroyed$),
		);

		this.displayMode$ = this.listenForBasicPref$((preferences) => this.overlayDisplayModeExtractor(preferences));
		this.showTitleBar$ = this.listenForBasicPref$((preferences) => preferences.overlayShowTitleBar);
		this.showControlBar$ = this.listenForBasicPref$((preferences) => preferences.overlayShowControlBar);
		this.opacity$ = this.listenForBasicPref$((preferences) => this.opacityExtractor(preferences) / 100);
		this.colorManaCost$ = this.listenForBasicPref$((preferences) => preferences.overlayShowRarityColors);
		this.showUpdatedCost$ = this.listenForBasicPref$((preferences) => preferences.overlayShowCostReduction);
		this.showGiftsSeparately$ = this.listenForBasicPref$(
			(preferences) => preferences.overlayShowGiftedCardsInSeparateLine,
		);
		this.showStatsChange$ = this.listenForBasicPref$((preferences) => preferences.overlayShowStatsChange);
		this.cardsGoToBottom$ = this.listenForBasicPref$((preferences) => this.cardsGoToBottomExtractor(preferences));
		this.showGlobalEffectsZone$ = this.listenForBasicPref$((preferences) =>
			this.showGlobalEffectsExtractor(preferences),
		);
		this.showDeckWinrate$ = this.listenForBasicPref$((preferences) => this.showDeckWinrateExtractor(preferences));
		this.showMatchupWinrate$ = this.listenForBasicPref$((preferences) =>
			this.showMatchupWinrateExtractor(preferences),
		);
		this.darkenUsedCards$ = this.listenForBasicPref$((preferences) => this.darkenUsedCardsExtractor(preferences));
		this.hideGeneratedCardsInOtherZone$ = this.listenForBasicPref$((preferences) =>
			this.hideGeneratedCardsInOtherZoneExtractor(preferences),
		);
		this.sortCardsByManaCostInOtherZone$ = this.listenForBasicPref$((preferences) =>
			this.sortCardsByManaCostInOtherZoneExtractor(preferences),
		);
		this.store
			.listenPrefs$((prefs) => prefs.overlayShowTooltipsOnHover)
			.pipe(
				map(([pref]) => pref),
				distinctUntilChanged(),
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				tap((filter) => cdLog('emitting pref in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			)
			.subscribe((value) => {
				this.showTooltipsFromPrefs = value;
				this.cdr?.detectChanges();
			});
		this.store
			.listenPrefs$((prefs) => this.scaleExtractor(prefs))
			.pipe(
				debounceTime(100),
				map(([pref]) => pref),
				distinctUntilChanged(),
				filter((scale) => !!scale),
				takeUntil(this.destroyed$),
			)
			.subscribe((scale) => {
				console.debug('updating scale', scale);
				this.el.nativeElement.style.setProperty('--decktracker-scale', scale / 100);
				this.el.nativeElement.style.setProperty(
					'--decktracker-max-height',
					this.player === 'player' ? '90vh' : '70vh',
				);
				const newScale = scale / 100;
				const element = this.el.nativeElement.querySelector('.scalable');
				this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
				this.updateTooltipPosition();
			});
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		super.ngOnDestroy();
		this.cardsHighlight.shutDown();
		this.ow.removeGameInfoUpdatedListener(this.gameInfoUpdatedListener);
	}

	onMinimize() {
		this.onDecktrackerToggle(false);
	}

	async onDecktrackerToggle(toggled: boolean) {
		this.active = toggled;
		// Avoid artifacts when minimizing
		this.showTooltips = this.active && this.showTooltipsFromPrefs;
		await this.updateTooltipPosition();
	}

	@HostListener('mousedown', ['$event'])
	dragMove(event: MouseEvent) {
		const path: any[] = event.composedPath();
		// Hack for drop-downs
		if (
			path.length > 2 &&
			path[0].localName === 'div' &&
			path[0].className?.includes('options') &&
			path[1].localName === 'div' &&
			path[1].className?.includes('below')
		) {
			return;
		}

		this.tooltipPosition = 'none';
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		this.ow.dragMove(this.windowId, async (result) => {
			await this.updateTooltipPosition();
			const window = await this.ow.getCurrentWindow();

			if (!window) {
				return;
			}

			this.trackerPositionUpdater(window.left, window.top);
		});
	}

	private async restoreWindowPosition(forceTrackerReposition = false): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}

		const currentWindow = await this.ow.getCurrentWindow();
		// window.width does not include DPI, see https://overwolf.github.io/docs/topics/windows-resolution-size-position#dpi
		// logical* properties are not DPI aware either, so we should work with them
		const windowWidth = currentWindow.width;
		console.log('window position', currentWindow, gameInfo, windowWidth);

		const prefs = await this.prefs.getPreferences();
		const trackerPosition = this.trackerPositionExtractor(prefs);
		console.log('loaded tracker position', prefs);

		const minAcceptableLeft = -windowWidth / 2;
		const maxAcceptableLeft = gameInfo.logicalWidth - windowWidth / 2;
		const minAcceptableTop = -100;
		const maxAcceptableTop = gameInfo.logicalHeight - 100;
		console.log('acceptable values', minAcceptableLeft, maxAcceptableLeft, minAcceptableTop, maxAcceptableTop);
		const newLogicalLeft = Math.min(
			maxAcceptableLeft,
			Math.max(
				minAcceptableLeft,
				trackerPosition && !forceTrackerReposition
					? trackerPosition.left || 0
					: this.defaultTrackerPositionLeftProvider(gameInfo.logicalWidth, windowWidth),
			),
		);
		const newLogicalTop = Math.min(
			maxAcceptableTop,
			Math.max(
				minAcceptableTop,
				trackerPosition && !forceTrackerReposition
					? trackerPosition.top || 0
					: this.defaultTrackerPositionTopProvider(gameInfo.logicalHeight, gameInfo.logicalHeight),
			),
		);
		console.log('updating tracker position', newLogicalLeft, newLogicalTop, gameInfo.logicalWidth, gameInfo.width);
		await this.ow.changeWindowPosition(this.windowId, newLogicalLeft, newLogicalTop);
		console.log('after window position update', await this.ow.getCurrentWindow());
		await this.updateTooltipPosition();
	}

	private async changeWindowSize(): Promise<void> {
		const width = 252 * 3; // Max scale
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameHeight = gameInfo.logicalHeight;
		await this.ow.changeWindowSize(this.windowId, width, gameHeight);
		await this.restoreWindowPosition();
		await this.updateTooltipPosition();
	}

	private async updateTooltipPosition() {
		const window = await this.ow.getCurrentWindow();
		if (!window) {
			return;
		}

		if (!this.showTooltips) {
			this.tooltipPosition = 'none';
		} else if (window.left < 0) {
			this.tooltipPosition = 'right';
		} else {
			this.tooltipPosition = 'left';
		}

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr?.detectChanges();
		}
	}
}
