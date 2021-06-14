import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	Input,
	OnDestroy,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BehaviorSubject, Subscriber, Subscription } from 'rxjs';
import { CardTooltipPositionType } from '../../../directives/card-tooltip-position.type';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { StatsRecap } from '../../../models/decktracker/stats-recap';
import { Preferences } from '../../../models/preferences';
import { DebugService } from '../../../services/debug.service';
import { Events } from '../../../services/events.service';
import { CARDS_VERSION } from '../../../services/hs-utils';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';

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
				<div class="decktracker-container">
					<div
						class="decktracker"
						*ngIf="showTracker"
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
							[deck]="deck"
							[showTitleBar]="showTitleBar"
							[showDeckWinrate]="showDeckWinrate"
							[showMatchupWinrate]="showMatchupWinrate"
							[deckWinrate]="deckStatsRecap"
							[matchupWinrate]="matchupStatsRecap"
							[tooltipPosition]="tooltipPosition"
						></decktracker-title-bar>
						<decktracker-deck-list
							[deckState]="deck"
							[displayMode]="displayMode"
							[colorManaCost]="colorManaCost"
							[showUpdatedCost]="showUpdatedCost"
							[showGlobalEffectsZone]="showGlobalEffectsZone"
							[showGiftsSeparately]="showGiftsSeparately"
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
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerOverlayRootComponent implements AfterViewInit, OnDestroy {
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

	deck: DeckState;

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
	cardsGoToBottom: boolean;
	showGlobalEffectsZone: boolean;
	darkenUsedCards: boolean;
	hideGeneratedCardsInOtherZone: boolean;
	sortCardsByManaCostInOtherZone: boolean;
	showDeckWinrate: boolean;
	showMatchupWinrate: boolean;

	tooltipPosition: CardTooltipPositionType = 'left';
	showBackdrop: boolean;

	showTracker: boolean;
	deckStatsRecap: StatsRecap;
	matchupStatsRecap: StatsRecap;

	// private hasBeenMovedByUser: boolean;
	private showTooltips = true;

	private scale;
	private gameInfoUpdatedListener: (message: any) => void;
	private showTooltipSubscription: Subscription;
	private hideTooltipSubscription: Subscription;
	private deckSubscription: Subscription;
	private preferencesSubscription: Subscription;
	// private displaySubscription: Subscription;

	constructor(
		private prefs: PreferencesService,
		private cdr: ChangeDetectorRef,
		private ow: OverwolfService,
		private el: ElementRef,
		private renderer: Renderer2,
		private events: Events,
		private init_DebugService: DebugService,
		private cards: AllCardsService,
	) {}

	async ngAfterViewInit() {
		this.cards.initializeCardsDb(CARDS_VERSION);
		this.windowId = (await this.ow.getCurrentWindow()).id;

		const deckEventBus: BehaviorSubject<any> = this.ow.getMainWindow().deckEventBus;
		const subscriber = new Subscriber<any>(async (event) => {
			this.showTracker = event.state != null;
			this.deckStatsRecap = (event.state as GameState).deckStatsRecap;
			this.matchupStatsRecap = (event.state as GameState).matchupStatsRecap;
			// this.gameState = event ? event.state : undefined;
			// console.log('received game state', event);
			this.deck = event.state ? this.deckExtractor(event.state) : null;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
		subscriber['identifier'] = 'decktracker-overlay-root';
		this.deckSubscription = deckEventBus.subscribe(subscriber);

		const preferencesEventBus: EventEmitter<any> = this.ow.getMainWindow().preferencesEventBus;
		this.preferencesSubscription = preferencesEventBus.subscribe((event) => {
			this.handleDisplayPreferences(event.preferences);
		});
		this.gameInfoUpdatedListener = this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (res && res.resolutionChanged) {
				console.log('[decktracker-overlay] received new game info', res);
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
		// console.log('handled after view init');
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		this.ow.removeGameInfoUpdatedListener(this.gameInfoUpdatedListener);
		this.showTooltipSubscription?.unsubscribe();
		this.hideTooltipSubscription?.unsubscribe();
		this.deckSubscription?.unsubscribe();
		this.preferencesSubscription?.unsubscribe();
		this.deckStatsRecap = null;
		this.matchupStatsRecap = null;
		console.log('[shutdown] unsubscribed from decktracker-ovelray-root');
	}

	onMinimize() {
		console.log('minimizing in root');
		this.onDecktrackerToggle(false);
	}

	async onDecktrackerToggle(toggled: boolean) {
		this.active = toggled;
		// Avoid artifacts when minimizing
		this.showTooltips = this.active;
		await this.updateTooltipPosition();
	}

	@HostListener('mousedown')
	dragMove() {
		// console.log('starting drag');
		this.tooltipPosition = 'none';
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		this.ow.dragMove(this.windowId, async (result) => {
			// console.log('drag finished, updating position');
			await this.updateTooltipPosition();
			const window = await this.ow.getCurrentWindow();
			// console.log('retrieved window', window);
			if (!window) {
				return;
			}

			console.log('updating tracker position', window.left, window.top);
			this.trackerPositionUpdater(window.left, window.top);
		});
	}

	private async handleDisplayPreferences(preferences: Preferences = null) {
		preferences = preferences || (await this.prefs.getPreferences());
		// console.log('updating prefs', preferences);
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
		this.cardsGoToBottom = this.cardsGoToBottomExtractor(preferences);
		this.showGlobalEffectsZone = this.showGlobalEffectsExtractor(preferences);
		this.showDeckWinrate = this.showDeckWinrateExtractor(preferences);
		this.showMatchupWinrate = this.showMatchupWinrateExtractor(preferences);
		this.darkenUsedCards = this.darkenUsedCardsExtractor(preferences);
		this.hideGeneratedCardsInOtherZone = this.hideGeneratedCardsInOtherZoneExtractor(preferences);
		this.sortCardsByManaCostInOtherZone = this.sortCardsByManaCostInOtherZoneExtractor(preferences);
		this.showTooltips = preferences.overlayShowTooltipsOnHover;
		await this.updateTooltipPosition();
		// console.log('showing tooltips?', this.showTooltips, this.tooltipPosition);
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
		console.log('loaded tracker position', trackerPosition);

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
		// console.log('updating tooltip position');
		const window = await this.ow.getCurrentWindow();
		if (!window) {
			return;
		}
		// console.log('retrieved current window', window);
		if (!this.showTooltips) {
			this.tooltipPosition = 'none';
		} else if (window.left < 0) {
			this.tooltipPosition = 'right';
		} else {
			this.tooltipPosition = 'left';
		}
		// console.debug('[decktracker-overlay] tooltip position updated', this.tooltipPosition);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
