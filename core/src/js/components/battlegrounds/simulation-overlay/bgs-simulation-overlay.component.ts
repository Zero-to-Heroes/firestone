import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	OnDestroy,
	OnInit,
	ViewRef,
} from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { BattlegroundsState } from '../../../models/battlegrounds/battlegrounds-state';
import { Preferences } from '../../../models/preferences';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';
import { BattleResult } from '../in-game/battle-result';

declare let amplitude: any;

@Component({
	selector: 'bgs-simulation-overlay',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/simulation-overlay/bgs-simulation-overlay.component.scss`,
		'../../../../css/themes/battlegrounds-theme.scss',
	],
	template: `
		<div class="logo-container battlegrounds-theme">
			<div class="background-main-part"></div>
			<div class="background-second-part"></div>
			<i class="gold-theme logo">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#logo" />
				</svg>
			</i>
		</div>
		<div class="app-container overlay-container-parent battlegrounds-theme simulation-overlay">
			<bgs-battle-status
				[nextBattle]="nextBattle"
				[battleSimulationStatus]="battleSimulationStatus"
			></bgs-battle-status>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsSimulationOverlayComponent implements OnInit, OnDestroy {
	nextBattle: BattleResult;
	battleSimulationStatus: 'empty' | 'waiting-for-result' | 'done';

	private windowId: string;
	private storeSubscription: Subscription;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
	) {}

	async ngOnInit() {
		const storeBus: BehaviorSubject<BattlegroundsState> = this.ow.getMainWindow().battlegroundsStore;
		this.storeSubscription = storeBus.subscribe((newState: BattlegroundsState) => {
			try {
				this.nextBattle = newState?.currentGame?.battleResult;
				this.battleSimulationStatus = newState?.currentGame?.battleInfoStatus;
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			} catch (e) {
				// Not having this catch block causes the "Cannot read property 'destroyed' of null"
				// exception to break the app
				console.error('Exception while handling new state', e.message, e);
			}
		});
		this.windowId = (await this.ow.getCurrentWindow()).id;
		await this.restoreWindowPosition();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	ngOnDestroy(): void {
		this.storeSubscription.unsubscribe();
	}

	@HostListener('mousedown')
	dragMove() {
		this.ow.dragMove(this.windowId, async result => {
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
