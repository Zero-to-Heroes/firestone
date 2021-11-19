import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	Renderer2,
} from '@angular/core';
import { Race } from '@firestone-hs/reference-data';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { Preferences } from '../../models/preferences';
import { getTribeName } from '../../services/battlegrounds/bgs-utils';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../services/ui-store/app-ui-store.service';
import { arraysEqual } from '../../services/utils';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

@Component({
	selector: 'bgs-banned-tribes',
	styleUrls: [
		'../../../css/global/components-global.scss',
		`../../../css/global/cdk-overlay.scss`,
		'../../../css/component/battlegrounds/bgs-banned-tribes.component.scss',
		`../../../css/themes/battlegrounds-theme.scss`,
	],
	template: `
		<div class="root scalable overlay-container-parent" [activeTheme]="'battlegrounds'">
			<div
				*ngIf="bannedTribes$ | async as bannedTribes"
				class="banned-tribes {{ orientation$ | async }}"
				[helpTooltip]="tooltip$ | async"
				helpTooltipPosition="bottom"
			>
				<bgs-banned-tribe *ngFor="let tribe of bannedTribes" [tribe]="tribe">{{ tribe }}</bgs-banned-tribe>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBannedTribesComponent extends AbstractSubscriptionComponent implements AfterContentInit, AfterViewInit {
	bannedTribes$: Observable<readonly Race[]>;
	tooltip$: Observable<string>;
	orientation$: Observable<'row' | 'column'>;

	// private stateSubscription: Subscription;
	private windowId: string;

	constructor(
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.bannedTribes$ = this.store
			.listenBattlegrounds$(([state]) => state)
			.pipe(
				filter(([state]) => !!state),
				map(([state]) => state?.currentGame?.bannedRaces),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((info) => cdLog('emitting showAds in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
		this.tooltip$ = this.bannedTribes$.pipe(
			filter((bannedTribes) => !!bannedTribes?.length),
			map((bannedTribes) => {
				const tribeNames = bannedTribes.map((tribe) => getTribeName(tribe)).join(', ');
				const exceptionCards = bannedTribes
					.map((tribe) => this.getExceptions(tribe))
					.reduce((a, b) => a.concat(b), []);
				const exceptions =
					exceptionCards && exceptionCards.length > 0 ? 'Exceptions: ' + exceptionCards.join(', ') : '';
				const tooltip = `${tribeNames}s won't appear in this run. ${exceptions}`;
				return tooltip;
			}),
			distinctUntilChanged(),
			// FIXME
			tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
			tap((info) => cdLog('emitting tooltip in ', this.constructor.name, info)),
			takeUntil(this.destroyed$),
		);
		this.orientation$ = this.store
			.listen$(([main, nav, prefs]) => prefs.bgsBannedTribesShowVertically)
			.pipe(
				map(([pref]) => (pref ? 'column' : 'row') as 'row' | 'column'),
				distinctUntilChanged(),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((info) => cdLog('emitting orientation in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
		this.store
			.listen$(([main, nav, prefs]) => prefs.bgsBannedTribeScale)
			.pipe(
				map(([pref]) => pref),
				distinctUntilChanged(),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((info) => cdLog('emitting bgsBannedTribeScale in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			)
			.subscribe((scale) => {
				this.el.nativeElement.style.setProperty('--bgs-banned-tribe-scale', scale / 100);
				const element = this.el.nativeElement.querySelector('.scalable');
				this.renderer.setStyle(element, 'transform', `scale(${scale / 100})`);
			});
	}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;
		await this.restoreWindowPosition();
	}

	@HostListener('mousedown')
	dragMove() {
		this.ow.dragMove(this.windowId, async (result) => {
			const window = await this.ow.getCurrentWindow();
			if (!window) {
				return;
			}
			this.prefs.updateBgsBannedTribedPosition(window.left, window.top);
		});
	}

	private getExceptions(value: Race): string[] {
		switch (value) {
			case Race.BEAST:
				return [];
			case Race.DEMON:
				return [];
			case Race.DRAGON:
				return [];
			case Race.MECH:
				return [];
			case Race.MURLOC:
				return [];
			case Race.PIRATE:
				return [];
			case Race.ELEMENTAL:
				return [];
			case Race.QUILBOAR:
				return [];
		}
		return [];
	}

	private async restoreWindowPosition(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		console.log('gameInfo', gameInfo);
		if (!gameInfo) {
			return;
		}
		const gameWidth = gameInfo.logicalWidth;
		console.log('gameWidth', gameWidth);
		const prefs: Preferences = await this.prefs.getPreferences();
		const trackerPosition = prefs.bgsBannedTribesWidgetPosition;
		console.log('trackerPosition', trackerPosition);
		const newLeft = (trackerPosition && trackerPosition.left) || gameWidth / 2 + 300;
		console.log('newLeft', newLeft);
		const newTop = (trackerPosition && trackerPosition.top) || 200;
		console.log('newTop', newTop);
		await this.ow.changeWindowPosition(this.windowId, newLeft, newTop);
	}
}
