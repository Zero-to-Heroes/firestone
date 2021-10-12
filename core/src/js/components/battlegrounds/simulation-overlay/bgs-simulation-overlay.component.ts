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
import { BattleInfoMessage } from '../../../models/battlegrounds/battle-info-message.type';
import { BattlegroundsState } from '../../../models/battlegrounds/battlegrounds-state';
import { BgsFaceOffWithSimulation } from '../../../models/battlegrounds/bgs-face-off-with-simulation';
import { Preferences } from '../../../models/preferences';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';

@Component({
	selector: 'bgs-simulation-overlay',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/simulation-overlay/bgs-simulation-overlay.component.scss`,
		'../../../../css/themes/battlegrounds-theme.scss',
	],
	template: `
		<!-- <div class="logo-container battlegrounds-theme">
			<div class="background-main-part"></div>
			<div class="background-second-part"></div>
			<i class="gold-theme logo">
				<svg class="svg-icon-fill">
					<use xlink:href="assets/svg/sprite.svg#logo" />
				</svg>
			</i>
		</div> -->
		<div class="app-container overlay-container-parent battlegrounds-theme simulation-overlay">
			<bgs-battle-status [nextBattle]="nextBattle" [showReplayLink]="showSimulationSample"></bgs-battle-status>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsSimulationOverlayComponent implements OnInit, OnDestroy {
	nextBattle: BgsFaceOffWithSimulation;
	battleSimulationStatus: 'empty' | 'waiting-for-result' | 'done';
	simulationMessage: BattleInfoMessage;
	showSimulationSample: boolean;

	private windowId: string;
	private storeSubscription: Subscription;
	private preferencesSubscription: Subscription;
	private preferences: Preferences;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
	) {}

	async ngOnInit() {
		const storeBus: BehaviorSubject<BattlegroundsState> = this.ow.getMainWindow().battlegroundsStore;
		this.storeSubscription = storeBus.subscribe((newState: BattlegroundsState) => {
			try {
				this.nextBattle = newState?.currentGame?.getRelevantFaceOff(this.preferences);

				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			} catch (e) {
				// Not having this catch block causes the "Cannot read property 'destroyed' of null"
				// exception to break the app
				console.error('Exception while handling new state', e.message, e);
			}
		});

		const preferencesEventBus: BehaviorSubject<any> = this.ow.getMainWindow().preferencesEventBus;
		this.preferencesSubscription = preferencesEventBus.subscribe((event) => {
			this.handleDisplayPreferences(event.preferences);
		});

		this.windowId = (await this.ow.getCurrentWindow()).id;

		await this.handleDisplayPreferences();
		await this.restoreWindowPosition();

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		this.storeSubscription?.unsubscribe();
		this.preferencesSubscription?.unsubscribe();
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

	private async handleDisplayPreferences(preferences: Preferences = null) {
		this.preferences = preferences || (await this.prefs.getPreferences());

		this.showSimulationSample = this.preferences.bgsEnableSimulationSampleInOverlay;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
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
