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
import { CardTooltipPositionType } from '../../../directives/card-tooltip-position.type';
import { GameState } from '../../../models/decktracker/game-state';
import { Preferences } from '../../../models/preferences';
import { DebugService } from '../../../services/debug.service';
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
					<div class="decktracker" *ngIf="gameState" [style.width.px]="overlayWidthInPx">
						<div class="background"></div>
						<decktracker-title-bar [windowId]="windowId"></decktracker-title-bar>
						<decktracker-deck-name
							[hero]="gameState.playerDeck.hero"
							[deckName]="gameState.playerDeck?.name"
							*ngIf="gameState.playerDeck?.name"
						>
						</decktracker-deck-name>
						<decktracker-deck-list
							[deckState]="gameState.playerDeck"
							[displayMode]="displayMode"
							[highlightCardsInHand]="highlightCardsInHand"
							[colorManaCost]="colorManaCost"
							[cardsGoToBottom]="cardsGoToBottom"
							[tooltipPosition]="tooltipPosition"
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
export class DeckTrackerOverlayComponent implements AfterViewInit, OnDestroy {
	gameState: GameState;
	windowId: string;
	activeTooltip: string;
	// overlayDisplayed: boolean;
	displayMode: string;
	useCleanMode: boolean;
	showTitleBar: boolean;
	overlayWidthInPx: number;
	opacity: number;
	// showTracker: boolean;
	highlightCardsInHand: boolean;
	colorManaCost: boolean;
	cardsGoToBottom: boolean;
	tooltipPosition: CardTooltipPositionType = 'left';
	showBackdrop: boolean;

	// private hasBeenMovedByUser: boolean;
	private showTooltips: boolean = true;

	private scale;
	private gameInfoUpdatedListener: (message: any) => void;
	private showTooltipSubscription: Subscription;
	private hideTooltipSubscription: Subscription;
	private deckSubscription: Subscription;
	private preferencesSubscription: Subscription;
	// private displaySubscription: Subscription;

	constructor(
		private logger: NGXLogger,
		private prefs: PreferencesService,
		private cdr: ChangeDetectorRef,
		private ow: OverwolfService,
		private el: ElementRef,
		private renderer: Renderer2,
		private events: Events,
		private init_DebugService: DebugService,
	) {}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;
		const deckEventBus: BehaviorSubject<any> = this.ow.getMainWindow().deckEventBus;
		this.deckSubscription = deckEventBus.subscribe(async event => {
			this.gameState = event ? event.state : undefined;
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		});
		const preferencesEventBus: EventEmitter<any> = this.ow.getMainWindow().preferencesEventBus;
		this.preferencesSubscription = preferencesEventBus.subscribe(event => {
			this.handleDisplayPreferences(event.preferences);
		});
		this.gameInfoUpdatedListener = this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (res && res.resolutionChanged) {
				this.logger.debug('[decktracker-overlay] received new game info', res);
				await this.changeWindowSize();
			}
		});
		this.events.on(Events.SHOW_MODAL).subscribe(() => {
			this.showBackdrop = true;
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		});
		this.events.on(Events.HIDE_MODAL).subscribe(() => {
			this.showBackdrop = false;
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		});

		await this.changeWindowSize();
		await this.restoreWindowPosition();
		await this.handleDisplayPreferences();
		amplitude.getInstance().logEvent('match-start', {
			'active-skin': this.useCleanMode ? 'clean' : 'original',
			'display-mode': this.displayMode,
		});
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
	}

	@HostListener('mousedown')
	dragMove() {
		// console.log('starting drag');
		this.tooltipPosition = 'none';
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
		this.ow.dragMove(this.windowId, async result => {
			// console.log('drag finished, updating position');
			await this.updateTooltipPosition();
			const window = await this.ow.getCurrentWindow();
			// console.log('retrieved window', window);
			if (!window) {
				return;
			}
			// console.log('updating tracker position', window.left, window.top);
			this.prefs.updateTrackerPosition(window.left, window.top);
			// console.log('updated tracker position', window.left, window.top);
		});
	}

	private async handleDisplayPreferences(preferences: Preferences = null) {
		preferences = preferences || (await this.prefs.getPreferences());
		// console.log('updating prefs', preferences);
		this.useCleanMode = preferences.decktrackerSkin === 'clean';
		this.displayMode =
			!preferences.overlayGroupByZone || this.useCleanMode ? 'DISPLAY_MODE_GROUPED' : 'DISPLAY_MODE_ZONE';
		this.showTitleBar = preferences.overlayShowTitleBar;
		this.overlayWidthInPx = preferences.overlayWidthInPx;
		this.opacity = preferences.overlayOpacityInPercent / 100;
		this.scale = preferences.decktrackerScale;
		this.highlightCardsInHand = preferences.overlayHighlightCardsInHand;
		this.colorManaCost = preferences.overlayShowRarityColors;
		this.cardsGoToBottom = preferences.overlayCardsGoToBottom;
		this.showTooltips = preferences.overlayShowTooltipsOnHover;
		await this.updateTooltipPosition();
		// console.log('showing tooltips?', this.showTooltips, this.tooltipPosition);
		this.onResized();
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private onResized() {
		const newScale = this.scale / 100;
		const element = this.el.nativeElement.querySelector('.scalable');
		this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async restoreWindowPosition(): Promise<void> {
		const prefs = await this.prefs.getPreferences();
		const width = Math.max(252, 252 * 2);
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameWidth = gameInfo.logicalWidth;
		const dpi = gameWidth / gameInfo.width;
		// https://stackoverflow.com/questions/8388440/converting-a-double-to-an-int-in-javascript-without-rounding
		const newLeft = prefs.decktrackerPosition ? prefs.decktrackerPosition.left || 0 : gameWidth - width * dpi - 40; // Leave a bit of room to the right
		const newTop = prefs.decktrackerPosition ? prefs.decktrackerPosition.top || 0 : 10;
		await this.ow.changeWindowPosition(this.windowId, newLeft, newTop);
		await this.updateTooltipPosition();
	}

	private async changeWindowSize(): Promise<void> {
		const width = Math.max(252, 252 * 3); // Max scale
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameHeight = gameInfo.logicalHeight;
		await this.ow.changeWindowSize(this.windowId, width, gameHeight);
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
		// console.log('[decktracker-overlay] tooltip position updated', this.tooltipPosition);
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
