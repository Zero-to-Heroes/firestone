import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	OnDestroy,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, takeUntil, tap } from 'rxjs/operators';
import { CurrentAppType } from '../models/mainwindow/current-app.type';
import { MainWindowState } from '../models/mainwindow/main-window-state';
import { NavigationState } from '../models/mainwindow/navigation/navigation-state';
import { DebugService } from '../services/debug.service';
import { HotkeyService } from '../services/hotkey.service';
import { OverwolfService } from '../services/overwolf.service';
import { OwUtilsService } from '../services/plugins/ow-utils.service';
import { PreferencesService } from '../services/preferences.service';
import { AppUiStoreFacadeService } from '../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../services/ui-store/app-ui-store.service';
import { AbstractSubscriptionComponent } from './abstract-subscription.component';

@Component({
	selector: 'main-window',
	styleUrls: [
		`../../css/global/components-global.scss`,
		`../../css/global/ngx-tooltips.scss`,
		`../../css/component/main-window.component.scss`,
	],
	encapsulation: ViewEncapsulation.None,
	template: `
		<window-wrapper *ngIf="dataState && navigationState" [activeTheme]="activeTheme" [allowResize]="true">
			<section class="layout">
				<div class="navigation" [ngClass]="{ 'navigation-ftue': dataState.showFtue }">
					<div class="logo" inlineSVG="assets/svg/firestone_logo_no_text.svg"></div>
					<div class="main-menu-separator"></div>
					<menu-selection
						[selectedModule]="navigationState.currentApp"
						[currentUser]="dataState.currentUser"
					></menu-selection>
				</div>
				<div class="main">
					<section class="menu-bar">
						<div class="before-main-divider"></div>
						<hotkey></hotkey>
						<div class="controls">
							<control-share
								[onSocialClick]="takeScreenshotFunction"
								[page]="navigationState?.getPageName()"
							></control-share>
							<control-bug></control-bug>
							<control-settings
								[windowId]="windowId"
								[settingsApp]="navigationState.currentApp"
							></control-settings>
							<control-help (help)="onHelp()"></control-help>
							<control-discord></control-discord>
							<control-minimize [windowId]="windowId" [isMainWindow]="true"></control-minimize>
							<control-maximize [windowId]="windowId"></control-maximize>
							<control-close
								[windowId]="windowId"
								[helpTooltip]="hotkeyText"
								helpTooltipPosition="bottom-left"
								[isMainWindow]="true"
								[closeAll]="true"
							></control-close>
						</div>
					</section>
					<section
						class="content-container"
						*ngIf="!dataState.showFtue"
						[ngClass]="{ 'hide-ads': !_showAds }"
					>
						<!-- Don't cache the DOM, as it can cause some lag when many replays are loaded -->
						<replays
							class="main-section"
							[state]="dataState"
							[navigation]="navigationState"
							*ngIf="navigationState.currentApp === 'replays'"
						></replays>
						<achievements
							class="main-section"
							[state]="dataState.achievements"
							[navigation]="navigationState"
							[currentUser]="dataState.currentUser"
							[socialShareUserInfo]="dataState.socialShareUserInfo"
							[globalStats]="dataState.globalStats"
							*ngIf="navigationState.currentApp === 'achievements'"
						>
						</achievements>
						<collection
							class="main-section"
							[state]="dataState.binder"
							[navigation]="navigationState"
							*ngIf="navigationState.currentApp === 'collection'"
						></collection>
						<decktracker
							class="main-section"
							[state]="dataState?.decktracker"
							[showAds]="dataState?.showAds"
							[navigation]="navigationState"
							*ngIf="navigationState.currentApp === 'decktracker'"
						>
						</decktracker>
						<battlegrounds-desktop
							class="main-section"
							*ngIf="navigationState.currentApp === 'battlegrounds'"
						>
						</battlegrounds-desktop>
						<mercenaries-desktop class="main-section" *ngIf="navigationState.currentApp === 'mercenaries'">
						</mercenaries-desktop>
						<duels-desktop class="main-section" *ngIf="navigationState.currentApp === 'duels'">
						</duels-desktop>
						<arena-desktop class="main-section" *ngIf="navigationState.currentApp === 'arena'">
						</arena-desktop>
						<stats-desktop class="main-section" *ngIf="navigationState.currentApp === 'stats'">
						</stats-desktop>
					</section>
				</div>
			</section>
			<ftue *ngIf="dataState.showFtue" [selectedModule]="navigationState.currentApp"> </ftue>
			<ads [parentComponent]="'main-window'" [adRefershToken]="adRefershToken$ | async" *ngIf="_showAds"></ads>
			<new-version-notification
				class="new-version"
				[forceOpen]="forceShowReleaseNotes"
				(notificationDisplayed)="onNewVersionDisplayed($event)"
			></new-version-notification>
		</window-wrapper>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainWindowComponent extends AbstractSubscriptionComponent implements AfterViewInit, OnDestroy {
	adRefershToken$: Observable<boolean>;

	dataState: MainWindowState;
	navigationState: NavigationState;
	windowId: string;
	activeTheme: CurrentAppType | 'decktracker-desktop';
	displayingNewVersionNotification: boolean;
	forceShowReleaseNotes: boolean;
	_showAds = true;

	takeScreenshotFunction: (copyToCliboard: boolean) => Promise<[string, any]> = this.takeScreenshot();
	hotkeyText: string;

	private isMaximized = false;
	private stateChangedListener: (message: any) => void;
	// private navigationStateChangedListener: (message: any) => void;
	private messageReceivedListener: (message: any) => void;
	private dataStoreSubscription: Subscription;
	private navigationStoreSubscription: Subscription;
	private hotkeyPressedHandler;
	private hotkey;

	constructor(
		private readonly ow: OverwolfService,
		private readonly debug: DebugService,
		private readonly owUtils: OwUtilsService,
		private readonly hotkeyService: HotkeyService,
		private readonly preferencesService: PreferencesService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	async ngAfterViewInit() {
		const currentWindow = await this.ow.getCurrentWindow();
		this.windowId = currentWindow.id;
		this.adRefershToken$ = this.store
			.listenDeckState$((gameState) => gameState)
			.pipe(
				map(([gameState]) => gameState.gameStarted),
				debounceTime(100),
				distinctUntilChanged(),
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				tap((filter) => cdLog('emitting adRefershToken in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);

		this.messageReceivedListener = this.ow.addMessageReceivedListener(async (message) => {
			if (message.id === 'move') {
				const window = await this.ow.getCurrentWindow();
				const newX = message.content.x - window.width / 2;
				const newY = message.content.y - window.height / 2;
				this.ow.changeWindowPosition(this.windowId, newX, newY);
			}
		});
		const prefs = await this.preferencesService.getPreferences();
		const windowName = this.ow.getCollectionWindowName(prefs);
		this.stateChangedListener = this.ow.addStateChangedListener(windowName, (message) => {
			// If hidden, restore window to as it was
			if (message.window_state === 'maximized') {
				this.isMaximized = true;
			} else if (message.window_state !== 'minimized') {
				// When minimized we want to remember the last position
				this.isMaximized = false;
			}
		});
		const storeBus: BehaviorSubject<MainWindowState> = this.ow.getMainWindow().mainWindowStore;
		this.dataStoreSubscription = storeBus.subscribe((newState: MainWindowState) => {
			setTimeout(async () => {
				this.dataState = newState;
				this.activeTheme = this.buildActiveTheme();
				this._showAds = this.showAds();
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			});
		});
		const navigationStoreBus: BehaviorSubject<NavigationState> = this.ow.getMainWindow().mainWindowStoreNavigation;
		this.navigationStoreSubscription = navigationStoreBus.subscribe((newState: NavigationState) => {
			setTimeout(async () => {
				// First update the state before restoring the window
				this.navigationState = newState;
				this.activeTheme = this.buildActiveTheme();
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
				const window = await this.ow.getCurrentWindow();
				const currentlyVisible = window.isVisible;
				if (
					newState.isVisible &&
					(!this.navigationState || !this.navigationState.isVisible || !currentlyVisible)
				) {
					// amplitude.getInstance().logEvent('show', { 'window': 'collection', 'page': newState.currentApp });
					await this.ow.restoreWindow(this.windowId);
					this.ow.bringToFront(this.windowId);
					if (this.isMaximized) {
						await this.ow.maximizeWindow(this.windowId);
					}
				} else if (!newState.isVisible && currentlyVisible) {
					await this.ow.hideWindow(this.windowId);
				}
				if (this.navigationState && newState.currentApp !== this.navigationState.currentApp) {
					// amplitude.getInstance().logEvent('show', { 'window': 'collection', 'page': newState.currentApp });
				}
			});
		});

		this.hotkey = await this.ow.getHotKey('collection');
		this.hotkeyText = await this.hotkeyService.getHotkeyCombination('collection');
		this.hotkeyPressedHandler = this.ow.getMainWindow().mainWindowHotkeyPressed;
		// Only needed for the hotkey
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
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
			this.hotkeyPressedHandler();
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
		super.ngOnDestroy();
		this.ow.removeStateChangedListener(this.stateChangedListener);
		this.ow.removeMessageReceivedListener(this.messageReceivedListener);
		this.dataStoreSubscription?.unsubscribe();
		this.navigationStoreSubscription?.unsubscribe();
	}

	onHelp(event: MouseEvent) {
		this.forceShowReleaseNotes = true;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onNewVersionDisplayed(value: boolean) {
		this.displayingNewVersionNotification = value;
		this.activeTheme = this.buildActiveTheme();
		if (!value) {
			this.forceShowReleaseNotes = false;
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	showAds(): boolean {
		if (this.dataState.showFtue) {
			return false;
		}

		// Hide the ads for supporters and in the ladder deck details
		if (!this.dataState.showAds) {
			return false;
			// if (this.navigationState?.navigationDecktracker?.currentView === 'deck-details') {
			// 	return false;
			// }
		}

		return true;
	}

	takeScreenshot(): (copyToCliboard: boolean) => Promise<[string, any]> {
		return (copyToCliboard: boolean) => {
			return this.owUtils.captureWindow('Firestone - MainWindow', copyToCliboard);
		};
	}

	private buildActiveTheme(): CurrentAppType | 'decktracker-desktop' {
		if (this.displayingNewVersionNotification) {
			return 'general';
		}
		return this.dataState.showFtue
			? 'general'
			: ['decktracker', 'arena', 'stats', 'mercenaries'].includes(this.navigationState?.currentApp)
			? 'decktracker-desktop'
			: this.navigationState?.currentApp;
	}
}
