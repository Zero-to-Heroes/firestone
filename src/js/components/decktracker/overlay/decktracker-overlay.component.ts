import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	OnDestroy,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { BehaviorSubject, Subscription } from 'rxjs';
import { GameState } from '../../../models/decktracker/game-state';
import { Preferences } from '../../../models/preferences';
import { DebugService } from '../../../services/debug.service';
import { DeckEvents } from '../../../services/decktracker/event-parser/deck-events';
import { Events } from '../../../services/events.service';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';

declare var amplitude;

@Component({
	selector: 'decktracker-overlay',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		`../../../../css/global/cdk-overlay.scss`,
		'../../../../css/component/decktracker/overlay/decktracker-overlay.component.scss',
		'../../../../css/component/decktracker/overlay/decktracker-overlay-clean.scss',
		`../../../../css/themes/decktracker-theme.scss`,
	],
	template: `
		<div
			class="root overlay-container-parent"
			[ngClass]="{ 'clean': useCleanMode, 'show-title-bar': showTitleBar }"
			[activeTheme]="'decktracker'"
			[style.opacity]="opacity"
		>
			<!-- Never remove the scalable from the DOM so that we can perform resizing even when not visible -->
			<div class="scalable">
				<div class="decktracker-container">
					<div class="decktracker" *ngIf="showTracker" [style.width.px]="overlayWidthInPx">
						<decktracker-title-bar [windowId]="windowId"></decktracker-title-bar>
						<decktracker-deck-name
							[hero]="gameState.playerDeck.hero"
							[deckName]="gameState.playerDeck.name"
						>
						</decktracker-deck-name>
						<decktracker-deck-list
							[deckState]="gameState.playerDeck"
							[displayMode]="displayMode"
							(onDisplayModeChanged)="onDisplayModeChanged($event)"
							[activeTooltip]="activeTooltip"
							[highlightCardsInHand]="highlightCardsInHand"
						>
						</decktracker-deck-list>
					</div>
				</div>

				<i class="i-54 gold-theme corner top-left" *ngIf="showTracker">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#golden_corner" />
					</svg>
				</i>
				<i class="i-54 gold-theme corner top-right" *ngIf="showTracker">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#golden_corner" />
					</svg>
				</i>
				<i class="i-54 gold-theme corner bottom-right" *ngIf="showTracker">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#golden_corner" />
					</svg>
				</i>
				<i class="i-54 gold-theme corner bottom-left" *ngIf="showTracker">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#golden_corner" />
					</svg>
				</i>
				<tooltips *ngIf="showTracker" [module]="'decktracker'"></tooltips>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerOverlayComponent implements AfterViewInit, OnDestroy {
	gameState: GameState;
	windowId: string;
	activeTooltip: string;
	overlayDisplayed: boolean;
	displayMode: string;
	useCleanMode: boolean;
	showTitleBar: boolean;
	overlayWidthInPx: number;
	opacity: number;
	showTracker: boolean;
	highlightCardsInHand: boolean;

	private hasBeenMovedByUser: boolean;

	private scale;
	private showTooltipTimer;
	private hideTooltipTimer;
	private gameInfoUpdatedListener: (message: any) => void;
	private showTooltipSubscription: Subscription;
	private hideTooltipSubscription: Subscription;
	private deckSubscription: Subscription;
	private preferencesSubscription: Subscription;
	private displaySubscription: Subscription;

	constructor(
		private logger: NGXLogger,
		private prefs: PreferencesService,
		private cdr: ChangeDetectorRef,
		private events: Events,
		private ow: OverwolfService,
		private el: ElementRef,
		private renderer: Renderer2,
		private init_DebugService: DebugService,
	) {}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;
		this.showTooltipSubscription = this.events.on(Events.DECK_SHOW_TOOLTIP).subscribe(data => {
			clearTimeout(this.hideTooltipTimer);
			// Already in tooltip mode
			if (this.activeTooltip) {
				this.activeTooltip = data.data[0];
				this.events.broadcast(Events.SHOW_TOOLTIP, ...data.data);
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.detectChanges();
				}
			} else {
				this.showTooltipTimer = setTimeout(() => {
					this.activeTooltip = data.data[0];
					this.events.broadcast(Events.SHOW_TOOLTIP, ...data.data);
					if (!(this.cdr as ViewRef).destroyed) {
						this.cdr.detectChanges();
					}
				}, 1000);
			}
		});
		this.hideTooltipSubscription = this.events.on(Events.DECK_HIDE_TOOLTIP).subscribe(data => {
			clearTimeout(this.showTooltipTimer);
			this.hideTooltipTimer = setTimeout(
				() => {
					// console.log('hidigin tooltip');
					this.activeTooltip = undefined;
					this.events.broadcast(Events.HIDE_TOOLTIP);
					if (!(this.cdr as ViewRef).destroyed) {
						this.cdr.detectChanges();
					}
				},
				data.data[0] ? data.data[0] : 0,
			);
		});
		const deckEventBus: BehaviorSubject<any> = this.ow.getMainWindow().deckEventBus;
		this.deckSubscription = deckEventBus.subscribe(async event => {
			if (event.name === DeckEvents.MATCH_METADATA) {
				amplitude.getInstance().logEvent('match-start', {
					'active-skin': this.useCleanMode ? 'clean' : 'original',
					'display-mode': this.displayMode,
				});
			}
			// console.log('received deck event', event.event);
			this.gameState = event.state;
			this.showTracker =
				this.gameState &&
				this.gameState.playerDeck &&
				((this.gameState.playerDeck.deck && this.gameState.playerDeck.deck.length > 0) ||
					(this.gameState.playerDeck.hand && this.gameState.playerDeck.hand.length > 0) ||
					(this.gameState.playerDeck.board && this.gameState.playerDeck.board.length > 0) ||
					(this.gameState.playerDeck.otherZone && this.gameState.playerDeck.otherZone.length > 0));
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		});
		const displayEventBus: BehaviorSubject<any> = this.ow.getMainWindow().decktrackerDisplayEventBus;
		this.displaySubscription = displayEventBus.asObservable().subscribe(async event => {
			// console.log('received event', event);
			if (event && this.gameState && this.gameState.playerDeck) {
				const window = await this.ow.getCurrentWindow();
				if (window && window.stateEx !== 'normal') {
					this.restoreWindow();
				}
			} else {
				this.hideWindow();
			}
		});
		const preferencesEventBus: EventEmitter<any> = this.ow.getMainWindow().preferencesEventBus;
		this.preferencesSubscription = preferencesEventBus.subscribe(event => {
			if (event.name === PreferencesService.DECKTRACKER_OVERLAY_DISPLAY) {
				this.handleDisplayPreferences(event.preferences);
			}
		});
		// if (process.env.NODE_ENV !== 'production') {
		// 	console.error('Should not allow debug game state from production');
		// 	this.gameState = this.ow.getMainWindow().deckDebug.state;
		// 	console.log('game state', this.gameState);
		// 	if (this.gameState) {
		// 		this.restoreWindow();
		// 	}
		// }
		this.gameInfoUpdatedListener = this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (res && res.resolutionChanged) {
				this.logger.debug('[decktracker-overlay] received new game info', res);
				await this.changeWindowSize();
				await this.changeWindowPosition();
			}
		});

		await this.changeWindowSize();
		await this.changeWindowPosition();
		await this.handleDisplayPreferences();
		await this.restoreWindow();
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
		console.log('handled after view init');
	}

	ngOnDestroy(): void {
		this.ow.removeGameInfoUpdatedListener(this.gameInfoUpdatedListener);
		this.showTooltipSubscription.unsubscribe();
		this.hideTooltipSubscription.unsubscribe();
		this.deckSubscription.unsubscribe();
		this.preferencesSubscription.unsubscribe();
		this.displaySubscription.unsubscribe();
	}

	@HostListener('mousedown')
	dragMove() {
		this.ow.dragMove(this.windowId);
		this.hasBeenMovedByUser = true;
	}

	onDisplayModeChanged(pref: string) {
		this.prefs.setOverlayDisplayMode(pref);
	}

	private async handleDisplayPreferences(preferences: Preferences = null) {
		preferences = preferences || (await this.prefs.getPreferences());
		this.useCleanMode = preferences.decktrackerSkin === 'clean';
		this.displayMode = this.useCleanMode
			? 'DISPLAY_MODE_GROUPED'
			: preferences.overlayDisplayMode || 'DISPLAY_MODE_ZONE';
		this.showTitleBar = preferences.overlayShowTitleBar;
		this.overlayWidthInPx = preferences.overlayWidthInPx;
		this.opacity = preferences.overlayOpacityInPercent / 100;
		this.scale = preferences.decktrackerScale;
		this.highlightCardsInHand = preferences.overlayHighlightCardsInHand;
		this.onResized();
		// console.log('switching views?', this.useCleanMode, this.displayMode);
		// const shouldDisplay = await this.displayService.shouldDisplayOverlay(this.gameState, preferences);
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async onResized() {
		const newScale = this.scale / 100;
		const element = this.el.nativeElement.querySelector('.scalable');
		this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async restoreWindow() {
		const window = await this.ow.getCurrentWindow();
		console.log('current window', window);
		const [top, left] = [window.top, window.left];
		await this.ow.restoreWindow(this.windowId);
		await this.ow.changeWindowPosition(this.windowId, left, top);
		console.log('restoring window to previous position');
		await this.onResized();
	}

	private hideWindow() {
		this.ow.hideWindow(this.windowId);
	}

	private async changeWindowPosition(): Promise<void> {
		if (this.hasBeenMovedByUser) {
			return;
		}
		const width = Math.max(252, 252 * 2);
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameWidth = gameInfo.logicalWidth;
		const dpi = gameWidth / gameInfo.width;
		// https://stackoverflow.com/questions/8388440/converting-a-double-to-an-int-in-javascript-without-rounding
		const newLeft = gameWidth - width * dpi - 40; // Leave a bit of room to the right
		const newTop = 10;
		await this.ow.changeWindowPosition(this.windowId, newLeft, newTop);
	}

	private async changeWindowSize(): Promise<void> {
		const width = Math.max(252, 252 * 2); // Max scale
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameHeight = gameInfo.logicalHeight;
		await this.ow.changeWindowSize(this.windowId, width, gameHeight);
	}
}
