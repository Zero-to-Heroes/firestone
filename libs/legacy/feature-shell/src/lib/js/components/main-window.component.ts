import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	Inject,
	OnDestroy,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { CardsHighlightFacadeService } from '@firestone/game-state';
import { MainWindowNavigationService, MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { CurrentAppType, ScalingService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import {
	ADS_SERVICE_TOKEN,
	AnalyticsService,
	IAdsService,
	OverwolfService,
	OwUtilsService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { DebugService } from '../services/debug.service';

@Component({
	standalone: false,
	selector: 'main-window',
	styleUrls: [`../../css/global/ngx-tooltips.scss`, `../../css/component/main-window.component.scss`],
	encapsulation: ViewEncapsulation.None,
	template: `
		<window-wrapper
			*ngIf="{
				showAds: showAds$ | async,
				showFtue: showFtue$ | async,
				currentApp: currentApp$ | async,
			} as value"
			[activeTheme]="activeTheme$ | async"
			[allowResize]="true"
			[avoidGameOverlap]="true"
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
					<control-minimize [windowId]="windowId" [isMainWindow]="true"></control-minimize>
					<control-maximize [windowId]="windowId"></control-maximize>
					<control-close
						[windowId]="windowId"
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
		</window-wrapper>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainWindowComponent
	extends AbstractSubscriptionComponent
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

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly debug: DebugService,
		private readonly owUtils: OwUtilsService,
		private readonly analytics: AnalyticsService,
		private readonly nav: MainWindowNavigationService,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
		private readonly init_ScalingService: ScalingService,
		private readonly init_cardsHighlight: CardsHighlightFacadeService,
		private readonly mainWindowStateService: MainWindowStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.ads, this.mainWindowStateService);

		this.forceShowReleaseNotes$ = this.forceShowReleaseNotes.asObservable();
		this.showFtue$ = this.mainWindowStateService.mainWindowState$$.pipe(this.mapData((state) => state.showFtue));
		this.currentApp$ = this.nav.currentApp$$.pipe(this.mapData((currentApp) => currentApp));
		this.currentApp$.subscribe((currentApp) => {
			this.analytics.trackPageView(currentApp);
		});
		this.activeTheme$ = combineLatest([
			this.showFtue$,
			this.nav.currentApp$$,
			this.displayingNewVersion.asObservable(),
		]).pipe(
			this.mapData(([showFtue, currentApp, displayingNewVersion]) =>
				this.buildActiveTheme(showFtue, currentApp, displayingNewVersion),
			),
		);
		this.showAds$ = this.ads.hasPremiumSub$$.pipe(this.mapData((sub) => !sub));

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.markForCheck();
		}
	}

	async ngAfterViewInit() {
		const currentWindow = await this.ow.getCurrentWindow();
		this.windowId = currentWindow.id;

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
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

	takeScreenshot(): (copyToCliboard: boolean) => Promise<[string, any]> {
		return (copyToCliboard: boolean) => {
			return this.owUtils.captureWindow('Firestone - Main', copyToCliboard);
		};
	}

	private buildActiveTheme(
		showFtue: boolean,
		currentApp: CurrentAppType,
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
