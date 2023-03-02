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
import { OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { CurrentAppType } from '../models/mainwindow/current-app.type';
import { DebugService } from '../services/debug.service';
import { HotkeyService } from '../services/hotkey.service';
import { OwUtilsService } from '../services/plugins/ow-utils.service';
import { PreferencesService } from '../services/preferences.service';
import { AppUiStoreFacadeService } from '../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from './abstract-subscription-store.component';

@Component({
	selector: 'main-window',
	styleUrls: [`../../css/global/ngx-tooltips.scss`, `../../css/component/main-window.component.scss`],
	encapsulation: ViewEncapsulation.None,
	template: `
		<window-wrapper
			*ngIf="{
				showAds: showAds$ | async,
				showFtue: showFtue$ | async,
				currentApp: currentApp$ | async
			} as value"
			[activeTheme]="activeTheme$ | async"
			[allowResize]="true"
			[avoidGameOverlap]="true"
		>
			<ng-container>
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
									[page]="value.currentApp"
								></control-share>
								<control-bug></control-bug>
								<control-settings [settingsApp]="value.currentApp"></control-settings>
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
							role="main"
							class="content-container"
							*ngIf="!value.showFtue"
							[ngClass]="{ 'hide-ads': !value.showAds }"
						>
							<!-- Don't cache the DOM, as it can cause some lag when many replays are loaded -->
							<replays class="main-section" *ngIf="value.currentApp === 'replays'"></replays>
							<achievements class="main-section" *ngIf="value.currentApp === 'achievements'">
							</achievements>
							<collection class="main-section" *ngIf="value.currentApp === 'collection'"></collection>
							<decktracker
								class="main-section"
								[showAds]="value.showAds"
								*ngIf="value.currentApp === 'decktracker'"
							>
							</decktracker>
							<battlegrounds-desktop class="main-section" *ngIf="value.currentApp === 'battlegrounds'">
							</battlegrounds-desktop>
							<mercenaries-desktop class="main-section" *ngIf="value.currentApp === 'mercenaries'">
							</mercenaries-desktop>
							<duels-desktop class="main-section" *ngIf="value.currentApp === 'duels'"> </duels-desktop>
							<arena-desktop class="main-section" *ngIf="value.currentApp === 'arena'"> </arena-desktop>
							<tavern-brawl-desktop class="main-section" *ngIf="value.currentApp === 'tavern-brawl'">
							</tavern-brawl-desktop>
							<stats-desktop class="main-section" *ngIf="value.currentApp === 'stats'"> </stats-desktop>
							<mailbox-desktop class="main-section" *ngIf="value.currentApp === 'mailbox'">
							</mailbox-desktop>
							<streams-desktop class="main-section" *ngIf="value.currentApp === 'streams'">
							</streams-desktop>
						</section>
					</div>
				</section>
				<ftue *ngIf="value.showFtue" [selectedModule]="value.currentApp"> </ftue>
				<ads *ngIf="value.showAds"></ads>
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
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit, OnDestroy
{
	activeTheme$: Observable<CurrentAppType | 'decktracker-desktop'>;
	forceShowReleaseNotes$: Observable<boolean>;
	showAds$: Observable<boolean>;
	showFtue$: Observable<boolean>;
	currentApp$: Observable<CurrentAppType>;

	windowId: string;

	displayingNewVersion = new BehaviorSubject<boolean>(false);
	forceShowReleaseNotes = new BehaviorSubject<boolean>(false);

	takeScreenshotFunction: (copyToCliboard: boolean) => Promise<[string, any]> = this.takeScreenshot();
	hotkeyText: string;

	private isMaximized = false;
	private stateChangedListener: (message: any) => void;
	private messageReceivedListener: (message: any) => void;
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
		this.showFtue$ = this.store
			.listen$(([main, nav, prefs]) => main.showFtue)
			.pipe(this.mapData(([showFtue]) => showFtue));
		this.currentApp$ = this.store
			.listen$(([main, nav, prefs]) => nav.currentApp)
			.pipe(this.mapData(([currentApp]) => currentApp));
		this.activeTheme$ = combineLatest(
			this.showFtue$,
			this.store.listen$(([main, nav, prefs]) => nav.currentApp),
			this.displayingNewVersion.asObservable(),
		).pipe(
			this.mapData(([showFtue, [currentApp], displayingNewVersion]) =>
				this.buildActiveTheme(showFtue, currentApp, displayingNewVersion),
			),
		);
		this.showAds$ = this.store
			.listen$(
				([main, nav, prefs]) => main.showAds,
				([main, nav, prefs]) => main.showFtue,
			)
			.pipe(this.mapData(([showAds, showFtue]) => showAds && !showFtue));
		this.store
			.listen$(([main, nav, prefs]) => nav.isVisible)
			.pipe(this.mapData(([visible]) => visible))
			.subscribe(async (visible) => {
				const window = await this.ow.getCurrentWindow();
				const currentlyVisible = window.isVisible;
				if (visible && !currentlyVisible) {
					await this.ow.restoreWindow(this.windowId);
					this.ow.bringToFront(this.windowId);
					if (this.isMaximized) {
						await this.ow.maximizeWindow(this.windowId);
					}
				} else if (!visible && currentlyVisible) {
					await this.ow.hideWindow(this.windowId);
				}
			});
	}

	async ngAfterViewInit() {
		const currentWindow = await this.ow.getCurrentWindow();
		this.windowId = currentWindow.id;

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
	}

	onHelp() {
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
		if (showFtue) {
			return 'general';
		}
		switch (currentApp) {
			case 'achievements':
			case 'replays':
			case 'collection':
			case 'battlegrounds':
				return currentApp;
			default:
				return 'decktracker-desktop';
		}
	}
}
