import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
} from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { BgsFaceOffWithSimulation } from '../../../models/battlegrounds/bgs-face-off-with-simulation';
import { Preferences } from '../../../models/preferences';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../services/ui-store/app-ui-store.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'bgs-simulation-overlay',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/simulation-overlay/bgs-simulation-overlay.component.scss`,
		'../../../../css/themes/battlegrounds-theme.scss',
	],
	template: `
		<div class="app-container overlay-container-parent battlegrounds-theme simulation-overlay">
			<bgs-battle-status
				[nextBattle]="nextBattle$ | async"
				[showReplayLink]="showSimulationSample$ | async"
			></bgs-battle-status>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsSimulationOverlayComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit {
	nextBattle$: Observable<BgsFaceOffWithSimulation>;
	showSimulationSample$: Observable<boolean>;

	private windowId: string;

	constructor(
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		this.nextBattle$ = combineLatest(
			this.store.listenBattlegrounds$(([state]) => state?.currentGame),
			this.store.listen$(
				([state, nav, prefs]) => prefs?.bgsShowSimResultsOnlyOnRecruit,
				([state, nav, prefs]) => prefs?.bgsHideSimResultsOnRecruit,
			),
		).pipe(
			filter(([[currentGame], [bgsShowSimResultsOnlyOnRecruit, bgsHideSimResultsOnRecruit]]) => !!currentGame),
			map(([[currentGame], [bgsShowSimResultsOnlyOnRecruit, bgsHideSimResultsOnRecruit]]) =>
				currentGame.getRelevantFaceOff(bgsShowSimResultsOnlyOnRecruit, bgsHideSimResultsOnRecruit),
			),
			distinctUntilChanged(),
			tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
			tap((filter) => cdLog('emitting nextBattle in ', this.constructor.name, filter)),
			takeUntil(this.destroyed$),
		);
		this.showSimulationSample$ = this.store
			.listen$(([state, nav, prefs]) => prefs?.bgsEnableSimulationSampleInOverlay)
			.pipe(
				map(([pref]) => pref),
				distinctUntilChanged(),
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				tap((filter) => cdLog('emitting showSimulationSample in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);
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
			this.prefs.updateBgsSimulationWidgetPosition(window.left, window.top);
		});
	}

	private async restoreWindowPosition(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameWidth = gameInfo.logicalWidth;
		const prefs: Preferences = await this.prefs.getPreferences();
		const trackerPosition = prefs.bgsSimulationWidgetPosition;
		const newLeft = (trackerPosition && trackerPosition.left) || gameWidth / 2 - 200;
		const newTop = (trackerPosition && trackerPosition.top) || 0;
		await this.ow.changeWindowPosition(this.windowId, newLeft, newTop);
	}
}
