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
import { Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { CardTooltipPositionType } from '../../../../directives/card-tooltip-position.type';
import { MercenariesAction } from '../../../../models/mercenaries/mercenaries-battle-state';
import { Preferences } from '../../../../models/preferences';
import { OverwolfService } from '../../../../services/overwolf.service';
import { PreferencesService } from '../../../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../../services/ui-store/app-ui-store.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'mercenaries-action-queue',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
		`../../../../../css/global/cdk-overlay.scss`,
		`../../../../../css/themes/decktracker-theme.scss`,
		'../../../../../css/component/mercenaries/overlay/action-queue/mercenaries-action-queue.component.scss',
	],
	template: `
		<div class="root overlay-container-parent" [activeTheme]="'decktracker'">
			<!-- Never remove the scalable from the DOM so that we can perform resizing even when not visible -->
			<div class="scalable">
				<div class="container">
					<div class="actions" *ngIf="actions$ | async as actions" [style.width.px]="overlayWidthInPx">
						<!-- <div class= "background"></div> -->
						<div class="actions-list">
							<mercenaries-action
								class="action {{ action.side }}"
								*ngFor="let action of actions"
								[action]="action"
								[tooltipPosition]="tooltipPosition"
							></mercenaries-action>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesActionsQueueComponent
	extends AbstractSubscriptionComponent
	implements AfterViewInit, OnDestroy {
	actions$: Observable<readonly MercenariesAction[]>;

	windowId: string;
	overlayWidthInPx = 240;
	tooltipPosition: CardTooltipPositionType = 'left';

	private trackerPositionUpdater = (left: number, top: number) =>
		this.prefs.updateMercenariesActionsQueueOverlayPosition(left, top);
	private trackerPositionExtractor = (prefs: Preferences) => prefs.mercenariesActionsQueueOverlayPosition;
	private scaleExtractor = (prefs: Preferences) => prefs.mercenariesActionsQueueOverlayScale;
	private defaultTrackerPositionLeftProvider = (gameWidth: number, windowWidth: number) =>
		gameWidth - windowWidth - 180;
	private defaultTrackerPositionTopProvider = (gameHeight: number, windowHeight: number) => 10;

	private gameInfoUpdatedListener: (message: any) => void;
	private scale: Subscription;

	constructor(
		private readonly ow: OverwolfService,
		private readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly store: AppUiStoreFacadeService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
	) {
		super();
	}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;
		this.actions$ = this.store
			.listenMercenaries$(([state]) => state.actionQueue)
			.pipe(
				filter(([actionQueue]) => !!actionQueue?.length),
				map(([actionQueue]) => actionQueue),
				distinctUntilChanged(),
				map((actionQueue) => {
					const speeds = actionQueue.map((action) => action.speed);
					return actionQueue.map((action) => ({
						...action,
						actionOrder: speeds.indexOf(action.speed) + 1,
					}));
				}),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((filter) => cdLog('emitting actionQueue in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);
		this.scale = this.store
			.listenPrefs$((prefs) => (!!this.scaleExtractor ? this.scaleExtractor(prefs) : null))
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
				this.el.nativeElement.style.setProperty('--decktracker-max-height', '90vh');
				const newScale = scale / 100;
				const element = this.el.nativeElement.querySelector('.scalable');
				this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			});

		this.gameInfoUpdatedListener = this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (res && res.resolutionChanged) {
				await this.changeWindowSize();
				await this.restoreWindowPosition();
			}
		});
		await this.changeWindowSize();
		await this.updateTooltipPosition();
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		super.ngOnDestroy();
		this.ow.removeGameInfoUpdatedListener(this.gameInfoUpdatedListener);
		this.scale?.unsubscribe();
	}

	@HostListener('mousedown', ['$event'])
	dragMove(event: MouseEvent) {
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

			console.log('updating tracker position', window.left, window.top);
			this.trackerPositionUpdater(window.left, window.top);
		});
	}

	private async changeWindowSize(): Promise<void> {
		const width = 252 * 4.5; // Max scale + room for the tasks list
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameHeight = gameInfo.logicalHeight;
		await this.ow.changeWindowSize(this.windowId, width, gameHeight);
		await this.restoreWindowPosition();
		await this.updateTooltipPosition();
	}

	private async restoreWindowPosition(): Promise<void> {
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
				trackerPosition
					? trackerPosition.left || 0
					: this.defaultTrackerPositionLeftProvider(gameInfo.logicalWidth, windowWidth),
			),
		);
		const newLogicalTop = Math.min(
			maxAcceptableTop,
			Math.max(
				minAcceptableTop,
				trackerPosition
					? trackerPosition.top || 0
					: this.defaultTrackerPositionTopProvider(gameInfo.logicalHeight, gameInfo.logicalHeight),
			),
		);
		console.log('updating tracker position', newLogicalLeft, newLogicalTop, gameInfo.logicalWidth, gameInfo.width);
		await this.ow.changeWindowPosition(this.windowId, newLogicalLeft, newLogicalTop);
		console.log('after window position update', await this.ow.getCurrentWindow());
		await this.updateTooltipPosition();
	}

	private async updateTooltipPosition() {
		const window = await this.ow.getCurrentWindow();
		if (!window) {
			return;
		}
		this.tooltipPosition = window.left < 0 ? 'right' : 'left';
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

export interface Task {
	readonly mercenaryCardId: string;
	readonly title: string;
	readonly description: string;
	readonly taskChainProgress: number;
	readonly progress: number;
	readonly portraitUrl?: string;
	readonly frameUrl?: string;
}
