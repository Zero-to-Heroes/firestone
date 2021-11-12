import {
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
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
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
			[style.opacity]="opacity"
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
							[ngClass]="{ 'hide-control-bar': !showControlBar }"
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
								[showTitleBar]="showTitleBar"
								[showDeckWinrate]="showDeckWinrate"
								[showMatchupWinrate]="showMatchupWinrate"
								[deckWinrate]="deckStatsRecap$ | async"
								[matchupWinrate]="matchupStatsRecap$ | async"
								[tooltipPosition]="tooltipPosition"
							></decktracker-title-bar>
							<decktracker-deck-list
								[deckState]="value.deck"
								[displayMode]="displayMode"
								[colorManaCost]="colorManaCost"
								[showUpdatedCost]="showUpdatedCost"
								[showGlobalEffectsZone]="showGlobalEffectsZone"
								[showGiftsSeparately]="showGiftsSeparately"
								[showStatsChange]="showStatsChange"
								[cardsGoToBottom]="cardsGoToBottom"
								[tooltipPosition]="tooltipPosition"
								[darkenUsedCards]="darkenUsedCards"
								[hideGeneratedCardsInOtherZone]="hideGeneratedCardsInOtherZone"
								[sortCardsByManaCostInOtherZone]="sortCardsByManaCostInOtherZone"
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
export class DeckTrackerOverlayRootComponent extends AbstractSubscriptionComponent implements AfterViewInit, OnDestroy {
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

	// deck: DeckState;
	deck$: Observable<DeckState>;
	matchupStatsRecap$: Observable<StatsRecap>;
	deckStatsRecap$: Observable<StatsRecap>;

	// gameState: GameState;
	active = true;
	windowId: string;
	activeTooltip: string;
	// overlayDisplayed: boolean;
	displayMode: string;
	showTitleBar: boolean;
	showControlBar: boolean;
	overlayWidthInPx: number;
	opacity: number;
	// showTracker: boolean;
	// highlightCardsInHand: boolean;
	colorManaCost: boolean;
	showUpdatedCost: boolean;
	showGiftsSeparately: boolean;
	showStatsChange: boolean;
	cardsGoToBottom: boolean;
	showGlobalEffectsZone: boolean;
	darkenUsedCards: boolean;
	hideGeneratedCardsInOtherZone: boolean;
	sortCardsByManaCostInOtherZone: boolean;
	showDeckWinrate: boolean;
	showMatchupWinrate: boolean;

	tooltipPosition: CardTooltipPositionType = 'left';
	showBackdrop: boolean;

	private showTooltips = true;

	private scale;
	private gameInfoUpdatedListener: (message: any) => void;
	private showTooltipSubscription: Subscription;
	private hideTooltipSubscription: Subscription;
	private deckSubscription: Subscription;
	private preferencesSubscription: Subscription;

	constructor(
		private prefs: PreferencesService,
		private cdr: ChangeDetectorRef,
		private ow: OverwolfService,
		private el: ElementRef,
		private renderer: Renderer2,
		private events: Events,
		private init_DebugService: DebugService,
		private readonly store: AppUiStoreFacadeService,
	) {
		super();
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
	}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;

		const preferencesEventBus: BehaviorSubject<any> = this.ow.getMainWindow().preferencesEventBus;
		this.preferencesSubscription = preferencesEventBus.subscribe((event) => {
			this.handleDisplayPreferences(event.preferences);
		});
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

		await this.handleDisplayPreferences();
		await this.changeWindowSize();
		await this.ow.bringToFront(this.windowId);
		// amplitude.getInstance().logEvent('match-start', {
		// 	'display-mode': this.displayMode,
		// 	'player': this.player,
		// });
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		super.ngOnDestroy();
		this.ow.removeGameInfoUpdatedListener(this.gameInfoUpdatedListener);
		this.showTooltipSubscription?.unsubscribe();
		this.hideTooltipSubscription?.unsubscribe();
		this.deckSubscription?.unsubscribe();
		this.preferencesSubscription?.unsubscribe();
	}

	onMinimize() {
		this.onDecktrackerToggle(false);
	}

	async onDecktrackerToggle(toggled: boolean) {
		this.active = toggled;
		// Avoid artifacts when minimizing
		this.showTooltips = this.active;
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

	private async handleDisplayPreferences(preferences: Preferences = null) {
		preferences = preferences || (await this.prefs.getPreferences());

		this.displayMode = this.overlayDisplayModeExtractor(preferences);
		this.showTitleBar = preferences.overlayShowTitleBar;
		this.showControlBar = preferences.overlayShowControlBar;
		this.overlayWidthInPx = 227; // this.overlayWidthExtractor(preferences);
		this.opacity = this.opacityExtractor(preferences) / 100;
		this.scale = this.scaleExtractor(preferences);
		this.el.nativeElement.style.setProperty('--decktracker-scale', this.scale / 100);
		this.el.nativeElement.style.setProperty('--decktracker-max-height', this.player === 'player' ? '90vh' : '70vh');
		this.colorManaCost = preferences.overlayShowRarityColors;
		this.showUpdatedCost = preferences.overlayShowCostReduction;
		this.showGiftsSeparately = preferences.overlayShowGiftedCardsInSeparateLine;
		this.showStatsChange = preferences.overlayShowStatsChange;
		this.cardsGoToBottom = this.cardsGoToBottomExtractor(preferences);
		this.showGlobalEffectsZone = this.showGlobalEffectsExtractor(preferences);
		this.showDeckWinrate = this.showDeckWinrateExtractor(preferences);
		this.showMatchupWinrate = this.showMatchupWinrateExtractor(preferences);
		this.darkenUsedCards = this.darkenUsedCardsExtractor(preferences);
		this.hideGeneratedCardsInOtherZone = this.hideGeneratedCardsInOtherZoneExtractor(preferences);
		this.sortCardsByManaCostInOtherZone = this.sortCardsByManaCostInOtherZoneExtractor(preferences);
		this.showTooltips = preferences.overlayShowTooltipsOnHover;
		await this.updateTooltipPosition();

		this.onResized();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private onResized() {
		const newScale = this.scale / 100;
		const element = this.el.nativeElement.querySelector('.scalable');
		this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
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
			this.cdr.detectChanges();
		}
	}
}
