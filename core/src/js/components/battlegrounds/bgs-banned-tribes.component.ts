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
import { Race } from '@firestone-hs/reference-data';
import { BehaviorSubject, Subscription } from 'rxjs';
import { BattlegroundsState } from '../../models/battlegrounds/battlegrounds-state';
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
		<div class="scalable">
			<div
				*ngIf="bannedTribes"
				class="root overlay-container-parent banned-tribes {{ orientation }}"
				[activeTheme]="'battlegrounds'"
			>
				<bgs-banned-tribe *ngFor="let tribe of bannedTribes" [tribe]="tribe">{{ tribe }}</bgs-banned-tribe>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBannedTribesComponent implements AfterViewInit, OnDestroy {
	bannedTribes: readonly Race[] = [];
	orientation: 'row' | 'column' = 'row';

	private scale: number;
	private stateSubscription: Subscription;
	private windowId: string;
	private preferencesSubscription: Subscription;

	constructor(
		private readonly ow: OverwolfService,
		private readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
	) {}

	async ngAfterViewInit() {
		const deckEventBus: BehaviorSubject<any> = this.ow.getMainWindow().battlegroundsStore;
		this.stateSubscription = deckEventBus.subscribe(async (gameState: BattlegroundsState) => {
			// console.log('received state', gameState?.currentGame?.bannedRaces, event);
			if (gameState?.currentGame?.bannedRaces !== this.bannedTribes) {
				this.bannedTribes = gameState?.currentGame?.bannedRaces || [];
				console.log('setting banned tribes', this.bannedTribes);
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			}
		});
		this.windowId = (await this.ow.getCurrentWindow()).id;
		const preferencesEventBus: EventEmitter<any> = this.ow.getMainWindow().preferencesEventBus;
		this.preferencesSubscription = preferencesEventBus.subscribe(event => {
			this.handleDisplayPreferences(event.preferences);
		});
		await this.handleDisplayPreferences();
		await this.restoreWindowPosition();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	ngOnDestroy() {
		if (this.stateSubscription) {
			this.stateSubscription.unsubscribe();
		}
		this.preferencesSubscription.unsubscribe();
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

	private async handleDisplayPreferences(preferences: Preferences = null) {
		preferences = preferences || (await this.prefs.getPreferences());
		this.orientation = preferences.bgsBannedTribesShowVertically ? 'column' : 'row';
		this.scale = preferences.bgsBannedTribeScale;
		this.el.nativeElement.style.setProperty('--bgs-banned-tribe-scale', this.scale / 100);
		// this.el.nativeElement.style.setProperty('--secrets-helper-max-height', '22vh');
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
		const gameWidth = gameInfo.logicalWidth;
		const prefs: Preferences = await this.prefs.getPreferences();
		const trackerPosition = prefs.bgsBannedTribesWidgetPosition;
		const newLeft = (trackerPosition && trackerPosition.left) || gameWidth / 2 + 300;
		const newTop = (trackerPosition && trackerPosition.top) || 200;
		await this.ow.changeWindowPosition(this.windowId, newLeft, newTop);
	}
}
