import { Injectable } from '@angular/core';
import { NotificationsService, Preferences, PreferencesService } from '@firestone/shared/common/service';
import { arraysEqual } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ADS_SERVICE_TOKEN,
	AppInjector,
	IAdsService,
	OverwolfService,
	waitForReady,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, filter, map, startWith } from 'rxjs';

@Injectable()
export class LotteryWidgetControllerService extends AbstractFacadeService<LotteryWidgetControllerService> {
	public shouldTrack$$: BehaviorSubject<boolean>;
	public shouldShowOverlay$$: BehaviorSubject<boolean>;
	public events$$: BehaviorSubject<{ name: LotteryEventName; data?: any } | null>;

	private closedByUser$$ = new BehaviorSubject<boolean>(false);

	private notifications: NotificationsService;
	private prefs: PreferencesService;
	private ads: IAdsService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'LotteryWidgetControllerService', () => !!this.events$$);
	}

	protected override assignSubjects() {
		this.shouldTrack$$ = this.mainInstance.shouldTrack$$;
		this.shouldShowOverlay$$ = this.mainInstance.shouldShowOverlay$$;
		this.events$$ = this.mainInstance.events$$;
	}

	protected async init() {
		this.shouldTrack$$ = new BehaviorSubject<boolean>(true);
		this.shouldShowOverlay$$ = new BehaviorSubject<boolean>(true);
		this.events$$ = new BehaviorSubject<{ name: LotteryEventName; data?: any } | null>(null);
		// this.ow = AppInjector.get(OverwolfService);
		this.notifications = AppInjector.get(NotificationsService);
		this.prefs = AppInjector.get(PreferencesService);
		this.ads = AppInjector.get(ADS_SERVICE_TOKEN);

		await waitForReady(this.prefs, this.ads);

		const displayWidgetFromData$ = combineLatest([
			this.prefs.preferences$$.pipe(
				map((prefs) => prefs.showLottery),
				distinctUntilChanged(),
			),
			this.ads.hasPremiumSub$$,
			this.closedByUser$$,
		]).pipe(
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			// tap((info) => console.debug('[lottery-widget] should track 0?', info)),
			map(([showLottery, isPremium, closedByUser]) => {
				return (
					!closedByUser &&
					// Check for null so that by default it doesn't show up for premium users
					(showLottery === true || (!isPremium && showLottery === null))
				);
			}),
		);
		await this.setInitialOverlayValue();
		combineLatest([
			this.prefs.preferences$$.pipe(
				map((prefs) => prefs.lotteryOverlay),
				distinctUntilChanged(),
			),
			displayWidgetFromData$,
		])
			.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)))
			.subscribe(async ([lotteryOverlay, visible]) => {
				this.shouldShowOverlay$$.next(visible && !!lotteryOverlay);
			});

		combineLatest([
			this.prefs.preferences$$.pipe(
				map((prefs) => prefs.lotteryOverlay),
				distinctUntilChanged(),
			),
			displayWidgetFromData$,
		])
			.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)))
			.subscribe(async ([lotteryOverlay, visible]) => {
				await this.windowManager.closeWindow(OverwolfService.LOTTERY_WINDOW);

				if (visible) {
					await this.windowManager.restoreWindow(OverwolfService.LOTTERY_WINDOW, true);
				} else {
					await this.windowManager.closeWindow(OverwolfService.LOTTERY_WINDOW);
				}
			});

		const adVisible$ = this.events$$.pipe(
			filter((event) => event?.name === 'lottery-visibility-changed'),
			map((event) => event!.data.visible as 'hidden' | 'partial' | 'full'),
			distinctUntilChanged(),
			map((visible) => visible === 'full' || visible === 'partial'),
			startWith(true),
		);

		this.events$$
			.pipe(
				filter((event) => event?.name === 'lottery-closed'),
				distinctUntilChanged(),
			)
			.subscribe(() => this.closedByUser$$.next(true));

		combineLatest([displayWidgetFromData$, adVisible$]).subscribe(([displayWidget, adVisible]) => {
			this.shouldTrack$$.next(displayWidget && adVisible);
		});

		combineLatest([
			adVisible$,
			this.ads.hasPremiumSub$$,
			this.prefs.preferences$$.pipe(
				map((prefs) => prefs.showLottery),
				distinctUntilChanged(),
			),
			this.prefs.preferences$$.pipe(
				map((prefs) => prefs.lotteryShowHiddenWindowNotification),
				distinctUntilChanged(),
			),
			this.prefs.preferences$$.pipe(
				map((prefs) => prefs.lotteryOverlay),
				distinctUntilChanged(),
			),
		])
			.pipe(
				distinctUntilChanged(),
				debounceTime(2000),
				filter(
					([adVisible, premium, showLottery, showNotification, lotteryOverlay]) =>
						!adVisible && !premium && !!showLottery && !!showNotification && !lotteryOverlay,
				),
			)
			.subscribe(() => {
				const title = 'Lottery window hidden';
				const msg = 'Lottery points and premium features are paused while the lottery window is hidden';
				const dontShowAgain = `Don't show again`;
				const ok = `OK`;
				this.notifications.emitNewNotification({
					notificationId: 'lottery-hidden-window',
					content: `
						<div class="message-container general-message-container general-theme">
							<div class="firestone-icon">
								<svg class="svg-icon-fill">
									<use xlink:href="assets/svg/sprite.svg#ad_placeholder" />
								</svg>
							</div>
							<div class="message">
								<div class="title">
									<span>${title}</span>
								</div>
								<span class="text">${msg}</span>
								<div class="buttons">
									<button class="dont-show-again secondary">${dontShowAgain}</button>
									<button class="ok primary">${ok}</button>
								</div>
							</div>
							<button class="i-30 close-button">
								<svg class="svg-icon-fill">
									<use xmlns:xlink="https://www.w3.org/1999/xlink" xlink:href="assets/svg/sprite.svg#window-control_close"></use>
								</svg>
							</button>
						</div>`,
					handlers: [
						{
							selector: 'dont-show-again',
							action: async () => {
								console.debug('[lottery-widget] clicked on dont-show-again');
								const prefs = await this.prefs.getPreferences();
								const newPrefs: Preferences = { ...prefs, lotteryShowHiddenWindowNotification: false };
								const updated = await this.prefs.savePreferences(newPrefs);
								console.debug('[lottery-widget] updated prefs', updated);
							},
						},
						{
							selector: 'ok',
							action: () => {
								console.debug('[lottery-widget] clicked on ok, do nothing (except close the notif)');
							},
						},
					],
					timeout: 9999999,
				});
			});
	}

	private async setInitialOverlayValue() {
		const prefs = await this.prefs.getPreferences();
		if (prefs.lotteryOverlay != null) {
			return;
		}

		const monitors = await this.windowManager.getMonitorsList();
		if (!monitors) {
			return;
		}
		const initialLotteryOverlayPref = monitors?.displays?.length === 1;
		console.log(
			'[lottery-widget] setting initial overlay pref',
			initialLotteryOverlayPref,
			monitors?.displays?.length,
		);
		const newPrefs: Preferences = { ...prefs, lotteryOverlay: initialLotteryOverlayPref };
		await this.prefs.savePreferences(newPrefs);
	}
}

export type LotteryEventName = 'lottery-visibility-changed' | 'lottery-closed';
