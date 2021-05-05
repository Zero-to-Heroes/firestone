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
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BehaviorSubject, Subscriber, Subscription } from 'rxjs';
import { CardTooltipPositionType } from '../../directives/card-tooltip-position.type';
import { BoardSecret } from '../../models/decktracker/board-secret';
import { GameState } from '../../models/decktracker/game-state';
import { Preferences } from '../../models/preferences';
import { DebugService } from '../../services/debug.service';
import { CARDS_VERSION } from '../../services/hs-utils';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';

@Component({
	selector: 'secrets-helper',
	styleUrls: [
		'../../../css/global/components-global.scss',
		`../../../css/global/cdk-overlay.scss`,
		`../../../css/themes/decktracker-theme.scss`,
		'../../../css/component/secrets-helper/secrets-helper.component.scss',
	],
	template: `
		<div
			class="root overlay-container-parent"
			[activeTheme]="'decktracker'"
			[style.opacity]="opacity"
			[ngClass]="{ 'active': active }"
		>
			<div class="main-container">
				<secrets-helper-widget-icon class="icon" [active]="active"></secrets-helper-widget-icon>
				<!-- Never remove the scalable from the DOM so that we can perform resizing even when not visible -->
				<div class="scalable">
					<div class="secrets-helper-container">
						<div class="secrets-helper" *ngIf="shouldShow" [style.width.px]="widthInPx">
							<div class="background"></div>
							<secrets-helper-control-bar [windowId]="windowId"></secrets-helper-control-bar>
							<secrets-helper-list
								[secrets]="secrets"
								[colorManaCost]="colorManaCost"
								[cardsGoToBottom]="cardsGoToBottom"
								[tooltipPosition]="tooltipPosition"
							>
							</secrets-helper-list>
							<div class="backdrop" *ngIf="showBackdrop"></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecretsHelperComponent implements AfterViewInit, OnDestroy {
	secrets: readonly BoardSecret[];
	active: boolean;

	// gameState: GameState;
	shouldShow: boolean;
	windowId: string;
	widthInPx: number;
	opacity: number;
	colorManaCost: boolean;
	cardsGoToBottom: boolean;
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
		private init_DebugService: DebugService,
		private cards: AllCardsService,
	) {
		cards.initializeCardsDb(CARDS_VERSION);
	}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;
		const deckEventBus: BehaviorSubject<any> = this.ow.getMainWindow().deckEventBus;
		const subscriber = new Subscriber<any>(async (event) => {
			this.shouldShow = event?.state != null;
			// this.gameState = event ? event.state : undefined;
			this.active = (event.state as GameState)?.opponentDeck?.secretHelperActive;
			this.secrets = (event.state as GameState)?.opponentDeck?.secrets;
			console.debug('is active', this.active);
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
		subscriber['identifier'] = 'secrets-helper';
		this.deckSubscription = deckEventBus.subscribe(subscriber);

		const preferencesEventBus: EventEmitter<any> = this.ow.getMainWindow().preferencesEventBus;
		this.preferencesSubscription = preferencesEventBus.subscribe((event) => {
			this.handleDisplayPreferences(event.preferences);
		});
		this.gameInfoUpdatedListener = this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (res && res.resolutionChanged) {
				console.log('[decktracker-overlay] received new game info', res);
				await this.changeWindowSize();
			}
		});

		await this.changeWindowSize();
		await this.restoreWindowPosition();
		await this.handleDisplayPreferences();
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
		console.log('[shutdown] unsubscribed from secrets-helper');
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
			console.log('updating position', window.left, window.top);
			this.prefs.updateSecretsHelperPosition(window.left, window.top);
		});
	}

	private async handleDisplayPreferences(preferences: Preferences = null) {
		preferences = preferences || (await this.prefs.getPreferences());
		// console.log('updating prefs', preferences);
		this.widthInPx = 227;
		this.opacity = preferences.secretsHelperOpacity / 100;
		this.scale = preferences.secretsHelperScale;
		this.el.nativeElement.style.setProperty('--secrets-helper-scale', this.scale / 100);
		this.el.nativeElement.style.setProperty('--secrets-helper-max-height', '22vh');
		this.colorManaCost = preferences.overlayShowRarityColors;
		this.cardsGoToBottom = preferences.secretsHelperCardsGoToBottom;
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

	private async restoreWindowPosition(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}

		const currentWindow = await this.ow.getCurrentWindow();
		const windowWidth = currentWindow.width;
		console.log('window position', currentWindow, gameInfo, windowWidth);

		const prefs = await this.prefs.getPreferences();
		const trackerPosition = prefs.secretsHelperPosition;
		console.log('loaded tracker position', trackerPosition);

		const minAcceptableLeft = -windowWidth / 2;
		const maxAcceptableLeft = gameInfo.logicalWidth - windowWidth / 2;
		const minAcceptableTop = -100;
		const maxAcceptableTop = gameInfo.logicalHeight - 100;
		const newLogicalLeft = Math.min(
			maxAcceptableLeft,
			Math.max(minAcceptableLeft, (trackerPosition && trackerPosition.left) ?? (await this.getDefaultLeft())),
		);
		const newTop = Math.min(
			maxAcceptableTop,
			Math.max(minAcceptableTop, (trackerPosition && trackerPosition.top) ?? (await this.getDefaultTop())),
		);
		console.log('setting new position', trackerPosition, newLogicalLeft, newTop);
		await this.ow.changeWindowPosition(this.windowId, newLogicalLeft, newTop);
		await this.updateTooltipPosition();
	}

	private async getDefaultLeft(): Promise<number> {
		const gameInfo = await this.ow.getRunningGameInfo();
		const width = Math.max(252, 252 * 2);
		// Use the height as a way to change the position, as the width can expand around the play
		// area based on the screen resolution
		return gameInfo.width / 2 - width - gameInfo.height * 0.3;
	}

	private async getDefaultTop(): Promise<number> {
		const gameInfo = await this.ow.getRunningGameInfo();
		return gameInfo.height * 0.05;
	}

	private async changeWindowSize(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		// const dpi = gameInfo.logicalWidth / gameInfo.width;
		// We don't divide by the DPI here, because we need a lot of space when displaying tooltips
		const width = 252 * 3; // Max scale
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
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
