import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	OnDestroy,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
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
		<window-wrapper
			*ngIf="{
				showAds: showAds$ | async,
				showFtue: showFtue$ | async,
				dataState: dataState$ | async,
				currentApp: currentApp$ | async
			} as value"
			[activeTheme]="activeTheme$ | async"
			[allowResize]="true"
		>
			<ng-container *ngIf="value.dataState && navigationState">
				<section class="layout">
					<div class="navigation" [ngClass]="{ 'navigation-ftue': value.showFtue }">
						<div class="logo" inlineSVG="assets/svg/firestone_logo_no_text.svg"></div>
						<div class="main-menu-separator"></div>
						<menu-selection [selectedModule]="value.currentApp"></menu-selection>
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
									[settingsApp]="value.currentApp"
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
							*ngIf="!value.showFtue"
							[ngClass]="{ 'hide-ads': !value.showAds }"
						>
							<!-- Don't cache the DOM, as it can cause some lag when many replays are loaded -->
							<replays
								class="main-section"
								[state]="value.dataState"
								[navigation]="navigationState"
								*ngIf="value.currentApp === 'replays'"
							></replays>
							<achievements
								class="main-section"
								[state]="value.dataState.achievements"
								[navigation]="navigationState"
								[currentUser]="value.dataState.currentUser"
								[socialShareUserInfo]="value.dataState.socialShareUserInfo"
								[globalStats]="value.dataState.globalStats"
								*ngIf="value.currentApp === 'achievements'"
							>
							</achievements>
							<collection
								class="main-section"
								[state]="value.dataState.binder"
								[navigation]="navigationState"
								*ngIf="value.currentApp === 'collection'"
							></collection>
							<decktracker
								class="main-section"
								[state]="value.dataState.decktracker"
								[showAds]="value.showAds"
								[navigation]="navigationState"
								*ngIf="value.currentApp === 'decktracker'"
							>
							</decktracker>
							<battlegrounds-desktop class="main-section" *ngIf="value.currentApp === 'battlegrounds'">
							</battlegrounds-desktop>
							<mercenaries-desktop class="main-section" *ngIf="value.currentApp === 'mercenaries'">
							</mercenaries-desktop>
							<duels-desktop class="main-section" *ngIf="value.currentApp === 'duels'"> </duels-desktop>
							<arena-desktop class="main-section" *ngIf="value.currentApp === 'arena'"> </arena-desktop>
							<stats-desktop class="main-section" *ngIf="value.currentApp === 'stats'"> </stats-desktop>
						</section>
					</div>
				</section>
				<ftue *ngIf="value.showFtue" [selectedModule]="value.currentApp"> </ftue>
				<ads
					[parentComponent]="'main-window'"
					[adRefershToken]="adRefershToken$ | async"
					*ngIf="value.showAds"
				></ads>
				<new-version-notification
					class="new-version"
					[forceOpen]="forceShowReleaseNotes$ | async"
					(notificationDisplayed)="onNewVersionDisplayed($event)"
				></new-version-notification>
			</ng-container>
		</window-wrapper>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainWindowComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit, OnDestroy {
	adRefershToken$: Observable<boolean>;
	activeTheme$: Observable<CurrentAppType | 'decktracker-desktop'>;
	forceShowReleaseNotes$: Observable<boolean>;
	showAds$: Observable<boolean>;
	showFtue$: Observable<boolean>;
	dataState$: Observable<MainWindowState>;
	currentApp$: Observable<CurrentAppType>;

	navigationState: NavigationState;
	windowId: string;

	displayingNewVersion = new BehaviorSubject<boolean>(false);
	forceShowReleaseNotes = new BehaviorSubject<boolean>(false);

	takeScreenshotFunction: (copyToCliboard: boolean) => Promise<[string, any]> = this.takeScreenshot();
	hotkeyText: string;

	private isMaximized = false;
	private stateChangedListener: (message: any) => void;
	// private navigationStateChangedListener: (message: any) => void;
	private messageReceivedListener: (message: any) => void;
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

	ngAfterContentInit() {
		this.forceShowReleaseNotes$ = this.forceShowReleaseNotes.asObservable();
		this.adRefershToken$ = this.store
			.listenDeckState$((gameState) => gameState)
			.pipe(this.mapData(([gameState]) => gameState.gameStarted));
		this.showFtue$ = this.store
			.listen$(([main, nav, prefs]) => main.showFtue)
			.pipe(this.mapData(([showFtue]) => showFtue));
		this.currentApp$ = this.store
			.listen$(([main, nav, prefs]) => nav.currentApp)
			.pipe(this.mapData(([currentApp]) => currentApp));
		this.activeTheme$ = combineLatest(
			this.store.listen$(
				([main, nav, prefs]) => main.showFtue,
				([main, nav, prefs]) => nav.currentApp,
			),
			this.displayingNewVersion.asObservable(),
		).pipe(
			this.mapData(([[showFtue, currentApp], displayingNewVersion]) =>
				this.buildActiveTheme(showFtue, currentApp, displayingNewVersion),
			),
		);
		this.showAds$ = this.store
			.listen$(
				([main, nav, prefs]) => main.showAds,
				([main, nav, prefs]) => main.showFtue,
			)
			.pipe(this.mapData(([showAds, showFtue]) => showAds && !showFtue));
		// TODO: remove this to avoid having too many refreshes every time any tiny bit of the state
		// changes
		this.dataState$ = this.store
			.listen$(([main, nav, prefs]) => main)
			.pipe(
				debounceTime(100),
				map(([main]) => main),
				distinctUntilChanged(),
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				tap((filter) => cdLog('emitting dataState in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);
	}

	async ngAfterViewInit() {
		const currentWindow = await this.ow.getCurrentWindow();
		this.windowId = currentWindow.id;

		const navigationStoreBus: BehaviorSubject<NavigationState> = this.ow.getMainWindow().mainWindowStoreNavigation;
		this.navigationStoreSubscription = navigationStoreBus.subscribe((newState: NavigationState) => {
			setTimeout(async () => {
				// First update the state before restoring the window
				this.navigationState = newState;
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
		this.navigationStoreSubscription?.unsubscribe();
	}

	onHelp(event: MouseEvent) {
		this.forceShowReleaseNotes.next(true);
	}

	onNewVersionDisplayed(value: boolean) {
		this.displayingNewVersion.next(value);
		if (!value) {
			this.forceShowReleaseNotes.next(false);
		}
	}

	takeScreenshot(): (copyToCliboard: boolean) => Promise<[string, any]> {
		return (copyToCliboard: boolean) => {
			return this.owUtils.captureWindow('Firestone - MainWindow', copyToCliboard);
		};
	}

	private buildActiveTheme(
		showFtue: boolean,
		currentApp: CurrentAppType,
		displayingNewVersionNotification: boolean,
	): CurrentAppType | 'decktracker-desktop' {
		if (displayingNewVersionNotification) {
			return 'general';
		}
		return showFtue
			? 'general'
			: ['decktracker', 'arena', 'stats', 'mercenaries'].includes(currentApp)
			? 'decktracker-desktop'
			: currentApp;
	}
}
