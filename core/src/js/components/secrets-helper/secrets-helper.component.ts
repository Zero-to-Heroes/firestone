import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	OnDestroy,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { CardTooltipPositionType } from '../../directives/card-tooltip-position.type';
import { BoardSecret } from '../../models/decktracker/board-secret';
import { DebugService } from '../../services/debug.service';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../services/ui-store/app-ui-store.service';
import { arraysEqual } from '../../services/utils';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

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
			[style.opacity]="opacity$ | async"
			*ngIf="{ active: active$ | async } as value"
			[ngClass]="{ 'active': value.active }"
		>
			<div class="main-container">
				<secrets-helper-widget-icon class="icon" [active]="value.active"></secrets-helper-widget-icon>
				<!-- Never remove the scalable from the DOM so that we can perform resizing even when not visible -->
				<div class="scalable">
					<div class="secrets-helper-container">
						<div class="secrets-helper" [style.width.px]="widthInPx">
							<div class="background"></div>
							<secrets-helper-control-bar [windowId]="windowId"></secrets-helper-control-bar>
							<secrets-helper-list
								[secrets]="secrets$ | async"
								[colorManaCost]="colorManaCost$ | async"
								[cardsGoToBottom]="cardsGoToBottom$ | async"
								[tooltipPosition]="tooltipPosition"
							>
							</secrets-helper-list>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecretsHelperComponent extends AbstractSubscriptionComponent implements AfterViewInit, OnDestroy {
	opacity$: Observable<number>;
	colorManaCost$: Observable<boolean>;
	cardsGoToBottom$: Observable<boolean>;
	active$: Observable<boolean>;
	secrets$: Observable<readonly BoardSecret[]>;

	tooltipPosition: CardTooltipPositionType = 'left';

	windowId: string;
	widthInPx = 227;

	private showTooltips = true;

	private gameInfoUpdatedListener: (message: any) => void;

	constructor(
		private readonly prefs: PreferencesService,
		private readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly store: AppUiStoreFacadeService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		private readonly init_DebugService: DebugService,
	) {
		super();
	}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;
		this.active$ = this.store
			.listenDeckState$((state) => state?.opponentDeck?.secretHelperActive)
			.pipe(
				map(([pref]) => pref),
				distinctUntilChanged(),
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				tap((filter) => cdLog('emitting active in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);
		this.secrets$ = this.store
			.listenDeckState$((state) => state?.opponentDeck?.secrets)
			.pipe(
				map(([secrets]) => secrets),
				distinctUntilChanged(arraysEqual),
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				tap((filter) => cdLog('emitting secrets in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);
		this.opacity$ = this.store
			.listenPrefs$((prefs) => prefs.secretsHelperOpacity)
			.pipe(
				map(([pref]) => pref),
				distinctUntilChanged(),
				map((opacity) => opacity / 100),
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				tap((filter) => cdLog('emitting opacity in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);
		this.colorManaCost$ = this.store
			.listen$(([main, nav, prefs]) => prefs.overlayShowRarityColors)
			.pipe(
				map(([pref]) => pref),
				distinctUntilChanged(),
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				tap((filter) => cdLog('emitting colorManaCost in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);
		this.cardsGoToBottom$ = this.store
			.listen$(([main, nav, prefs]) => prefs.secretsHelperCardsGoToBottom)
			.pipe(
				map(([pref]) => pref),
				distinctUntilChanged(),
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				tap((filter) => cdLog('emitting cardsGoToBottom in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);

		this.store
			.listenPrefs$((prefs) => prefs.secretsHelperScale)
			.pipe(
				debounceTime(100),
				map(([pref]) => pref),
				distinctUntilChanged(),
				filter((scale) => !!scale),
				takeUntil(this.destroyed$),
			)
			.subscribe((scale) => {
				console.debug('updating scale', scale);
				this.el.nativeElement.style.setProperty('--secrets-helper-scale', scale / 100);
				this.el.nativeElement.style.setProperty('--secrets-helper-max-height', '22vh');
				const newScale = scale / 100;
				const element = this.el.nativeElement.querySelector('.scalable');
				this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			});
		this.store
			.listenPrefs$((prefs) => prefs.overlayShowTooltipsOnHover)
			.pipe(
				debounceTime(100),
				map(([pref]) => pref),
				distinctUntilChanged(),
				takeUntil(this.destroyed$),
			)
			.subscribe(async (overlayShowTooltipsOnHover) => {
				this.showTooltips = overlayShowTooltipsOnHover;
				await this.updateTooltipPosition();
			});
		this.gameInfoUpdatedListener = this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (res && res.resolutionChanged) {
				await this.changeWindowSize();
			}
		});

		await this.changeWindowSize();
		await this.restoreWindowPosition();
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		super.ngOnDestroy();
		this.ow.removeGameInfoUpdatedListener(this.gameInfoUpdatedListener);
	}

	@HostListener('mousedown')
	dragMove() {
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
			this.prefs.updateSecretsHelperPosition(window.left, window.top);
		});
	}

	private async restoreWindowPosition(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}

		const currentWindow = await this.ow.getCurrentWindow();
		const windowWidth = currentWindow.width;

		const prefs = await this.prefs.getPreferences();
		const trackerPosition = prefs.secretsHelperPosition;

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
