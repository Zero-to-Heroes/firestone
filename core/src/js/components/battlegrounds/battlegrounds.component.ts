import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	OnDestroy,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { BattlegroundsState } from '../../models/battlegrounds/battlegrounds-state';
import { AdService } from '../../services/ad.service';
import { DebugService } from '../../services/debug.service';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';

@Component({
	selector: 'battlegrounds',
	styleUrls: [
		`../../../css/global/reset-styles.scss`,
		`../../../css/global/scrollbar.scss`,
		`../../../css/global/ngx-tooltips.scss`,
		`../../../css/component/battlegrounds/battlegrounds.component.scss`,
	],
	encapsulation: ViewEncapsulation.None,
	template: `
		<window-wrapper [activeTheme]="'battlegrounds'" [allowResize]="true">
			<ads [parentComponent]="'battlegrounds'" [adRefershToken]="adRefershToken" *ngIf="showAds"></ads>
			<battlegrounds-content [state]="state" *ngIf="cardsLoaded"> </battlegrounds-content>
		</window-wrapper>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsComponent implements AfterViewInit, OnDestroy {
	windowId: string;
	// activeTheme: CurrentAppType;
	state: BattlegroundsState;
	cardsLoaded = false;
	showAds = true;
	adRefershToken: string;

	private hotkeyPressedHandler: EventEmitter<boolean>;
	// private messageReceivedListener: (message: any) => void;
	private storeSubscription: Subscription;
	private hotkey;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly debug: DebugService,
		private readonly prefs: PreferencesService,
		private readonly ads: AdService,
	) {
		this.init();
	}

	private async init() {
		this.cardsLoaded = true;
		this.ow.getTwitterUserInfo();
		this.ow.getRedditUserInfo();
		this.showAds = await this.ads.shouldDisplayAds();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async ngAfterViewInit() {
		this.cdr.detach();
		this.windowId = (await this.ow.getCurrentWindow()).id;
		this.hotkeyPressedHandler = this.ow.getMainWindow().bgsHotkeyPressed;
		const storeBus: BehaviorSubject<BattlegroundsState> = this.ow.getMainWindow().battlegroundsStore;
		this.storeSubscription = storeBus.subscribe((newState: BattlegroundsState) => {
			try {
				this.state = { ...newState } as BattlegroundsState;
				this.adRefershToken = this.state?.currentGame?.reviewId;
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			} catch (e) {
				// Not having this catch block causes the "Cannot read property 'destroyed' of null"
				// exception to break the app
				if (
					e.message &&
					!(e.message as string).includes("Cannot read property 'destroyed' of null") &&
					!(e.message as string).includes("Cannot read property 'context' of null")
				) {
					console.error('Exception while handling new state', e.message, e.stack, e);
				}
			}
		});
		this.hotkey = await this.ow.getHotKey('battlegrounds');
		this.positionWindowOnSecondScreen();
	}

	@HostListener('window:keydown', ['$event'])
	async onKeyDown(e: KeyboardEvent) {
		const currentWindow = await this.ow.getCurrentWindow();

		if (currentWindow.id.includes('Overlay')) {
			return;
		}
		if (!this.hotkey || this.hotkey.IsUnassigned) {
			return;
		}
		const isAltKey = [1, 3, 5, 7].indexOf(this.hotkey.modifierKeys) !== -1;
		const isCtrlKey = [2, 3, 6, 7].indexOf(this.hotkey.modifierKeys) !== -1;
		const isShiftKey = [4, 5, 6, 7].indexOf(this.hotkey.modifierKeys) !== -1;

		if (
			e.shiftKey === isShiftKey &&
			e.altKey === isAltKey &&
			e.ctrlKey === isCtrlKey &&
			e.keyCode == this.hotkey.virtualKeycode
		) {
			this.hotkeyPressedHandler.next(true);
		}
	}

	@HostListener('mousedown', ['$event'])
	dragMove(event: MouseEvent) {
		const path: any[] = event.composedPath();
		// Hack for drop-downs
		if (
			path.length > 2 &&
			path[0].localName === 'div' &&
			path[0].className?.includes('options') &&
			path[1].localName === 'div' &&
			path[1].className?.includes('below')
		) {
			return;
		}
		this.ow.dragMove(this.windowId);
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		this.storeSubscription?.unsubscribe();
		this.state = null;
	}

	private async positionWindowOnSecondScreen() {
		const [monitorsList, gameInfo, prefs] = await Promise.all([
			this.ow.getMonitorsList(),
			this.ow.getRunningGameInfo(),
			this.prefs.getPreferences(),
		]);
		if (monitorsList.displays.length === 1 || prefs.bgsUseOverlay) {
			return;
		}

		const mainMonitor = gameInfo?.monitorHandle?.value ?? -1;
		if (mainMonitor !== -1) {
			const secondMonitor = monitorsList.displays.filter((monitor) => monitor.handle.value !== mainMonitor)[0];
			this.ow.changeWindowPosition(this.windowId, secondMonitor.x + 100, secondMonitor.y + 100);
		}
	}
}
