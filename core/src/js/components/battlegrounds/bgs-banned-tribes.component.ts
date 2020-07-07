import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { Race } from '@firestone-hs/reference-data';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Preferences } from '../../models/preferences';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';

declare let amplitude;

@Component({
	selector: 'bgs-banned-tribes',
	styleUrls: [
		'../../../css/global/components-global.scss',
		`../../../css/global/cdk-overlay.scss`,
		'../../../css/component/battlegrounds/bgs-banned-tribes.component.scss',
		`../../../css/themes/battlegrounds-theme.scss`,
	],
	template: `
		<div *ngIf="bannedTribes" class="root overlay-container-parent" [activeTheme]="'battlegrounds'">
			<bgs-banned-tribe *ngFor="let tribe of bannedTribes" [tribe]="tribe">{{ tribe }}</bgs-banned-tribe>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBannedTribesComponent implements AfterViewInit, OnDestroy {
	bannedTribes: readonly Race[];

	private stateSubscription: Subscription;
	private windowId: string;

	constructor(
		private readonly ow: OverwolfService,
		private readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
	) {}

	async ngAfterViewInit() {
		const deckEventBus: BehaviorSubject<any> = this.ow.getMainWindow().battlegroundsStore;
		this.stateSubscription = deckEventBus.subscribe(async gameState => {
			// console.log('received state', gameState?.currentGame?.bannedRaces, event);
			if (gameState?.currentGame?.bannedRaces !== this.bannedTribes) {
				this.bannedTribes = gameState?.currentGame?.bannedRaces;
				// console.log('setting banned tribes', this.bannedTribes);
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			}
		});
		this.windowId = (await this.ow.getCurrentWindow()).id;
		await this.restoreWindowPosition();
	}

	ngOnDestroy() {
		if (this.stateSubscription) {
			this.stateSubscription.unsubscribe();
		}
	}

	@HostListener('mousedown')
	dragMove() {
		this.ow.dragMove(this.windowId, async result => {
			const window = await this.ow.getCurrentWindow();
			if (!window) {
				return;
			}
			this.prefs.updateBgsBannedTribedPosition(window.left, window.top);
		});
	}

	private async restoreWindowPosition(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameWidth = gameInfo.logicalWidth;
		const prefs: Preferences = await this.prefs.getPreferences();
		const trackerPosition = prefs.bgsBannedTribesWidgetPosition;
		const newLeft = (trackerPosition && trackerPosition.left) || gameWidth / 2 - 700;
		const newTop = (trackerPosition && trackerPosition.top) || gameInfo.logicalHeight - 400;
		await this.ow.changeWindowPosition(this.windowId, newLeft, newTop);
	}
}
