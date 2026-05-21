import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Inject,
	OnDestroy,
	Output,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { MainWindowNavigationService, MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { CurrentAppType } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import {
	ADS_SERVICE_TOKEN,
	AnalyticsService,
	IAdsService,
	IScreenshotService,
	IWindowControlsService,
	SCREENSHOT_SERVICE_TOKEN,
	WINDOW_CONTROLS_SERVICE_TOKEN,
	waitForReady,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, tap } from 'rxjs';

@Component({
	standalone: false,
	selector: 'main-window-root',
	styleUrls: [
		`../../../../../../shared/styles/src/lib/styles/ngx-tooltips.scss`,
		`./main-window-root.component.scss`,
	],
	encapsulation: ViewEncapsulation.None,
	template: `
		<ng-container
			*ngIf="{
				showAds: showAds$ | async,
				showFtue: showFtue$ | async,
				currentApp: currentApp$ | async,
			} as value"
		>
			<section class="menu-bar">
				<div class="before-main-divider"></div>
				<hotkey></hotkey>
				<div class="controls">
					<control-share [onSocialClick]="takeScreenshotFunction" [page]="value.currentApp"></control-share>
					<control-bug></control-bug>
					<control-settings [settingsApp]="value.currentApp"></control-settings>
					<control-help (help)="onHelp()"></control-help>
					<control-discord></control-discord>
					<control-website></control-website>
					<control-minimize [isMainWindow]="true"></control-minimize>
					<control-maximize></control-maximize>
					<control-close
						[helpTooltip]="'app.global.controls.close-button-tooltip' | fsTranslate"
						helpTooltipPosition="bottom-left"
						[isMainWindow]="true"
						[closeAll]="true"
					></control-close>
				</div>
			</section>
			<section class="layout">
				<div class="navigation" [ngClass]="{ 'navigation-ftue': value.showFtue }">
					<div class="logo" inlineSVG="assets/svg/firestone_logo_no_text.svg"></div>
					<div class="main-menu-separator"></div>
					<menu-selection [selectedModule]="value.currentApp"></menu-selection>
				</div>
				<div class="main">
					<section
						role="main"
						class="content-container"
						*ngIf="!value.showFtue"
						[ngClass]="{ 'hide-ads': !value.showAds }"
					>
						<!-- Don't cache the DOM, as it can cause some lag when many replays are loaded -->
						<replays class="main-section" *ngIf="value.currentApp === 'replays'"></replays>
						<achievements class="main-section" *ngIf="value.currentApp === 'achievements'"> </achievements>
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
						<arena-desktop class="main-section" *ngIf="value.currentApp === 'arena'"> </arena-desktop>
						<tavern-brawl-desktop class="main-section" *ngIf="value.currentApp === 'tavern-brawl'">
						</tavern-brawl-desktop>
						<stats-desktop class="main-section" *ngIf="value.currentApp === 'profile'"> </stats-desktop>
						<streams-desktop class="main-section" *ngIf="value.currentApp === 'streams'"> </streams-desktop>
						<communities-desktop class="main-section" *ngIf="value.currentApp === 'communities'">
						</communities-desktop>
						<premium-desktop class="main-section" *ngIf="value.currentApp === 'premium'"> </premium-desktop>
					</section>
				</div>
				<ads *ngIf="value.showAds"></ads>
			</section>
			<ftue *ngIf="value.showFtue" [selectedModule]="value.currentApp"> </ftue>
			<new-version-notification
				class="new-version"
				[forceOpen]="forceShowReleaseNotes$ | async"
				(notificationDisplayed)="onNewVersionDisplayed($event)"
			></new-version-notification>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainWindowRootComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit, OnDestroy
{
	@Output() activeTheme = new EventEmitter<CurrentAppType | 'decktracker-desktop'>();

	forceShowReleaseNotes$: Observable<boolean>;
	showAds$: Observable<boolean>;
	showFtue$: Observable<boolean>;
	currentApp$: Observable<CurrentAppType | null>;

	windowId: string;

	displayingNewVersion = new BehaviorSubject<boolean>(false);
	forceShowReleaseNotes = new BehaviorSubject<boolean>(false);

	takeScreenshotFunction: (copyToCliboard: boolean) => Promise<[string | null, any]> = this.takeScreenshot();

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		@Inject(WINDOW_CONTROLS_SERVICE_TOKEN) private readonly windowControls: IWindowControlsService,
		@Inject(SCREENSHOT_SERVICE_TOKEN) private readonly screenshot: IScreenshotService,
		private readonly analytics: AnalyticsService,
		private readonly nav: MainWindowNavigationService,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
		private readonly mainWindowStateService: MainWindowStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.ads, this.mainWindowStateService);

		this.forceShowReleaseNotes$ = this.forceShowReleaseNotes.asObservable();
		this.showFtue$ = this.mainWindowStateService.mainWindowState$$.pipe(
			this.mapData((state) => state?.showFtue ?? false),
		);
		this.currentApp$ = this.nav.currentApp$$.pipe(
			tap((currentApp) => console.debug('currentApp', currentApp)),
			this.mapData((currentApp) => currentApp),
		);
		this.currentApp$.subscribe((currentApp) => {
			this.analytics.trackPageView(currentApp);
		});
		combineLatest([this.showFtue$, this.nav.currentApp$$, this.displayingNewVersion.asObservable()])
			.pipe(
				this.mapData(([showFtue, currentApp, displayingNewVersion]) =>
					this.buildActiveTheme(showFtue, currentApp, displayingNewVersion),
				),
			)
			.subscribe((activeTheme) => {
				this.activeTheme.emit(activeTheme);
			});

		this.showAds$ = this.ads.hasPremiumSub$$.pipe(this.mapData((sub) => !sub));

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.markForCheck();
		}
	}

	async ngAfterViewInit() {
		const currentWindow = await this.windowControls.getCurrentWindow();
		this.windowId = currentWindow.id;
		console.warn(
			'[window-resize-debug]',
			JSON.stringify({
				context: 'main-window-root-view-init',
				innerWidth: window.innerWidth,
				innerHeight: window.innerHeight,
				windowId: this.windowId,
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	onHelp() {
		this.forceShowReleaseNotes.next(true);
	}

	onNewVersionDisplayed(value: boolean) {
		console.debug('onNewVersionDisplayed', value);
		this.displayingNewVersion.next(value);
		if (!value) {
			this.forceShowReleaseNotes.next(false);
		}
	}

	takeScreenshot(): (copyToCliboard: boolean) => Promise<[string | null, any]> {
		return (copyToCliboard: boolean) => {
			return this.screenshot.captureWindow('Firestone - Main', copyToCliboard);
		};
	}

	private buildActiveTheme(
		showFtue: boolean,
		currentApp: CurrentAppType | null,
		displayingNewVersionNotification: boolean,
	): CurrentAppType | 'decktracker-desktop' {
		console.debug('buildActiveTheme', showFtue, currentApp, displayingNewVersionNotification);
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
			case 'profile':
				return 'collection';
			default:
				return 'decktracker-desktop';
		}
	}
}
