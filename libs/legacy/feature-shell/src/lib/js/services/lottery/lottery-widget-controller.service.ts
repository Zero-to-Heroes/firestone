import { Injectable } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, distinctUntilChanged, filter, map, startWith, tap } from 'rxjs';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';

@Injectable()
export class LotteryWidgetControllerService {
	public shouldTrack$$ = new BehaviorSubject<boolean>(true);

	constructor(private readonly store: AppUiStoreFacadeService, private readonly ow: OverwolfService) {
		this.init();
		window['lotteryWidgetController'] = this;
	}

	private async init() {
		await this.store.initComplete();
		const displayWidgetFromData$ = combineLatest([
			this.store.listen$(([main, nav, prefs]) => main.currentScene),
			this.store.listenPrefs$(
				(prefs) => prefs.showLottery,
				(prefs) => prefs.lotteryOverlay,
			),
			this.store.hasPremiumSub$(),
		]).pipe(
			// tap((info) => console.debug('[lottery-widget] should track 0?', info)),
			map(([[currentScene], [showLottery, lotteryOverlay], isPremium]) => {
				return (
					!lotteryOverlay &&
					// currentScene === SceneMode.GAMEPLAY &&
					// Check for null so that by default it doesn't show up for premium users
					(showLottery === true || (!isPremium && showLottery === null))
				);
			}),
		);
		displayWidgetFromData$
			.pipe(
				// tap((info) => console.debug('[lottery-widget] should track?', info)),
				distinctUntilChanged(),
			)
			.subscribe(async (visible) => {
				// console.debug('[lottery-widget] setting visibility', visible);
				const lotteryWindow = await this.ow.obtainDeclaredWindow(OverwolfService.LOTTERY_WINDOW);
				if (visible) {
					this.ow.restoreWindow(lotteryWindow.id);
					this.ow.bringToFront(lotteryWindow.id);
				} else {
					this.ow.closeWindow(lotteryWindow.id);
				}
			});

		const adVisible$ = this.store.eventBus$$.pipe(
			filter((event) => event?.name === 'lottery-visibility-changed'),
			map((event) => event.data.visible as 'hidden' | 'partial' | 'full'),
			distinctUntilChanged(),
			tap((info) => console.debug('[lottery-widget] ad visible?', info)),
			map((visible) => visible === 'full' || visible === 'partial'),
			startWith(true),
		);

		combineLatest([displayWidgetFromData$, adVisible$]).subscribe(([displayWidget, adVisible]) => {
			this.shouldTrack$$.next(displayWidget && adVisible);
		});
	}
}
